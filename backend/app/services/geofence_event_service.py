from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.geofence_event import GeofenceEvent
from app.schemas.geofence_event import (
    GeofenceEventListResponse,
    GeofenceEventResponse,
)


class GeofenceEventService:

    @staticmethod
    def get_event(
        db: Session,
        event_id: int,
    ) -> GeofenceEventResponse | None:
        event = db.scalar(
            select(GeofenceEvent).where(
                GeofenceEvent.id == event_id
            )
        )

        if event is None:
            return None

        return GeofenceEventResponse.model_validate(event)

    @staticmethod
    def get_events(
        db: Session,
        device_id: int | None = None,
        geofence_id: int | None = None,
        event_type: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> GeofenceEventListResponse:

        filters = []

        if device_id is not None:
            filters.append(
                GeofenceEvent.device_id == device_id
            )

        if geofence_id is not None:
            filters.append(
                GeofenceEvent.geofence_id == geofence_id
            )

        if event_type is not None:
            filters.append(
                GeofenceEvent.event_type == event_type.upper()
            )

        if start_date is not None:
            filters.append(
                GeofenceEvent.timestamp >= start_date
            )

        if end_date is not None:
            filters.append(
                GeofenceEvent.timestamp <= end_date
            )

        count_query = select(
            func.count(GeofenceEvent.id)
        )

        if filters:
            count_query = count_query.where(*filters)

        total = db.scalar(count_query) or 0

        offset = (page - 1) * page_size

        query = (
            select(GeofenceEvent)
            .where(*filters)
            .order_by(
                GeofenceEvent.timestamp.desc(),
                GeofenceEvent.id.desc(),
            )
            .offset(offset)
            .limit(page_size)
        )

        events = db.scalars(query).all()

        items = [
            GeofenceEventResponse.model_validate(event)
            for event in events
        ]

        total_pages = (
            (total + page_size - 1) // page_size
            if total > 0
            else 0
        )

        return GeofenceEventListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )