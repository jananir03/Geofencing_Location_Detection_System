from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.audit_log import (
    AuditLogListResponse,
    AuditLogResponse,
)
from app.services.audit_log_service import AuditLogService


router = APIRouter(
    prefix="/api/audit-logs",
    tags=["Audit Logs"],
)


@router.get(
    "",
    response_model=AuditLogListResponse,
)
def get_audit_logs(
    action: str | None = Query(
        default=None,
        description="Filter by action",
    ),
    entity_type: str | None = Query(
        default=None,
        description="Filter by entity type",
    ),
    entity_id: int | None = Query(
        default=None,
        gt=0,
        description="Filter by entity ID",
    ),
    user_id: int | None = Query(
        default=None,
        gt=0,
        description="Filter by user ID",
    ),
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
) -> AuditLogListResponse:

    return AuditLogService.get_logs(
        db=db,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{log_id}",
    response_model=AuditLogResponse,
)
def get_audit_log(
    log_id: int,
    db: Session = Depends(get_db),
) -> AuditLogResponse:

    log = AuditLogService.get_log(
        db=db,
        log_id=log_id,
    )

    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found.",
        )

    return log