"""Configuration settings for the application.

All values can be overridden via environment variables or a `.env` file.
For PostgreSQL, set DATABASE_URL to something like:
    postgresql://user:password@localhost:5432/aivoa
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment / .env file."""

    # ── AI / LLM ──
    groq_api_key: str = ""
    model_name: str = "gemma2-9b-it"

    # ── Database ──
    database_url: str = "sqlite:///./complaints.db"

    # ── CORS ──
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
