"""Customers module schemas."""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CustomerCreate(BaseModel):
    name: str
    gstin: Optional[str] = None
    state_code: Optional[str] = None
    state_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    gstin: Optional[str] = None
    state_code: Optional[str] = None
    state_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None


class CustomerResponse(BaseModel):
    id: str
    name: str
    gstin: Optional[str] = None
    state_code: Optional[str] = None
    state_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    customers: List[CustomerResponse]
    total: int
    page: int
    page_size: int
