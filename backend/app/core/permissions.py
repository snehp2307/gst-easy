"""
Role-Based Access Control (RBAC).
Roles: admin, accountant, staff, ca (chartered accountant)
"""
from functools import wraps
from typing import List
from fastapi import HTTPException, status


# Role hierarchy — higher roles inherit lower permissions
ROLE_HIERARCHY = {
    "admin": 100,
    "ca": 80,
    "accountant": 60,
    "staff": 40,
}


def require_role(allowed_roles: List[str]):
    """
    FastAPI dependency factory that checks if the current user has one of the allowed roles.
    Usage: router.get("/", dependencies=[Depends(require_role(["admin", "accountant"]))])
    """
    from app.dependencies import get_current_user

    async def _check_role(user=None):
        # user is injected by the dependency chain
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' does not have permission. Required: {allowed_roles}",
            )
        return user

    return _check_role


def check_permission(user_role: str, allowed_roles: List[str]) -> bool:
    """Simple permission check helper."""
    return user_role in allowed_roles
