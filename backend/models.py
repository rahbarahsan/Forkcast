from pydantic import BaseModel
from typing import List, Optional, Dict

class Recipe(BaseModel):
    id: Optional[str]
    title: str
    cuisine: Optional[str]
    image: Optional[str]
    ingredients: List[str]
    instructions: Optional[str]
    prep_time: Optional[str]
    cook_time: Optional[str]

class PantryItem(BaseModel):
    id: Optional[str]
    name: str
    quantity: Optional[str] = None

class GroceryRequest(BaseModel):
    is_guest: bool
    user_id: Optional[str] = None
    plan_ids: Optional[List[str]] = []
    selected_ids: Optional[List[str]] = []
    pantry_items: Optional[List[PantryItem]] = []

class GroceryResponse(BaseModel):
    categorized: Dict[str, List[str]]
    raw: List[str]