
from services.llm_client import llm
from services.agent_tools import tools
from helpers.redis_utils import get_user_session, save_user_session
import json
from langchain_core.messages import (
    HumanMessage, 
    SystemMessage, 
    ToolMessage, 
    AIMessage, 
    messages_from_dict, 
    messages_to_dict
)
from services.prompts import PROMPTS
from controllers.venture_filtering import get_ventures_by_metrics, search_ventures
from helpers.logging import setup_logger
from helpers.json_utils import json_serial

logger = setup_logger("chatting.py")

tool_map = {
    "search_ventures": search_ventures,
    "get_ventures_by_metrics": get_ventures_by_metrics,
}

# Model Setup with Fallbacks
primary_llm = llm.llm_proxy.with_config(config={
    "configurable": {"model_provider": "openai", "model": "gpt-5-nano"}
})

LLM_WITH_TOOLS = primary_llm.bind_tools(tools).with_fallbacks([
    llm.llm_proxy.with_config(config={
        "configurable": {"model_provider": "anthropic", "model": "claude-3-5-sonnet-20240620"}
    }).bind_tools(tools)
])

def get_active_context(chat_summary, history, session_state, sys_content):
    memory_context = SystemMessage(content=f"""
        [CONTEXTUAL MEMORY]
        {chat_summary if chat_summary else "Beginning of analysis session."}
        
        [CURRENT FILTER STATE]
        {json.dumps(session_state['active_filters'], indent=2)}
        
        [VENTURES IN FOCUS]
        {json.dumps(session_state['focused_ventures'], indent=2)}
    """)
    
    return [SystemMessage(content=sys_content), memory_context] + history


def agent_chatting(session_id, msg, session):    
    # 1. Load Session from Redis
    session_data = get_user_session(session_id=session_id) or {}
    chat_summary = session_data.get("summary", "")
    history = messages_from_dict(session_data.get("messages", []))
    
    # 2. Venture-Specific State
    session_state = {
        "active_filters": session_data.get("active_filters", {}),
        "focused_ventures": session_data.get("focused_ventures", []),
        "last_analysis_metrics": session_data.get("last_analysis_metrics", {})
    }

    history.append(HumanMessage(content=msg))
    sys_content = PROMPTS.get("venture_analyst")["content"]

    # 3. Execution with Tool Feedback Loop
    for i in range(3):  
        # Pass the cumulative history which now includes previous ToolMessages
        active_messages = get_active_context(chat_summary, history, session_state, sys_content)
        response = LLM_WITH_TOOLS.invoke(active_messages)
        
        # We only append the AI's response to history here
        history.append(response)

        if not response.tool_calls:
            # Before returning, double check if focused_ventures_data exists.
            # If the LLM just answered from memory without calling a tool in THIS specific turn,
            # we need to make sure we didn't lose the data from the PREVIOUS turn.
            
            # Pull the data that was stored in session_state by the tool handler in the PREVIOUS iteration
            final_ventures = session_state.get("focused_ventures_data", [])
            final_ids = session_state.get("focused_ventures", [])

            save_data = {
                **session_state,
                "summary": chat_summary,
                "messages": messages_to_dict(history)
            }
            save_user_session(session_id, save_data)

            return {
                "answer": response.content,
                "data": {
                    "ventures_ids": final_ids,
                    "ventures": final_ventures, 
                }
            }

        # 4. Tool Handling
        for tool_call in response.tool_calls:
            handler = tool_map.get(tool_call["name"])
            if handler:
                tool_output = handler(state=session_state, payload=tool_call["args"], db=session)
                
                if isinstance(tool_output, dict):
                    # This is the most important part: update the session_state object
                    if "state_update" in tool_output:
                        session_state.update(tool_output["state_update"])
                    
                    # Update the specific data key
                    session_state["focused_ventures_data"] = tool_output.get("data", [])
                    result = tool_output.get("data")
                
                # This MUST be appended to history so the LLM sees it in the next i-loop
                history.append(
                    ToolMessage(
                        tool_call_id=tool_call["id"], 
                        content=json.dumps(result, default=json_serial)
                    )
                )       

    return {"reply": "I've hit my reasoning limit. Could you rephrase the request?", "error": "LOOP_LIMIT"}
