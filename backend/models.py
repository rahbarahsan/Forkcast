from pydantic import BaseModel
from typing import List, Optional

class Recipe(BaseModel):
    id: Optional[str]
    title: str
    cuisine: Optional[str]
    image: Optional[str]
    ingredients: List[str]
    instructions: Optional[str]
    prep_time: Optional[str]
    cook_time: Optional[str]
