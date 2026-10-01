from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


if TYPE_CHECKING:
    from app.models.geofence_event import GeofenceEvent
    from app.models.geofence_point import GeofencePoint


class GeofenceType(str, Enum):
    CIRCLE = "CIRCLE"
    POLYGON = "POLYGON"


class Geofence(Base):
    __tablename__ = "geofences"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    boundary_type: Mapped[GeofenceType] = mapped_column(
        String(20),
        nullable=False,
    )

    center_latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    center_longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    radius_meters: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="1",
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    points: Mapped[list["GeofencePoint"]] = relationship(
        "GeofencePoint",
        back_populates="geofence",
        cascade="all, delete-orphan",
        order_by="GeofencePoint.point_order",
    )

    events: Mapped[list["GeofenceEvent"]] = relationship(
        "GeofenceEvent",
        back_populates="geofence",
        cascade="all, delete-orphan",
    )