from typing import Optional
from backend.supabase_client import supabase
from functools import lru_cache

@lru_cache
def fetch_lookup_data():
    response = supabase.table("ingredient_lookup").select("*").execute()
    return response.data

def get_canonical_name(ingredient: str) -> Optional[str]:
    lookup = fetch_lookup_data()
    normalized = ingredient.strip().lower()

    for item in lookup:
        synonyms = [s.strip().lower() for s in item.get("synonyms", "").split(",")]
        if normalized in synonyms:
            return item["canonical"]
    return None
