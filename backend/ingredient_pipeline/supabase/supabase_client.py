import os
from dotenv import load_dotenv

# Set env file path
env_path = os.path.join(os.path.dirname(__file__), "..", "config", ".env")

# Check if .env exists
if not os.path.exists(env_path):
    raise FileNotFoundError(f".env file not found at expected path: {env_path}")

# Then load
load_dotenv(dotenv_path=env_path)

from supabase import create_client, Client

# Read variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials are missing inside .env file!")

# Initialize client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_client() -> Client:
    return supabase
