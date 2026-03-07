"""
Documents module — File upload and OCR processing pipeline.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business, Document
from app.core.exceptions import NotFoundError
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()


class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_url: str
    document_type: str
    ocr_status: str
    ocr_confidence: Optional[float] = None
    linked_invoice_id: Optional[str] = None
    created_at: datetime


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Query("invoice"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    # For now, store locally — in production use S3/R2
    contents = await file.read()
    file_url = f"/uploads/{file.filename}"

    doc = Document(
        business_id=business.id,
        uploaded_by=user.id,
        filename=file.filename or "upload",
        file_url=file_url,
        file_size=len(contents),
        mime_type=file.content_type,
        document_type=document_type,
        ocr_status="pending",
    )
    db.add(doc)
    await db.flush()

    # In production: dispatch background OCR task here
    # tasks.ocr_tasks.process_document.delay(str(doc.id))

    return DocumentResponse(
        id=str(doc.id),
        filename=doc.filename,
        file_url=doc.file_url,
        document_type=doc.document_type,
        ocr_status=doc.ocr_status,
        created_at=doc.created_at,
    )


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Document)
        .where(Document.business_id == business.id)
        .order_by(Document.created_at.desc())
        .limit(50)
    )
    docs = result.scalars().all()
    return [
        DocumentResponse(
            id=str(d.id), filename=d.filename, file_url=d.file_url,
            document_type=d.document_type, ocr_status=d.ocr_status,
            ocr_confidence=d.ocr_confidence,
            linked_invoice_id=str(d.linked_invoice_id) if d.linked_invoice_id else None,
            created_at=d.created_at,
        )
        for d in docs
    ]
