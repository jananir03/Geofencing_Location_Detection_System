from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Geofencing & Location Event Detection System"
    app_env: str = "development"
    debug: bool = True

    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    mysql_host: str = "mysql"
    mysql_port: int = 3306
    mysql_database: str = "geofencing_db"
    mysql_user: str = "geofence_user"
    mysql_password: str = "geofence_password"
    mysql_root_password: str = "Jaanu863$"

    database_url: str

    cors_origins: str = "http://localhost:5173"

    gps_accuracy_buffer_meters: float = 10.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()