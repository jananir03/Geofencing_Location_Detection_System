import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import {
  createDevice,
  listDevices,
  updateDevice,
  updateDeviceStatus,
} from "../api/devices";
import { listUsers } from "../api/users";
import { getApiErrorMessage } from "../api/error";
import type {
  CreateDevicePayload,
  Device,
  UpdateDevicePayload,
  User,
} from "../types";
import PageHeader from "../components/common/PageHeader";
import StatusChip from "../components/common/StatusChip";
import TablePaginationBar from "../components/common/TablePaginationBar";
import EmptyState from "../components/common/EmptyState";
import LoadingState from "../components/common/LoadingState";
import ConfirmDialog from "../components/common/ConfirmDialog";

interface Feedback {
  message: string;
  severity: "success" | "error";
}

function formatDate(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString();
}

function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<number | "">("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form, setForm] = useState({
    user_id: "",
    device_identifier: "",
    name: "",
  });
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Device | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const result = await listDevices({
        page,
        pageSize,
        search,
        userId: userFilter === "" ? null : userFilter,
        isActive:
          activeFilter === "" ? null : activeFilter === "true",
      });

      setDevices(result.items);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.total_pages);
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page, pageSize, search, userFilter]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);

    try {
      const result = await listUsers({
        page: 1,
        pageSize: 100,
        isActive: true,
      });
      setUsers(result.items);
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getApiErrorMessage(error),
      });
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditingDevice(null);
    setForm({
      user_id: "",
      device_identifier: "",
      name: "",
    });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (device: Device) => {
    setEditingDevice(device);
    setForm({
      user_id: String(device.user_id),
      device_identifier: device.device_identifier,
      name: device.name,
    });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const name = form.name.trim();

    if (name.length < 2) {
      setFormError("Device name must contain at least 2 characters.");
      return;
    }

    setActionLoading(true);
    setFormError("");

    try {
      if (editingDevice) {
        const payload: UpdateDevicePayload = { name };
        await updateDevice(editingDevice.id, payload);
        setFeedback({
          severity: "success",
          message: "Device updated successfully.",
        });
      } else {
        const userId = Number(form.user_id);
        const identifier = form.device_identifier.trim();

        if (!Number.isInteger(userId) || userId <= 0) {
          setFormError("Select an active user.");
          setActionLoading(false);
          return;
        }

        if (identifier.length < 3) {
          setFormError(
            "Device identifier must contain at least 3 characters.",
          );
          setActionLoading(false);
          return;
        }

        const payload: CreateDevicePayload = {
          user_id: userId,
          device_identifier: identifier,
          name,
        };

        await createDevice(payload);
        setFeedback({
          severity: "success",
          message: "Device registered successfully.",
        });
      }

      setDialogOpen(false);
      await loadDevices();
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;

    setActionLoading(true);

    try {
      await updateDeviceStatus(
        statusTarget.id,
        !statusTarget.is_active,
      );

      setFeedback({
        severity: "success",
        message: `Device ${statusTarget.is_active ? "disabled" : "enabled"} successfully.`,
      });

      setStatusTarget(null);
      await loadDevices();
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getApiErrorMessage(error),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getUserName = (userId: number): string => {
    return users.find((user) => user.id === userId)?.name ?? `User #${userId}`;
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Devices"
        description="Register and manage devices that send location data to the geofencing system."
        actionLabel="Register device"
        onAction={openCreate}
      />

      <Card>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Stack spacing={1.75}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                fullWidth
                placeholder="Search device name or identifier..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchRoundedIcon
                      sx={{ mr: 1, color: "text.secondary" }}
                    />
                  ),
                }}
              />

              <Select
                size="small"
                value={userFilter}
                onChange={(event: SelectChangeEvent<number | "">) => {
                  const value = event.target.value;
                  setUserFilter(value === "" ? "" : Number(value));
                  setPage(1);
                }}
                displayEmpty
                sx={{ minWidth: 190 }}
              >
                <MenuItem value="">All users</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>

              <Select
                size="small"
                value={activeFilter}
                onChange={(event) => {
                  setActiveFilter(event.target.value as "" | "true" | "false");
                  setPage(1);
                }}
                displayEmpty
                sx={{ minWidth: 145 }}
              >
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Disabled</MenuItem>
              </Select>

              <Tooltip title="Refresh">
                <IconButton
                  onClick={() => void loadDevices()}
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
                    onClick={() => void loadDevices()}
                  >
                    Retry
                  </Button>
                }
              >
                {pageError}
              </Alert>
            )}

            {loading ? (
              <LoadingState label="Loading devices..." />
            ) : devices.length === 0 ? (
              <EmptyState
                title="No devices found"
                description="Register a device or adjust the current filters."
              />
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    minWidth: 900,
                    borderCollapse: "collapse",
                    "& th, & td": {
                      borderBottom: "1px solid",
                      borderColor: "divider",
                      px: 1.5,
                      py: 1.5,
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
                      <th>Device</th>
                      <th>Owner</th>
                      <th>Status</th>
                      <th>Last location</th>
                      <th>Last seen</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((device) => (
                      <tr key={device.id}>
                        <td>
                          <Typography fontSize={14} fontWeight={700}>
                            {device.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {device.device_identifier}
                          </Typography>
                        </td>
                        <td>
                          <Typography fontSize={14}>
                            {getUserName(device.user_id)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            User #{device.user_id}
                          </Typography>
                        </td>
                        <td>
                          <StatusChip active={device.is_active} />
                        </td>
                        <td>
                          {device.last_latitude !== null &&
                          device.last_longitude !== null ? (
                            <Typography variant="caption">
                              {device.last_latitude.toFixed(5)},{" "}
                              {device.last_longitude.toFixed(5)}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              No location yet
                            </Typography>
                          )}
                        </td>
                        <td>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(device.last_seen_at)}
                          </Typography>
                        </td>
                        <td>
                          <Stack
                            direction="row"
                            justifyContent="flex-end"
                            spacing={0.25}
                          >
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => openEdit(device)}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title={
                                device.is_active
                                  ? "Disable device"
                                  : "Enable device"
                              }
                            >
                              <IconButton
                                size="small"
                                color={
                                  device.is_active ? "warning" : "success"
                                }
                                onClick={() => setStatusTarget(device)}
                              >
                                <PowerSettingsNewRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
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
        open={dialogOpen}
        onClose={actionLoading ? undefined : () => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 750 }}>
          {editingDevice ? "Edit device" : "Register device"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            {!editingDevice && (
              <Select
                value={form.user_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    user_id: event.target.value,
                  }))
                }
                displayEmpty
                fullWidth
                disabled={usersLoading}
              >
                <MenuItem value="" disabled>
                  {usersLoading ? "Loading active users..." : "Select active user"}
                </MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {user.name} — {user.email}
                  </MenuItem>
                ))}
              </Select>
            )}

            <TextField
              label="Device identifier"
              value={form.device_identifier}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  device_identifier: event.target.value,
                }))
              }
              fullWidth
              disabled={editingDevice !== null}
              helperText={
                editingDevice
                  ? "The registered identifier cannot be changed."
                  : "Example: EXCAVATOR-GPS-001"
              }
            />

            <TextField
              label="Device name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              fullWidth
              autoFocus={editingDevice !== null}
              helperText="Use a clear human-readable device name."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDialogOpen(false)}
            disabled={actionLoading}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={actionLoading}
          >
            {actionLoading
              ? "Saving..."
              : editingDevice
                ? "Save changes"
                : "Register device"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={statusTarget !== null}
        title={statusTarget?.is_active ? "Disable device?" : "Enable device?"}
        message={
          statusTarget?.is_active
            ? `Disable "${statusTarget.name}"? It will no longer be accepted for new location events.`
            : `Enable "${statusTarget?.name}"? It can start sending location events again.`
        }
        confirmLabel={statusTarget?.is_active ? "Disable" : "Enable"}
        confirmColor={statusTarget?.is_active ? "warning" : "primary"}
        loading={actionLoading}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => void handleStatusChange()}
      />

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

export default DevicesPage;
