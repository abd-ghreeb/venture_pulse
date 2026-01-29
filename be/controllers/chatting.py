
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
    "configurable": {"model_provider": "openai", "model": "gpt-5.2"}
})

LLM_WITH_TOOLS = primary_llm.bind_tools(tools).with_fallbacks([
    llm.llm_proxy.with_config(config={
        "configurable": {"model_provider": "anthropic", "model": "claude-3-5-sonnet-20240620"}
    }).bind_tools(tools)
])

def get_active_context(chat_summary, history, session_state, sys_content):
    # --- STEP 1: VALIDATE HISTORY SEQUENCE ---
    # We must ensure every AIMessage with tool_calls is followed by ToolMessages.
    # If not, that AIMessage is "invalid" and must be removed before sending to OpenAI.
    
    validated_history = []
    i = 0
    while i < len(history):
        msg = history[i]
        
        # If it's an AI message with tool calls
        if hasattr(msg, 'tool_calls') and msg.tool_calls:
            # Check if the NEXT messages are the corresponding ToolMessages
            # (We expect one ToolMessage for each tool_call)
            expected_count = len(msg.tool_calls)
            tool_responses = history[i+1 : i+1+expected_count]
            
            # Verify they are all ToolMessages and count matches
            is_valid = (
                len(tool_responses) == expected_count and 
                all(isinstance(tr, ToolMessage) for tr in tool_responses)
            )
            
            if is_valid:
                validated_history.append(msg)
                validated_history.extend(tool_responses)
                i += (1 + expected_count) # Skip forward
            else:
                # Sequence is broken! Skip this AIMessage to "heal" the history
                i += 1 
        else:
            # Regular Human or System message
            validated_history.append(msg)
            i += 1

    # --- STEP 2: CONSOLIDATE INSTRUCTIONS ---
    combined_instructions = f"""
{sys_content}
[SESSION CONTEXT]: {chat_summary if chat_summary else "New session."}
[STATE]: {json.dumps(session_state.get('active_filters', {}))}
"""

    # --- STEP 3: TRIM ---
    final_history = validated_history[-8:]
    # Final check: Ensure we don't start with a ToolMessage
    while final_history and isinstance(final_history[0], ToolMessage):
        final_history.pop(0)

    return [SystemMessage(content=combined_instructions)] + final_history
def agent_chatting(session_id, msg, session):    
    # 1. Load Session & Initialize History
    session_data = get_user_session(session_id=session_id) or {}
    chat_summary = session_data.get("summary", "")
    
    # Robust history loading
    raw_history = session_data.get("messages", [])
    history = messages_from_dict(raw_history) if raw_history else []
    
    # 2. Maintain Venture-Specific State
    session_state = {
        "active_filters": session_data.get("active_filters", {}),
        "focused_ventures": session_data.get("focused_ventures", []),
        "last_analysis_metrics": session_data.get("last_analysis_metrics", {}),
        "focused_ventures_data": session_data.get("focused_ventures_data", [])
    }

    # Add the new user message
    history.append(HumanMessage(content=msg))
    sys_content = PROMPTS.get("venture_analyst")["content"]

    # 3. Execution Loop (Limit to 5 turns to prevent infinite loops)
    for i in range(5):  
        active_messages = get_active_context(chat_summary, history, session_state, sys_content)
        
        try:
            response = LLM_WITH_TOOLS.invoke(active_messages)
        except Exception as e:
            # CRITICAL FIX: If the history is corrupted (orphaned tool calls), 
            # pop the last message to unblock the session for the next attempt.
            if "tool_calls" in str(e) and len(history) > 0:
                history.pop() 
            raise e
        
        # We append the AI response immediately to maintain sequence
        history.append(response)

        # CASE A: Final Answer (No tools called)
        if not response.tool_calls:
            final_ventures = session_state.get("focused_ventures_data", [])
            final_ids = session_state.get("focused_ventures", [])

            # Save clean history and state to Redis
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

        # CASE B: Tool Handling (Tools were called)
        for tool_call in response.tool_calls:
            handler = tool_map.get(tool_call["name"])
            result = "No data found." # Default fallback string
            
            if handler:
                tool_output = handler(state=session_state, payload=tool_call["args"], db=session)
                
                if isinstance(tool_output, dict):
                    # Update local state with tool results
                    if "state_update" in tool_output:
                        session_state.update(tool_output["state_update"])
                    
                    session_state["focused_ventures_data"] = tool_output.get("data", [])
                    result = tool_output.get("data")
                
                # IMPORTANT: Append ToolMessage immediately after the AI's tool_call
                history.append(
                    ToolMessage(
                        tool_call_id=tool_call["id"], 
                        content=json.dumps(result, default=json_serial)
                    )
                )       

    # 4. Final Safety Guard
    # If the loop finishes without returning, the last message might be an AIMessage 
    # with tool_calls. We MUST remove it so the history remains valid for the next turn.
    if history and hasattr(history[-1], 'tool_calls') and history[-1].tool_calls:
        history.pop()

    return {
        "answer": "I've hit my reasoning limit for this specific request. Could you try rephrasing?", 
        "error": "LOOP_LIMIT"
    }
