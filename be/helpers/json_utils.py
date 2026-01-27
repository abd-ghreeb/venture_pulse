from datetime import datetime, date
import json
from decimal import Decimal

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    # If you have Decimal types (often from SQL Numeric columns):
    if isinstance(obj, Decimal):
        return float(obj) # Or str(obj) if you need absolute precision
    if hasattr(obj, '__float__'):
        return float(obj)
    raise TypeError(f"Type {type(obj)} not serializable")