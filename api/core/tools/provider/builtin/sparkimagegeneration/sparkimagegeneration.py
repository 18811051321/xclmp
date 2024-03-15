import json
from core.tools.errors import ToolProviderCredentialValidationError
from core.tools.provider.builtin.sparkimagegeneration.tools.sparkimggen import spark_response
from core.tools.provider.builtin_tool_provider import BuiltinToolProviderController


class SparkText2picProvider(BuiltinToolProviderController):
    def _validate_credentials(self, credentials: dict) -> None:
        try:
            if 'APPID' not in credentials or not credentials.get('APPID'):
                raise ToolProviderCredentialValidationError("APPID is required.")
            if 'APISecret' not in credentials or not credentials.get('APISecret'):
                raise ToolProviderCredentialValidationError("APISecret is required.")
            if 'APIKey' not in credentials or not credentials.get('APIKey'):
                raise ToolProviderCredentialValidationError("APIKey is required.")

            appid = credentials.get('APPID')
            apisecret = credentials.get('APISecret')
            apikey = credentials.get('APIKey')
            prompt = "a small black dog"

            try:
                response = spark_response(prompt, appid, apikey, apisecret)
                data = json.loads(response)
                code = data['header']['code']

                if code == 0:
                    # 服务错误码 ， 0表示正常，非0表示出错
                    pass  # 验证通过
                else:
                    raise ToolProviderCredentialValidationError('图片生成错误。错误代码：{}'.format(code))
            except Exception as e:
                raise ToolProviderCredentialValidationError("APPID APISecret APIKey is invalid. {}".format(e))
        except Exception as e:
            raise ToolProviderCredentialValidationError(str(e))
