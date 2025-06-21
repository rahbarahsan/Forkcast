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

class GroceryItemPerRecipe(BaseModel):
    id: Optional[str]
    recipe_id: str
    raw_text: str
    quantity: Optional[str] = None
    unit: Optional[str] = None
    name: str
    modifiers: Optional[str] = None
    category: Optional[str] = None
    plural: Optional[str] = None
    needs_attention: Optional[bool] = None
    synonym_of: Optional[str] = None

class GroceryRequest(BaseModel):
    is_guest: bool
    user_id: Optional[str] = None
    plan_ids: Optional[List[str]] = []
    selected_ids: Optional[List[str]] = []
    recipe_ids: Optional[List[str]] = []  # Add recipe_ids field
    pantry_items: Optional[List[PantryItem]] = []

class GroceryResponse(BaseModel):
    categorized: Dict[str, List[str]]
    raw: Dict[str, Dict[str, float]]
