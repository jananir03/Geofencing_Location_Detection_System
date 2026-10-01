from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.device import Device
    from app.models.geofence_event import GeofenceEvent


class LocationEvent(Base):
    __tablename__ = "location_events"

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

    latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    accuracy: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
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
        back_populates="location_events",
    )

    geofence_events: Mapped[list["GeofenceEvent"]] = relationship(
        "GeofenceEvent",
        back_populates="location_event",
    )

    __table_args__ = (
        Index(
            "ix_location_events_device_timestamp",
            "device_id",
            "timestamp",
        ),
        UniqueConstraint(
            "device_id",
            "latitude",
            "longitude",
            "timestamp",
            name="uq_location_event_duplicate",
        ),
    )