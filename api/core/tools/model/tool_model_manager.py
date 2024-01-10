"""
    For some reason, model will be used in tools like WebScraperTool, WikipediaSearchTool etc.

    Therefore, a model manager is needed to list/invoke/validate models.
"""

from core.model_runtime.entities.message_entities import PromptMessage
from core.model_runtime.entities.llm_entities import LLMResult
from core.model_runtime.entities.model_entities import ModelType
from core.model_runtime.model_providers.__base.large_language_model import LargeLanguageModel, ModelPropertyKey
from core.model_runtime.errors.invoke import InvokeRateLimitError, InvokeBadRequestError, \
    InvokeConnectionError, InvokeAuthorizationError, InvokeServerUnavailableError
from core.model_runtime.utils.encoders import jsonable_encoder
from core.model_manager import ModelManager

from core.tools.model.errors import InvokeModelError
from core.tools.model.entities import ToolModelConfig

from extensions.ext_database import db

from models.tools import ToolModelInvoke

from typing import List, cast
import json

class ToolModelManager:
    @staticmethod
    def get_max_llm_context_tokens(
        tenant_id: str,
        model_provider: str, model: str, model_parameters: dict,
    ) -> int:
        """
            get max llm context tokens of the model
        """
        model_parameter_max_tokens = model_parameters.get('max_tokens', None)
        if model_parameter_max_tokens is not None:
            return model_parameter_max_tokens
        
        model_manager = ModelManager()
        model_instance = model_manager.get_model_instance(
            tenant_id=tenant_id, provider=model_provider, model_type=ModelType.LLM, model=model
        )

        if not model_instance:
            raise InvokeModelError(f'Model not found')
        
        llm_model = cast(LargeLanguageModel, model_instance.model_type_instance)
        schema = llm_model.get_model_schema(model, model_instance.credentials)

        if not schema:
            raise InvokeModelError(f'No model schema found')

        max_tokens = schema.model_properties.get(ModelPropertyKey.CONTEXT_SIZE, None)
        if max_tokens is None:
            return 2048
        
        return max_tokens

    @staticmethod
    def invoke(
        user_id: str, tenant_id: str,
        model_config: ToolModelConfig,
        tool_type: str, tool_name: str,
        model_provider: str, model: str, model_parameters: dict,
        prompt_messages: List[PromptMessage]
    ) -> LLMResult:
        """
        invoke model with parameters in user's own context

        :param user_id: user id
        :param tenant_id: tenant id, the tenant id of the creator of the tool
        :param tool_provider: tool provider
        :param tool_id: tool id
        :param tool_name: tool name
        :param provider: model provider
        :param model: model name
        :param model_parameters: model parameters
        :param prompt_messages: prompt messages
        :return: AssistantPromptMessage
        """

        # get model manager
        model_manager = ModelManager()
        # get model instance
        model_instance = model_manager.get_model_instance(
            tenant_id=tenant_id, provider=model_provider, model_type=ModelType.LLM, model=model
        )

        llm_model = cast(LargeLanguageModel, model_instance.model_type_instance)

        # get model credentials
        model_credentials = model_instance.credentials

        # get prompt tokens
        prompt_tokens = llm_model.get_num_tokens(model, model_credentials, prompt_messages)

        # create tool model invoke
        tool_model_invoke = ToolModelInvoke(
            user_id=user_id,
            tenant_id=tenant_id,
            provider=model_config.provider,
            tool_type=tool_type,
            tool_name=tool_name,
            model_parameters=json.dumps(model_parameters),
            prompt_messages=json.dumps(jsonable_encoder(prompt_messages)),
            model_response='',
            prompt_tokens=prompt_tokens,
            answer_tokens=0,
            answer_unit_price=0,
            answer_price_unit=0,
            provider_response_latency=0,
            total_price=0,
            currency='USD',
        )

        db.session.add(tool_model_invoke)
        db.session.commit()

        try:
            response: LLMResult = llm_model.invoke(
                prompt_messages=prompt_messages,
                model_parameters=model_parameters,
                tools=[], stop=[], stream=False, user=user_id, callbacks=[]
            )
        except InvokeRateLimitError as e:
            raise InvokeModelError(f'Invoke rate limit error: {e}')
        except InvokeBadRequestError as e:
            raise InvokeModelError(f'Invoke bad request error: {e}')
        except InvokeConnectionError as e:
            raise InvokeModelError(f'Invoke connection error: {e}')
        except InvokeAuthorizationError as e:
            raise InvokeModelError(f'Invoke authorization error')
        except InvokeServerUnavailableError as e:
            raise InvokeModelError(f'Invoke server unavailable error: {e}')
        except Exception as e:
            raise InvokeModelError(f'Invoke error: {e}')

        # update tool model invoke
        tool_model_invoke.model_response = response.message.content
        if response.usage:
            tool_model_invoke.answer_tokens = response.usage.completion_tokens
            tool_model_invoke.answer_unit_price = response.usage.completion_unit_price
            tool_model_invoke.answer_price_unit = response.usage.completion_price_unit
            tool_model_invoke.provider_response_latency = response.usage.latency
            tool_model_invoke.total_price = response.usage.total_price
            tool_model_invoke.currency = response.usage.currency

        db.session.commit()

        return response