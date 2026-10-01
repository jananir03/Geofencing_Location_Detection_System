import apiClient from "./axios";
import { API_ENDPOINTS } from "./endpoints";
import type { AuditLog, PaginatedResponse } from "../types";

export interface ListAuditLogsParams {
  page: number;
  pageSize: number;
  action?: string;
  entityType?: string;
  entityId?: number | null;
  userId?: number | null;
}

interface BackendAuditLogListResponse {
  items: AuditLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function listAuditLogs(
  params: ListAuditLogsParams,
): Promise<PaginatedResponse<AuditLog>> {
  const response = await apiClient.get<BackendAuditLogListResponse>(
    API_ENDPOINTS.auditLogs,
    {
      params: {
        action: params.action || undefined,
        entity_type: params.entityType || undefined,
        entity_id: params.entityId ?? undefined,
        user_id: params.userId ?? undefined,
        page: params.page,
        page_size: params.pageSize,
      },
    },
  );

  return {
    items: response.data.items,
    pagination: {
      page: response.data.page,
      page_size: response.data.page_size,
      total: response.data.total,
      total_pages: response.data.total_pages,
      has_next: response.data.page < response.data.total_pages,
      has_previous: response.data.page > 1,
    },
  };
}

export async function getAuditLog(logId: number): Promise<AuditLog> {
  const response = await apiClient.get<AuditLog>(
    `${API_ENDPOINTS.auditLogs}/${logId}`,
  );

  return response.data;
}
