import { Box, FormControl, IconButton, MenuItem, Select, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

interface TablePaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

function TablePaginationBar({ page, pageSize, total, totalPages, onPageChange, onPageSizeChange }: TablePaginationBarProps) {
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);
  const handlePageSizeChange = (event: SelectChangeEvent<number>) => onPageSizeChange(Number(event.target.value));

  return (
    <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", borderTop: "1px solid", borderColor: "divider" }}>
      <Typography variant="caption" color="text.secondary">{firstItem}–{lastItem} of {total}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Typography variant="caption" color="text.secondary">Rows</Typography>
        <FormControl size="small" sx={{ minWidth: 72 }}>
          <Select value={pageSize} onChange={handlePageSizeChange}>
            {[10, 20, 50].map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </Select>
        </FormControl>
        <IconButton size="small" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="previous page"><ChevronLeftRoundedIcon /></IconButton>
        <Typography variant="caption" sx={{ minWidth: 54, textAlign: "center" }}>{totalPages === 0 ? 0 : page} / {totalPages}</Typography>
        <IconButton size="small" disabled={page >= totalPages || totalPages === 0} onClick={() => onPageChange(page + 1)} aria-label="next page"><ChevronRightRoundedIcon /></IconButton>
      </Box>
    </Box>
  );
}

export default TablePaginationBar;
