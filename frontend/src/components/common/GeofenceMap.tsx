import { useEffect } from "react";
import {
  Circle,
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";
import type {
  BoundaryType,
  Geofence,
  GeofencePoint,
} from "../../types";
import "leaflet/dist/leaflet.css";

export const DEFAULT_MAP_CENTER: [number, number] = [13.0827, 80.2707];

interface GeofenceMapProps {
  geofences?: Geofence[];
  boundaryType?: BoundaryType;
  centerLatitude?: number | null;
  centerLongitude?: number | null;
  radiusMeters?: number | null;
  points?: GeofencePoint[];
  interactive?: boolean;
  onMapClick?: (event: LeafletMouseEvent) => void;
  height?: number | string;
}

function FitBounds({ geofences }: { geofences: Geofence[] }) {
  const map = useMap();

  useEffect(() => {
    const coordinates: [number, number][] = [];

    geofences.forEach((geofence) => {
      if (
        geofence.boundary_type === "CIRCLE" &&
        geofence.center_latitude !== null &&
        geofence.center_longitude !== null
      ) {
        coordinates.push([
          geofence.center_latitude,
          geofence.center_longitude,
        ]);
      }

      if (geofence.boundary_type === "POLYGON") {
        geofence.points.forEach((point) => {
          coordinates.push([point.latitude, point.longitude]);
        });
      }
    });

    if (coordinates.length === 1) {
      map.setView(coordinates[0], 14);
    } else if (coordinates.length > 1) {
      const bounds = coordinates.map(
        ([lat, lng]) => [lat, lng] as [number, number],
      );
      map.fitBounds(bounds, { padding: [24, 24] });
    }
  }, [geofences, map]);

  return null;
}

function ClickHandler({
  enabled,
  onMapClick,
}: {
  enabled: boolean;
  onMapClick?: (event: LeafletMouseEvent) => void;
}) {
  useMapEvents({
    click: (event) => {
      if (enabled && onMapClick) {
        onMapClick(event);
      }
    },
  });

  return null;
}

function GeofenceMap({
  geofences = [],
  boundaryType,
  centerLatitude,
  centerLongitude,
  radiusMeters,
  points = [],
  interactive = false,
  onMapClick,
  height = 360,
}: GeofenceMapProps) {
  const hasFormCenter =
    centerLatitude !== null &&
    centerLatitude !== undefined &&
    centerLongitude !== null &&
    centerLongitude !== undefined;

  const mapCenter: [number, number] = hasFormCenter
    ? [centerLatitude as number, centerLongitude as number]
    : points.length > 0
      ? [points[0].latitude, points[0].longitude]
      : DEFAULT_MAP_CENTER;

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
        center={mapCenter}
        zoom={14}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geofences.length > 0 && <FitBounds geofences={geofences} />}
        <ClickHandler enabled={interactive} onMapClick={onMapClick} />

        {geofences.map((geofence) => {
          if (
            geofence.boundary_type === "CIRCLE" &&
            geofence.center_latitude !== null &&
            geofence.center_longitude !== null &&
            geofence.radius_meters !== null
          ) {
            return (
              <Circle
                key={`circle-${geofence.id}`}
                center={[
                  geofence.center_latitude,
                  geofence.center_longitude,
                ]}
                radius={geofence.radius_meters}
                pathOptions={{
                  color: geofence.enabled ? "#8B5CF6" : "#AAA2B5",
                  fillColor: geofence.enabled ? "#8B5CF6" : "#AAA2B5",
                  fillOpacity: 0.16,
                  weight: 2,
                }}
              />
            );
          }

          const polygonPoints = [...geofence.points]
            .sort((a, b) => a.point_order - b.point_order)
            .map(
              (point) =>
                [point.latitude, point.longitude] as [number, number],
            );

          return (
            <Polygon
              key={`polygon-${geofence.id}`}
              positions={polygonPoints}
              pathOptions={{
                color: geofence.enabled ? "#EC4899" : "#AAA2B5",
                fillColor: geofence.enabled ? "#EC4899" : "#AAA2B5",
                fillOpacity: 0.15,
                weight: 2,
              }}
            />
          );
        })}

        {boundaryType === "CIRCLE" &&
          hasFormCenter &&
          radiusMeters !== null &&
          radiusMeters !== undefined &&
          radiusMeters > 0 && (
            <Circle
              center={[centerLatitude as number, centerLongitude as number]}
              radius={radiusMeters}
              pathOptions={{
                color: "#8B5CF6",
                fillColor: "#8B5CF6",
                fillOpacity: 0.18,
                weight: 2,
              }}
            />
          )}

        {boundaryType === "POLYGON" && points.length >= 2 && (
          <Polygon
            positions={[...points]
              .sort((a, b) => a.point_order - b.point_order)
              .map(
                (point) =>
                  [point.latitude, point.longitude] as [number, number],
              )}
            pathOptions={{
              color: "#EC4899",
              fillColor: "#EC4899",
              fillOpacity: points.length >= 3 ? 0.16 : 0.05,
              weight: 2,
              dashArray: points.length >= 3 ? undefined : "6 6",
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}


export default GeofenceMap;
