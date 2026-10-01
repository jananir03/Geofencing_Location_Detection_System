from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import PaginationMetadata
from app.schemas.location_event import (
    LocationEventCreate,
    LocationEventListResponse,
    LocationEventResponse,
)
from app.services.location_event_service import (
    LocationEventService,
)


router = APIRouter(
    prefix="/api/location-events",
    tags=["Location Events"],
)


DbSession = Annotated[
    Session,
    Depends(get_db),
]


@router.post(
    "",
    response_model=LocationEventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_location_event(
    payload: LocationEventCreate,
    db: DbSession,
):
    try:
        return LocationEventService.create(
            db,
            payload,
        )

    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    except PermissionError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=LocationEventListResponse,
)
def list_location_events(
    db: DbSession,
    page: int = Query(
        default=1,
        ge=1,
    ),
    page_size: int = Query(
        default=10,
        ge=1,
        le=100,
    ),
    device_id: Optional[int] = Query(
        default=None,
        gt=0,
    ),
    start_time: Optional[datetime] = Query(
        default=None,
    ),
    end_time: Optional[datetime] = Query(
        default=None,
    ),
):
    if (
        start_time is not None
        and end_time is not None
        and start_time > end_time
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "start_time must be earlier than "
                "or equal to end_time."
            ),
        )

    (
        items,
        total,
        total_pages,
    ) = LocationEventService.list_events(
        db=db,
        page=page,
        page_size=page_size,
        device_id=device_id,
        start_time=start_time,
        end_time=end_time,
    )

    pagination = PaginationMetadata(
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=page > 1,
    )

    return LocationEventListResponse(
        items=items,
        pagination=pagination.model_dump(),
    )


@router.get(
    "/{location_event_id}",
    response_model=LocationEventResponse,
)
def get_location_event(
    location_event_id: int,
    db: DbSession,
):
    location_event = LocationEventService.get_by_id(
        db,
        location_event_id,
    )

    if location_event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location event not found.",
        )

    return location_event