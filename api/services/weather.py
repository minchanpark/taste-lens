from typing import Dict, Any, Optional
import httpx
from api.config import settings

CITIES: Dict[str, tuple[float, float]] = {
    "seoul": (37.5665, 126.9780),
    "busan": (35.1796, 129.0756),
    "daejeon": (36.3504, 127.3845),
    "jeju": (33.4996, 126.5312),
}

async def fetch_weather(city: str = "seoul", latitude: Optional[float] = None, longitude: Optional[float] = None) -> Dict[str, Any]:
    if not settings.OPEN_METEO_ENABLED:
        return {
            "weather": "unknown",
            "temperature": None,
            "city": city,
            "source": "disabled",
            "message": "날씨 보정이 비활성화되어 있어요.",
        }

    if latitude is not None and longitude is not None:
        lat, lon = latitude, longitude
    else:
        lat, lon = CITIES.get(city.lower(), CITIES["seoul"])

    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code&timezone=Asia%2FSeoul"
    )

    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise RuntimeError(f"Open-Meteo error: {resp.status_code}")

            data = resp.json()
            current = data.get("current", {})
            temp = current.get("temperature_2m")
            code = current.get("weather_code")

            if temp is None or code is None:
                raise ValueError("Incomplete weather data received")

            # Priority per PRD v4.3 Section 30:
            # Rain condition -> rain
            # temp >= 28 -> hot
            # temp <= 8 -> cold
            # otherwise -> normal
            is_rain = (code in range(51, 68)) or (code in range(80, 83)) or (code in range(95, 100)) or (code >= 51)
            if is_rain:
                weather_type = "rain"
            elif temp >= 28.0:
                weather_type = "hot"
            elif temp <= 8.0:
                weather_type = "cold"
            else:
                weather_type = "normal"

            return {
                "weather": weather_type,
                "temperature": temp,
                "weather_code": code,
                "city": city,
                "observed_at": current.get("time"),
                "source": "Open-Meteo",
            }
    except Exception as e:
        return {
            "weather": "unknown",
            "temperature": None,
            "city": city,
            "source": "unavailable",
            "message": "날씨를 가져오지 못해 날씨 보정을 제외했어요.",
            "error_detail": str(e),
        }
