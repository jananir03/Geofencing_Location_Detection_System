export interface User {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
}

export interface UserPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface UserListResponse {
  items: User[];
  pagination: UserPagination;
}

export interface Device {
  id: number;
  user_id: number;
  device_identifier: string;
  name: string;
  is_active: boolean;
  last_latitude: number | null;
  last_longitude: number | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDevicePayload {
  user_id: number;
  device_identifier: string;
  name: string;
}

export interface UpdateDevicePayload {
  name?: string;
}

export interface DevicePagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface DeviceListResponse {
  items: Device[];
  pagination: DevicePagination;
}

export interface GeofencePoint {
  id?: number;
  latitude: number;
  longitude: number;
  point_order: number;
}

export type BoundaryType = "CIRCLE" | "POLYGON";

export interface Geofence {
  id: number;
  name: string;
  description: string | null;
  boundary_type: BoundaryType;
  center_latitude: number | null;
  center_longitude: number | null;
  radius_meters: number | null;
  enabled: boolean;
  points: GeofencePoint[];
  created_at: string;
  updated_at: string;
}

export interface GeofenceCreatePayload {
  name: string;
  description?: string | null;
  boundary_type: BoundaryType;
  center_latitude?: number | null;
  center_longitude?: number | null;
  radius_meters?: number | null;
  points?: GeofencePoint[];
  enabled: boolean;
}

export interface GeofenceUpdatePayload {
  name?: string;
  description?: string | null;
  center_latitude?: number | null;
  center_longitude?: number | null;
  radius_meters?: number | null;
  points?: GeofencePoint[];
}

export interface GeofencePagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface GeofenceListResponse {
  items: Geofence[];
  pagination: GeofencePagination;
}

export type GeofenceEventType = "ENTER" | "EXIT" | "INSIDE" | "OUTSIDE";

export interface GeofenceEvent {
  id: number;
  device_id: number;
  geofence_id: number;
  location_event_id: number;
  event_type: GeofenceEventType;
  previous_state: string;
  current_state: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  created_at: string;
}

export interface GeofenceEventListResponse {
  items: GeofenceEvent[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface LocationEvent {
  id: number;
  device_id: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface DashboardSummary {
  users: number;
  devices: number;
  geofences: number;
  events: number;
  backendHealthy: boolean;
}
