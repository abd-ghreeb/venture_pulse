from fastapi import FastAPI, HTTPException, Depends, Query
from sqlmodel import Session, select, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from models.venture import Venture

from models.db import get_session
from schemas import VenturePulseResponse 

def venture_api(app: FastAPI, prefix: str = "/api/v1/ventures"):
    
    @app.get(f"{prefix}", response_model=List[VenturePulseResponse])
    async def get_all_ventures(session: Session = Depends(get_session)):
        """
        Fetches all ventures using denormalized columns for high performance.
        """
        # We only need to eager load pilot_customers if the schema requires the full list
        statement = select(Venture).options(
            selectinload(Venture.pilot_customers)
        )
        results = session.exec(statement).all()
        
        # Pydantic's model_validate handles the snake_case -> camelCase mapping 
        # based on the aliases we set in the VenturePulseResponse schema.
        return [VenturePulseResponse.model_validate(v) for v in results]

    @app.get(f"{prefix}/{{venture_id}}", response_model=VenturePulseResponse)
    async def get_venture_details(venture_id: str, session: Session = Depends(get_session)):
        """
        Fetches full details for a single venture, including history for the sparkline.
        """
        statement = select(Venture).where(Venture.id == venture_id).options(
            selectinload(Venture.pilot_customers),
            # We eager load history only when viewing details
            selectinload(Venture.metrics_history) 
        )
        venture = session.exec(statement).first()
        
        if not venture:
            raise HTTPException(status_code=404, detail="Venture not found")
            
        return VenturePulseResponse.model_validate(venture)
    
    @app.get(f"{prefix}/filter", response_model=List[VenturePulseResponse])
    async def filter_ventures(
        pod: Optional[str] = Query(None),
        stage: Optional[str] = Query(None),
        health: Optional[str] = Query(None),
        search: Optional[str] = Query(None),
        min_runway: Optional[int] = Query(None),
        max_burn: Optional[float] = Query(None),
        session: Session = Depends(get_session)
    ):
        """
        Optimized filtering using direct database columns.
        """
        statement = select(Venture).options(selectinload(Venture.pilot_customers))

        # Categorical Filters
        if pod:
            statement = statement.where(Venture.pod == pod)
        if stage:
            statement = statement.where(Venture.stage == stage)
        if health:
            statement = statement.where(Venture.health == health)
        
        # Text Search
        if search:
            statement = statement.where(
                or_(
                    Venture.name.ilike(f"%{search}%"),
                    Venture.founder.ilike(f"%{search}%")
                )
            )

        # Numerical Metric Filters (Now possible directly in SQL!)
        if min_runway:
            statement = statement.where(Venture.runway_months >= min_runway)
        if max_burn:
            statement = statement.where(Venture.burn_rate_monthly <= max_burn)

        results = session.exec(statement).all()
        return [VenturePulseResponse.model_validate(v) for v in results]