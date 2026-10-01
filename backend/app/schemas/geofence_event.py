from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class GeofenceEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    device_id: int
    geofence_id: int
    location_event_id: int

    event_type: str
    previous_state: str
    current_state: str

    latitude: float
    longitude: float

    timestamp: datetime
    created_at: datetime


class GeofenceEventListResponse(BaseModel):
    items: list[GeofenceEventResponse]
    total: int
    page: int
    page_size: int
    total_pages: int