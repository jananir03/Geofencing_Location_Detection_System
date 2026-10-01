# Geofencing & Location Event Detection System

## 1. Project Overview

This project is a **Geofencing and Location Event Detection System**.

The system receives the current location of a device and checks whether the device is inside or outside a configured geofence.

It can detect events such as:

- ENTER
- EXIT
- INSIDE
- OUTSIDE

The project also provides APIs and a frontend to manage users, devices, geofences, location events, geofence events and audit logs.

---

## 2. Project Objective

The main objective of this project is to:

- Create and manage geofences
- Support circular and polygon geofences
- Enable or disable geofences
- Register users and devices
- Receive device GPS locations
- Check whether a device is inside or outside a geofence
- Detect ENTER and EXIT events
- Store location history
- Store geofence event history
- Maintain audit logs
- Display locations and geofences on a map

---

## 3. Technology Stack

### Backend

- Python 3.12
- FastAPI
- SQLAlchemy
- Alembic
- Pydantic
- PyMySQL

### Frontend

- React
- TypeScript
- Vite
- Material UI (MUI)
- Axios
- React Router
- Leaflet
- OpenStreetMap

### Database

- MySQL 8.0

### Tools

- Docker
- Docker Compose
- Visual Studio Code
- MySQL Workbench
- Postman
- Swagger / OpenAPI
- Git

---

## 4. Main Features

### User Management

Users can be:

- Created
- Viewed
- Updated
- Activated
- Deactivated

### Device Management

Devices are connected to users.

The system supports:

- Device creation
- Device listing
- Device search
- Device update
- Device activation/deactivation

### Geofence Management

The system supports:

- Create geofence
- Update geofence
- Delete geofence
- Enable/disable geofence
- Circular geofence
- Polygon geofence
- Geofence points

### Location Tracking

The system receives:

- Device ID
- Geofence ID
- Latitude
- Longitude
- GPS accuracy
- Timestamp

Location events are stored in the database.

Duplicate location events are prevented using a database constraint.

### Geofence Event Detection

The system checks the device location against the selected geofence.

Possible events are:

```text
ENTER
EXIT
INSIDE
OUTSIDE
```

The system uses location history to identify changes in the device state.

### Audit Logs

Important system activities can be recorded in audit logs.

Examples:

- User changes
- Device changes
- Geofence changes
- Important geofence events

---

---

### Docker Setup

The project uses Docker Compose for the backend and MySQL database.

Start the project:

```bash
docker compose up --build
```

To run it in the background:

```bash
docker compose up -d
```

Check the containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs
```

Stop the containers:

```bash
docker compose down
```

---


### Running the Backend

The backend runs on:

```text
http://127.0.0.1:8000
```

Swagger UI:

```text
http://127.0.0.1:8000/docs
```

OpenAPI JSON:

```text
http://127.0.0.1:8000/openapi.json
```

Health check:

```text
http://127.0.0.1:8000/health
```

Swagger can be used to test the backend APIs.

---

