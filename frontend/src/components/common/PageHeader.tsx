import type { ReactNode } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

interface PageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: ReactNode;
}

function PageHeader({ title, description, actionLabel, onAction, actionIcon = <AddRoundedIcon /> }: PageHeaderProps) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" spacing={2}>
      <Box>
        <Typography variant="h4">{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
          {description}
        </Typography>
      </Box>
      {actionLabel && onAction && (
        <Button variant="contained" startIcon={actionIcon} onClick={onAction} sx={{ flexShrink: 0 }}>
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}

export default PageHeader;
