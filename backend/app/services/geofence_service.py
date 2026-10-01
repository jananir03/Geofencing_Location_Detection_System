from math import ceil
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.geofence import Geofence
from app.models.geofence_point import GeofencePoint
from app.schemas.geofence import (
    GeofenceCreate,
    GeofencePointCreate,
    GeofenceUpdate,
)
from app.services.audit_log_service import AuditLogService


class GeofenceService:

    @staticmethod
    def _validate_boundary_data(
        boundary_type: str,
        center_latitude: Optional[float],
        center_longitude: Optional[float],
        radius_meters: Optional[float],
        points: Optional[list[GeofencePointCreate]],
    ) -> None:

        boundary_type = boundary_type.upper()

        if boundary_type == "CIRCLE":

            if center_latitude is None or center_longitude is None:
                raise ValueError(
                    "Circle geofence requires center_latitude and "
                    "center_longitude."
                )

            if radius_meters is None or radius_meters <= 0:
                raise ValueError(
                    "Circle geofence requires radius_meters greater than 0."
                )

            if points:
                raise ValueError(
                    "Circle geofence cannot contain polygon points."
                )

        elif boundary_type == "POLYGON":

            if not points or len(points) < 3:
                raise ValueError(
                    "Polygon geofence requires at least 3 points."
                )

            if (
                center_latitude is not None
                or center_longitude is not None
                or radius_meters is not None
            ):
                raise ValueError(
                    "Polygon geofence should not contain circle properties."
                )

        else:
            raise ValueError(
                "boundary_type must be CIRCLE or POLYGON."
            )

    @staticmethod
    def _load_geofence(
        db: Session,
        geofence_id: int,
    ) -> Optional[Geofence]:

        stmt = (
            select(Geofence)
            .options(selectinload(Geofence.points))
            .where(Geofence.id == geofence_id)
        )

        return db.scalar(stmt)

    @staticmethod
    def create(
        db: Session,
        payload: GeofenceCreate,
    ) -> Geofence:

        GeofenceService._validate_boundary_data(
            boundary_type=payload.boundary_type,
            center_latitude=payload.center_latitude,
            center_longitude=payload.center_longitude,
            radius_meters=payload.radius_meters,
            points=payload.points,
        )

        geofence = Geofence(
            name=payload.name,
            description=payload.description,
            boundary_type=payload.boundary_type.upper(),
            center_latitude=payload.center_latitude,
            center_longitude=payload.center_longitude,
            radius_meters=payload.radius_meters,
            enabled=payload.enabled,
        )

        db.add(geofence)

        try:
            db.flush()

            if payload.boundary_type.upper() == "POLYGON":
                for point in payload.points or []:
                    geofence_point = GeofencePoint(
                        geofence_id=geofence.id,
                        latitude=point.latitude,
                        longitude=point.longitude,
                        point_order=point.point_order,
                    )

                    db.add(geofence_point)

            AuditLogService.create_log(
                db=db,
                action="CREATE",
                entity_type="GEOFENCE",
                entity_id=geofence.id,
                details={
                    "name": geofence.name,
                    "boundary_type": geofence.boundary_type,
                    "enabled": geofence.enabled,
                    "radius_meters": geofence.radius_meters,
                },
            )

            db.commit()

        except IntegrityError:
            db.rollback()
            raise ValueError("Unable to create geofence.")

        return GeofenceService._load_geofence(
            db,
            geofence.id,
        )

    @staticmethod
    def get_by_id(
        db: Session,
        geofence_id: int,
    ) -> Optional[Geofence]:

        return GeofenceService._load_geofence(
            db,
            geofence_id,
        )

    @staticmethod
    def list_geofences(
        db: Session,
        page: int,
        page_size: int,
        search: Optional[str] = None,
        boundary_type: Optional[str] = None,
        enabled: Optional[bool] = None,
    ) -> tuple[list[Geofence], int, int]:

        stmt = select(Geofence).options(
            selectinload(Geofence.points)
        )

        count_stmt = select(
            func.count(Geofence.id)
        )

        filters = []

        if search:
            search_value = f"%{search.strip()}%"

            filters.append(
                or_(
                    Geofence.name.ilike(search_value),
                    Geofence.description.ilike(search_value),
                )
            )

        if boundary_type:
            filters.append(
                Geofence.boundary_type
                == boundary_type.upper()
            )

        if enabled is not None:
            filters.append(
                Geofence.enabled == enabled
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
            .order_by(Geofence.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        items = list(db.scalars(stmt).unique().all())

        return items, total, total_pages

    @staticmethod
    def update(
        db: Session,
        geofence: Geofence,
        payload: GeofenceUpdate,
    ) -> Geofence:

        new_boundary_type = geofence.boundary_type

        center_latitude = (
            payload.center_latitude
            if payload.center_latitude is not None
            else geofence.center_latitude
        )

        center_longitude = (
            payload.center_longitude
            if payload.center_longitude is not None
            else geofence.center_longitude
        )

        radius_meters = (
            payload.radius_meters
            if payload.radius_meters is not None
            else geofence.radius_meters
        )

        points = payload.points

        if points is None and new_boundary_type == "POLYGON":
            points = [
                GeofencePointCreate(
                    latitude=point.latitude,
                    longitude=point.longitude,
                    point_order=point.point_order,
                )
                for point in geofence.points
            ]

        GeofenceService._validate_boundary_data(
            boundary_type=new_boundary_type,
            center_latitude=center_latitude,
            center_longitude=center_longitude,
            radius_meters=radius_meters,
            points=points,
        )

        updated_fields = []

        if payload.name is not None:
            geofence.name = payload.name
            updated_fields.append("name")

        if payload.description is not None:
            geofence.description = payload.description
            updated_fields.append("description")

        if (
            payload.center_latitude is not None
            or payload.center_longitude is not None
        ):
            updated_fields.extend(
                [
                    "center_latitude",
                    "center_longitude",
                ]
            )

        if payload.radius_meters is not None:
            updated_fields.append("radius_meters")

        geofence.center_latitude = (
            center_latitude
            if new_boundary_type == "CIRCLE"
            else None
        )

        geofence.center_longitude = (
            center_longitude
            if new_boundary_type == "CIRCLE"
            else None
        )

        geofence.radius_meters = (
            radius_meters
            if new_boundary_type == "CIRCLE"
            else None
        )

        if new_boundary_type == "POLYGON" and payload.points is not None:

            for point in list(geofence.points):
                db.delete(point)

            db.flush()

            for point in payload.points:
                db.add(
                    GeofencePoint(
                        geofence_id=geofence.id,
                        latitude=point.latitude,
                        longitude=point.longitude,
                        point_order=point.point_order,
                    )
                )

            updated_fields.append("points")

        AuditLogService.create_log(
            db=db,
            action="UPDATE",
            entity_type="GEOFENCE",
            entity_id=geofence.id,
            details={
                "updated_fields": list(dict.fromkeys(updated_fields)),
                "boundary_type": geofence.boundary_type,
            },
        )

        db.commit()

        return GeofenceService._load_geofence(
            db,
            geofence.id,
        )

    @staticmethod
    def update_status(
        db: Session,
        geofence: Geofence,
        enabled: bool,
    ) -> Geofence:

        previous_status = geofence.enabled

        geofence.enabled = enabled

        AuditLogService.create_log(
            db=db,
            action="ENABLE" if enabled else "DISABLE",
            entity_type="GEOFENCE",
            entity_id=geofence.id,
            details={
                "previous_status": previous_status,
                "new_status": enabled,
                "name": geofence.name,
            },
        )

        db.commit()

        return GeofenceService._load_geofence(
            db,
            geofence.id,
        )

    @staticmethod
    def delete(
        db: Session,
        geofence: Geofence,
    ) -> None:

        geofence_id = geofence.id
        geofence_name = geofence.name
        boundary_type = geofence.boundary_type

        AuditLogService.create_log(
            db=db,
            action="DELETE",
            entity_type="GEOFENCE",
            entity_id=geofence_id,
            details={
                "name": geofence_name,
                "boundary_type": boundary_type,
            },
        )

        db.delete(geofence)
        db.commit()