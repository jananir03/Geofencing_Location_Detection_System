from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.common import PaginationMetadata


class DeviceCreate(BaseModel):
    user_id: int = Field(
        ...,
        gt=0,
        description="ID of the user who owns the device.",
        examples=[1],
    )

    device_identifier: str = Field(
        ...,
        min_length=3,
        max_length=150,
        description="Unique identifier assigned to the physical device.",
        examples=["DEVICE-CHN-001"],
    )

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Human-readable device name.",
        examples=["Arun's Mobile"],
    )

    @field_validator("device_identifier")
    @classmethod
    def validate_device_identifier(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Device identifier cannot be empty.")

        return value

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Device name cannot be empty.")

        return value


class DeviceUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
        description="Updated device name.",
    )

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None

        value = value.strip()

        if not value:
            raise ValueError("Device name cannot be empty.")

        return value


class DeviceStatusUpdate(BaseModel):
    is_active: bool = Field(
        ...,
        description="Whether the device is active.",
        examples=[True],
    )


class DeviceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    device_identifier: str
    name: str
    is_active: bool
    last_latitude: float | None
    last_longitude: float | None
    last_seen_at: datetime | None
    created_at: datetime
    updated_at: datetime


class DeviceListResponse(BaseModel):
    items: list[DeviceResponse]
    pagination: PaginationMetadata