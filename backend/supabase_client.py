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
