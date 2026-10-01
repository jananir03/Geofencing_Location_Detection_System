from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class LocationEventCreate(BaseModel):
    device_id: int = Field(
        gt=0,
    )

    geofence_id: int = Field(
        gt=0,
        description="Enabled geofence to evaluate for this location event.",
    )

    latitude: float = Field(
        ge=-90,
        le=90,
    )

    longitude: float = Field(
        ge=-180,
        le=180,
    )

    accuracy: Optional[float] = Field(
        default=None,
        ge=0,
    )

    timestamp: datetime


class LocationEventResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int
    device_id: int
    latitude: float
    longitude: float
    accuracy: Optional[float]
    timestamp: datetime
    created_at: datetime


class LocationEventListResponse(BaseModel):
    items: list[LocationEventResponse]
    pagination: dict