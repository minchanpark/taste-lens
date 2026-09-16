from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import settings
from api.routes import health, weather, taste, catalog

app = FastAPI(
    title="Taste Lens API",
    description="FastAPI Backend for Taste Lens Food Discovery Layer (PRD v4.3)",
    version="4.3.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(weather.router)
app.include_router(taste.router)
app.include_router(catalog.router)

@app.get("/api")
async def root():
    return {
        "message": "Taste Lens API v4.3",
        "health": "/api/health",
        "docs": "/api/docs"
    }
