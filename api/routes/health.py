from fastapi import APIRouter
from api.config import settings

router = APIRouter(prefix="/api/health", tags=["Health"])

@router.get("")
async def health_check():
    """
    Health check endpoint per PRD v4.3 Section 96.1.
    Never exposes raw secrets, only configuration state.
    """
    return {
        "status": "ok",
        "service": "taste-lens-fastapi",
        "version": "4.3",
        "fastapi": "running",
        "supabase_configured": bool(settings.SUPABASE_URL),
        "upstage_configured": bool(settings.UPSTAGE_API_KEY),
        "open_meteo_enabled": settings.OPEN_METEO_ENABLED,
    }
