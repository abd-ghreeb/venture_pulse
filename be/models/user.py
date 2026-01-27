from typing import List, Optional
from sqlalchemy import Column, String
from helpers.text_utils import generate_id
from sqlmodel import SQLModel, Field, Relationship, DateTime, func
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

class User(SQLModel, table=True):
    __tablename__ = "user"

    # Internal PK
    id: str = Field(
            default_factory=generate_id,
            sa_column=Column(String, primary_key=True, index=True)
        )
    
    # App auth fields
    email: Optional[str] = Field(default=None, unique=True, index=True)
    hashed_password: Optional[str]
    full_name: Optional[str] = None

    # Timestamps
    created_at: datetime = Field(
        sa_column=Column(DateTime(timezone=True), server_default=func.now())
    )
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)

    # The "Team ID"
    # Nullable=False ensures everyone belongs to a team (even if it's their own)
    team_id: Optional[str] = Field(default=None, foreign_key="user.id")

    role: Optional[str] = "admin"