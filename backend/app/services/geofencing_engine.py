from math import atan2, cos, degrees, radians, sin, sqrt
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.geofence import Geofence
from app.models.geofence_event import (
    GeofenceEvent,
    GeofenceEventType,
    GeofenceState,
)
from app.models.geofence_point import GeofencePoint
from app.models.location_event import LocationEvent


class GeofencingEngine:

    EARTH_RADIUS_METERS = 6_371_000

    @staticmethod
    def calculate_distance(
        latitude_1: float,
        longitude_1: float,
        latitude_2: float,
        longitude_2: float,
    ) -> float:
        """
        Calculate distance between two GPS coordinates
        using the Haversine formula.
        """

        lat1 = radians(latitude_1)
        lat2 = radians(latitude_2)

        delta_lat = radians(
            latitude_2 - latitude_1
        )

        delta_lon = radians(
            longitude_2 - longitude_1
        )

        a = (
            sin(delta_lat / 2) ** 2
            + cos(lat1)
            * cos(lat2)
            * sin(delta_lon / 2) ** 2
        )

        c = 2 * atan2(
            sqrt(a),
            sqrt(1 - a),
        )

        return (
            GeofencingEngine.EARTH_RADIUS_METERS
            * c
        )

    @staticmethod
    def is_inside_circle(
        latitude: float,
        longitude: float,
        geofence: Geofence,
        accuracy: Optional[float],
    ) -> bool:
        """
        Determine whether a GPS point is inside a circular
        geofence.

        GPS accuracy is used as a tolerance buffer.
        """

        if (
            geofence.center_latitude is None
            or geofence.center_longitude is None
            or geofence.radius_meters is None
        ):
            return False

        distance = GeofencingEngine.calculate_distance(
            latitude,
            longitude,
            geofence.center_latitude,
            geofence.center_longitude,
        )

        accuracy_buffer = max(
            accuracy or 0,
            settings.gps_accuracy_buffer_meters,
        )

        effective_radius = (
            geofence.radius_meters
            + accuracy_buffer
        )

        return distance <= effective_radius

    @staticmethod
    def point_on_segment(
        latitude: float,
        longitude: float,
        point_1: GeofencePoint,
        point_2: GeofencePoint,
        tolerance_meters: float,
    ) -> bool:
        """
        Determine whether the point is close enough to a
        polygon edge to be considered on the boundary.
        """

        distance_1 = GeofencingEngine.calculate_distance(
            latitude,
            longitude,
            point_1.latitude,
            point_1.longitude,
        )

        distance_2 = GeofencingEngine.calculate_distance(
            latitude,
            longitude,
            point_2.latitude,
            point_2.longitude,
        )

        segment_length = GeofencingEngine.calculate_distance(
            point_1.latitude,
            point_1.longitude,
            point_2.latitude,
            point_2.longitude,
        )

        if segment_length == 0:
            return distance_1 <= tolerance_meters

        if (
            distance_1
            + distance_2
            <= segment_length
            + tolerance_meters
        ):
            return True

        return False

    @staticmethod
    def is_inside_polygon(
        latitude: float,
        longitude: float,
        points: list[GeofencePoint],
        accuracy: Optional[float],
    ) -> bool:
        """
        Point-in-polygon detection using the ray-casting
        algorithm.

        The GPS accuracy value is also used as a boundary
        tolerance.
        """

        if len(points) < 3:
            return False

        tolerance = max(
            accuracy or 0,
            settings.gps_accuracy_buffer_meters,
        )

        # Boundary tolerance check.
        for index in range(len(points)):
            current = points[index]

            next_index = (
                index + 1
            ) % len(points)

            next_point = points[next_index]

            if GeofencingEngine.point_on_segment(
                latitude,
                longitude,
                current,
                next_point,
                tolerance,
            ):
                return True

        inside = False

        j = len(points) - 1

        for i in range(len(points)):

            latitude_i = points[i].latitude
            longitude_i = points[i].longitude

            latitude_j = points[j].latitude
            longitude_j = points[j].longitude

            intersects = (
                (
                    latitude_i > latitude
                )
                != (
                    latitude_j > latitude
                )
            ) and (
                longitude
                <
                (
                    longitude_j
                    - longitude_i
                )
                * (
                    latitude
                    - latitude_i
                )
                / (
                    latitude_j
                    - latitude_i
                )
                + longitude_i
            )

            if intersects:
                inside = not inside

            j = i

        return inside

    @staticmethod
    def is_location_inside(
        latitude: float,
        longitude: float,
        geofence: Geofence,
        accuracy: Optional[float],
    ) -> bool:

        if geofence.boundary_type == "CIRCLE":
            return GeofencingEngine.is_inside_circle(
                latitude=latitude,
                longitude=longitude,
                geofence=geofence,
                accuracy=accuracy,
            )

        if geofence.boundary_type == "POLYGON":
            return GeofencingEngine.is_inside_polygon(
                latitude=latitude,
                longitude=longitude,
                points=list(geofence.points),
                accuracy=accuracy,
            )

        return False

    @staticmethod
    def get_previous_state(
        db: Session,
        device_id: int,
        geofence_id: int,
    ) -> str:

        stmt = (
            select(GeofenceEvent)
            .where(
                GeofenceEvent.device_id == device_id,
                GeofenceEvent.geofence_id == geofence_id,
            )
            .order_by(
                GeofenceEvent.timestamp.desc(),
                GeofenceEvent.id.desc(),
            )
            .limit(1)
        )

        previous_event = db.scalar(stmt)

        if previous_event is None:
            return GeofenceState.UNKNOWN

        return previous_event.current_state

    @staticmethod
    def determine_event_type(
        previous_state: str,
        current_state: str,
    ) -> str:

        if (
            previous_state == GeofenceState.OUTSIDE
            and current_state == GeofenceState.INSIDE
        ):
            return GeofenceEventType.ENTER

        if (
            previous_state == GeofenceState.INSIDE
            and current_state == GeofenceState.OUTSIDE
        ):
            return GeofenceEventType.EXIT

        if current_state == GeofenceState.INSIDE:
            return GeofenceEventType.INSIDE

        return GeofenceEventType.OUTSIDE

    @staticmethod
    def process_location(
        db: Session,
        location_event: LocationEvent,
        geofence_id: int,
    ) -> list[GeofenceEvent]:
        """Evaluate a location against one selected geofence only."""

        stmt = (
            select(Geofence)
            .options(
                selectinload(
                    Geofence.points
                )
            )
            .where(
                Geofence.id == geofence_id,
                Geofence.enabled.is_(True),
            )
        )

        geofence = db.scalar(stmt)

        if geofence is None:
            raise LookupError(
                "Selected geofence was not found or is disabled."
            )

        inside = GeofencingEngine.is_location_inside(
            latitude=location_event.latitude,
            longitude=location_event.longitude,
            geofence=geofence,
            accuracy=location_event.accuracy,
        )

        current_state = (
            GeofenceState.INSIDE
            if inside
            else GeofenceState.OUTSIDE
        )

        previous_state = GeofencingEngine.get_previous_state(
            db=db,
            device_id=location_event.device_id,
            geofence_id=geofence.id,
        )

        event_type = GeofencingEngine.determine_event_type(
            previous_state=previous_state,
            current_state=current_state,
        )

        geofence_event = GeofenceEvent(
            device_id=location_event.device_id,
            geofence_id=geofence.id,
            location_event_id=location_event.id,
            event_type=event_type,
            previous_state=previous_state,
            current_state=current_state,
            latitude=location_event.latitude,
            longitude=location_event.longitude,
            timestamp=location_event.timestamp,
        )

        db.add(geofence_event)
        db.commit()

        return [geofence_event]
