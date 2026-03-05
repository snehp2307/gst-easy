"""
Audit logging service — append-only financial change tracking.
"""
from uuid import UUID
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import AuditLog


async def log_audit(
    db: AsyncSession,
    business_id: UUID,
    user_id: UUID,
    entity_type: str,
    entity_id: UUID,
    action: str,
    changes: Optional[Dict[str, Any]] = None,
    reason: Optional[str] = None,
) -> AuditLog:
    """Create an immutable audit log entry."""
    entry = AuditLog(
        business_id=business_id,
        user_id=user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        changes=changes or {},
        reason=reason,
    )
    db.add(entry)
    return entry
