from typing import List, Dict, Set, Tuple
from backend.grocery_rules.unit_threshold_rules import estimate_weight
from backend.grocery_rules.synonym_resolver import get_canonical_name
from backend.grocery_rules.category_resolver import get_category
from backend.grocery_rules.plural_resolver import normalize_plural
import re

class SmartGroceryAggregator:
    def __init__(self, recipes, pantry_items):
        self.recipes = recipes
        self.pantry_items = pantry_items

    def generate(self):
        needed_ingredients, categorized_ingredients = smart_grocery_aggregation(
            self.recipes, self.pantry_items
        )
        
        # Convert needed_ingredients to raw list for the API response
        raw_ingredients = list(needed_ingredients.keys())
        
        return categorized_ingredients, raw_ingredients


def parse_ingredient_string(ingredient_string: str) -> Tuple[float, str, str]:
    """
    Parses an ingredient string to extract quantity, unit, and ingredient name.
    Assumes format like 'quantity unit ingredient_name' or 'quantity ingredient_name'.
    Returns quantity as float, unit as string, and ingredient name as string.
    Returns 0.0, "", original_string if parsing fails or only name is present.
    """
    parts = ingredient_string.strip().lower().split(maxsplit=2)
    quantity = 0.0
    unit = ""
    name = ingredient_string.strip().lower()

    if len(parts) > 0:
        try:
            quantity = float(parts[0])
            if len(parts) > 1:
                # Check if the second part looks like a unit (short and no digits)
                if len(parts[1]) <= 5 and not re.search(r'\d', parts[1]):
                    unit = parts[1]
                    if len(parts) > 2:
                        name = parts[2]
                    else:
                        # Quantity and unit, but no name part - assume the rest is the name
                        name = " ".join(parts[1:]) # Corrected: if no third part, the second part might be the start of the name
                else:
                    # Second part is not a unit, assume it's part of the name
                    name = " ".join(parts[1:])
            else:
                # Only quantity provided, the rest is the name
                name = " ".join(parts[1:]) if len(parts) > 1 else "" # Corrected: if only one part, name is empty
        except ValueError:
            # First part is not a number, assume no quantity or unit provided, the whole string is the name
            quantity = 0.0
            unit = ""
            name = ingredient_string.strip().lower()

    # If name is still empty after parsing, use the original string as the name
    if not name:
        name = ingredient_string.strip().lower()

    return quantity, unit, name

def normalize_ingredient_name(name_part: str) -> str:
    """
    Normalizes an ingredient name part (removes plural, resolves synonyms).
    Returns the canonical name if found, otherwise returns the normalized original name part.
    """
    normalized_name_part = normalize_plural(name_part.strip().lower())
    canonical_name = get_canonical_name(normalized_name_part)
    return canonical_name if canonical_name is not None else normalized_name_part

def smart_grocery_aggregation(
    recipes: List[Dict[str, str]],
    pantry: List[Dict[str, str]]
) -> Tuple[Dict[str, Dict[str, float]], Dict[str, List[str]]]:
    """
    Processes recipe ingredients and user pantry to produce:
    - needed_ingredients: aggregated ingredients with units and estimated quantity
    - categorized_ingredients: dictionary of ingredient -> category
    """

    needed_ingredients: Dict[str, Dict[str, float]] = {}  # {canonical: {unit: total_qty}}
    categorized_ingredients: Dict[str, List[str]] = {}  # {category: [ingredient, ...]}

    # Normalize pantry
    pantry_map = {}
    for item in pantry:
        # Handle both dictionary and PantryItem object
        if hasattr(item, 'quantity') and hasattr(item, 'name'):
            # It's a PantryItem object
            quantity_str = item.quantity or ""
            name_str = item.name
        else:
            # It's a dictionary
            quantity_str = item.get('quantity', "")
            name_str = item.get('name', "")
            
        # Parse the quantity string to get quantity and unit for pantry items
        pantry_qty, pantry_unit, pantry_name_part = parse_ingredient_string(quantity_str)
        # Normalize the name
        norm = normalize_ingredient_name(name_str)

        # Use the parsed quantity and unit from the 'quantity' field for pantry aggregation
        if norm not in pantry_map:
            pantry_map[norm] = {}
        pantry_map[norm][pantry_unit] = pantry_map[norm].get(pantry_unit, 0) + pantry_qty


    # Process each recipe
    for recipe in recipes:
        for ing_string in recipe['ingredients']:
            qty, unit, name = parse_ingredient_string(ing_string)
            norm = normalize_ingredient_name(name) # Normalize the extracted name part

            # Use the parsed quantity and unit with estimate_weight
            est_weight = estimate_weight(qty, unit)

            # Aggregate by normalized name and estimated weight (using a common unit like kg implicitly)
            # For simplicity, let's aggregate total estimated weight per ingredient
            if norm not in needed_ingredients:
                needed_ingredients[norm] = {"kg": 0.0} # Use kg as a common unit for aggregation
            needed_ingredients[norm]["kg"] += est_weight


    # Compare with pantry
    # This part needs adjustment based on the new aggregation by estimated weight
    # We need to compare estimated weight in pantry with estimated weight needed from recipes
    for ing, units in pantry_map.items():
        if ing in needed_ingredients:
            # Calculate total estimated weight for this ingredient in the pantry
            pantry_total_weight = sum(estimate_weight(qty, unit) for unit, qty in units.items())
            # Subtract pantry weight from needed weight
            needed_ingredients[ing]["kg"] -= pantry_total_weight
            # Remove the ingredient if the needed quantity is zero or less
            if needed_ingredients[ing]["kg"] <= 0:
                del needed_ingredients[ing]


    # Categorize ingredients
    # Iterate through the keys of needed_ingredients (which are normalized names)
    for ing in needed_ingredients.keys():
        cat = get_category(ing)
        # If get_category returns None (shouldn't happen with the updated get_category, but as a safeguard)
        if cat is None:
            cat = "Unknown" # Assign to Unknown category

        if cat not in categorized_ingredients:
            categorized_ingredients[cat] = []
        categorized_ingredients[cat].append(ing)

    return needed_ingredients, categorized_ingredients
