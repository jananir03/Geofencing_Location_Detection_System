import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import DevicesOtherRoundedIcon from "@mui/icons-material/DevicesOtherRounded";
import FmdGoodRoundedIcon from "@mui/icons-material/FmdGoodRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";

import { getDashboardSummary } from "../api/dashboard";
import { getApiErrorMessage } from "../api/error";
import type { DashboardSummary } from "../types";

interface StatCard {
  label: string;
  key: keyof Pick<DashboardSummary, "users" | "devices" | "geofences" | "events">;
  description: string;
  icon: typeof PeopleAltRoundedIcon;
}

const statCards: StatCard[] = [
  {
    label: "Users",
    key: "users",
    description: "Registered users",
    icon: PeopleAltRoundedIcon,
  },
  {
    label: "Devices",
    key: "devices",
    description: "Tracked devices",
    icon: DevicesOtherRoundedIcon,
  },
  {
    label: "Geofences",
    key: "geofences",
    description: "Configured boundaries",
    icon: FmdGoodRoundedIcon,
  },
  {
    label: "Events",
    key: "events",
    description: "Detected geofence events",
    icon: EventNoteRoundedIcon,
  },
];

function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getDashboardSummary();
      setSummary(result);
    } catch (requestError) {
      setSummary(null);
      setError(getApiErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography variant="h4">Good evening</Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 0.75, maxWidth: 720 }}
          >
            Monitor your users, devices, geofences and location
            events from one place.
          </Typography>
        </Box>

        <Tooltip title="Refresh dashboard">
          <IconButton
            onClick={() => void loadSummary()}
            disabled={loading}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: "background.paper",
            }}
          >
            <RefreshRoundedIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && (
        <Alert severity="error" action={
          <IconButton
            color="inherit"
            size="small"
            onClick={() => void loadSummary()}
            aria-label="retry dashboard"
          >
            <RefreshRoundedIcon fontSize="small" />
          </IconButton>
        }>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const value = summary?.[stat.key];

          return (
            <Card key={stat.label}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {stat.label}
                    </Typography>

                    {loading ? (
                      <Skeleton
                        variant="text"
                        width={70}
                        height={52}
                        sx={{ mt: 0.25 }}
                      />
                    ) : (
                      <Typography variant="h4" sx={{ mt: 0.75 }}>
                        {value ?? "—"}
                      </Typography>
                    )}

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      {stat.description}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      flexShrink: 0,
                      borderRadius: 3,
                      display: "grid",
                      placeItems: "center",
                      color: "primary.main",
                      background:
                        "linear-gradient(135deg, #F1EAFF 0%, #FDECF5 100%)",
                    }}
                  >
                    <Icon />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Card>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6">
                System status
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Live status from the FastAPI health endpoint.
              </Typography>
            </Box>

            {loading ? (
              <Skeleton variant="rounded" width={150} height={38} />
            ) : summary?.backendHealthy ? (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: "#EAF7F1",
                  color: "#247A59",
                }}
              >
                <CheckCircleRoundedIcon fontSize="small" />
                <Typography variant="body2" fontWeight={700}>
                  Backend healthy
                </Typography>
              </Stack>
            ) : (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  backgroundColor: "#FDECEF",
                  color: "#B63F59",
                }}
              >
                <ErrorRoundedIcon fontSize="small" />
                <Typography variant="body2" fontWeight={700}>
                  Backend unavailable
                </Typography>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default DashboardPage;
