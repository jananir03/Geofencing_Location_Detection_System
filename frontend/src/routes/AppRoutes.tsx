import { Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";
import AuditLogsPage from "../pages/AuditLogsPage";
import DashboardPage from "../pages/DashboardPage";
import DevicesPage from "../pages/DevicesPage";
import GeofenceEventsPage from "../pages/GeofenceEventsPage";
import GeofencesPage from "../pages/GeofencesPage";
import LocationEventsPage from "../pages/LocationEventsPage";
import UsersPage from "../pages/UsersPage";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/geofences" element={<GeofencesPage />} />
        <Route path="/locations" element={<LocationEventsPage />} />
        <Route
          path="/geofence-events"
          element={<GeofenceEventsPage />}
        />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
