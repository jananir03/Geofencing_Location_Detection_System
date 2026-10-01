import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#8B5CF6",
      light: "#A78BFA",
      dark: "#6D28D9",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#EC4899",
      light: "#F472B6",
      dark: "#BE185D",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F8F6FB",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#29243A",
      secondary: "#756E83",
    },
    success: {
      main: "#2E9B70",
    },
    warning: {
      main: "#D8943D",
    },
    error: {
      main: "#D85C72",
    },
    divider: "#ECE7F2",
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: [
      "Inter",
      "Roboto",
      "Arial",
      "sans-serif",
    ].join(","),
    h4: {
      fontWeight: 750,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 650,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          minWidth: "320px",
          backgroundColor: "#F8F6FB",
        },
        "*": {
          boxSizing: "border-box",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 11,
          paddingInline: 18,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid #ECE7F2",
          boxShadow: "0 8px 28px rgba(47, 35, 67, 0.055)",
          borderRadius: 18,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
  },
});
