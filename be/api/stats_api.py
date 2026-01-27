from fastapi import FastAPI, Depends
from sqlmodel import Session, select, func
from models.venture import Venture
from models.db import get_session
from schemas import DashboardStatsResponse
from sqlalchemy import desc

def stats_api(app: FastAPI, prefix: str = "/api/v1"):
    @app.get(f"{prefix}/dashboard-stats", response_model=DashboardStatsResponse)
    async def get_dashboard_stats(session: Session = Depends(get_session)):
        # 1. Fetch Aggregated Totals and Averages using the new Venture columns
        stats_statement = select(
            func.sum(Venture.burn_rate_monthly).label("total_burn"),
            func.avg(Venture.runway_months).label("avg_runway"),
            func.avg(Venture.nps_score).label("avg_nps"),
            func.sum(Venture.pilot_customers_count).label("total_pilots"),
            func.count(Venture.id).label("venture_count")
        )
        stats_result = session.exec(stats_statement).one()

        if not stats_result.venture_count:
            return DashboardStatsResponse(
                totalBurn=0, avgRunway=0, avgNps=0, totalPilotCustomers=0,
                burnChange=0, runwayChange=0, npsChange=0, pilotsChange=0,
                burnTrend=[], chartData=[]
            )

        # 2. Prepare Venture Chart Data (Bar/Scatter Chart)
        # Directly pulls from the Venture table columns
        chart_statement = select(Venture).order_by(desc(Venture.burn_rate_monthly)).limit(10)
        chart_ventures = session.exec(chart_statement).all()
        
        chart_data = [{
            "name": v.name,
            "burn": float(v.burn_rate_monthly) / 1000, # Value in K
            "runway": v.runway_months,
            "health": v.health
        } for v in chart_ventures]

        # 3. Handle Burn Trend
        # Since VentureMetric is gone, we no longer have a SQL table for history.
        # If you aren't storing history, we return an empty list or mock data.
        burn_trend_data = [] 

        return {
            "totalBurn": float(stats_result.total_burn or 0),
            "avgRunway": round(stats_result.avg_runway or 0),
            "avgNps": round(stats_result.avg_nps or 0),
            "totalPilotCustomers": int(stats_result.total_pilots or 0),
            "burnChange": 0, # Compare to prev snapshot if columns added later
            "runwayChange": 0,
            "npsChange": 0,
            "pilotsChange": 0,
            "burnTrend": burn_trend_data,
            "chartData": chart_data
        }