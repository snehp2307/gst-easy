"""Products module — Pydantic schemas for product CRUD."""
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    hsn_code: Optional[str] = Field(None, max_length=8)
    unit: str = "NOS"
    unit_price: int = 0  # paise
    gst_rate: float = 18.0
    stock_quantity: int = 0
    low_stock_threshold: int = 10
    sku: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    hsn_code: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[int] = None
    gst_rate: Optional[float] = None
    stock_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    sku: Optional[str] = None
    category: Optional[str] = None


class ProductResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    hsn_code: Optional[str] = None
    unit: str
    unit_price: int
    gst_rate: float
    stock_quantity: int
    low_stock_threshold: int
    sku: Optional[str] = None
    category: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    page_size: int
