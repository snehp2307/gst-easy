"""Products module — CRUD for product / inventory management."""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business, Product
from app.core.exceptions import NotFoundError
from app.modules.products.schemas import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
)

router = APIRouter()


@router.get("", response_model=ProductListResponse)
async def list_products(
    search: str = Query(None),
    category: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    query = select(Product).where(Product.business_id == business.id, Product.is_active == True)

    if search:
        query = query.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.hsn_code.ilike(f"%{search}%"),
                Product.sku.ilike(f"%{search}%"),
            )
        )
    if category:
        query = query.where(Product.category == category)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    offset = (page - 1) * page_size
    query = query.order_by(Product.name).offset(offset).limit(page_size)
    result = await db.execute(query)
    products = result.scalars().all()

    return ProductListResponse(
        products=[ProductResponse.model_validate(p, from_attributes=True) for p in products],
        total=total, page=page, page_size=page_size,
    )


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    req: ProductCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    product = Product(business_id=business.id, **req.model_dump())
    db.add(product)
    await db.flush()
    return ProductResponse.model_validate(product, from_attributes=True)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.business_id == business.id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError("Product", str(product_id))
    return ProductResponse.model_validate(product, from_attributes=True)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    req: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.business_id == business.id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError("Product", str(product_id))

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    await db.flush()
    return ProductResponse.model_validate(product, from_attributes=True)


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.business_id == business.id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundError("Product", str(product_id))
    product.is_active = False
    await db.flush()


@router.get("/low-stock", response_model=ProductListResponse)
async def low_stock_products(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    """Return products where stock_quantity <= low_stock_threshold."""
    query = (
        select(Product)
        .where(
            Product.business_id == business.id,
            Product.is_active == True,
            Product.stock_quantity <= Product.low_stock_threshold,
        )
        .order_by(Product.stock_quantity)
    )
    result = await db.execute(query)
    products = result.scalars().all()

    return ProductListResponse(
        products=[ProductResponse.model_validate(p, from_attributes=True) for p in products],
        total=len(products), page=1, page_size=100,
    )
