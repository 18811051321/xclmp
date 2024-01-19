from typing import Any, Dict, List, Union
from core.tools.entities.tool_entities import ToolInvokeMessage
from core.tools.tool.builtin_tool import BuiltinTool

from base64 import b64decode

from openai import OpenAI

class DallE3Tool(BuiltinTool):
    def _invoke(self, 
                user_id: str, 
               tool_paramters: Dict[str, Any], 
        ) -> Union[ToolInvokeMessage, List[ToolInvokeMessage]]:
        """
            invoke tools
        """
        openai_organization = self.runtime.credentials.get('openai_organizaion_id', None)
        if not openai_organization:
            openai_organization = None
        openai_base_url = self.runtime.credentials.get('openai_base_url', None)
        if not openai_base_url:
            openai_base_url = None

        client = OpenAI(
            api_key=self.runtime.credentials['openai_api_key'],
            base_url=openai_base_url,
            organization=openai_organization
        )

        SIZE_MAPPING = {
            'square': '1024x1024',
            'vertical': '1024x1792',
            'horizontal': '1792x1024',
        }

        # prompt
        prompt = tool_paramters.get('prompt', '')
        if not prompt:
            return self.create_text_message('Please input prompt')
        # get size
        size = SIZE_MAPPING[tool_paramters.get('size', 'square')]
        # get n
        n = tool_paramters.get('n', 1)
        # get quality
        quality = tool_paramters.get('quality', 'standard')
        if quality not in ['standard', 'hd']:
            return self.create_text_message('Invalid quality')
        # get style
        style = tool_paramters.get('style', 'vivid')
        if style not in ['natural', 'vivid']:
            return self.create_text_message('Invalid style')

        # call openapi dalle3
        response = client.images.generate(
            prompt=prompt,
            model='dall-e-3',
            size=size,
            n=n,
            style=style,
            quality=quality,
            response_format='b64_json'
        )

        result = []

        for image in response.data:
            result.append(self.create_blob_message(blob=b64decode(image.b64_json), 
                                                   meta={ 'mime_type': 'image/png' },
                                                    save_as=self.VARIABLE_KEY.IMAGE.value))

        return result