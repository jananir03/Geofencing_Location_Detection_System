from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.geofence import (
    GeofenceCreate,
    GeofenceListResponse,
    GeofenceResponse,
    GeofenceStatusUpdate,
    GeofenceUpdate,
)
from app.schemas.common import PaginationMetadata
from app.services.geofence_service import GeofenceService


router = APIRouter(
    prefix="/api/geofences",
    tags=["Geofences"],
)

DbSession = Annotated[
    Session,
    Depends(get_db),
]


@router.post(
    "",
    response_model=GeofenceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_geofence(
    payload: GeofenceCreate,
    db: DbSession,
):
    try:
        return GeofenceService.create(
            db,
            payload,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.get(
    "",
    response_model=GeofenceListResponse,
)
def list_geofences(
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
    search: Optional[str] = Query(
        default=None,
    ),
    boundary_type: Optional[str] = Query(
        default=None,
    ),
    enabled: Optional[bool] = Query(
        default=None,
    ),
):
    items, total, total_pages = (
        GeofenceService.list_geofences(
            db=db,
            page=page,
            page_size=page_size,
            search=search,
            boundary_type=boundary_type,
            enabled=enabled,
        )
    )

    pagination = PaginationMetadata(
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=page > 1,
    )

    return GeofenceListResponse(
        items=items,
        pagination=pagination.model_dump(),
    )


@router.get(
    "/{geofence_id}",
    response_model=GeofenceResponse,
)
def get_geofence(
    geofence_id: int,
    db: DbSession,
):
    geofence = GeofenceService.get_by_id(
        db,
        geofence_id,
    )

    if geofence is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geofence not found.",
        )

    return geofence


@router.put(
    "/{geofence_id}",
    response_model=GeofenceResponse,
)
def update_geofence(
    geofence_id: int,
    payload: GeofenceUpdate,
    db: DbSession,
):
    geofence = GeofenceService.get_by_id(
        db,
        geofence_id,
    )

    if geofence is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geofence not found.",
        )

    if payload.model_dump(exclude_unset=True) == {}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field is required for update.",
        )

    try:
        return GeofenceService.update(
            db,
            geofence,
            payload,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.patch(
    "/{geofence_id}/status",
    response_model=GeofenceResponse,
)
def update_geofence_status(
    geofence_id: int,
    payload: GeofenceStatusUpdate,
    db: DbSession,
):
    geofence = GeofenceService.get_by_id(
        db,
        geofence_id,
    )

    if geofence is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geofence not found.",
        )

    return GeofenceService.update_status(
        db,
        geofence,
        payload.enabled,
    )


@router.delete(
    "/{geofence_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_geofence(
    geofence_id: int,
    db: DbSession,
):
    geofence = GeofenceService.get_by_id(
        db,
        geofence_id,
    )

    if geofence is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Geofence not found.",
        )

    GeofenceService.delete(
        db,
        geofence,
    )

    return None