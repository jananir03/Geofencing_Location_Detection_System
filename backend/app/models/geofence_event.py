from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.device import Device
    from app.models.geofence import Geofence
    from app.models.location_event import LocationEvent


class GeofenceEventType:
    ENTER = "ENTER"
    EXIT = "EXIT"
    INSIDE = "INSIDE"
    OUTSIDE = "OUTSIDE"


class GeofenceState:
    INSIDE = "INSIDE"
    OUTSIDE = "OUTSIDE"
    UNKNOWN = "UNKNOWN"


class GeofenceEvent(Base):
    __tablename__ = "geofence_events"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    device_id: Mapped[int] = mapped_column(
        ForeignKey(
            "devices.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    geofence_id: Mapped[int] = mapped_column(
        ForeignKey(
            "geofences.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    location_event_id: Mapped[int] = mapped_column(
        ForeignKey(
            "location_events.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    event_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )

    previous_state: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=GeofenceState.UNKNOWN,
    )

    current_state: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    device: Mapped["Device"] = relationship(
        "Device",
        back_populates="geofence_events",
    )

    geofence: Mapped["Geofence"] = relationship(
        "Geofence",
        back_populates="events",
    )

    location_event: Mapped["LocationEvent"] = relationship(
        "LocationEvent",
        back_populates="geofence_events",
    )

    __table_args__ = (
        Index(
            "ix_geofence_events_device_geofence_timestamp",
            "device_id",
            "geofence_id",
            "timestamp",
        ),
    )