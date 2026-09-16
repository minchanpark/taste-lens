import os
from typing import List
from dotenv import load_dotenv

load_dotenv()
load_dotenv(".env.local")

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", os.getenv("NEXT_PUBLIC_SUPABASE_URL", ""))
    SUPABASE_SECRET_KEY: str = os.getenv("SUPABASE_SECRET_KEY", "")
    SUPABASE_ASSET_BUCKET: str = os.getenv("SUPABASE_ASSET_BUCKET", "taste-lens-assets")

    UPSTAGE_API_KEY: str = os.getenv("UPSTAGE_API_KEY", "")
    UPSTAGE_API_BASE_URL: str = os.getenv("UPSTAGE_API_BASE_URL", "https://api.upstage.ai/v1")
    UPSTAGE_MODEL: str = os.getenv("UPSTAGE_MODEL", "solar-pro4")

    OPEN_METEO_ENABLED: bool = os.getenv("OPEN_METEO_ENABLED", "true").lower() in ("true", "1", "yes")

    raw_cors = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    CORS_ORIGINS: List[str] = [origin.strip() for origin in raw_cors.split(",") if origin.strip()]

settings = Settings()
