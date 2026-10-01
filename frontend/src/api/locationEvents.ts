import apiClient from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import type { LocationEvent, PaginatedResponse } from "../types";

export interface ListLocationEventsParams {
  page: number;
  pageSize: number;
  deviceId?: number | null;
  startTime?: string;
  endTime?: string;
}

interface BackendLocationEventListResponse {
  items: LocationEvent[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface CreateLocationEventPayload {
  device_id: number;
  geofence_id: number;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: string;
}

export async function listLocationEvents(
  params: ListLocationEventsParams,
): Promise<PaginatedResponse<LocationEvent>> {
  const response =
    await apiClient.get<BackendLocationEventListResponse>(
      API_ENDPOINTS.locationEvents,
      {
        params: {
          page: params.page,
          page_size: params.pageSize,
          device_id: params.deviceId ?? undefined,
          start_time: params.startTime || undefined,
          end_time: params.endTime || undefined,
        },
      },
    );

  return {
    items: response.data.items,
    pagination: response.data.pagination,
  };
}

export async function createLocationEvent(
  payload: CreateLocationEventPayload,
): Promise<LocationEvent> {
  const response = await apiClient.post<LocationEvent>(
    API_ENDPOINTS.locationEvents,
    payload,
  );

  return response.data;
}

export async function getLocationEvent(
  locationEventId: number,
): Promise<LocationEvent> {
  const response = await apiClient.get<LocationEvent>(
    `${API_ENDPOINTS.locationEvents}/${locationEventId}`,
  );

  return response.data;
}
