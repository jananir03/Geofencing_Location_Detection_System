import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { LeafletMouseEvent } from "leaflet";

import GeofenceMap from "./GeofenceMap";
import type {
  BoundaryType,
  Geofence,
  GeofenceCreatePayload,
  GeofencePoint,
  GeofenceUpdatePayload,
} from "../../types";

const DEFAULT_CENTER_LATITUDE = 13.0827;
const DEFAULT_CENTER_LONGITUDE = 80.2707;
const DEFAULT_RADIUS = 500;

interface GeofenceFormDialogProps {
  open: boolean;
  editingGeofence: Geofence | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (
    payload: GeofenceCreatePayload | GeofenceUpdatePayload,
  ) => Promise<void>;
}

interface FormState {
  name: string;
  description: string;
  boundary_type: BoundaryType;
  center_latitude: string;
  center_longitude: string;
  radius_meters: string;
  points: GeofencePoint[];
  enabled: boolean;
}

function buildInitialState(geofence: Geofence | null): FormState {
  if (!geofence) {
    return {
      name: "",
      description: "",
      boundary_type: "CIRCLE",
      center_latitude: String(DEFAULT_CENTER_LATITUDE),
      center_longitude: String(DEFAULT_CENTER_LONGITUDE),
      radius_meters: String(DEFAULT_RADIUS),
      points: [],
      enabled: true,
    };
  }

  return {
    name: geofence.name,
    description: geofence.description ?? "",
    boundary_type: geofence.boundary_type,
    center_latitude:
      geofence.center_latitude === null
        ? ""
        : String(geofence.center_latitude),
    center_longitude:
      geofence.center_longitude === null
        ? ""
        : String(geofence.center_longitude),
    radius_meters:
      geofence.radius_meters === null
        ? ""
        : String(geofence.radius_meters),
    points: [...geofence.points]
      .sort((a, b) => a.point_order - b.point_order)
      .map((point) => ({ ...point })),
    enabled: geofence.enabled,
  };
}

