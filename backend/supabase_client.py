from supabase import create_client
from dotenv import load_dotenv
import os
import pathlib

# Try to load .env from multiple possible locations
current_dir = pathlib.Path(__file__).parent.absolute()
parent_dir = current_dir.parent

# Try current directory first
load_dotenv(os.path.join(current_dir, '.env'))
# Then try parent directory
load_dotenv(os.path.join(parent_dir, '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # For local development, provide guidance on setting up .env
    print("\n" + "="*80)
    print("ERROR: Missing Supabase credentials")
    print("Please ensure your .env file exists and contains SUPABASE_URL and SUPABASE_KEY")
    print("The .env file should be in the backend directory or the project root")
    print("="*80 + "\n")
    raise ValueError("Missing Supabase credentials")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def client_for_token(access_token: str):
    """Return a Supabase client that acts as the user owning `access_token`.

    Queries made through this client carry the user's JWT, so Row Level Security
    evaluates auth.uid() and returns only that user's rows. This is what keeps
    per-user tables (pantry, plans) private: authorisation is enforced by the
    database rather than by filtering in application code.
    """
    user_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    user_client.postgrest.auth(access_token)
    return user_client


def user_id_from_token(access_token: str):
    """Verify `access_token` with Supabase and return its user id, or None.

    The signature is checked by Supabase; an expired, forged or malformed token
    yields None rather than raising.
    """
    try:
        response = supabase.auth.get_user(access_token)
    except Exception:
        return None

    user = getattr(response, "user", None)
    return getattr(user, "id", None) if user else None
