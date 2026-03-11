from uuid import UUID
"""Auth module Pydantic schemas."""
from pydantic import BaseModel, Field
from typing import Optional


class RegisterRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)
    email: Optional[str] = None


class LoginRequest(BaseModel):
    phone: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class BusinessSetupRequest(BaseModel):
    name: str
    gstin: Optional[str] = None
    state_code: str = Field(..., min_length=2, max_length=2)
    state_name: str
    business_type: str = "regular"
    address: Optional[str] = None
    pincode: Optional[str] = None
    financial_year: str = "2025-26"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: UUID
    name: str
    role: str


class UserProfile(BaseModel):
    id: UUID
    name: str
    phone: str
    email: Optional[str]
    role: str
