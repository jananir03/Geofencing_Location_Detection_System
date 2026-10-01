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

## 5. How Geofencing Works

The basic flow is:

```text
Device Location
       |
       v
Location API
       |
       v
Geofencing Engine
       |
       v
Check Geofence Boundary
       |
       v
Determine Current State
       |
       v
Create Geofence Event
       |
       v
Store Event in MySQL
```

For a circular geofence, the system calculates the distance between the device location and the geofence center.

For a polygon geofence, the system checks whether the location is inside the polygon.

---

## 6. Event Example

Example:

```text
Device starts outside the geofence
            |
            v
Device enters the geofence
            |
            v
ENTER event
            |
            v
Device remains inside
            |
            v
INSIDE event
            |
            v
Device leaves the geofence
            |
            v
EXIT event
```

The first location observation can be stored as `INSIDE` or `OUTSIDE` because there is no previous state to compare with.

---

## 7. Database Tables

The main database tables are:

```text
users
devices
geofences
geofence_points
location_events
geofence_events
audit_logs
```

Basic relationship:

```text
User
 |
 +---- Devices
          |
          +---- Location Events
          |
          +---- Geofence Events

Geofence
 |
 +---- Geofence Points
 |
 +---- Geofence Events

Users / Devices / Geofences
 |
 +---- Audit Logs
```

---

## 8. Project Structure

```text
Geofencing-System/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── main.tsx
│   │
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 9. Docker Setup

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

> Do not use `docker compose down -v` unless you intentionally want to delete the MySQL volume and database data.

---

## 10. Database Configuration

The MySQL database runs inside Docker.

The application uses:

```text
Database: geofencing_db
MySQL internal port: 3306
MySQL host port: 3307
```

From the FastAPI container, MySQL is accessed using:

```text
mysql:3306
```

From MySQL Workbench on the host machine:

```text
Host: 127.0.0.1
Port: 3307
```

---

## 11. Database Migration

Alembic is used for database migrations.

Run:

```bash
docker compose exec backend alembic upgrade head
```

Check the current migration:

```bash
docker compose exec backend alembic current
```

---

## 12. Running the Backend

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

## 13. Main API Endpoints

### Users

```text
GET    /api/users
POST   /api/users
GET    /api/users/{user_id}
PUT    /api/users/{user_id}
PATCH  /api/users/{user_id}/status
```

### Devices

```text
GET    /api/devices
POST   /api/devices
GET    /api/devices/{device_id}
PUT    /api/devices/{device_id}
PATCH  /api/devices/{device_id}/status
```

### Geofences

```text
GET    /api/geofences
POST   /api/geofences
GET    /api/geofences/{geofence_id}
PUT    /api/geofences/{geofence_id}
PATCH  /api/geofences/{geofence_id}/status
DELETE /api/geofences/{geofence_id}
```

### Location Events

```text
POST /api/location-events
GET  /api/location-events
```

### Geofence Events

```text
GET /api/geofence-events
```

### Audit Logs

```text
GET /api/audit-logs
```

> The exact request and response fields can be checked in Swagger because the API documentation is generated from the current backend code.

---

## 14. Example Location Event

Example request:

```json
{
  "device_id": 2,
  "geofence_id": 2,
  "latitude": 13.063000,
  "longitude": 80.271000,
  "accuracy": 5,
  "timestamp": "2026-10-01T19:10:00"
}
```

The IDs should be replaced with IDs that already exist in the database.

---

## 15. Testing

The project can be tested using:

- Swagger UI
- Postman
- Frontend
- MySQL Workbench
- Docker logs

### Suggested Testing Order

```text
1. Create User
       ↓
2. Create Device
       ↓
3. Create Geofence
       ↓
4. Create Location Event
       ↓
5. Check Geofence Events
       ↓
6. Check Audit Logs
       ↓
7. Verify data in MySQL
```

---

## 16. Example Geofence Testing

For a circular geofence:

```text
Center:
Latitude  = 13.059200
Longitude = 80.271000

Radius:
500 meters
```

Example locations:

```text
Outside:
13.064500, 80.271000

Inside:
13.063000, 80.271000

Inside:
13.060800, 80.270500

Inside:
13.058000, 80.272000

Outside:
13.064500, 80.271000
```

A possible event flow is:

```text
OUTSIDE
   ↓
ENTER
   ↓
INSIDE
   ↓
INSIDE
   ↓
EXIT
```

Use different timestamps for different location events so that duplicate records are not created.

---

## 17. Frontend Pages

The frontend contains pages for:

- Dashboard
- Users
- Devices
- Geofences
- Location Events
- Geofence Events
- Audit Logs

The geofence and location pages also provide map-based visualization.

---

## 18. Map

The project uses:

- Leaflet
- OpenStreetMap

The map can display:

- Current/latest device location
- GPS accuracy area
- Circular geofences
- Polygon geofences
- Selected geofence boundary

---

## 19. MySQL Verification

Open MySQL Workbench and connect using:

```text
Host: 127.0.0.1
Port: 3307
Username: geofence_user
Database: geofencing_db
```

To check the tables:

```sql
USE geofencing_db;

SHOW TABLES;
```

To check users:

```sql
SELECT * FROM users;
```

To check devices:

```sql
SELECT * FROM devices;
```

To check geofences:

```sql
SELECT * FROM geofences;
```

To check location events:

```sql
SELECT * FROM location_events;
```

To check geofence events:

```sql
SELECT * FROM geofence_events;
```

To check audit logs:

```sql
SELECT * FROM audit_logs;
```

---

## 20. Important Notes

- GPS accuracy is considered while checking circular geofences.
- Disabled geofences are not processed.
- Inactive devices cannot be used for normal location processing.
- Duplicate location events are prevented.
- Location history is stored in the database.
- Geofence events are stored separately from raw location events.
- Audit logs are used for important system activities.
- MySQL data is stored in a Docker volume.

---

## 21. Future Improvements

Some possible future improvements are:

- Real-time device tracking
- WebSocket based location updates
- More advanced polygon boundary handling
- Notification system for ENTER and EXIT events
- Email/SMS notifications
- Background location processing
- Better GPS accuracy handling
- Analytics dashboard
- Role-based authentication
- Production deployment

---

## 22. Conclusion

This project demonstrates how a location-based system can receive GPS data and automatically detect geofence-related events.

It combines:

```text
React
   +
FastAPI
   +
MySQL
   +
Geofencing Logic
   +
Leaflet Maps
   +
Docker
```

The project can be used as a basic foundation for applications such as:

- Delivery tracking
- Vehicle tracking
- Employee attendance zones
- Store or warehouse zones
- Field staff tracking
- Location-based notifications
