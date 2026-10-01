import apiClient from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import type {
  BoundaryType,
  Geofence,
  GeofenceCreatePayload,
  GeofenceListResponse,
  GeofenceUpdatePayload,
} from "../types";

export interface GeofenceListParams {
  page: number;
  page_size: number;
  search?: string;
  boundary_type?: BoundaryType;
  enabled?: boolean;
}

export async function getGeofences(
  params: GeofenceListParams,
): Promise<GeofenceListResponse> {
  const response = await apiClient.get<GeofenceListResponse>(
    API_ENDPOINTS.geofences,
    { params },
  );

  return response.data;
}

export async function getGeofence(
  geofenceId: number,
): Promise<Geofence> {
  const response = await apiClient.get<Geofence>(
    `${API_ENDPOINTS.geofences}/${geofenceId}`,
  );

  return response.data;
}

export async function createGeofence(
  payload: GeofenceCreatePayload,
): Promise<Geofence> {
  const response = await apiClient.post<Geofence>(
    API_ENDPOINTS.geofences,
    payload,
  );

  return response.data;
}

export async function updateGeofence(
  geofenceId: number,
  payload: GeofenceUpdatePayload,
): Promise<Geofence> {
  const response = await apiClient.put<Geofence>(
    `${API_ENDPOINTS.geofences}/${geofenceId}`,
    payload,
  );

  return response.data;
}

export async function updateGeofenceStatus(
  geofenceId: number,
  enabled: boolean,
): Promise<Geofence> {
  const response = await apiClient.patch<Geofence>(
    `${API_ENDPOINTS.geofences}/${geofenceId}/status`,
    { enabled },
  );

  return response.data;
}

export async function deleteGeofence(
  geofenceId: number,
): Promise<void> {
  await apiClient.delete(
    `${API_ENDPOINTS.geofences}/${geofenceId}`,
  );
}
