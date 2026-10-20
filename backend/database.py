"""Database connection and session management.

Uses SQLAlchemy async engine. Defaults to SQLite for local development;
switch DATABASE_URL to a PostgreSQL connection string for production.

Example PostgreSQL URL:
    postgresql+asyncpg://user:password@localhost:5432/pharmashield

Example SQLite URL (default):
    sqlite+aiosqlite:///./complaints.db
"""
import sys
import asyncio
import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import settings

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

logger = logging.getLogger(__name__)


def _normalise_url(url: str) -> str:
    """Convert a plain DB URL to its async driver variant if needed."""
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


DATABASE_URL = _normalise_url(settings.database_url)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    # SQLite needs this for async
    **({"connect_args": {"check_same_thread": False}} if "sqlite" in DATABASE_URL else {}),
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


async def init_db() -> None:
    """Create all tables. Called once at application startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialised.")


async def get_db() -> AsyncSession:
    """FastAPI dependency — yields an async database session with automatic lifecycle management."""
    async with AsyncSessionLocal() as session:
        yield session

