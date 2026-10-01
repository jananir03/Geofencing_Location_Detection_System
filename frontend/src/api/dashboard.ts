import apiClient from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import type { DashboardSummary } from "../types";

interface PaginatedCountResponse {
  pagination: {
    total: number;
  };
}

interface EventCountResponse {
  total: number;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [users, devices, geofences, events, health] = await Promise.all([
    apiClient.get<PaginatedCountResponse>(API_ENDPOINTS.users, {
      params: { page: 1, page_size: 1 },
    }),
    apiClient.get<PaginatedCountResponse>(API_ENDPOINTS.devices, {
      params: { page: 1, page_size: 1 },
    }),
    apiClient.get<PaginatedCountResponse>(API_ENDPOINTS.geofences, {
      params: { page: 1, page_size: 1 },
    }),
    apiClient.get<EventCountResponse>(API_ENDPOINTS.geofenceEvents, {
      params: { page: 1, page_size: 1 },
    }),
    apiClient.get(API_ENDPOINTS.health),
  ]);

  return {
    users: users.data.pagination.total,
    devices: devices.data.pagination.total,
    geofences: geofences.data.pagination.total,
    events: events.data.total,
    backendHealthy: health.status === 200 && health.data?.status === "healthy",
  };
}
