import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import { listDevices } from "../api/devices";
import { getGeofences } from "../api/geofences";
import { listGeofenceEvents } from "../api/geofenceEvents";
import { getApiErrorMessage } from "../api/error";
import type {
  Device,
  Geofence,
  GeofenceEvent,
  GeofenceEventType,
} from "../types";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import TablePaginationBar from "../components/common/TablePaginationBar";

const EVENT_TYPES: GeofenceEventType[] = [
  "ENTER",
  "EXIT",
  "INSIDE",
  "OUTSIDE",
];

function eventColor(
  eventType: GeofenceEventType,
): "success" | "error" | "info" | "default" {
  switch (eventType) {
    case "ENTER":
      return "success";
    case "EXIT":
      return "error";
    case "INSIDE":
      return "info";
    default:
      return "default";
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

function GeofenceEventsPage() {
  const [events, setEvents] = useState<GeofenceEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deviceId, setDeviceId] = useState<number | "">("");
  const [geofenceId, setGeofenceId] = useState<number | "">("");
  const [eventType, setEventType] =
    useState<GeofenceEventType | "">("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [selectedEvent, setSelectedEvent] =
    useState<GeofenceEvent | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const result = await listGeofenceEvents({
        page,
        pageSize,
        deviceId: deviceId === "" ? null : deviceId,
        geofenceId:
          geofenceId === "" ? null : geofenceId,
        eventType: eventType || undefined,
      });

      setEvents(result.items);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [deviceId, eventType, geofenceId, page, pageSize]);

  const loadFilters = useCallback(async () => {
    try {
      const [deviceResult, geofenceResult] =
        await Promise.all([
          listDevices({ page: 1, pageSize: 100 }),
          getGeofences({
            page: 1,
            page_size: 100,
          }),
        ]);

      setDevices(deviceResult.items);
      setGeofences(geofenceResult.items);
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    void loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const getDeviceName = (id: number): string =>
    devices.find((device) => device.id === id)?.name ??
    `Device #${id}`;

  const getGeofenceName = (id: number): string =>
    geofences.find((geofence) => geofence.id === id)?.name ??
    `Geofence #${id}`;

  const clearFilters = () => {
    setDeviceId("");
    setGeofenceId("");
    setEventType("");
    setPage(1);
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Geofence Events"
        description="Review ENTER, EXIT, INSIDE and OUTSIDE events produced by the geofencing engine."
      />

      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack spacing={1.75}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Select
                size="small"
                value={deviceId}
                onChange={(event: SelectChangeEvent<number | "">) => {
                  const value = event.target.value;
                  setDeviceId(
                    value === "" ? "" : Number(value),
                  );
                  setPage(1);
                }}
                displayEmpty
                sx={{ minWidth: 210 }}
              >
                <MenuItem value="">All devices</MenuItem>
                {devices.map((device) => (
                  <MenuItem key={device.id} value={device.id}>
                    {device.name}
                  </MenuItem>
                ))}
              </Select>

              <Select
                size="small"
                value={geofenceId}
                onChange={(event: SelectChangeEvent<number | "">) => {
                  const value = event.target.value;
                  setGeofenceId(
                    value === "" ? "" : Number(value),
                  );
                  setPage(1);
                }}
                displayEmpty
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="">All geofences</MenuItem>
                {geofences.map((geofence) => (
                  <MenuItem
                    key={geofence.id}
                    value={geofence.id}
                  >
                    {geofence.name}
                  </MenuItem>
                ))}
              </Select>

              <Select
                size="small"
                value={eventType}
                onChange={(event) => {
                  setEventType(
                    event.target.value as
                      | GeofenceEventType
                      | "",
                  );
                  setPage(1);
                }}
                displayEmpty
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">All event types</MenuItem>
                {EVENT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>

              <Box sx={{ flex: 1 }} />

              {(deviceId !== "" ||
                geofenceId !== "" ||
                eventType !== "") && (
                <Button
                  size="small"
                  color="inherit"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )}

              <Tooltip title="Refresh">
                <IconButton
                  onClick={() => void loadEvents()}
                  disabled={loading}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            {pageError && (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={() => void loadEvents()}
                  >
                    Retry
                  </Button>
                }
              >
                {pageError}
              </Alert>
            )}

            {loading ? (
              <LoadingState label="Loading geofence events..." />
            ) : events.length === 0 ? (
              <EmptyState
                title="No geofence events"
                description="Send a location from an active device to generate geofence events."
              />
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    minWidth: 1000,
                    borderCollapse: "collapse",
                    "& th, & td": {
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      px: 1.5,
                      py: 1.4,
                      textAlign: "left",
                    },
                    "& th": {
                      color: "text.secondary",
                      fontSize: 12,
                      fontWeight: 750,
                    },
                  }}
                >
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Device</th>
                      <th>Geofence</th>
                      <th>Transition</th>
                      <th>Coordinates</th>
                      <th>Timestamp</th>
                      <th style={{ textAlign: "right" }}>
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <Chip
                            label={event.event_type}
                            size="small"
                            color={eventColor(event.event_type)}
                          />
                        </td>
                        <td>
                          <Typography
                            fontSize={14}
                            fontWeight={700}
                          >
                            {getDeviceName(event.device_id)}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Device #{event.device_id}
                          </Typography>
                        </td>
                        <td>
                          <Typography fontSize={14}>
                            {getGeofenceName(
                              event.geofence_id,
                            )}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Geofence #{event.geofence_id}
                          </Typography>
                        </td>
                        <td>
                          <Typography variant="caption">
                            {event.previous_state} →{" "}
                            {event.current_state}
                          </Typography>
                        </td>
                        <td>
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {event.latitude.toFixed(6)},{" "}
                            {event.longitude.toFixed(6)}
                          </Typography>
                        </td>
                        <td>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {formatDate(event.timestamp)}
                          </Typography>
                        </td>
                        <td align="right">
                          <Tooltip title="View event details">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setSelectedEvent(event)
                              }
                            >
                              <VisibilityRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Box>
              </Box>
            )}

            {!loading && (
              <TablePaginationBar
                page={page}
                pageSize={pageSize}
                total={total}
                totalPages={totalPages}
                onPageChange={setPage}
                onPageSizeChange={(value) => {
                  setPageSize(value);
                  setPage(1);
                }}
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={selectedEvent !== null}
        onClose={() => setSelectedEvent(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 750 }}>
          Geofence event #{selectedEvent?.id}
        </DialogTitle>

        <DialogContent dividers>
          {selectedEvent && (
            <Stack spacing={1.25}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <Chip
                  label={selectedEvent.event_type}
                  color={eventColor(
                    selectedEvent.event_type,
                  )}
                  size="small"
                />
                <Typography variant="body2">
                  {selectedEvent.previous_state} →{" "}
                  {selectedEvent.current_state}
                </Typography>
              </Stack>

              <Typography variant="body2">
                <strong>Device:</strong>{" "}
                {getDeviceName(selectedEvent.device_id)}
              </Typography>
              <Typography variant="body2">
                <strong>Geofence:</strong>{" "}
                {getGeofenceName(
                  selectedEvent.geofence_id,
                )}
              </Typography>
              <Typography variant="body2">
                <strong>Location event:</strong>{" "}
                #{selectedEvent.location_event_id}
              </Typography>
              <Typography variant="body2">
                <strong>Coordinates:</strong>{" "}
                {selectedEvent.latitude.toFixed(6)},{" "}
                {selectedEvent.longitude.toFixed(6)}
              </Typography>
              <Typography variant="body2">
                <strong>Timestamp:</strong>{" "}
                {formatDate(selectedEvent.timestamp)}
              </Typography>
              <Typography variant="body2">
                <strong>Created:</strong>{" "}
                {formatDate(selectedEvent.created_at)}
              </Typography>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setSelectedEvent(null)}
            color="inherit"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default GeofenceEventsPage;
