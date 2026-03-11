"""
CMS module — Public API endpoints for Blog, Help Center, and Company pages.
No authentication required — these are public-facing endpoints.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models import BlogPost, SupportArticle, CompanyPage

router = APIRouter()


# ─── Schemas ──────────────────────────────

class BlogPostResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    content: str
    author: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SupportArticleResponse(BaseModel):
    id: UUID
    title: str
    content: str
    category: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CompanyPageResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    content: str
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Blog ─────────────────────────────────

@router.get("/blog", response_model=List[BlogPostResponse], tags=["CMS"])
async def list_blog_posts(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BlogPost).order_by(BlogPost.created_at.desc()).limit(50)
    )
    posts = result.scalars().all()
    return [
        BlogPostResponse(
            id=str(p.id), title=p.title, slug=p.slug,
            content=p.content, author=p.author, created_at=p.created_at,
        ) for p in posts
    ]


@router.get("/blog/{slug}", response_model=BlogPostResponse, tags=["CMS"])
async def get_blog_post(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BlogPost).where(BlogPost.slug == slug))
    post = result.scalar_one_or_none()
    if not post:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Blog post not found")
    return BlogPostResponse(
        id=str(post.id), title=post.title, slug=post.slug,
        content=post.content, author=post.author, created_at=post.created_at,
    )


# ─── Help Center ─────────────────────────

@router.get("/help", response_model=List[SupportArticleResponse], tags=["CMS"])
async def list_support_articles(
    category: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(SupportArticle).order_by(SupportArticle.created_at.desc())
    if category:
        query = query.where(SupportArticle.category == category)
    result = await db.execute(query.limit(100))
    articles = result.scalars().all()
    return [
        SupportArticleResponse(
            id=str(a.id), title=a.title, content=a.content,
            category=a.category, created_at=a.created_at,
        ) for a in articles
    ]


@router.get("/help/{article_id}", response_model=SupportArticleResponse, tags=["CMS"])
async def get_support_article(
    article_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SupportArticle).where(SupportArticle.id == UUID(article_id))
    )
    article = result.scalar_one_or_none()
    if not article:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Support article not found")
    return SupportArticleResponse(
        id=str(article.id), title=article.title, content=article.content,
        category=article.category, created_at=article.created_at,
    )


# ─── Company Pages ────────────────────────

@router.get("/company/{slug}", response_model=CompanyPageResponse, tags=["CMS"])
async def get_company_page(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CompanyPage).where(CompanyPage.slug == slug))
    page = result.scalar_one_or_none()
    if not page:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Page not found")
    return CompanyPageResponse(
        id=str(page.id), title=page.title, slug=page.slug,
        content=page.content, updated_at=page.updated_at,
    )
