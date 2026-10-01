import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import { Box, Typography } from "@mui/material";

interface EmptyStateProps { title: string; description: string; }

function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Box sx={{ py: 7, textAlign: "center" }}>
      <Box sx={{ width: 56, height: 56, mx: "auto", borderRadius: "50%", display: "grid", placeItems: "center", color: "primary.main", background: "linear-gradient(135deg, #F1EAFF 0%, #FDECF5 100%)" }}><InboxRoundedIcon /></Box>
      <Typography variant="h6" sx={{ mt: 2 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{description}</Typography>
    </Box>
  );
}

export default EmptyState;
