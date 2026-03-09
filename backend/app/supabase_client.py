"""
Supabase client — Optional direct SDK access for storage, auth, and realtime.
The primary database connection uses SQLAlchemy async engine (database.py).
This client provides additional Supabase-specific features.
"""
import os
from typing import Optional

# Supabase Python SDK (optional — install with: pip install supabase)
_supabase_client = None


def get_supabase_client():
    """
    Lazy-initialize the Supabase client using environment variables.
    Falls back gracefully if supabase SDK is not installed or credentials are missing.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")

    if not url or not key:
        print("⚠ SUPABASE_URL or SUPABASE_SERVICE_KEY not set. Supabase client disabled.")
        return None

    try:
        from supabase import create_client, Client
        _supabase_client: Client = create_client(url, key)
        print(f"✓ Supabase client initialized: {url[:40]}...")
        return _supabase_client
    except ImportError:
        print("⚠ supabase package not installed. Run: pip install supabase")
        return None
    except Exception as e:
        print(f"⚠ Supabase client error: {e}")
        return None


# ─── Direct helpers ─────────────────────

def supabase_storage_upload(bucket: str, path: str, file_data: bytes, content_type: str = "application/octet-stream"):
    """Upload a file to Supabase Storage."""
    client = get_supabase_client()
    if not client:
        raise RuntimeError("Supabase client not available")
    return client.storage.from_(bucket).upload(path, file_data, {"content-type": content_type})


def supabase_storage_url(bucket: str, path: str) -> str:
    """Get public URL for a file in Supabase Storage."""
    client = get_supabase_client()
    if not client:
        return ""
    return client.storage.from_(bucket).get_public_url(path)
