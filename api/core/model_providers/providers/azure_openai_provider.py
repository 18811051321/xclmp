import json
import logging
from typing import Type

import openai
from langchain.embeddings import OpenAIEmbeddings
from langchain.schema import HumanMessage

from core.helper import encrypter
from core.model_providers.models.base import BaseProviderModel
from core.model_providers.models.embedding.azure_openai_embedding import AzureOpenAIEmbedding, \
    AZURE_OPENAI_API_VERSION
from core.model_providers.models.entity.model_params import ModelType, ModelKwargsRules, KwargRule
from core.model_providers.models.llm.azure_openai_model import AzureOpenAIModel
from core.model_providers.providers.base import BaseModelProvider, CredentialsValidateFailedError
from core.model_providers.providers.hosted import hosted_model_providers
from core.third_party.langchain.llms.azure_chat_open_ai import EnhanceAzureChatOpenAI
from models.provider import ProviderType

BASE_MODELS = [
    'gpt-4',
    'gpt-4-32k',
    'gpt-35-turbo',
    'gpt-35-turbo-16k',
    'text-davinci-003',
    'text-embedding-ada-002',
]


class AzureOpenAIProvider(BaseModelProvider):

    @property
    def provider_name(self):
        """
        Returns the name of a provider.
        """
        return 'azure_openai'

    def _get_fixed_model_list(self, model_type: ModelType) -> list[dict]:
        return []

    def get_model_class(self, model_type: ModelType) -> Type[BaseProviderModel]:
        """
        Returns the model class.

        :param model_type:
        :return:
        """
        if model_type == ModelType.TEXT_GENERATION:
            model_class = AzureOpenAIModel
        elif model_type == ModelType.EMBEDDINGS:
            model_class = AzureOpenAIEmbedding
        else:
            raise NotImplementedError

        return model_class

    def get_model_parameter_rules(self, model_name: str, model_type: ModelType) -> ModelKwargsRules:
        """
        get model parameter rules.

        :param model_name:
        :param model_type:
        :return:
        """
        base_model_max_tokens = {
            'gpt-4': 8192,
            'gpt-4-32k': 32768,
            'gpt-35-turbo': 4096,
            'gpt-35-turbo-16k': 16384,
            'text-davinci-003': 4097,
        }

        model_credentials = self.get_model_credentials(model_name, model_type)

        return ModelKwargsRules(
            temperature=KwargRule(min=0, max=2, default=1),
            top_p=KwargRule(min=0, max=1, default=1),
            presence_penalty=KwargRule(min=-2, max=2, default=0),
            frequency_penalty=KwargRule(min=-2, max=2, default=0),
            max_tokens=KwargRule(min=10, max=base_model_max_tokens.get(
                model_credentials['base_model_name'],
                4097
            ), default=16),
        )

    @classmethod
    def is_model_credentials_valid_or_raise(cls, model_name: str, model_type: ModelType, credentials: dict):
        """
        check model credentials valid.

        :param model_name:
        :param model_type:
        :param credentials:
        """
        if 'openai_api_key' not in credentials:
            raise CredentialsValidateFailedError('Azure OpenAI API key is required')

        if 'openai_api_base' not in credentials:
            raise CredentialsValidateFailedError('Azure OpenAI API Base Endpoint is required')

        if 'base_model_name' not in credentials:
            raise CredentialsValidateFailedError('Base Model Name is required')

        if credentials['base_model_name'] not in BASE_MODELS:
            raise CredentialsValidateFailedError('Base Model Name is invalid')

        if model_type == ModelType.TEXT_GENERATION:
            try:
                client = EnhanceAzureChatOpenAI(
                    deployment_name=model_name,
                    temperature=0,
                    max_tokens=15,
                    request_timeout=10,
                    openai_api_type='azure',
                    openai_api_version='2023-07-01-preview',
                    openai_api_key=credentials['openai_api_key'],
                    openai_api_base=credentials['openai_api_base'],
                )

                client.generate([[HumanMessage(content='hi!')]])
            except openai.error.OpenAIError as e:
                raise CredentialsValidateFailedError(
                    f"Azure OpenAI deployment {model_name} not exists, cause: {e.__class__.__name__}:{str(e)}")
            except Exception as e:
                logging.exception("Azure OpenAI Model retrieve failed.")
                raise e
        elif model_type == ModelType.EMBEDDINGS:
            try:
                client = OpenAIEmbeddings(
                    openai_api_type='azure',
                    openai_api_version=AZURE_OPENAI_API_VERSION,
                    deployment=model_name,
                    chunk_size=16,
                    max_retries=1,
                    openai_api_key=credentials['openai_api_key'],
                    openai_api_base=credentials['openai_api_base']
                )

                client.embed_query('hi')
            except openai.error.OpenAIError as e:
                logging.exception("Azure OpenAI Model check error.")
                raise CredentialsValidateFailedError(
                    f"Azure OpenAI deployment {model_name} not exists, cause: {e.__class__.__name__}:{str(e)}")
            except Exception as e:
                logging.exception("Azure OpenAI Model retrieve failed.")
                raise e

    @classmethod
    def encrypt_model_credentials(cls, tenant_id: str, model_name: str, model_type: ModelType,
                                  credentials: dict) -> dict:
        """
        encrypt model credentials for save.

        :param tenant_id:
        :param model_name:
        :param model_type:
        :param credentials:
        :return:
        """
        credentials['openai_api_key'] = encrypter.encrypt_token(tenant_id, credentials['openai_api_key'])
        return credentials

    def get_model_credentials(self, model_name: str, model_type: ModelType, obfuscated: bool = False) -> dict:
        """
        get credentials for llm use.

        :param model_name:
        :param model_type:
        :param obfuscated:
        :return:
        """
        if self.provider.provider_type != ProviderType.CUSTOM.value:
            raise NotImplementedError

        provider_model = self._get_provider_model(model_name, model_type)

        if not provider_model.encrypted_config:
            return {
                'openai_api_base': '',
                'openai_api_key': '',
                'base_model_name': ''
            }

        credentials = json.loads(provider_model.encrypted_config)
        if credentials['openai_api_key']:
            credentials['openai_api_key'] = encrypter.decrypt_token(
                self.provider.tenant_id,
                credentials['openai_api_key']
            )

            if obfuscated:
                credentials['openai_api_key'] = encrypter.obfuscated_token(credentials['openai_api_key'])

        return credentials

    def should_deduct_quota(self):
        if hosted_model_providers.azure_openai.quota_limit and hosted_model_providers.azure_openai.quota_limit > 0:
            return True

        return False

    @classmethod
    def is_provider_credentials_valid_or_raise(cls, credentials: dict):
        return

    @classmethod
    def encrypt_provider_credentials(cls, tenant_id: str, credentials: dict) -> dict:
        return {}

    def get_provider_credentials(self, obfuscated: bool = False) -> dict:
        return {}
