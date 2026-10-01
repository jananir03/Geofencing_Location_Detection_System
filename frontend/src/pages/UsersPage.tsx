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
  createUser,
  listUsers,
  updateUser,
  updateUserStatus,
} from "../api/users";
import { getApiErrorMessage } from "../api/error";
import type { CreateUserPayload, UpdateUserPayload, User } from "../types";
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

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [formError, setFormError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const result = await listUsers({
        page,
        pageSize,
        search,
        isActive:
          activeFilter === "" ? null : activeFilter === "true",
      });

      setUsers(result.items);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.total_pages);
    } catch (error) {
      setPageError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [activeFilter, page, pageSize, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: "", email: "" });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    if (name.length < 2) {
      setFormError("Name must contain at least 2 characters.");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    setActionLoading(true);
    setFormError("");

    try {
      if (editingUser) {
        const payload: UpdateUserPayload = {
          name,
          email,
        };
        await updateUser(editingUser.id, payload);
        setFeedback({
          severity: "success",
          message: "User updated successfully.",
        });
      } else {
        const payload: CreateUserPayload = { name, email };
        await createUser(payload);
        setFeedback({
          severity: "success",
          message: "User created successfully.",
        });
      }

      setDialogOpen(false);
      await loadUsers();
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
      await updateUserStatus(
        statusTarget.id,
        !statusTarget.is_active,
      );

      setFeedback({
        severity: "success",
        message: `User ${statusTarget.is_active ? "disabled" : "enabled"} successfully.`,
      });

      setStatusTarget(null);
      await loadUsers();
    } catch (error) {
      setFeedback({
        severity: "error",
        message: getApiErrorMessage(error),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFilterChange = (event: SelectChangeEvent) => {
    setActiveFilter(event.target.value as "" | "true" | "false");
    setPage(1);
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Users"
        description="Manage the people who own and operate devices in the geofencing system."
        actionLabel="Add user"
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
                placeholder="Search by name or email..."
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
                value={activeFilter}
                onChange={handleFilterChange}
                sx={{ minWidth: 150 }}
                displayEmpty
              >
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Disabled</MenuItem>
              </Select>

              <Tooltip title="Refresh">
                <IconButton
                  onClick={() => void loadUsers()}
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
                    onClick={() => void loadUsers()}
                  >
                    Retry
                  </Button>
                }
              >
                {pageError}
              </Alert>
            )}

            {loading ? (
              <LoadingState label="Loading users..." />
            ) : users.length === 0 ? (
              <EmptyState
                title="No users found"
                description="Try another search or create the first user."
              />
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Box
                  component="table"
                  sx={{
                    width: "100%",
                    minWidth: 720,
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
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <Typography fontSize={14} fontWeight={700}>
                            {user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID #{user.id}
                          </Typography>
                        </td>
                        <td>
                          <Typography fontSize={14}>{user.email}</Typography>
                        </td>
                        <td>
                          <StatusChip active={user.is_active} />
                        </td>
                        <td>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(user.created_at)}
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
                                onClick={() => openEdit(user)}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title={
                                user.is_active ? "Disable user" : "Enable user"
                              }
                            >
                              <IconButton
                                size="small"
                                color={user.is_active ? "warning" : "success"}
                                onClick={() => setStatusTarget(user)}
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
          {editingUser ? "Edit user" : "Add user"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Full name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              fullWidth
              autoFocus
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              fullWidth
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
            {actionLoading ? "Saving..." : editingUser ? "Save changes" : "Create user"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={statusTarget !== null}
        title={statusTarget?.is_active ? "Disable user?" : "Enable user?"}
        message={
          statusTarget?.is_active
            ? `Disable "${statusTarget.name}"? The user will no longer be considered active.`
            : `Enable "${statusTarget?.name}"? The user can be used for active device operations again.`
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

export default UsersPage;
