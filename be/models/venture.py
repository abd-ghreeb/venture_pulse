from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Column, DateTime, Numeric, String, Text, func
from helpers.text_utils import generate_id
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone

if TYPE_CHECKING:
    from .pilot_customer import PilotCustomer

class Venture(SQLModel, table=True):
    __tablename__ = "venture"

    id: str = Field(
        default_factory=generate_id,
        sa_column=Column(String, primary_key=True, index=True)
    )
    name: str = Field(index=True)
    pod: str = Field(index=True)
    stage: str = Field(index=True)
    health: str = Field(default="On Track")
    founder: str
    description: Optional[str] = Field(sa_column=Column(Text))
    last_update_text: str = Field(sa_column=Column(Text))

    # --- New Aggregation Columns (Denormalized for performance) ---
    # We use float/Numeric to handle burn rate
    burn_rate_monthly: float = Field(default=0.0, sa_column=Column(Numeric(12, 2)))
    runway_months: int = Field(default=0)
    pilot_customers_count: int = Field(default=0) # Total number of pilot customers
    nps_score: int = Field(default=0)
    
    # Standard Timestamps
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column=Column(DateTime(timezone=True), onupdate=func.now())
    )

    # Relationships
    lead_id: Optional[str] = Field(default=None, foreign_key="user.id")
    pilot_customers: List["PilotCustomer"] = Relationship(back_populates="venture")