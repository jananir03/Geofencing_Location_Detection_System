from datetime import datetime
from math import ceil
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.device import Device
from app.models.geofence import Geofence
from app.models.location_event import LocationEvent
from app.schemas.location_event import LocationEventCreate
from app.services.geofencing_engine import GeofencingEngine


class LocationEventService:

    @staticmethod
    def get_device(
        db: Session,
        device_id: int,
    ) -> Optional[Device]:

        stmt = select(Device).where(
            Device.id == device_id
        )

        return db.scalar(stmt)

    @staticmethod
    def find_duplicate(
        db: Session,
        payload: LocationEventCreate,
    ) -> Optional[LocationEvent]:

        stmt = select(LocationEvent).where(
            LocationEvent.device_id == payload.device_id,
            LocationEvent.latitude == payload.latitude,
            LocationEvent.longitude == payload.longitude,
            LocationEvent.timestamp == payload.timestamp,
        )

        return db.scalar(stmt)

    @staticmethod
    def create(
        db: Session,
        payload: LocationEventCreate,
    ) -> LocationEvent:

        device = LocationEventService.get_device(
            db,
            payload.device_id,
        )

        if device is None:
            raise LookupError(
                "Device not found."
            )

        if not device.is_active:
            raise PermissionError(
                "Device is inactive."
            )

        geofence = db.scalar(
            select(Geofence).where(
                Geofence.id == payload.geofence_id,
                Geofence.enabled.is_(True),
            )
        )

        if geofence is None:
            raise LookupError(
                "Selected geofence was not found or is disabled."
            )

        duplicate = LocationEventService.find_duplicate(
            db,
            payload,
        )

        if duplicate is not None:
            raise ValueError(
                "Duplicate location event already exists."
            )

        location_event = LocationEvent(
            device_id=payload.device_id,
            latitude=payload.latitude,
            longitude=payload.longitude,
            accuracy=payload.accuracy,
            timestamp=payload.timestamp,
        )

        db.add(location_event)

        device.last_latitude = payload.latitude
        device.last_longitude = payload.longitude
        device.last_seen_at = payload.timestamp

        try:
            db.commit()

        except IntegrityError as exc:
            db.rollback()

            if "uq_location_event_duplicate" in str(exc):
                raise ValueError(
                    "Duplicate location event already exists."
                ) from exc

            raise ValueError(
                "Unable to create location event."
            ) from exc

        db.refresh(location_event)

        # -----------------------------------------------------
        # Phase 6:
        # Evaluate the new location only against the geofence
        # explicitly selected by the caller.
        # -----------------------------------------------------

        GeofencingEngine.process_location(
            db=db,
            location_event=location_event,
            geofence_id=payload.geofence_id,
        )

        return location_event

    @staticmethod
    def get_by_id(
        db: Session,
        location_event_id: int,
    ) -> Optional[LocationEvent]:

        stmt = select(LocationEvent).where(
            LocationEvent.id == location_event_id
        )

        return db.scalar(stmt)

    @staticmethod
    def list_events(
        db: Session,
        page: int,
        page_size: int,
        device_id: Optional[int] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
    ) -> tuple[list[LocationEvent], int, int]:

        stmt = select(LocationEvent)

        count_stmt = select(
            func.count(LocationEvent.id)
        )

        filters = []

        if device_id is not None:
            filters.append(
                LocationEvent.device_id == device_id
            )

        if start_time is not None:
            filters.append(
                LocationEvent.timestamp >= start_time
            )

        if end_time is not None:
            filters.append(
                LocationEvent.timestamp <= end_time
            )

        if filters:
            stmt = stmt.where(*filters)
            count_stmt = count_stmt.where(*filters)

        total = db.scalar(count_stmt) or 0

        total_pages = (
            ceil(total / page_size)
            if total > 0
            else 0
        )

        stmt = (
            stmt
            .order_by(
                LocationEvent.timestamp.desc()
            )
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        items = list(
            db.scalars(stmt).all()
        )

        return items, total, total_pages