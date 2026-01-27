from fastapi import FastAPI, Body, WebSocket, WebSocketDisconnect, Depends, \
    HTTPException, Query, Cookie, Request
from pydantic import BaseModel, Field
from models.user import User
from controllers.chatting import  agent_chatting
from helpers.authentication_utils import get_current_user # Corrected import
from sqlmodel import Session, SQLModel, Field
from models.db import get_session
from helpers.logging import setup_logger
from helpers.redis_utils import reset_user_session

logger = setup_logger("chat_api")


class MessageCreate(SQLModel):
    text: str
    # sender: str  # "user_id" or "bot" --> sourced directly from logged in user

class ChatRequest(BaseModel):
    question: str

# Pydantic request body model for /message
class AskRequest(BaseModel):
    # Required fields
    question: str = Field(
        ...,
        min_length=1,
        max_length=512,
        description="User’s message"
    )
    slug: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Unique identifier for app."
    )


def query_api(app: FastAPI, prefix: str = "/api/v1"):

    @app.post(f"{prefix}/query")
    async def ai_agent_query(
        session_id: str = Body("test"),
        msg: str = Body(...),       
        # current_user: dict = Depends(get_current_user),
        session: Session = Depends(get_session)):

      response = agent_chatting(
          session_id=session_id, 
          msg=msg,
          session=session)
      # { "answer": str, "data": { "ventures": [...], "venture_ids": [...]} }
      return response


    @app.post(f"{prefix}/session/clear")
    async def clear_session(session_id: str = Body(..., embed=True)):
        try:
            reset_user_session(session_id)
        except Exception as e:
            print(f"Session clear failed: {e}")

        return {"status": "success", "session_id": session_id}