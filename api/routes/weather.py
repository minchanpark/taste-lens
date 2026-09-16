from typing import Optional
from fastapi import APIRouter, Query
from api.services.weather import fetch_weather

router = APIRouter(prefix="/api/weather", tags=["Weather"])

@router.get("")
async def get_weather(
    city: str = Query("seoul", description="City name (seoul, busan, etc.)"),
    latitude: Optional[float] = Query(None, description="Optional latitude"),
    longitude: Optional[float] = Query(None, description="Optional longitude")
):
    return await fetch_weather(city=city, latitude=latitude, longitude=longitude)
