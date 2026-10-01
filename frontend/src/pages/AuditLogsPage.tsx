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

import { listAuditLogs } from "../api/auditLogs";
import { listUsers } from "../api/users";
import { getApiErrorMessage } from "../api/error";
import type { AuditLog, User } from "../types";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import TablePaginationBar from "../components/common/TablePaginationBar";

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "ENABLE",
  "DISABLE",
  "DELETE",
] as const;

const ENTITY_TYPES = [
  "USER",
  "DEVICE",
  "GEOFENCE",
] as const;

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString();
}

function actionColor(
  action: string,
): "success" | "warning" | "error" | "info" | "default" {
  switch (action) {
    case "CREATE":
      return "success";
    case "DELETE":
      return "error";
    case "DISABLE":
      return "warning";
    case "ENABLE":
      return "success";
    case "UPDATE":
      return "info";
    default:
      return "default";
  }
}

function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [userId, setUserId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [selectedLog, setSelectedLog] =
    useState<AuditLog | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const result = await listAuditLogs({
        page,
        pageSize,
        action,
        entityType,
        userId: userId === "" ? null : userId,
      });

      setLogs(result.items);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.total_pages);
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [action, entityType, page, pageSize, userId]);

  const loadUsers = useCallback(async () => {
    try {
      const result = await listUsers({
        page: 1,
        pageSize: 100,
      });
      setUsers(result.items);
    } catch {
      // User IDs remain available even if the optional name lookup fails.
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const getUserName = (id: number | null): string => {
    if (id === null) return "System";
    return users.find((user) => user.id === id)?.name ??
      `User #${id}`;
  };

  const clearFilters = () => {
    setAction("");
    setEntityType("");
    setUserId("");
    setPage(1);
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Audit Logs"
        description="Track important user, device and geofence changes recorded by the backend audit service."
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
                value={action}
                onChange={(event: SelectChangeEvent) => {
                  setAction(event.target.value);
                  setPage(1);
                }}
                displayEmpty
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">All actions</MenuItem>
                {ACTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>

              <Select
                size="small"
                value={entityType}
                onChange={(event: SelectChangeEvent) => {
                  setEntityType(event.target.value);
                  setPage(1);
                }}
                displayEmpty
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">All entities</MenuItem>
                {ENTITY_TYPES.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </Select>

              <Select
                size="small"
                value={userId}
                onChange={(event: SelectChangeEvent<number | "">) => {
                  const value = event.target.value;
                  setUserId(
                    value === "" ? "" : Number(value),
                  );
                  setPage(1);
                }}
                displayEmpty
                sx={{ minWidth: 210 }}
              >
                <MenuItem value="">All users</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>

              <Box sx={{ flex: 1 }} />

              {(action || entityType || userId !== "") && (
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
                  onClick={() => void loadLogs()}
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
                    onClick={() => void loadLogs()}
                  >
                    Retry
                  </Button>
                }
              >
                {pageError}
              </Alert>
            )}

            {loading ? (
              <LoadingState label="Loading audit logs..." />
            ) : logs.length === 0 ? (
              <EmptyState
                title="No audit logs found"
                description="State-changing actions will appear here after they are recorded by the backend."
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
                      py: 1.45,
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
                      <th>Action</th>
                      <th>Entity</th>
                      <th>Entity ID</th>
                      <th>User</th>
                      <th>Details</th>
                      <th>Created</th>
                      <th style={{ textAlign: "right" }}>
                        View
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <Chip
                            label={log.action}
                            size="small"
                            color={actionColor(log.action)}
                          />
                        </td>
                        <td>
                          <Typography
                            fontSize={14}
                            fontWeight={700}
                          >
                            {log.entity_type}
                          </Typography>
                        </td>
                        <td>
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: "monospace" }}
                          >
                            {log.entity_id ?? "—"}
                          </Typography>
                        </td>
                        <td>
                          <Typography variant="caption">
                            {getUserName(log.user_id)}
                          </Typography>
                        </td>
                        <td>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              maxWidth: 320,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {log.details
                              ? JSON.stringify(log.details)
                              : "No details"}
                          </Typography>
                        </td>
                        <td>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {formatDate(log.created_at)}
                          </Typography>
                        </td>
                        <td align="right">
                          <Tooltip title="View details">
                            <IconButton
                              size="small"
                              onClick={() =>
                                setSelectedLog(log)
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
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 750 }}>
          Audit log #{selectedLog?.id}
        </DialogTitle>

        <DialogContent dividers>
          {selectedLog && (
            <Stack spacing={1.25}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
              >
                <Chip
                  label={selectedLog.action}
                  size="small"
                  color={actionColor(selectedLog.action)}
                />
                <Chip
                  label={selectedLog.entity_type}
                  size="small"
                  variant="outlined"
                />
              </Stack>

              <Typography variant="body2">
                <strong>Entity ID:</strong>{" "}
                {selectedLog.entity_id ?? "—"}
              </Typography>

              <Typography variant="body2">
                <strong>User:</strong>{" "}
                {getUserName(selectedLog.user_id)}
              </Typography>

              <Typography variant="body2">
                <strong>Created:</strong>{" "}
                {formatDate(selectedLog.created_at)}
              </Typography>

              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  borderRadius: 2,
                  overflow: "auto",
                  backgroundColor: "#F8F6FB",
                  border: "1px solid",
                  borderColor: "divider",
                  fontSize: 12,
                  lineHeight: 1.6,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Consolas, monospace",
                }}
              >
                {JSON.stringify(
                  selectedLog.details ?? {},
                  null,
                  2,
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setSelectedLog(null)}
            color="inherit"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export default AuditLogsPage;
