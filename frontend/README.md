# Geofencing & Location Event Detection System — Frontend

Production-oriented React frontend for the Geofencing & Location Event Detection System.

## Frontend stack

- React 18.3.1
- TypeScript 5.8.2
- Vite 6.2.2
- Material UI 6.4.8
- Axios 1.8.4
- React Router 7.5.0
- Leaflet 1.9.4
- React Leaflet 4.2.1
- OpenStreetMap

## Compatibility rules

This project intentionally keeps the dependency set compatible with React 18.

- `verbatimModuleSyntax: true`
- Type-only imports use `import type`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- Do not use `npm install --force`
- Do not use `npm install --legacy-peer-deps`
- Do not disable strict TypeScript checks to hide errors

## Functional frontend areas

### Dashboard

- Backend health
- User count
- Device count
- Geofence count
- Geofence event count
- Loading, retry and error states

### Users

- List/search/filter/pagination
- Create
- Edit
- Enable/disable
- Validation and API feedback

### Devices

- List/search/filter/pagination
- User filtering
- Register device
- Edit
- Enable/disable
- Latest device location

### Geofences

- Circle and polygon CRUD
- Enable/disable/delete
- Search/filter/pagination
- Large map on the left
- Compact geofence details on the right
- Circle and polygon visualization
- Interactive geofence creation map

### Locations

- Select active device
- Submit latitude/longitude/accuracy/timestamp
- Trigger backend geofence evaluation
- Location history
- Device/date filtering
- Large live/latest-location map
- Enabled geofence overlays
- Accuracy radius visualization
- Automatic latest-device refresh

### Geofence Events

- ENTER / EXIT / INSIDE / OUTSIDE
- Device filter
- Geofence filter
- Event-type filter
- Pagination
- Event details dialog

### Audit Logs

- Action filtering
- Entity filtering
- User filtering
- Pagination
- Detail inspection
- JSON audit details

## Run

From the frontend directory:

```powershell
npm install
npm run build
npm run dev
```

The application runs at:

```text
http://localhost:5173
```

The backend is expected at:

```text
http://localhost:8000
```

Configured in `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Verification

Before moving to final documentation/testing:

```powershell
npm run build
```

The build must complete with zero TypeScript errors.

## Map

The application uses OpenStreetMap tiles through Leaflet. Internet access is required in the browser for map tiles.

## Phase status

The complete frontend workflow is implemented:

```text
Dashboard
Users
Devices
Geofences
Locations
Geofence Events
Audit Logs
```

The next step after this frontend build is systematic frontend testing against the already-completed FastAPI backend, followed by combined backend + frontend documentation and evidence.

### Geofence-scoped location evaluation

Each location submission selects one enabled geofence. The backend evaluates the GPS point only against that selected geofence, so one location does not create events for unrelated geofences.
