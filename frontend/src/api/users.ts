import apiClient from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import type {
  CreateUserPayload,
  PaginatedResponse,
  UpdateUserPayload,
  User,
} from "../types";

interface BackendUserListResponse {
  items: User[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export async function listUsers(params: {
  page: number;
  pageSize: number;
  search?: string;
  isActive?: boolean | null;
}): Promise<PaginatedResponse<User>> {
  const response = await apiClient.get<BackendUserListResponse>(
    API_ENDPOINTS.users,
    {
      params: {
        page: params.page,
        page_size: params.pageSize,
        search: params.search || undefined,
        is_active: params.isActive ?? undefined,
      },
    },
  );

  return {
    items: response.data.items,
    pagination: response.data.pagination,
  };
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const response = await apiClient.post<User>(API_ENDPOINTS.users, payload);
  return response.data;
}

export async function updateUser(
  userId: number,
  payload: UpdateUserPayload,
): Promise<User> {
  const response = await apiClient.put<User>(
    `${API_ENDPOINTS.users}/${userId}`,
    payload,
  );
  return response.data;
}

export async function updateUserStatus(
  userId: number,
  isActive: boolean,
): Promise<User> {
  const response = await apiClient.patch<User>(
    `${API_ENDPOINTS.users}/${userId}/status`,
    { is_active: isActive },
  );
  return response.data;
}
