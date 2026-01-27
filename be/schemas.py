from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- Sub-Schemas ---

class PilotCustomerSchema(BaseModel):
    id: str
    name: str
    contract_value: float
    start_date: datetime 
    status: str # 'Active' | 'Churned' | 'Pending'

    class Config:
        populate_by_name = True
        from_attributes = True

# --- Main Response Schemas ---

class VenturePulseResponse(BaseModel):
    id: str
    name: str
    pod: str
    stage: str
    founder: str
    health: str
    burn_rate_monthly: float
    runway_months: int
    nps_score: int
    pilot_customers_count: int
    last_update_text: str
    description: Optional[str] = None
    pilot_customers: List["PilotCustomerSchema"]

    class Config:
        # This allows Pydantic to read data from SQLModel/SQLAlchemy objects
        populate_by_name = True
        from_attributes = True

class VentureDetailResponse(VenturePulseResponse):
    """
    Extends PulseResponse. Used when clicking a specific venture.
    Can be used to add even more granular details if needed.
    """
    # todo: add additional fields here that only appear on the detail page
    # e.g., funding_rounds: List[FundingRound]
    pass

class GlobalMetricsResponse(BaseModel):
    """Matches your calculateMetrics() frontend function."""
    totalBurn: float
    avgRunway: int
    avgNps: int
    totalPilotCustomers: int

class DashboardStatsResponse(BaseModel):
    # KPI Metrics
    totalBurn: float
    avgRunway: int
    avgNps: int
    totalPilotCustomers: int
    
    # Trends & Comparisons (Percentage changes)
    burnChange: float
    runwayChange: float
    npsChange: float
    pilotsChange: float

    # For the KPI Sparklines (Aggregated monthly burn across all ventures)
    burnTrend: List[float] 
    
    # For the Venture Chart (Venture-by-venture comparison)
    chartData: List[dict] # [{"name": "PortFlow", "burn": 85, "runway": 18, "health": "On Track"}]    