import base64
import enum
import hashlib
import hmac
import logging
import os
import time
from typing import List, Union, Optional, Dict

import requests
from flask import current_app
from pydantic import BaseModel

from core.model_providers.models.entity.message import PromptMessageFile, PromptMessageFileType, ImagePromptMessageFile
from extensions.ext_database import db
from extensions.ext_storage import storage
from models.account import Account
from models.model import MessageFile, EndUser, AppModelConfig, MessageFileType, MessageFileTransferMethod, UploadFile

SUPPORT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']


class FileObj(BaseModel):
    tenant_id: str
    type: MessageFileType
    transfer_method: MessageFileTransferMethod
    url: str
    upload_file_id: str
    file_config: dict

    @property
    def data(self) -> Optional[str]:
        if self.type == MessageFileType.IMAGE:
            if self.transfer_method == MessageFileTransferMethod.REMOTE_URL:
                return self.url
            elif self.transfer_method == MessageFileTransferMethod.LOCAL_FILE:
                # get upload file from upload_file_id
                upload_file = (db.session.query(UploadFile)
                               .filter(
                    UploadFile.id == self.upload_file_id,
                    UploadFile.tenant_id == self.tenant_id
                ).first())

                if not upload_file:
                    return None

                if upload_file.extension not in SUPPORT_EXTENSIONS:
                    return None

                if current_app.config['MULTIMODAL_SEND_IMAGE_FORMAT'] == 'url':
                    return self._get_signed_temp_image_url(upload_file)
                else:
                    # get image file base64
                    try:
                        data = storage.load(upload_file.key)
                    except FileNotFoundError:
                        logging.error(f'File not found: {upload_file.key}')
                        return None

                    encoded_string = base64.b64encode(data).decode('utf-8')
                    return f'data:{upload_file.mime_type};base64,{encoded_string}'

        return None

    @property
    def prompt_message_file(self) -> PromptMessageFile:
        if self.type == MessageFileType.IMAGE:
            image_config = self.file_config.get('image')

            return ImagePromptMessageFile(
                data=self.data,
                detail=ImagePromptMessageFile.DETAIL.HIGH
                if image_config.get("detail") == "high" else ImagePromptMessageFile.DETAIL.LOW
            )

    def _get_signed_temp_image_url(self, upload_file: UploadFile) -> str:
        """
        get signed url from upload file

        :param upload_file: UploadFile object
        :return:
        """
        image_preview_url = current_app.config.get('FILES_URL') + '/image-preview/' + upload_file.id

        timestamp = int(time.time())
        nonce = os.urandom(16).hex()
        data_to_sign = f"{image_preview_url}|{timestamp}|{nonce}"
        secret_key = current_app.config['SECRET_KEY'].encode()
        sign = hmac.new(secret_key, data_to_sign.encode(), hashlib.sha256).digest()
        encoded_sign = base64.urlsafe_b64encode(sign).decode()

        return f"{image_preview_url}?timestamp={timestamp}&nonce={nonce}&signature={encoded_sign}"

    def _verify_signature(self, file_key: str, timestamp: int, nonce: str, sign: str) -> bool:
        """
        verify signature

        :param file_key: file id
        :param timestamp: timestamp
        :param nonce: nonce
        :param sign: signature
        :return:
        """
        image_preview_url = current_app.config.get('FILES_URL') + '/image-preview/' + file_key

        data_to_sign = f"{image_preview_url}|{timestamp}|{nonce}"
        secret_key = current_app.config['SECRET_KEY'].encode()
        recalculated_sign = hmac.new(secret_key, data_to_sign.encode(), hashlib.sha256).digest()
        recalculated_encoded_sign = base64.urlsafe_b64encode(recalculated_sign).decode()

        # verify signature
        if sign != recalculated_encoded_sign:
            return False

        current_time = int(time.time())
        return current_time - int(timestamp) <= 300  # expired after 5 minutes


class PassInFrom(enum.Enum):
    MESSAGE = 'message'
    ARG = 'arg'


