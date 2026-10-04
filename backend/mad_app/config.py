import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RebootMind - Anonymous Addiction Support App"
    VERSION: str = "1.0.0"
    HOST_LAN_IP: str | None = os.getenv("HOST_LAN_IP", None)
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./mad_dev.db")
    SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL", "sqlite:///./mad_dev.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_mad_key_change_in_production_12345")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRY_HOURS: int = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

    class Config:
        case_sensitive = True

def _async_db_url(url: str) -> str:
    """Render/Heroku give postgres:// or postgresql://; async SQLAlchemy needs +asyncpg."""
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+asyncpg://" + url[len(prefix):]
    return url

settings = Settings()
settings.DATABASE_URL = _async_db_url(settings.DATABASE_URL)
