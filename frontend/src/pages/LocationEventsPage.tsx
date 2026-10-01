import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import AddLocationAltRoundedIcon from "@mui/icons-material/AddLocationAltRounded";
import GpsFixedRoundedIcon from "@mui/icons-material/GpsFixedRounded";
import MyLocationRoundedIcon from "@mui/icons-material/MyLocationRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import {
  createLocationEvent,
  listLocationEvents,
} from "../api/locationEvents";
import { listDevices } from "../api/devices";
import { getGeofences } from "../api/geofences";
import { getApiErrorMessage } from "../api/error";
import type {
  Device,
  Geofence,
  LocationEvent,
} from "../types";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import TablePaginationBar from "../components/common/TablePaginationBar";
import LocationLiveMap from "../components/common/LocationLiveMap";

interface Feedback {
  message: string;
  severity: "success" | "error";
}

function getLocalDateTimeValue(date = new Date()): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

function LocationEventsPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [events, setEvents] = useState<LocationEvent[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationEvent | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [historyDeviceId, setHistoryDeviceId] =
    useState<number | "">("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [form, setForm] = useState({
    deviceId: "",
    geofenceId: "",
    latitude: "",
    longitude: "",
    accuracy: "8",
    timestamp: getLocalDateTimeValue(),
  });

  const [loading, setLoading] = useState(true);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [geofencesLoading, setGeofencesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const activeDevices = useMemo(
    () => devices.filter((device) => device.is_active),
    [devices],
  );

  const selectedGeofence = useMemo(
    () =>
      geofences.find(
        (geofence) => geofence.id === Number(form.geofenceId),
      ) ?? null,
    [form.geofenceId, geofences],
  );

  const liveLocation = useMemo(() => {
    if (!form.deviceId) {
      return selectedLocation;
    }

    const selectedDevice = activeDevices.find(
      (device) => device.id === Number(form.deviceId),
    );

    if (!selectedDevice) {
      return null;
    }

    if (
      selectedDevice.last_latitude !== null &&
      selectedDevice.last_longitude !== null
    ) {
      return {
        id:
          selectedLocation?.device_id === selectedDevice.id
            ? selectedLocation.id
            : 0,
        device_id: selectedDevice.id,
        latitude: selectedDevice.last_latitude,
        longitude: selectedDevice.last_longitude,
        accuracy: null,
        timestamp:
          selectedDevice.last_seen_at ?? new Date().toISOString(),
        created_at:
          selectedDevice.last_seen_at ?? new Date().toISOString(),
      } satisfies LocationEvent;
    }

    return selectedLocation?.device_id === selectedDevice.id
      ? selectedLocation
      : null;
  }, [activeDevices, form.deviceId, selectedLocation]);

  const loadDevices = useCallback(async () => {
    setDevicesLoading(true);

    try {
      const result = await listDevices({
        page: 1,
        pageSize: 100,
      });
      setDevices(result.items);

      setForm((current) => {
        if (current.deviceId || result.items.length === 0) {
          return current;
        }

        const firstActive = result.items.find(
          (device) => device.is_active,
        );

        return {
          ...current,
          deviceId: firstActive
            ? String(firstActive.id)
            : "",
        };
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getApiErrorMessage(error),
      });
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  const loadGeofences = useCallback(async () => {
    setGeofencesLoading(true);

    try {
      const result = await getGeofences({
        page: 1,
        page_size: 100,
        enabled: true,
      });
      setGeofences(result.items);

      setForm((current) => {
        const currentId = Number(current.geofenceId);
        const currentStillAvailable = result.items.some(
          (geofence) => geofence.id === currentId,
        );

        if (current.geofenceId && currentStillAvailable) {
          return current;
        }

        return {
          ...current,
          geofenceId:
            result.items.length > 0
              ? String(result.items[0].id)
              : "",
        };
      });
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getApiErrorMessage(error),
      });
    } finally {
      setGeofencesLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const result = await listLocationEvents({
        page,
        pageSize,
        deviceId:
          historyDeviceId === "" ? null : historyDeviceId,
        startTime: startTime
          ? `${startTime}:00`
          : undefined,
        endTime: endTime
          ? `${endTime}:59`
          : undefined,
      });

      setEvents(result.items);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.total_pages);
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [endTime, historyDeviceId, page, pageSize, startTime]);

  useEffect(() => {
    void loadDevices();
    void loadGeofences();
  }, [loadDevices, loadGeofences]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadDevices();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [loadDevices]);

  const handleDeviceChange = (value: string) => {
    setForm((current) => ({
      ...current,
      deviceId: value,
    }));
    setSelectedLocation(null);
    setFormError("");
  };

  const handleGeofenceChange = (value: string) => {
    setForm((current) => ({
      ...current,
      geofenceId: value,
    }));
    setFormError("");
  };

  const handleSendLocation = async () => {
    setFormError("");

    const deviceId = Number(form.deviceId);
    const geofenceId = Number(form.geofenceId);
    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const accuracy =
      form.accuracy.trim() === ""
        ? null
        : Number(form.accuracy);

    if (!Number.isInteger(deviceId) || deviceId <= 0) {
      setFormError("Select an active device.");
      return;
    }

    if (!Number.isInteger(geofenceId) || geofenceId <= 0) {
      setFormError("Select an enabled geofence to monitor.");
      return;
    }

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      setFormError("Latitude must be between -90 and 90.");
      return;
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setFormError("Longitude must be between -180 and 180.");
      return;
    }

    if (
      accuracy !== null &&
      (!Number.isFinite(accuracy) || accuracy < 0)
    ) {
      setFormError("Accuracy must be 0 or greater.");
      return;
    }

    if (!form.timestamp) {
      setFormError("Timestamp is required.");
      return;
    }

    setSubmitting(true);

    try {
      const created = await createLocationEvent({
        device_id: deviceId,
        geofence_id: geofenceId,
        latitude,
        longitude,
        accuracy,
        timestamp: `${form.timestamp}:00`,
      });

      setSelectedLocation(created);
      setFeedback({
        severity: "success",
        message: selectedGeofence
          ? `Location accepted. Only ${selectedGeofence.name} was evaluated.`
          : "Location accepted for the selected geofence.",
      });

      setForm((current) => ({
        ...current,
        latitude: "",
        longitude: "",
        timestamp: getLocalDateTimeValue(),
      }));

      setPage(1);
      await Promise.all([loadEvents(), loadDevices()]);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseLatestDeviceLocation = () => {
    const deviceId = Number(form.deviceId);
    const device = activeDevices.find(
      (item) => item.id === deviceId,
    );

    if (
      !device ||
      device.last_latitude === null ||
      device.last_longitude === null
    ) {
      setFormError(
        "The selected device does not have a latest location yet.",
      );
      return;
    }

    setFormError("");
    setForm((current) => ({
      ...current,
      latitude: String(device.last_latitude),
      longitude: String(device.last_longitude),
    }));
  };

  const getDeviceName = (deviceId: number): string =>
    devices.find((device) => device.id === deviceId)?.name ??
    `Device #${deviceId}`;

  const clearHistoryFilters = () => {
    setHistoryDeviceId("");
    setStartTime("");
    setEndTime("");
    setPage(1);
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Locations"
        description="Send GPS coordinates from an active device and monitor its latest position against enabled geofences."
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            xl: "minmax(340px, 0.72fr) minmax(600px, 1.28fr)",
          },
          gap: 2.25,
          alignItems: "stretch",
        }}
      >
        <Card>
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 2.5,
                    color: "primary.main",
                    background:
                      "linear-gradient(135deg, #F1EAFF 0%, #FDECF5 100%)",
                  }}
                >
                  <AddLocationAltRoundedIcon />
                </Box>
                <Box>
                  <Typography variant="h6">
                    Send location
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Every submission triggers geofence evaluation.
                  </Typography>
                </Box>
              </Stack>

              {formError && (
                <Alert severity="error">{formError}</Alert>
              )}

              {activeDevices.length === 0 &&
                !devicesLoading && (
                  <Alert severity="warning">
                    No active devices are available. Register and
                    enable a device before sending a location.
                  </Alert>
                )}

              <Select
                value={form.deviceId}
                onChange={(event: SelectChangeEvent<string>) =>
                  handleDeviceChange(event.target.value)
                }
                displayEmpty
                fullWidth
                disabled={
                  devicesLoading || activeDevices.length === 0
                }
              >
                <MenuItem value="" disabled>
                  {devicesLoading
                    ? "Loading active devices..."
                    : "Select active device"}
                </MenuItem>
                {activeDevices.map((device) => (
                  <MenuItem
                    key={device.id}
                    value={String(device.id)}
                  >
                    {device.name} — {device.device_identifier}
                  </MenuItem>
                ))}
              </Select>

              <Select
                value={form.geofenceId}
                onChange={(event: SelectChangeEvent<string>) =>
                  handleGeofenceChange(event.target.value)
                }
                displayEmpty
                fullWidth
                disabled={
                  geofencesLoading || geofences.length === 0
                }
              >
                <MenuItem value="" disabled>
                  {geofencesLoading
                    ? "Loading enabled geofences..."
                    : "Select geofence to monitor"}
                </MenuItem>
                {geofences.map((geofence) => (
                  <MenuItem
                    key={geofence.id}
                    value={String(geofence.id)}
                  >
                    {geofence.name} — {geofence.boundary_type}
                  </MenuItem>
                ))}
              </Select>

              {geofences.length === 0 && !geofencesLoading && (
                <Alert severity="warning">
                  No enabled geofences are available. Create and enable
                  a geofence before sending a location.
                </Alert>
              )}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 1.5,
                }}
              >
                <TextField
                  label="Latitude"
                  value={form.latitude}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      latitude: event.target.value,
                    }))
                  }
                  placeholder="13.082700"
                  inputMode="decimal"
                  fullWidth
                />

                <TextField
                  label="Longitude"
                  value={form.longitude}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      longitude: event.target.value,
                    }))
                  }
                  placeholder="80.270700"
                  inputMode="decimal"
                  fullWidth
                />
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
              >
                <TextField
                  label="GPS accuracy (meters)"
                  value={form.accuracy}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      accuracy: event.target.value,
                    }))
                  }
                  placeholder="8"
                  inputMode="decimal"
                  fullWidth
                />

                <Tooltip title="Use the selected device's latest backend location">
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<MyLocationRoundedIcon />}
                      onClick={handleUseLatestDeviceLocation}
                      disabled={
                        !form.deviceId ||
                        devicesLoading ||
                        activeDevices.length === 0
                      }
                      sx={{
                        height: 40,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Use latest
                    </Button>
                  </span>
                </Tooltip>
              </Stack>

              <TextField
                label="Timestamp"
                type="datetime-local"
                value={form.timestamp}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    timestamp: event.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <Divider />

              <Button
                variant="contained"
                size="large"
                startIcon={
                  submitting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <GpsFixedRoundedIcon />
                  )
                }
                onClick={() => void handleSendLocation()}
                disabled={
                  submitting ||
                  devicesLoading ||
                  geofencesLoading ||
                  activeDevices.length === 0 ||
                  geofences.length === 0 ||
                  !form.geofenceId
                }
              >
                {submitting
                  ? "Sending location..."
                  : "Send location"}
              </Button>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                The backend stores the GPS point and evaluates only
                the selected geofence for ENTER, EXIT, INSIDE or OUTSIDE.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 0 }}>
          <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
            <Stack spacing={1.25}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h6">
                    Live location map
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Latest location from the backend. The map
                    refreshes automatically.
                  </Typography>
                </Box>

                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                >
                  <Chip
                    size="small"
                    label={
                      geofencesLoading
                        ? "Loading zone"
                        : selectedGeofence
                          ? `Monitoring: ${selectedGeofence.name}`
                          : "No geofence selected"
                    }
                    variant="outlined"
                  />
                  <Tooltip title="Refresh latest location">
                    <IconButton
                      size="small"
                      onClick={() => void loadDevices()}
                      disabled={devicesLoading}
                    >
                      <RefreshRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              <LocationLiveMap
                location={liveLocation}
                geofences={selectedGeofence ? [selectedGeofence] : []}
                height={520}
              />

              {liveLocation ? (
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  divider={<Divider orientation="vertical" flexItem />}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Coordinates:{" "}
                    <strong>
                      {formatCoordinate(liveLocation.latitude)},{" "}
                      {formatCoordinate(liveLocation.longitude)}
                    </strong>
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Updated:{" "}
                    <strong>
                      {formatDate(liveLocation.timestamp)}
                    </strong>
                  </Typography>
                </Stack>
              ) : (
                <Alert severity="info">
                  Select a device and geofence, then send a location to
                  display the bus position and monitor that boundary.
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack spacing={1.75}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">
                  Location history
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Stored GPS events returned by the backend.
                </Typography>
              </Box>

              <Select
                size="small"
                value={historyDeviceId}
                onChange={(event: SelectChangeEvent<number | "">) => {
                  const value = event.target.value;
                  setHistoryDeviceId(
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

              <TextField
                size="small"
                label="From"
                type="datetime-local"
                value={startTime}
                onChange={(event) => {
                  setStartTime(event.target.value);
                  setPage(1);
                }}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                size="small"
                label="To"
                type="datetime-local"
                value={endTime}
                onChange={(event) => {
                  setEndTime(event.target.value);
                  setPage(1);
                }}
                InputLabelProps={{ shrink: true }}
              />

              <Tooltip title="Refresh location history">
                <IconButton
                  onClick={() => void loadEvents()}
                  disabled={loading}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>

              {(historyDeviceId !== "" ||
                startTime ||
                endTime) && (
                <Button
                  size="small"
                  color="inherit"
                  onClick={clearHistoryFilters}
                >
                  Clear
                </Button>
              )}
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
              <LoadingState label="Loading location history..." />
            ) : events.length === 0 ? (
              <EmptyState
                title="No location events"
                description="Send a location from an active device to create the first GPS event."
              />
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    minWidth: 850,
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
                    "& tbody tr": {
                      cursor: "pointer",
                      transition:
                        "background-color 0.15s ease",
                    },
                    "& tbody tr:hover": {
                      backgroundColor: "#FAF7FC",
                    },
                  }}
                >
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>Coordinates</th>
                      <th>Accuracy</th>
                      <th>Timestamp</th>
                      <th>Event ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => {
                      const selected =
                        selectedLocation?.id === event.id;

                      return (
                        <tr
                          key={event.id}
                          onClick={() =>
                            setSelectedLocation(event)
                          }
                          style={{
                            backgroundColor: selected
                              ? "#F7F1FF"
                              : undefined,
                          }}
                        >
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
                            <Typography
                              variant="caption"
                              sx={{ fontFamily: "monospace" }}
                            >
                              {formatCoordinate(
                                event.latitude,
                              )}
                              ,{" "}
                              {formatCoordinate(
                                event.longitude,
                              )}
                            </Typography>
                          </td>
                          <td>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {event.accuracy !== null
                                ? `${event.accuracy} m`
                                : "—"}
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
                          <td>
                            <Chip
                              label={`#${event.id}`}
                              size="small"
                              variant="outlined"
                            />
                          </td>
                        </tr>
                      );
                    })}
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

      {feedback && (
        <Box
          sx={{
            position: "fixed",
            right: { xs: 16, sm: 24 },
            bottom: { xs: 16, sm: 24 },
            zIndex: 1500,
          }}
        >
          <Alert
            severity={feedback.severity}
            variant="filled"
            onClose={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        </Box>
      )}
    </Stack>
  );
}

export default LocationEventsPage;