class MessageFileParser:

    def __init__(self, tenant_id: str, app_id: str, user: Union[Account, EndUser]) -> None:
        self.tenant_id = tenant_id
        self.app_id = app_id
        self.user = user

    def validate_and_transform_files_arg(self, files: List[dict], app_model_config: AppModelConfig) -> List[FileObj]:
        """
        validate and transform files arg

        :param files:
        :param app_model_config:
        :return:
        """
        file_upload_config = app_model_config.file_upload_dict

        # transform files to file objs
        type_file_objs = self._to_file_objs(files, file_upload_config)

        # validate files
        for file_type, file_objs in type_file_objs.items():
            if file_type == MessageFileType.IMAGE:
                # parse and validate files
                image_config = file_upload_config.get('image')

                # check if image file feature is enabled
                if not image_config['enabled']:
                    raise ValueError('Image file upload is not enabled')

                # Validate number of files
                if len(files) > image_config['number_limits']:
                    raise ValueError('Number of image files exceeds the maximum limit')

                for file_obj in file_objs:
                    # Validate transfer method
                    if file_obj.transfer_method.value not in image_config['transfer_methods']:
                        raise ValueError('Invalid transfer method')

                    # Validate file type
                    if file_obj.type != MessageFileType.IMAGE:
                        raise ValueError('Invalid file type')

                    if file_obj.transfer_method == MessageFileTransferMethod.REMOTE_URL:
                        # check remote url valid and is image
                        result, error = self._check_image_remote_url(file_obj.url)
                        if result is False:
                            raise ValueError(error)
                    elif file_obj.transfer_method == MessageFileTransferMethod.LOCAL_FILE:
                        # get upload file from upload_file_id
                        upload_file = (db.session.query(UploadFile)
                                       .filter(
                            UploadFile.id == file_obj.upload_file_id,
                            UploadFile.tenant_id == self.tenant_id,
                            UploadFile.created_by == self.user.id,
                            UploadFile.created_by_role == ('account' if isinstance(self.user, Account) else 'end_user'),
                            UploadFile.extension.in_(SUPPORT_EXTENSIONS)
                        ).first())

                        # check upload file is belong to tenant and user
                        if not upload_file:
                            raise ValueError('Invalid upload file')

        # return all file objs
        return [file_obj for file_objs in type_file_objs.values() for file_obj in file_objs]

    def transform_message_files(self, files: List[MessageFile], app_model_config: AppModelConfig) -> List[FileObj]:
        """
        transform message files

        :param files:
        :param app_model_config:
        :return:
        """
        # transform files to file objs
        type_file_objs = self._to_file_objs(files, app_model_config.file_upload_dict)

        # return all file objs
        return [file_obj for file_objs in type_file_objs.values() for file_obj in file_objs]

    def _to_file_objs(self, files: List[Union[Dict, MessageFile]],
                      file_upload_config: dict) -> Dict[MessageFileType, List[FileObj]]:
        """
        transform files to file objs

        :param files:
        :param file_upload_config:
        :return:
        """
        type_file_objs: Dict[MessageFileType, List[FileObj]] = {
            # Currently only support image
            MessageFileType.IMAGE: []
        }

        if not files:
            return type_file_objs

        # group by file type and convert file args or message files to FileObj
        for file in files:
            file_obj = self._to_file_obj(file, file_upload_config)
            if file_obj.type not in type_file_objs:
                continue

            type_file_objs[file_obj.type].append(file_obj)

        return type_file_objs

    def _to_file_obj(self, file: Union[dict, MessageFile], file_upload_config: dict) -> FileObj:
        """
        transform file to file obj

        :param file:
        :return:
        """
        if isinstance(file, dict):
            return FileObj(
                tenant_id=self.tenant_id,
                type=MessageFileType.value_of(file.get('type')),
                transfer_method=MessageFileTransferMethod.value_of(file.get('transfer_method')),
                url=file.get('url'),
                upload_file_id=file.get('upload_file_id'),
                file_config=file_upload_config
            )
        else:
            return FileObj(
                tenant_id=self.tenant_id,
                type=file.type,
                transfer_method=file.transfer_method,
                url=file.url,
                upload_file_id=file.upload_file_id,
                file_config=file_upload_config
            )

    def _check_image_remote_url(self, url):
        try:
            response = requests.head(url, allow_redirects=True)
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                if content_type.startswith('image/'):
                    return True, "URL exists and is an image."
                else:
                    return False, "URL exists but is not an image."
            else:
                return False, "URL does not exist."
        except requests.RequestException as e:
            return False, f"Error checking URL: {e}"
