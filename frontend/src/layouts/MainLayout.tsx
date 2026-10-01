import type { ReactNode } from "react";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import DevicesOtherRoundedIcon from "@mui/icons-material/DevicesOtherRounded";
import FmdGoodRoundedIcon from "@mui/icons-material/FmdGoodRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";

const drawerWidth = 250;

interface NavigationItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: <DashboardRoundedIcon />,
  },
  {
    label: "Users",
    path: "/users",
    icon: <PeopleAltRoundedIcon />,
  },
  {
    label: "Devices",
    path: "/devices",
    icon: <DevicesOtherRoundedIcon />,
  },
  {
    label: "Geofences",
    path: "/geofences",
    icon: <FmdGoodRoundedIcon />,
  },
  {
    label: "Locations",
    path: "/locations",
    icon: <LocationOnRoundedIcon />,
  },
  {
    label: "Geofence Events",
    path: "/geofence-events",
    icon: <EventNoteRoundedIcon />,
  },
  {
    label: "Audit Logs",
    path: "/audit-logs",
    icon: <HistoryRoundedIcon />,
  },
];

function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2.25, pt: 2.5, pb: 1.75 }}>
        <Typography
          variant="overline"
          sx={{
            color: "primary.main",
            fontWeight: 800,
            letterSpacing: "0.13em",
          }}
        >
          Management
        </Typography>
      </Box>

      <List sx={{ px: 1.25, pt: 0 }}>
        {navigationItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);

          return (
            <ListItemButton
              key={item.path}
              selected={isActive}
              onClick={() => handleNavigate(item.path)}
              sx={{
                minHeight: 46,
                mb: 0.5,
                borderRadius: 2.5,
                color: isActive ? "primary.dark" : "text.secondary",
                "& .MuiListItemIcon-root": {
                  color: isActive ? "primary.main" : "text.secondary",
                },
                "&.Mui-selected": {
                  background:
                    "linear-gradient(90deg, #F3EDFF 0%, #FCECF5 100%)",
                },
                "&.Mui-selected:hover": {
                  background:
                    "linear-gradient(90deg, #EFE7FF 0%, #FBE8F2 100%)",
                },
                "&:hover": {
                  backgroundColor: "#FAF7FC",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 42 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 550,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ mt: "auto", p: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            background:
              "linear-gradient(135deg, #F7F0FF 0%, #FFF1F7 100%)",
            border: "1px solid #EEE3F5",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            System
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.35, fontWeight: 700 }}
          >
            Location monitoring
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.35 }}
          >
            Geofencing & event detection
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Toolbar sx={{ minHeight: "68px !important" }}>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
              aria-label="open navigation"
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h6"
              sx={{
                lineHeight: 1.05,
                color: "text.primary",
              }}
            >
              GeoFence
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Location Event Detection
            </Typography>
          </Box>

          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: "success.main",
              mr: 1,
              boxShadow: "0 0 0 4px rgba(46,155,112,0.10)",
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Backend connected
          </Typography>
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              border: 0,
            },
          }}
        >
          <Toolbar sx={{ minHeight: "68px !important" }} />
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "1px solid",
              borderColor: "divider",
              backgroundColor: "#FFFFFF",
            },
          }}
        >
          <Toolbar sx={{ minHeight: "68px !important" }} />
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          backgroundColor: "background.default",
        }}
      >
        <Toolbar sx={{ minHeight: "68px !important" }} />
        <Box
          sx={{
            p: { xs: 2, sm: 2.5, md: 3.5 },
            maxWidth: 1600,
            mx: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default MainLayout;
