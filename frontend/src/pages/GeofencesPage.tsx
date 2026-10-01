import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import FmdGoodRoundedIcon from "@mui/icons-material/FmdGoodRounded";
import PowerSettingsNewRoundedIcon from "@mui/icons-material/PowerSettingsNewRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RadioButtonCheckedRoundedIcon from "@mui/icons-material/RadioButtonCheckedRounded";
import PolylineRoundedIcon from "@mui/icons-material/PolylineRounded";

import {
  createGeofence,
  deleteGeofence,
  getGeofences,
  updateGeofence,
  updateGeofenceStatus,
} from "../api/geofences";
import { getApiErrorMessage } from "../api/error";
import type {
  BoundaryType,
  Geofence,
  GeofenceCreatePayload,
  GeofenceUpdatePayload,
} from "../types";
import PageHeader from "../components/common/PageHeader";
import StatusChip from "../components/common/StatusChip";
import ConfirmDialog from "../components/common/ConfirmDialog";
import GeofenceMap from "../components/common/GeofenceMap";
import GeofenceFormDialog from "../components/common/GeofenceFormDialog";

interface Feedback {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function GeofencesPage() {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [boundaryType, setBoundaryType] =
    useState<BoundaryType | "">("");
  const [enabledFilter, setEnabledFilter] =
    useState<"" | "true" | "false">("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] =
    useState<Geofence | null>(null);
  const [statusTarget, setStatusTarget] =
    useState<Geofence | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<Geofence | null>(null);
  const [selectedGeofenceId, setSelectedGeofenceId] =
    useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(0);
      setSearch(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadGeofences = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await getGeofences({
        page: page + 1,
        page_size: pageSize,
        search: search || undefined,
        boundary_type: boundaryType || undefined,
        enabled:
          enabledFilter === ""
            ? undefined
            : enabledFilter === "true",
      });

      setGeofences(response.items);
      setTotal(response.pagination.total);

      setSelectedGeofenceId((current) => {
        if (
          current !== null &&
          response.items.some((item) => item.id === current)
        ) {
          return current;
        }
        return response.items[0]?.id ?? null;
      });
    } catch (error) {
      setPageError(
        getApiErrorMessage(error),
      );
    } finally {
      setLoading(false);
    }
  }, [boundaryType, enabledFilter, page, pageSize, search]);

  useEffect(() => {
    void loadGeofences();
  }, [loadGeofences]);

  const enabledGeofences = useMemo(
    () => geofences.filter((geofence) => geofence.enabled),
    [geofences],
  );

  const selectedGeofence = useMemo(
    () =>
      geofences.find(
        (geofence) => geofence.id === selectedGeofenceId,
      ) ?? null,
    [geofences, selectedGeofenceId],
  );

  const openCreate = () => {
    setEditingGeofence(null);
    setFormOpen(true);
  };

  const openEdit = (geofence: Geofence) => {
    setEditingGeofence(geofence);
    setSelectedGeofenceId(geofence.id);
    setFormOpen(true);
  };

