from sqlmodel import Field, SQLModel
from datetime import datetime, timezone
from helpers.text_utils import generate_id


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_token"
    id: str = Field(default_factory=generate_id, primary_key=True)
    user_id: str = Field(index=True)
    token: str = Field(index=True, unique=True)
    expires_at: datetime