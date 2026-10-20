"""Main FastAPI application entry point."""
import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from config import settings
from database import init_db
from routes import complaints, copilot

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle — create DB tables on startup."""
    logger.info("Initialising database…")
    await init_db()
    logger.info("PharmaShield AI API ready.")
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="PharmaShield AI API",
    description="Autonomous Pharmacovigilance & Quality Complaint Intelligence System API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(complaints.router, prefix="/api/complaints", tags=["complaints"])
app.include_router(copilot.router, prefix="/api/copilot", tags=["copilot"])


@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "app": "PharmaShield AI", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True, loop="asyncio")
