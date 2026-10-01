from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class GeofencePointCreate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    point_order: int = Field(ge=0)


class GeofencePointResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    latitude: float
    longitude: float
    point_order: int


class GeofenceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=500)

    boundary_type: str

    center_latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    center_longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    radius_meters: Optional[float] = Field(default=None, gt=0)

    points: Optional[list[GeofencePointCreate]] = None

    enabled: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Geofence name cannot be empty.")

        return value

    @field_validator("boundary_type")
    @classmethod
    def validate_boundary_type(cls, value: str) -> str:
        value = value.strip().upper()

        if value not in {"CIRCLE", "POLYGON"}:
            raise ValueError("boundary_type must be CIRCLE or POLYGON.")

        return value


class GeofenceUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=500)

    center_latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    center_longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    radius_meters: Optional[float] = Field(default=None, gt=0)

    points: Optional[list[GeofencePointCreate]] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise ValueError("Geofence name cannot be empty.")

        return value


class GeofenceStatusUpdate(BaseModel):
    enabled: bool


class GeofenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str]

    boundary_type: str

    center_latitude: Optional[float]
    center_longitude: Optional[float]
    radius_meters: Optional[float]

    enabled: bool

    points: list[GeofencePointResponse]

    created_at: datetime
    updated_at: datetime


class GeofenceListResponse(BaseModel):
    items: list[GeofenceResponse]
    pagination: dict