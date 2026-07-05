from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "Stock Analytics API"
    DEBUG: bool = True
    DATABASE_URL: str = "postgresql+asyncpg://stockuser:stockpass123@localhost:5432/stockdb"
    REDIS_URL: str = "redis://localhost:6379"
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"
    SECRET_KEY: str = "meri-secret-key-change-karna-production-mein"
    ALPHA_VANTAGE_API_KEY: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    model_config = {"env_file": ".env", "extra": "ignore"}

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
