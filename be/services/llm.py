# llm.py
from datetime import datetime, timezone
import os
import json
from typing import List, Optional, Dict
from helpers.text_utils import clean_llm_json
from langchain.chat_models import init_chat_model
from langchain_core.prompts import PromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from services.prompts import PROMPTS
from config.constants import CHAT_HISTORY_SUMMARIZATION_MODEL, CHAT_HISTORY_SUMMARIZATION_MODEL_PROVIDER
from helpers.logging import setup_logger


logger = setup_logger("LLMManager")

class LLMManager:
    def __init__(
        self,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        **kwargs
    ):
        # 1. Fetch Allowed Models Guardrail
        try:
            allowed_json = os.getenv("ALLOWED_MODELS_JSON", "{}")
            self.allowed_registry: Dict[str, List[str]] = json.loads(allowed_json)
        except json.JSONDecodeError:
            logger.error("ALLOWED_MODELS_JSON is not valid JSON. Defaulting to empty.")
            self.allowed_registry = {}

        # 2. Configurable Properties
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.extra_params = kwargs
        
        # 3. Initialize Provider-Agnostic Proxy
        # This proxy will only decide the model/provider at the moment of 'generate_response'
        self.llm_proxy = init_chat_model()

    def _validate_config(self, provider: str, model: str):
        """Guard layer to ensure provider and model are whitelisted."""
        if provider not in self.allowed_registry:
            raise ValueError(f"Provider '{provider}' is not supported.")
        if model not in self.allowed_registry[provider]:
            raise ValueError(f"Model '{model}' is not allowed for provider '{provider}'.")

    def generate_response(
        self,
        input_vars: dict,
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
        prompt_key: str = "system_prompt",
        lang: str = "English"
    ) -> str:
        try:
            # 1. Load the prompt data
            prompt_data = PROMPTS.get(prompt_key)
            if not prompt_data:
                raise ValueError(f"Prompt '{prompt_key}' not found")

            # 2. Resolve Model & Provider: User Input > Prompt Default > Manager Default
            active_provider = provider or prompt_data.get("default_provider", "openai")
            active_model = model_name or prompt_data.get("default_model", "gpt-5-nano")

            # 3. Guardrail Validation
            self._validate_config(active_provider, active_model)

            # 1. Create the Primary Runnable
            primary_llm = self.llm_proxy.with_config(config={
                "configurable": {
                    "model_provider": active_provider,
                    "model": active_model
                }
            })

            # 2. Define Fallbacks (e.g., if OpenAI fails, try Anthropic)
            # You can customize this list based on your specific needs
            fallbacks = [
                self.llm_proxy.with_config(config={
                    "configurable": {"model_provider": "anthropic", "model": "claude-3-5-sonnet-20240620"}
                }),
                self.llm_proxy.with_config(config={
                    "configurable": {"model_provider": "google", "model": "gemini-1.5-flash"}
                })
            ]

            # 3. Chain them together
            # This creates a single object that handles the retry logic automatically
            runnable = primary_llm.with_fallbacks(fallbacks)


            # 4. Prepare Content
            raw_template = prompt_data["content"]
            if "{language}" in raw_template:
                raw_template = raw_template.replace("{language}", lang)

            # Logic for template formatting
            if input_vars:
                template = PromptTemplate(input_variables=list(input_vars.keys()), template=raw_template)
                formatted_content = template.format(**input_vars)
            else:
                formatted_content = raw_template

            # 5. Execute
            response_obj = runnable.invoke(
                [HumanMessage(content=formatted_content)],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                **self.extra_params
            )
            
            response_text = clean_llm_json(text=response_obj.content)

            # Step 4: Logging
            log_entry = {
                "timestamp": datetime.now(timezone.utc),
                "provider": provider,
                "model": model_name,
                "prompt_key": prompt_key,
                "response": response_text,
                "language": lang,
            }

            return response_text

        except ValueError as ve:
            logger.warning(f"Guardrail violation: {ve}")
            return str(ve)
        except Exception as e:
            logger.exception("LLM query failed: %s", str(e))
            return "Sorry, I couldn't generate a response due to an internal error."


    def summarize_conversation(self, current_summary, messages_to_archive):
        """
        Collapses old messages into a concise summary to save tokens.
        """
        if not messages_to_archive:
            return current_summary

        # 1. Format the messages to be archived into a readable string for the LLM
        formatted_history = ""
        for m in messages_to_archive:
            if isinstance(m, HumanMessage):
                formatted_history += f"User: {m.content}\n"
            elif isinstance(m, AIMessage) and m.content:
                formatted_history += f"Assistant: {m.content}\n"
            elif isinstance(m, ToolMessage):
                # We usually summarize the fact a tool was called, not the raw JSON
                formatted_history += f"System: (Action performed/Data retrieved)\n"

        # 2. Prepare the Summarization Prompt
        summary_prompt = f"""
Progressively summarize the lines of conversation provided, adding onto the previous summary 
to create a single concise update. Focus on:
- User preferences (items they liked/disliked)
- Specific intent (e.g., "looking for a dress for a wedding")
- Key decisions made (e.g., "agreed to delivery on Friday")

CURRENT SUMMARY:
{current_summary if current_summary else "No previous summary."}

NEW MESSAGES TO ADD:
{formatted_history}

New concise summary:
"""

        # 3. Call the LLM (Using a lightweight model for cost efficiency)
        summary_llm = self.llm_proxy.with_config(config={
            "configurable": {"model_provider": CHAT_HISTORY_SUMMARIZATION_MODEL_PROVIDER, "model": CHAT_HISTORY_SUMMARIZATION_MODEL}
        })
        
        response = summary_llm.invoke([SystemMessage(content=summary_prompt)])
        
        return response.content.strip()

