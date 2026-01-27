"""
All tool (function) definitions used by the shopping assistant agent.
These definitions match the handlers in handlers.py and enforce factual accuracy.
"""

tools = [
    {
        "type": "function",
        "function": {
            "name": "search_ventures",
            "description": "Search the portfolio using text-based filters. Use this for finding specific companies, founders, or browsing by pod/stage.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Partial or full name of the venture"},
                    "founder": {"type": "string", "description": "Name of the founder"},
                    "pod": {"type": "string", "description": "e.g., 'HealthTech', 'FinTech', 'Infrastructure'"},
                    "stage": {"type": "string", "description": "e.g., 'Discovery', 'Validation', 'Pilot', 'Scale'"},
                    "health": {
                        "type": "string", 
                        "enum": ["On Track", "At Risk", "Critical"],
                        "description": "The current health status of the venture"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_ventures_by_metrics",
            "description": "Query ventures based on numerical performance data. Use this for 'top X', 'highest burn', 'low runway', or filtering by NPS/Pilots.",
            "parameters": {
                "type": "object",
                "properties": {
                    "metric_type": {
                        "type": "string", 
                        "enum": [
                            "burn_rate_monthly", 
                            "runway_months", 
                            "nps_score", 
                            "pilot_customers_count"
                        ],
                        "description": "The specific numerical KPI to analyze."
                    },
                    "operator": {
                        "type": "string", 
                        "enum": ["gt", "lt", "sort_desc", "sort_asc"],
                        "description": "gt/lt for filtering; sort_desc/sort_asc for ranking (e.g., 'Highest NPS')."
                    },
                    "value": {
                        "type": "number", 
                        "description": "The threshold value (e.g., 50000 for burn or 70 for NPS)."
                    },
                    "limit": {
                        "type": "integer", 
                        "default": 5, 
                        "description": "Number of results to return (useful for 'Top 3')."
                    }
                },
                "required": ["metric_type", "operator"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "fallback",
            "description": "Generic handler for unrecognized requests. Ask for clarification instead of speculating.",
            "parameters": {
                "type": "object",
                "properties": {
                    "raw_message": {"type": "string"},
                },
                "required": ["raw_message"],
            },
        },
    },
]