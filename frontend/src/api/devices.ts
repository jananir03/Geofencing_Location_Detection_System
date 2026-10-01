import apiClient from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import type {
  CreateDevicePayload,
  Device,
  PaginatedResponse,
  UpdateDevicePayload,
} from "../types";

interface BackendDeviceListResponse {
  items: Device[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export async function listDevices(params: {
  page: number;
  pageSize: number;
  search?: string;
  userId?: number | null;
  isActive?: boolean | null;
}): Promise<PaginatedResponse<Device>> {
  const response = await apiClient.get<BackendDeviceListResponse>(
    API_ENDPOINTS.devices,
    {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search || undefined,
        user_id: params.userId ?? undefined,
        is_active: params.isActive ?? undefined,
      },
    },
  );

  return {
    items: response.data.items,
    pagination: response.data.pagination,
  };
}

export async function createDevice(
  payload: CreateDevicePayload,
): Promise<Device> {
  const response = await apiClient.post<Device>(
    API_ENDPOINTS.devices,
    payload,
  );
  return response.data;
}

export async function updateDevice(
  deviceId: number,
  payload: UpdateDevicePayload,
): Promise<Device> {
  const response = await apiClient.put<Device>(
    `${API_ENDPOINTS.devices}/${deviceId}`,
    payload,
  );
  return response.data;
}

export async function updateDeviceStatus(
  deviceId: number,
  isActive: boolean,
): Promise<Device> {
  const response = await apiClient.patch<Device>(
    `${API_ENDPOINTS.devices}/${deviceId}/status`,
    { is_active: isActive },
  );
  return response.data;
}
