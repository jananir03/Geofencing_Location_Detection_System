from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.audit_logs import router as audit_logs_router
from app.api.devices import router as devices_router
from app.api.geofence_events import router as geofence_events_router
from app.api.geofences import router as geofences_router
from app.api.location_events import router as location_events_router
from app.api.users import router as users_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "Production-level Geofencing and Location Event "
        "Detection System"
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {
        "status": "healthy",
        "application": settings.app_name,
    }


app.include_router(users_router)
app.include_router(devices_router)
app.include_router(geofences_router)
app.include_router(location_events_router)
app.include_router(geofence_events_router)
app.include_router(audit_logs_router)