import { useEffect } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { Geofence, LocationEvent } from "../../types";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: LatLngExpression = [13.0827, 80.2707];

interface LocationLiveMapProps {
  location: LocationEvent | null;
  geofences: Geofence[];
  height?: number | string;
}

function MapViewport({
  location,
  geofences,
}: {
  location: LocationEvent | null;
  geofences: Geofence[];
}) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.setView([location.latitude, location.longitude], 15, {
        animate: true,
      });
      return;
    }

    const points: [number, number][] = [];

    geofences.forEach((geofence) => {
      if (
        geofence.boundary_type === "CIRCLE" &&
        geofence.center_latitude !== null &&
        geofence.center_longitude !== null
      ) {
        points.push([
          geofence.center_latitude,
          geofence.center_longitude,
        ]);
      }

      if (geofence.boundary_type === "POLYGON") {
        geofence.points.forEach((point) => {
          points.push([point.latitude, point.longitude]);
        });
      }
    });

    if (points.length === 1) {
      map.setView(points[0], 14);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [30, 30] });
    }
  }, [geofences, location, map]);

  return null;
}

function LocationLiveMap({
  location,
  geofences,
  height = 500,
}: LocationLiveMapProps) {
  const center: LatLngExpression = location
    ? [location.latitude, location.longitude]
    : DEFAULT_CENTER;

  return (
    <div
      style={{
        width: "100%",
        height,
        overflow: "hidden",
        borderRadius: 16,
        border: "1px solid #E8E1EE",
      }}
    >
      <MapContainer
        center={center}
        zoom={location ? 15 : 12}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewport location={location} geofences={geofences} />

        {geofences.map((geofence) => {
          if (
            geofence.boundary_type === "CIRCLE" &&
            geofence.center_latitude !== null &&
            geofence.center_longitude !== null &&
            geofence.radius_meters !== null
          ) {
            return (
              <Circle
                key={`live-circle-${geofence.id}`}
                center={[
                  geofence.center_latitude,
                  geofence.center_longitude,
                ]}
                radius={geofence.radius_meters}
                pathOptions={{
                  color: "#8B5CF6",
                  fillColor: "#8B5CF6",
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
            );
          }

          const points = [...geofence.points]
            .sort((a, b) => a.point_order - b.point_order)
            .map(
              (point) =>
                [point.latitude, point.longitude] as [number, number],
            );

          return (
            <Polygon
              key={`live-polygon-${geofence.id}`}
              positions={points}
              pathOptions={{
                color: "#EC4899",
                fillColor: "#EC4899",
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
          );
        })}

        {location && (
          <>
            <CircleMarker
              center={[location.latitude, location.longitude]}
              radius={9}
              pathOptions={{
                color: "#FFFFFF",
                weight: 3,
                fillColor: "#7C3AED",
                fillOpacity: 1,
              }}
            />
            {location.accuracy !== null && location.accuracy > 0 && (
              <Circle
                center={[location.latitude, location.longitude]}
                radius={location.accuracy}
                pathOptions={{
                  color: "#7C3AED",
                  fillColor: "#7C3AED",
                  fillOpacity: 0.08,
                  weight: 1,
                  dashArray: "5 5",
                }}
              />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default LocationLiveMap;
