from typing import Optional, List
from sqlmodel import Session, select, func, desc, asc
from models import Venture
from schemas import VenturePulseResponse

from helpers.logging import setup_logger

logger = setup_logger("AI Agnet Tools")

def parse_search_results (results):
    formatted_data = []
    for v in results:
        # Get latest metric for the current snapshot
        temp = {
            "id": v.id,
            "name": v.name,
            "pod": v.pod,
            "stage": v.stage,
            "founder": v.founder,
            "health": v.health,
            "burn_rate_monthly": float(v.burn_rate_monthly),
            "runway_months": v.runway_months,
            "nps_score": v.nps_score ,
            "pilot_customers_count": len(v.pilot_customers),
            "last_update_text": v.last_update_text,
            "description": v.description,
            "pilot_customers": [p.dict() for p in v.pilot_customers], 
        }
        validated = VenturePulseResponse.model_validate(temp).model_dump(by_alias=True)
        formatted_data.append(validated)
    return formatted_data

# --- Tool 1: General Metadata & Basic Filter ---
def search_ventures(state: dict, payload: dict, db: Session):
    """
    Search for ventures based on their name, pod, or growth stage.
    Payload keys: name, pod, stage
    """

    # 1. Extract arguments from the LLM payload
    name = payload.get("name")
    founder = payload.get("founder")
    pod = payload.get("pod")
    stage = payload.get("stage")
    health = payload.get("health")

    # 2. Build the query
    statement = select(Venture)
    if name:
        statement = statement.where(Venture.name.contains(name))
    if pod:
        statement = statement.where(Venture.pod == pod)
    if stage:
        statement = statement.where(Venture.stage == stage)
    if health:
        statement = statement.where(Venture.health == health)
    if founder:
        statement = statement.where(Venture.founder.ilike(f"%{founder}%"))
        
    results = db.exec(statement).all()
    validated_parsed_data = parse_search_results(results=results)

    # Return data for the LLM AND a state update for the UI/Memory
    return {
        "data": validated_parsed_data,
        "state_update": {
            "focused_ventures": [v.id for v in results],
            "active_filters": payload # Persist filters in session memory
        }
    }

# --- Tool 2: Advanced Metrics Query ---
def get_ventures_by_metrics(state: dict, payload: dict, db: Session):
    """
    Rank and filter ventures using denormalized metric columns.
    Supports single metric sorting via 'metric_type' or multi-metric via 'sort_by'.
    """
    # 1. Extraction & Parameter Normalization
    limit = payload.get("limit")
    health = payload.get("health")
    pod = payload.get("pod")
    
    # Handle both LLM styles: single 'metric_type' or plural 'sort_by'
    metric_type = payload.get("metric_type")
    operator = payload.get("operator", "sort_desc")
    sort_by_list = payload.get("sort_by", [])

    # 2. Base Query
    statement = select(Venture)
    
    # 3. Apply Categorical Filters (Pod/Health)
    if health:
        statement = statement.where(Venture.health == health)
    if pod:
        statement = statement.where(Venture.pod == pod)

    # 4. Construct Multi-Metric Sorting
    order_clauses = []

    # If LLM passed a specific list (e.g., ["nps_score", "burn_rate_monthly"])
    if sort_by_list:
        for field in sort_by_list:
            if hasattr(Venture, field):
                order_clauses.append(desc(getattr(Venture, field)))
    
    # If LLM used the standard single-metric definition
    elif metric_type and hasattr(Venture, metric_type):
        sort_func = desc if "desc" in operator else asc
        order_clauses.append(sort_func(getattr(Venture, metric_type)))

    # Default fallback to keep results consistent
    else:
        order_clauses.append(desc(Venture.updated_at))

    statement = statement.order_by(*order_clauses)
    # 5. Execution (Only apply limit if it is a positive integer)
    if limit:
        results = db.exec(statement.limit(limit)).all()
    else:
        results = db.exec(statement).all()
    
    # Use your previously defined helper to map to frontend-friendly camelCase
    validated_parsed_data = parse_search_results(results=results)

    # 6. Return Data + State Update
    return {
        "data": validated_parsed_data,
        "state_update": {
            "focused_ventures": [v.id for v in results],
            "active_filters": payload,
            "last_analysis_metrics": {
                "metric_used": metric_type or sort_by_list,
                "count": len(results)
            }
        }
    }