  const handleFormSubmit = async (
    payload: GeofenceCreatePayload | GeofenceUpdatePayload,
  ) => {
    setActionLoading(true);

    try {
      if (editingGeofence) {
        await updateGeofence(editingGeofence.id, payload);
        setFeedback({
          open: true,
          message: "Geofence updated successfully.",
          severity: "success",
        });
      } else {
        const created = await createGeofence(
          payload as GeofenceCreatePayload,
        );
        setSelectedGeofenceId(created.id);
        setFeedback({
          open: true,
          message: "Geofence created successfully.",
          severity: "success",
        });
      }

      setFormOpen(false);
      setEditingGeofence(null);
      await loadGeofences();
    } catch (error) {
      setFeedback({
        open: true,
        message: getApiErrorMessage(error),
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;

    setActionLoading(true);

    try {
      await updateGeofenceStatus(
        statusTarget.id,
        !statusTarget.enabled,
      );

      setFeedback({
        open: true,
        message: statusTarget.enabled
          ? "Geofence disabled successfully."
          : "Geofence enabled successfully.",
        severity: "success",
      });

      setStatusTarget(null);
      await loadGeofences();
    } catch (error) {
      setFeedback({
        open: true,
        message: getApiErrorMessage(error),
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setActionLoading(true);

    try {
      await deleteGeofence(deleteTarget.id);
      setFeedback({
        open: true,
        message: "Geofence deleted successfully.",
        severity: "success",
      });
      setDeleteTarget(null);

      if (geofences.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        await loadGeofences();
      }
    } catch (error) {
      setFeedback({
        open: true,
        message: getApiErrorMessage(error),
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Geofences"
        description="Create circular or polygon boundaries and manage the locations where your devices are monitored."
        actionLabel="Create geofence"
        onAction={openCreate}
      />

      {pageError && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void loadGeofences()}
            >
              Retry
            </Button>
          }
        >
          {pageError}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.85fr) minmax(280px, 0.65fr)",
          },
          gap: 2.25,
          alignItems: "stretch",
        }}
      >
        <Card sx={{ minWidth: 0 }}>
          <CardContent sx={{ p: { xs: 1.25, sm: 1.75 } }}>
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <TextField
                  fullWidth
                  value={searchInput}
                  onChange={(event) =>
                    setSearchInput(event.target.value)
                  }
                  placeholder="Search geofences..."
                  InputProps={{
                    startAdornment: (
                      <SearchRoundedIcon
                        sx={{ mr: 1, color: "text.secondary" }}
                      />
                    ),
                  }}
                />

                <FormControl sx={{ minWidth: { md: 135 } }}>
                  <InputLabel id="boundary-filter-label">
                    Type
                  </InputLabel>
                  <Select
                    labelId="boundary-filter-label"
                    label="Type"
                    value={boundaryType}
                    onChange={(event) => {
                      setPage(0);
                      setBoundaryType(
                        event.target.value as BoundaryType | "",
                      );
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="CIRCLE">Circle</MenuItem>
                    <MenuItem value="POLYGON">Polygon</MenuItem>
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: { md: 135 } }}>
                  <InputLabel id="status-filter-label">
                    Status
                  </InputLabel>
                  <Select
                    labelId="status-filter-label"
                    label="Status"
                    value={enabledFilter}
                    onChange={(event) => {
                      setPage(0);
                      setEnabledFilter(
                        event.target.value as "" | "true" | "false",
                      );
                    }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="true">Enabled</MenuItem>
                    <MenuItem value="false">Disabled</MenuItem>
                  </Select>
                </FormControl>

                <Tooltip title="Refresh">
                  <IconButton
                    onClick={() => void loadGeofences()}
                    disabled={loading}
                  >
                    <RefreshRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              <GeofenceMap
                geofences={enabledGeofences}
                height={620}
              />

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ px: 0.5 }}
              >
                Enabled boundaries are shown on the map. Select a
                geofence from the details panel to inspect it.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 0 }}>
          <CardContent sx={{ p: { xs: 1.75, md: 2 } }}>
            <Stack spacing={1.75}>
              <Box>
                <Typography variant="h6">
                  Geofence details
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {total} configured boundary{total === 1 ? "" : "ies"}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1}>
                <Chip
                  size="small"
                  color="primary"
                  label={`${enabledGeofences.length} enabled`}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${geofences.length - enabledGeofences.length} disabled`}
                />
              </Stack>

              {loading ? (
                <Box
                  sx={{
                    minHeight: 260,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <CircularProgress size={28} />
                </Box>
              ) : geofences.length === 0 ? (
                <Box
                  sx={{
                    minHeight: 260,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    px: 2,
                  }}
                >
                  <Stack spacing={1} alignItems="center">
                    <FmdGoodRoundedIcon
                      sx={{ fontSize: 38, color: "text.disabled" }}
                    />
                    <Typography fontWeight={700}>
                      No geofences
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Create a boundary to start monitoring.
                    </Typography>
                  </Stack>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {geofences.map((geofence) => {
                    const selected =
                      geofence.id === selectedGeofenceId;

                    return (
                      <Box
                        key={geofence.id}
                        onClick={() =>
                          setSelectedGeofenceId(geofence.id)
                        }
                        sx={{
                          p: 1.35,
                          borderRadius: 2.5,
                          border: "1px solid",
                          borderColor: selected
                            ? "primary.light"
                            : "divider",
                          backgroundColor: selected
                            ? "#F7F1FF"
                            : "#FFFFFF",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          "&:hover": {
                            borderColor: "primary.light",
                            backgroundColor: "#FAF7FC",
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="flex-start"
                        >
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 2,
                              display: "grid",
                              placeItems: "center",
                              flexShrink: 0,
                              color:
                                geofence.boundary_type === "CIRCLE"
                                  ? "primary.main"
                                  : "secondary.main",
                              backgroundColor:
                                geofence.boundary_type === "CIRCLE"
                                  ? "#F0E9FF"
                                  : "#FDEBF4",
                            }}
                          >
                            {geofence.boundary_type === "CIRCLE" ? (
                              <RadioButtonCheckedRoundedIcon
                                fontSize="small"
                              />
                            ) : (
                              <PolylineRoundedIcon fontSize="small" />
                            )}
                          </Box>

                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              spacing={1}
                            >
                              <Typography
                                fontSize={14}
                                fontWeight={750}
                                noWrap
                              >
                                {geofence.name}
                              </Typography>
                              <StatusChip
                                active={geofence.enabled}
                              />
                            </Stack>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: "block",
                                mt: 0.45,
                              }}
                            >
                              {geofence.boundary_type === "CIRCLE"
                                ? `${geofence.radius_meters ?? "—"} m radius`
                                : `${geofence.points.length} boundary points`}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              )}

              {selectedGeofence && (
                <Box
                  sx={{
                    mt: 0.5,
                    p: 1.5,
                    borderRadius: 2.5,
                    backgroundColor: "#FBF9FD",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Selected boundary
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={750}
                    sx={{ mt: 0.25 }}
                  >
                    {selectedGeofence.name}
                  </Typography>

                  {selectedGeofence.boundary_type === "CIRCLE" ? (
                    <Stack spacing={0.35} sx={{ mt: 1 }}>
                      <Typography variant="caption">
                        Center:{" "}
                        {selectedGeofence.center_latitude?.toFixed(6)},{" "}
                        {selectedGeofence.center_longitude?.toFixed(6)}
                      </Typography>
                      <Typography variant="caption">
                        Radius: {selectedGeofence.radius_meters} m
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={0.35} sx={{ mt: 1 }}>
                      <Typography variant="caption">
                        Polygon points: {selectedGeofence.points.length}
                      </Typography>
                      <Typography variant="caption">
                        Updated:{" "}
                        {formatUpdatedAt(selectedGeofence.updated_at)}
                      </Typography>
                    </Stack>
                  )}

                  <Stack
                    direction="row"
                    spacing={0.5}
                    sx={{ mt: 1 }}
                  >
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => openEdit(selectedGeofence)}
                      >
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        selectedGeofence.enabled
                          ? "Disable"
                          : "Enable"
                      }
                    >
                      <IconButton
                        size="small"
                        color={
                          selectedGeofence.enabled
                            ? "warning"
                            : "success"
                        }
                        onClick={() =>
                          setStatusTarget(selectedGeofence)
                        }
                      >
                        <PowerSettingsNewRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          setDeleteTarget(selectedGeofence)
                        }
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 1.25, sm: 1.75 } }}>
          <Typography variant="h6" sx={{ mb: 1.25 }}>
            Geofence registry
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 750 }}>
                    Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: 750 }}>
                    Type
                  </TableCell>
                  <TableCell sx={{ fontWeight: 750 }}>
                    Boundary
                  </TableCell>
                  <TableCell sx={{ fontWeight: 750 }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 750 }}>
                    Updated
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 750 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={26} />
                    </TableCell>
                  </TableRow>
                ) : geofences.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      No geofences found.
                    </TableCell>
                  </TableRow>
                ) : (
                  geofences.map((geofence) => (
                    <TableRow
                      key={geofence.id}
                      hover
                      selected={geofence.id === selectedGeofenceId}
                      onClick={() =>
                        setSelectedGeofenceId(geofence.id)
                      }
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>
                        <Typography fontSize={14} fontWeight={700}>
                          {geofence.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                        >
                          {geofence.description || "No description"}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {geofence.boundary_type === "CIRCLE"
                          ? "Circle"
                          : "Polygon"}
                      </TableCell>

                      <TableCell>
                        {geofence.boundary_type === "CIRCLE"
                          ? `${geofence.radius_meters ?? "—"} m radius`
                          : `${geofence.points.length} points`}
                      </TableCell>

                      <TableCell>
                        <StatusChip active={geofence.enabled} />
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {formatUpdatedAt(geofence.updated_at)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Stack
                          direction="row"
                          justifyContent="flex-end"
                          spacing={0.25}
                        >
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={(event) => {
                                event.stopPropagation();
                                openEdit(geofence);
                              }}
                            >
                              <EditRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip
                            title={
                              geofence.enabled
                                ? "Disable"
                                : "Enable"
                            }
                          >
                            <IconButton
                              size="small"
                              color={
                                geofence.enabled
                                  ? "warning"
                                  : "success"
                              }
                              onClick={(event) => {
                                event.stopPropagation();
                                setStatusTarget(geofence);
                              }}
                            >
                              <PowerSettingsNewRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteTarget(geofence);
                              }}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={pageSize}
            onRowsPerPageChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </CardContent>
      </Card>

      <GeofenceFormDialog
        open={formOpen}
        editingGeofence={editingGeofence}
        submitting={actionLoading}
        onClose={() => {
          if (!actionLoading) {
            setFormOpen(false);
            setEditingGeofence(null);
          }
        }}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={statusTarget !== null}
        title={
          statusTarget?.enabled
            ? "Disable geofence?"
            : "Enable geofence?"
        }
        message={
          statusTarget?.enabled
            ? `"${statusTarget.name}" will stop participating in location detection until it is enabled again.`
            : `"${statusTarget?.name}" will start participating in location detection again.`
        }
        confirmLabel={
          statusTarget?.enabled ? "Disable" : "Enable"
        }
        confirmColor={
          statusTarget?.enabled ? "warning" : "primary"
        }
        loading={actionLoading}
        onCancel={() => setStatusTarget(null)}
        onConfirm={() => void handleStatusChange()}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete geofence?"
        message={`This will permanently remove "${deleteTarget?.name ?? "this geofence"}". Continue only if you are sure.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={actionLoading}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />

      <Snackbar
        open={feedback.open}
        autoHideDuration={4500}
        onClose={() =>
          setFeedback((current) => ({
            ...current,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={feedback.severity}
          variant="filled"
          onClose={() =>
            setFeedback((current) => ({
              ...current,
              open: false,
            }))
          }
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

export default GeofencesPage;
