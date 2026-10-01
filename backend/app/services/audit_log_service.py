from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.schemas.audit_log import (
    AuditLogListResponse,
    AuditLogResponse,
)


class AuditLogService:

    @staticmethod
    def create_log(
        db: Session,
        action: str,
        entity_type: str,
        entity_id: int | None = None,
        user_id: int | None = None,
        details: dict[str, Any] | None = None,
    ) -> AuditLog:

        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )

        db.add(audit_log)
        db.flush()

        return audit_log

    @staticmethod
    def get_log(
        db: Session,
        log_id: int,
    ) -> AuditLogResponse | None:

        log = db.scalar(
            select(AuditLog).where(
                AuditLog.id == log_id
            )
        )

        if log is None:
            return None

        return AuditLogResponse.model_validate(log)

    @staticmethod
    def get_logs(
        db: Session,
        action: str | None = None,
        entity_type: str | None = None,
        entity_id: int | None = None,
        user_id: int | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> AuditLogListResponse:

        filters = []

        if action is not None:
            filters.append(
                AuditLog.action == action.upper()
            )

        if entity_type is not None:
            filters.append(
                AuditLog.entity_type == entity_type
            )

        if entity_id is not None:
            filters.append(
                AuditLog.entity_id == entity_id
            )

        if user_id is not None:
            filters.append(
                AuditLog.user_id == user_id
            )

        count_query = select(
            func.count(AuditLog.id)
        )

        if filters:
            count_query = count_query.where(*filters)

        total = db.scalar(count_query) or 0

        offset = (page - 1) * page_size

        query = (
            select(AuditLog)
            .where(*filters)
            .order_by(
                AuditLog.created_at.desc(),
                AuditLog.id.desc(),
            )
            .offset(offset)
            .limit(page_size)
        )

        logs = db.scalars(query).all()

        items = [
            AuditLogResponse.model_validate(log)
            for log in logs
        ]

        total_pages = (
            (total + page_size - 1) // page_size
            if total > 0
            else 0
        )

        return AuditLogListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )