from typing import List
from dataclasses import dataclass

@dataclass
class IngredientEntry:
    canonical: str
    synonyms: List[str]
    category: str
    default_piece_weight: float  # grams per piece
    exceptions: List[str] = None

# Main South Asian + General list
INGREDIENT_DICTIONARY: List[IngredientEntry] = [
    IngredientEntry("onion",   ["onion", "onions", "pyaz"],              "Vegetables",       150),
    IngredientEntry("garlic",  ["garlic", "lahsun", "clove"],            "Vegetables",         5),
    IngredientEntry("tomato",  ["tomato", "tamatar", "tomatoes"],       "Vegetables",       100),
    IngredientEntry("rice",    ["rice", "basmati rice", "chawal"],      "Grains & Bakery",   10),
    IngredientEntry("lentil",  ["dal", "moong dal", "masoor dal"],      "Grains & Bakery",   10),
    IngredientEntry("chicken", ["chicken", "murgh"],                    "Meat & Seafood",   200),
    IngredientEntry("egg",     ["egg", "eggs", "anda"],                 "Meat & Seafood",    60),
    IngredientEntry("milk",    ["milk", "doodh"],                       "Dairy",            240),
    IngredientEntry("butter",  ["butter", "makhan"],                    "Dairy",             20),
    IngredientEntry("oil",     ["oil", "mustard oil", "olive oil"],     "Condiments & Spices", 15,
                    exceptions=["soy sauce", "fish sauce"]),
    IngredientEntry("yogurt",  ["yogurt", "dahi", "curd"],              "Dairy",            150),
    IngredientEntry("apple",   ["apple", "seb"],                        "Fruits",           120),
    IngredientEntry("banana",  ["banana", "kela"],                      "Fruits",           120),
    IngredientEntry("mango",   ["mango", "aam"],                        "Fruits",           150),
    IngredientEntry("salt",    ["salt", "namak", "sea salt"],           "Condiments & Spices", 5),
    IngredientEntry("pepper",  ["pepper", "black pepper", "kali mirch"],"Condiments & Spices", 5),
    IngredientEntry("flour",   ["flour", "atta", "maida"],              "Grains & Bakery",   20),
    IngredientEntry("ginger",  ["ginger", "adrak"],                     "Condiments & Spices", 10),
    IngredientEntry("turmeric",["turmeric", "haldi"],                   "Condiments & Spices", 5),
    IngredientEntry("coconut",["coconut", "nariyal"],                   "Other",            100),
]
