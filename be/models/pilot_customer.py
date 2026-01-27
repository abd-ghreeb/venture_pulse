from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Column, String, Numeric, Text
from sqlmodel import SQLModel, Field, Relationship, DateTime, func
from datetime import datetime, timezone

# For generate_id, ensure you have your helper or replace with uuid.uuid4
from helpers.text_utils import generate_id 

if TYPE_CHECKING:
    from .venture import Venture

class PilotCustomer(SQLModel, table=True):
    __tablename__ = "pilot_customer"

    id: str = Field(default_factory=generate_id, primary_key=True)
    name: str = Field(index=True)
    contract_value: float = Field(sa_column=Column(Numeric(12, 2)))
    start_date: datetime
    status: str = Field(default="Active") # 'Active' | 'Churned' | 'Pending'
    
    venture_id: str = Field(foreign_key="venture.id", index=True)
    venture: "Venture" = Relationship(back_populates="pilot_customers")


