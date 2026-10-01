import { Chip } from "@mui/material";

interface StatusChipProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

function StatusChip({
  active,
  activeLabel = "Active",
  inactiveLabel = "Disabled",
}: StatusChipProps) {
  return (
    <Chip
      size="small"
      label={active ? activeLabel : inactiveLabel}
      sx={{
        fontWeight: 700,
        backgroundColor: active ? "#EAF7F1" : "#F3F0F5",
        color: active ? "#247A59" : "#756E83",
        border: "1px solid",
        borderColor: active ? "#CDEBDE" : "#E7E1EA",
      }}
    />
  );
}

export default StatusChip;
