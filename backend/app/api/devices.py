from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.common import PaginationMetadata
from app.schemas.device import (
    DeviceCreate,
    DeviceListResponse,
    DeviceResponse,
    DeviceStatusUpdate,
    DeviceUpdate,
)
from app.services.device_service import DeviceService


router = APIRouter(
    prefix="/api/devices",
    tags=["Devices"],
)


DbSession = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=DeviceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a device",
    description="Register a new active device for an active user.",
)
def create_device(
    payload: DeviceCreate,
    db: DbSession,
) -> DeviceResponse:
    try:
        device = DeviceService.create(
            db,
            payload,
        )
    except ValueError as exc:
        message = str(exc)

        if "user" in message.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=message,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=message,
        ) from exc

    return device


@router.get(
    "",
    response_model=DeviceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List devices",
)
def list_devices(
    db: DbSession,
    page: int = Query(
        default=1,
        ge=1,
        description="Page number.",
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Number of records per page.",
    ),
    search: str | None = Query(
        default=None,
        min_length=1,
        max_length=100,
        description="Search by device name or identifier.",
    ),
    user_id: int | None = Query(
        default=None,
        gt=0,
        description="Filter devices by owner.",
    ),
    is_active: bool | None = Query(
        default=None,
        description="Filter by active status.",
    ),
) -> DeviceListResponse:
    devices, total, total_pages = (
        DeviceService.list_devices(
            db=db,
            page=page,
            page_size=page_size,
            search=search,
            user_id=user_id,
            is_active=is_active,
        )
    )

    return DeviceListResponse(
        items=devices,
        pagination=PaginationMetadata(
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1 and total_pages > 0,
        ),
    )


@router.get(
    "/{device_id}",
    response_model=DeviceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a device",
)
def get_device(
    device_id: int,
    db: DbSession,
) -> DeviceResponse:
    device = DeviceService.get_by_id(
        db,
        device_id,
    )

    if device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found.",
        )

    return device


@router.put(
    "/{device_id}",
    response_model=DeviceResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a device",
)
def update_device(
    device_id: int,
    payload: DeviceUpdate,
    db: DbSession,
) -> DeviceResponse:
    device = DeviceService.get_by_id(
        db,
        device_id,
    )

    if device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found.",
        )

    if not payload.model_dump(exclude_unset=True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one field must be provided.",
        )

    return DeviceService.update(
        db,
        device,
        payload,
    )


@router.patch(
    "/{device_id}/status",
    response_model=DeviceResponse,
    status_code=status.HTTP_200_OK,
    summary="Enable or disable a device",
)
def update_device_status(
    device_id: int,
    payload: DeviceStatusUpdate,
    db: DbSession,
) -> DeviceResponse:
    device = DeviceService.get_by_id(
        db,
        device_id,
    )

    if device is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found.",
        )

    return DeviceService.update_status(
        db,
        device,
        payload.is_active,
    )