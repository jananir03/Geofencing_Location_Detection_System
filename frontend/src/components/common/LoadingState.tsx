import { Box, CircularProgress, Typography } from "@mui/material";

interface LoadingStateProps { label?: string; }

function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <Box sx={{ minHeight: 260, display: "grid", placeItems: "center", textAlign: "center" }}>
      <Box><CircularProgress size={28} /><Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>{label}</Typography></Box>
    </Box>
  );
}

export default LoadingState;
