import apiClient from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import type {
  GeofenceEvent,
  GeofenceEventListResponse,
} from "../types";

export interface ListGeofenceEventsParams {
  page: number;
  pageSize: number;
  deviceId?: number | null;
  geofenceId?: number | null;
  eventType?: string;
}

export async function listGeofenceEvents(
  params: ListGeofenceEventsParams,
): Promise<GeofenceEventListResponse> {
  const response = await apiClient.get<GeofenceEventListResponse>(
    API_ENDPOINTS.geofenceEvents,
    {
      params: {
        page: params.page,
        page_size: params.pageSize,
        device_id: params.deviceId ?? undefined,
        geofence_id: params.geofenceId ?? undefined,
        event_type: params.eventType || undefined,
      },
    },
  );

  return response.data;
}

export async function getGeofenceEvent(
  eventId: number,
): Promise<GeofenceEvent> {
  const response = await apiClient.get<GeofenceEvent>(
    `${API_ENDPOINTS.geofenceEvents}/${eventId}`,
  );

  return response.data;
}