function GeofenceFormDialog({
  open,
  editingGeofence,
  submitting,
  onClose,
  onSubmit,
}: GeofenceFormDialogProps) {
  const [form, setForm] = useState<FormState>(
    buildInitialState(editingGeofence),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(buildInitialState(editingGeofence));
      setError("");
    }
  }, [editingGeofence, open]);

  const isEditing = editingGeofence !== null;

  const sortedPoints = useMemo(
    () => [...form.points].sort((a, b) => a.point_order - b.point_order),
    [form.points],
  );

  const setField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleMapClick = (event: LeafletMouseEvent) => {
    if (form.boundary_type === "CIRCLE") {
      setField("center_latitude", event.latlng.lat.toFixed(6));
      setField("center_longitude", event.latlng.lng.toFixed(6));
      return;
    }

    const nextPoint: GeofencePoint = {
      latitude: Number(event.latlng.lat.toFixed(6)),
      longitude: Number(event.latlng.lng.toFixed(6)),
      point_order: form.points.length,
    };

    setForm((current) => ({
      ...current,
      points: [...current.points, nextPoint],
    }));
  };

  const handleBoundaryTypeChange = (value: BoundaryType) => {
    setForm((current) => ({
      ...current,
      boundary_type: value,
      points: value === "POLYGON" ? current.points : [],
      center_latitude:
        value === "CIRCLE"
          ? current.center_latitude || String(DEFAULT_CENTER_LATITUDE)
          : "",
      center_longitude:
        value === "CIRCLE"
          ? current.center_longitude || String(DEFAULT_CENTER_LONGITUDE)
          : "",
      radius_meters:
        value === "CIRCLE"
          ? current.radius_meters || String(DEFAULT_RADIUS)
          : "",
    }));
    setError("");
  };

  const removeLastPoint = () => {
    setForm((current) => ({
      ...current,
      points: current.points.slice(0, -1).map((point, index) => ({
        ...point,
        point_order: index,
      })),
    }));
  };

  const clearPoints = () => {
    setField("points", []);
  };

  const parseNumber = (value: string): number | null => {
    if (value.trim() === "") {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSubmit = async () => {
    setError("");

    const name = form.name.trim();
    if (name.length < 2) {
      setError("Geofence name must contain at least 2 characters.");
      return;
    }

    if (form.boundary_type === "CIRCLE") {
      const latitude = parseNumber(form.center_latitude);
      const longitude = parseNumber(form.center_longitude);
      const radius = parseNumber(form.radius_meters);

      if (latitude === null || latitude < -90 || latitude > 90) {
        setError("Enter a valid latitude between -90 and 90.");
        return;
      }

      if (longitude === null || longitude < -180 || longitude > 180) {
        setError("Enter a valid longitude between -180 and 180.");
        return;
      }

      if (radius === null || radius <= 0) {
        setError("Circle radius must be greater than 0 meters.");
        return;
      }

      const basePayload = {
        name,
        description: form.description.trim() || null,
        center_latitude: latitude,
        center_longitude: longitude,
        radius_meters: radius,
      };

      if (isEditing) {
        await onSubmit(basePayload);
      } else {
        await onSubmit({
          ...basePayload,
          boundary_type: "CIRCLE",
          enabled: form.enabled,
        });
      }

      return;
    }

    if (sortedPoints.length < 3) {
      setError("A polygon requires at least 3 points.");
      return;
    }

    const points = sortedPoints.map((point, index) => ({
      latitude: point.latitude,
      longitude: point.longitude,
      point_order: index,
    }));

    const basePayload = {
      name,
      description: form.description.trim() || null,
      points,
    };

    if (isEditing) {
      await onSubmit(basePayload);
    } else {
      await onSubmit({
        ...basePayload,
        boundary_type: "POLYGON",
        enabled: form.enabled,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      scroll="paper"
    >
      <DialogTitle sx={{ fontWeight: 750, pb: 1 }}>
        {isEditing ? "Edit geofence" : "Create geofence"}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Geofence name"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              required
              fullWidth
              autoFocus
              inputProps={{ maxLength: 150 }}
            />

            <FormControl fullWidth>
              <InputLabel id="boundary-type-label">
                Boundary type
              </InputLabel>
              <Select
                labelId="boundary-type-label"
                label="Boundary type"
                value={form.boundary_type}
                onChange={(event) =>
                  handleBoundaryTypeChange(event.target.value as BoundaryType)
                }
                disabled={isEditing}
              >
                <MenuItem value="CIRCLE">Circle</MenuItem>
                <MenuItem value="POLYGON">Polygon</MenuItem>
              </Select>
              {isEditing && (
                <FormHelperText>
                  Boundary type cannot be changed after creation.
                </FormHelperText>
              )}
            </FormControl>
          </Box>

          <TextField
            label="Description"
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            fullWidth
            multiline
            minRows={2}
            inputProps={{ maxLength: 500 }}
          />

          {form.boundary_type === "CIRCLE" ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              <TextField
                label="Center latitude"
                value={form.center_latitude}
                onChange={(event) =>
                  setField("center_latitude", event.target.value)
                }
                type="number"
                inputProps={{ min: -90, max: 90, step: "any" }}
                required
              />
              <TextField
                label="Center longitude"
                value={form.center_longitude}
                onChange={(event) =>
                  setField("center_longitude", event.target.value)
                }
                type="number"
                inputProps={{ min: -180, max: 180, step: "any" }}
                required
              />
              <TextField
                label="Radius (meters)"
                value={form.radius_meters}
                onChange={(event) =>
                  setField("radius_meters", event.target.value)
                }
                type="number"
                inputProps={{ min: 1, step: "any" }}
                required
              />
            </Box>
          ) : (
            <Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 1.25 }}
              >
                <Box>
                  <Typography fontWeight={700}>
                    Polygon points: {sortedPoints.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Click on the map to add points. Minimum 3 points required.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={removeLastPoint}
                    disabled={sortedPoints.length === 0}
                  >
                    Undo last
                  </Button>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={clearPoints}
                    disabled={sortedPoints.length === 0}
                  >
                    Clear
                  </Button>
                </Stack>
              </Stack>
            </Box>
          )}

          <GeofenceMap
            boundaryType={form.boundary_type}
            centerLatitude={parseNumber(form.center_latitude)}
            centerLongitude={parseNumber(form.center_longitude)}
            radiusMeters={parseNumber(form.radius_meters)}
            points={sortedPoints}
            interactive
            onMapClick={handleMapClick}
            height={380}
          />

          <Typography variant="caption" color="text.secondary">
            OpenStreetMap data is used for the map. For circles, click the map
            to move the center. For polygons, each click adds a boundary point.
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={submitting} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={submitting}
        >
          {submitting
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Create geofence"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GeofenceFormDialog;
