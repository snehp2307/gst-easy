"""
Indian state codes for GSTIN validation and place-of-supply determination.
"""
from typing import Dict, Optional, List

INDIAN_STATES: List[Dict] = [
    {"code": "01", "name": "Jammu & Kashmir", "ut": True},
    {"code": "02", "name": "Himachal Pradesh", "ut": False},
    {"code": "03", "name": "Punjab", "ut": False},
    {"code": "04", "name": "Chandigarh", "ut": True},
    {"code": "05", "name": "Uttarakhand", "ut": False},
    {"code": "06", "name": "Haryana", "ut": False},
    {"code": "07", "name": "Delhi", "ut": True},
    {"code": "08", "name": "Rajasthan", "ut": False},
    {"code": "09", "name": "Uttar Pradesh", "ut": False},
    {"code": "10", "name": "Bihar", "ut": False},
    {"code": "11", "name": "Sikkim", "ut": False},
    {"code": "12", "name": "Arunachal Pradesh", "ut": False},
    {"code": "13", "name": "Nagaland", "ut": False},
    {"code": "14", "name": "Manipur", "ut": False},
    {"code": "15", "name": "Mizoram", "ut": False},
    {"code": "16", "name": "Tripura", "ut": False},
    {"code": "17", "name": "Meghalaya", "ut": False},
    {"code": "18", "name": "Assam", "ut": False},
    {"code": "19", "name": "West Bengal", "ut": False},
    {"code": "20", "name": "Jharkhand", "ut": False},
    {"code": "21", "name": "Odisha", "ut": False},
    {"code": "22", "name": "Chhattisgarh", "ut": False},
    {"code": "23", "name": "Madhya Pradesh", "ut": False},
    {"code": "24", "name": "Gujarat", "ut": False},
    {"code": "26", "name": "Dadra & Nagar Haveli and Daman & Diu", "ut": True},
    {"code": "27", "name": "Maharashtra", "ut": False},
    {"code": "28", "name": "Andhra Pradesh (old)", "ut": False},
    {"code": "29", "name": "Karnataka", "ut": False},
    {"code": "30", "name": "Goa", "ut": False},
    {"code": "31", "name": "Lakshadweep", "ut": True},
    {"code": "32", "name": "Kerala", "ut": False},
    {"code": "33", "name": "Tamil Nadu", "ut": False},
    {"code": "34", "name": "Puducherry", "ut": True},
    {"code": "35", "name": "Andaman & Nicobar Islands", "ut": True},
    {"code": "36", "name": "Telangana", "ut": False},
    {"code": "37", "name": "Andhra Pradesh", "ut": False},
    {"code": "38", "name": "Ladakh", "ut": True},
    {"code": "97", "name": "Other Territory", "ut": False},
]

STATE_MAP: Dict[str, Dict] = {s["code"]: s for s in INDIAN_STATES}


def get_state_name(code: str) -> Optional[str]:
    state = STATE_MAP.get(code)
    return state["name"] if state else None


def is_valid_state_code(code: str) -> bool:
    return code in STATE_MAP
