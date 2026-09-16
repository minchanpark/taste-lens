from typing import Optional
from supabase import create_client, Client
from api.config import settings

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL:
        return None

    # Use secret key if available, otherwise fallback to empty/none
    key = settings.SUPABASE_SECRET_KEY or ""
    if not key:
        return None

    try:
        _supabase_client = create_client(settings.SUPABASE_URL, key)
        return _supabase_client
    except Exception:
        return None
