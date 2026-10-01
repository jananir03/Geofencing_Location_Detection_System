from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.geofence_event import (
    GeofenceEventListResponse,
    GeofenceEventResponse,
)
from app.services.geofence_event_service import GeofenceEventService


router = APIRouter(
    prefix="/api/geofence-events",
    tags=["Geofence Events"],
)


@router.get(
    "",
    response_model=GeofenceEventListResponse,
)
def get_geofence_events(
    device_id: int | None = Query(
        default=None,
        gt=0,
        description="Filter by device ID",
    ),
    geofence_id: int | None = Query(
        default=None,
        gt=0,
        description="Filter by geofence ID",
    ),
    event_type: str | None = Query(
        default=None,
        description="ENTER, EXIT, INSIDE or OUTSIDE",
    ),
    start_date: datetime | None = Query(
        default=None,
        description="Return events from this timestamp",
    ),
    end_date: datetime | None = Query(
        default=None,
        description="Return events until this timestamp",
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
) -> GeofenceEventListResponse:

    allowed_event_types = {
        "ENTER",
        "EXIT",
        "INSIDE",
        "OUTSIDE",
    }

    if event_type is not None:
        normalized_event_type = event_type.upper()

        if normalized_event_type not in allowed_event_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Invalid event_type. "
                    "Allowed values: ENTER, EXIT, INSIDE, OUTSIDE."
                ),
            )

        event_type = normalized_event_type

    if (
        start_date is not None
        and end_date is not None
        and start_date > end_date
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date cannot be greater than end_date.",
        )

    return GeofenceEventService.get_events(
        db=db,
        device_id=device_id,
        geofence_id=geofence_id,
        event_type=event_type,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{event_id}",
    response_model=GeofenceEventResponse,
)
def get_geofence_event(
    event_id: int,
    db: Session = Depends(get_db),
) -> GeofenceEventResponse:

    event = GeofenceEventService.get_event(
        db=db,
        event_id=event_id,
    )

    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geofence event not found.",
        )

    return event