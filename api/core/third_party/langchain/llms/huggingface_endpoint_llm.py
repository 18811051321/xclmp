import json
from typing import Any, Dict, List, Mapping, Optional

import requests
from langchain.llms import HuggingFaceEndpoint
from langchain.llms.huggingface_endpoint import VALID_TASKS
from pydantic import Extra, root_validator

from langchain.callbacks.manager import CallbackManagerForLLMRun
from langchain.llms.utils import enforce_stop_tokens
from langchain.utils import get_from_dict_or_env


class HuggingFaceEndpointLLM(HuggingFaceEndpoint):
    """HuggingFace Endpoint models.

    To use, you should have the ``huggingface_hub`` python package installed, and the
    environment variable ``HUGGINGFACEHUB_API_TOKEN`` set with your API token, or pass
    it as a named parameter to the constructor.

    Only supports `text-generation` and `text2text-generation` for now.

    Example:
        .. code-block:: python

            from langchain.llms import HuggingFaceEndpoint
            endpoint_url = (
                "https://abcdefghijklmnop.us-east-1.aws.endpoints.huggingface.cloud"
            )
            hf = HuggingFaceEndpoint(
                endpoint_url=endpoint_url,
                huggingfacehub_api_token="my-api-key"
            )
    """
    streaming: bool = False

    class Config:
        """Configuration for this pydantic object."""

        extra = Extra.forbid

    @root_validator(allow_reuse=True)
    def validate_environment(cls, values: Dict) -> Dict:
        """Validate that api key and python package exists in environment."""
        huggingfacehub_api_token = get_from_dict_or_env(
            values, "huggingfacehub_api_token", "HUGGINGFACEHUB_API_TOKEN"
        )

        values["huggingfacehub_api_token"] = huggingfacehub_api_token
        return values

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Call out to HuggingFace Hub's inference endpoint.

        Args:
            prompt: The prompt to pass into the model.
            stop: Optional list of stop words to use when generating.

        Returns:
            The string generated by the model.

        Example:
            .. code-block:: python

                response = hf("Tell me a joke.")
        """
        _model_kwargs = self.model_kwargs or {}

        # payload samples
        params = {**_model_kwargs, **kwargs}
        parameter_payload = {"inputs": prompt, "parameters": params}

        # HTTP headers for authorization
        headers = {
            "Authorization": f"Bearer {self.huggingfacehub_api_token}",
            "Content-Type": "application/json",
        }

        # send request
        try:
            response = requests.post(
                self.endpoint_url, headers=headers, json=parameter_payload, stream=self.streaming
            )
        except requests.exceptions.RequestException as e:  # This is the correct syntax
            raise ValueError(f"Error raised by inference endpoint: {e}")

        if self.streaming:
            for item in response.iter_lines():
                text = item.decode('utf-8')
                print(text)
                generated_text = json.loads(text)
        else:
            generated_text = response.json()

        if "error" in generated_text:
            raise ValueError(
                f"Error raised by inference API: {generated_text['error']}"
            )
        if self.task == "text-generation":
            text = generated_text[0]["generated_text"]
            # Remove prompt if included in generated text.
            if text.startswith(prompt):
                text = text[len(prompt) :]
        elif self.task == "text2text-generation":
            text = generated_text[0]["generated_text"]
        elif self.task == "summarization":
            text = generated_text[0]["summary_text"]
        else:
            raise ValueError(
                f"Got invalid task {self.task}, "
                f"currently only {VALID_TASKS} are supported"
            )
        if stop is not None:
            # This is a bit hacky, but I can't figure out a better way to enforce
            # stop tokens when making calls to huggingface_hub.
            text = enforce_stop_tokens(text, stop)
        return text
