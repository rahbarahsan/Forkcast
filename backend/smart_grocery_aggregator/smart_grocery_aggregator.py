from typing import List, Dict, Set, Tuple
import re

# Handle imports for both direct execution and module import
try:
    # Try relative imports (for when the file is imported as part of a package)
    from ..grocery_rules.unit_threshold_rules import estimate_weight
    from ..grocery_rules.synonym_resolver import get_canonical_name
    from ..grocery_rules.category_resolver import get_category
    from ..grocery_rules.plural_resolver import normalize_plural
except ImportError:
    # Fall back to absolute imports (for when the file is run directly)
    from grocery_rules.unit_threshold_rules import estimate_weight
    from grocery_rules.synonym_resolver import get_canonical_name
    from grocery_rules.category_resolver import get_category
    from grocery_rules.plural_resolver import normalize_plural

class SmartGroceryAggregator:
    def __init__(self, recipes, pantry_items):
        self.recipes = recipes
        self.pantry_items = pantry_items

    def generate(self):
        try:
            print(f"DEBUG: SmartGroceryAggregator.generate() - recipes: {self.recipes}")
            print(f"DEBUG: SmartGroceryAggregator.generate() - pantry_items: {self.pantry_items}")
            
            # Validate recipes
            for recipe in self.recipes:
                if not hasattr(recipe, 'ingredients') and not isinstance(recipe, dict):
                    print(f"DEBUG: Recipe missing ingredients attribute: {recipe}")
                    raise ValueError(f"Recipe missing ingredients attribute: {recipe}")
                
                # Check if recipe is a dictionary or an object
                if isinstance(recipe, dict):
                    if 'ingredients' not in recipe:
                        print(f"DEBUG: Recipe dictionary missing ingredients key: {recipe}")
                        raise ValueError(f"Recipe dictionary missing ingredients key: {recipe}")
                    if not isinstance(recipe['ingredients'], list):
                        print(f"DEBUG: Recipe ingredients is not a list: {recipe['ingredients']}")
                        raise ValueError(f"Recipe ingredients is not a list: {recipe['ingredients']}")
                else:
                    if not hasattr(recipe, 'ingredients'):
                        print(f"DEBUG: Recipe object missing ingredients attribute: {recipe}")
                        raise ValueError(f"Recipe object missing ingredients attribute: {recipe}")
                    if not isinstance(recipe.ingredients, list):
                        print(f"DEBUG: Recipe ingredients is not a list: {recipe.ingredients}")
                        raise ValueError(f"Recipe ingredients is not a list: {recipe.ingredients}")
            
            needed_ingredients, categorized_ingredients = smart_grocery_aggregation(
                self.recipes, self.pantry_items
            )
            
            # Convert needed_ingredients to raw list for the API response
            raw_ingredients = needed_ingredients
            
            return categorized_ingredients, raw_ingredients
        except Exception as e:
            print(f"DEBUG: Error in SmartGroceryAggregator.generate(): {str(e)}")
            import traceback
            print(f"DEBUG: Traceback: {traceback.format_exc()}")
            raise


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
    recipes: List,
    pantry: List
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
        
        # Normalize both the name field and the name extracted from quantity
        norm_from_name_field = normalize_ingredient_name(name_str)
        norm_from_qty_field = normalize_ingredient_name(pantry_name_part)
        
        # Use both normalized names to increase chances of matching
        norm_keys = set([norm_from_name_field, norm_from_qty_field])
        
        # Add to pantry map with both possible normalized names
        for norm in norm_keys:
            if norm and norm != "":  # Skip empty names
                if norm not in pantry_map:
                    pantry_map[norm] = {}
                pantry_map[norm][pantry_unit] = pantry_map[norm].get(pantry_unit, 0) + pantry_qty
                print(f"DEBUG: Added pantry item: {norm} ({pantry_qty} {pantry_unit})")
                
        print(f"DEBUG: Pantry item processing - name_str: {name_str}, quantity_str: {quantity_str}")
        print(f"DEBUG: Pantry item processing - parsed: qty={pantry_qty}, unit={pantry_unit}, name_part={pantry_name_part}")
        print(f"DEBUG: Pantry item processing - normalized: from_name={norm_from_name_field}, from_qty={norm_from_qty_field}")


    # Process each recipe
    for recipe in recipes:
        try:
            # Handle different ways ingredients might be accessed
            ingredients = []
            if isinstance(recipe, dict) and 'ingredients' in recipe:
                ingredients = recipe['ingredients']
            elif hasattr(recipe, 'ingredients'):
                ingredients = recipe.ingredients
            else:
                print(f"DEBUG: Cannot find ingredients in recipe: {recipe}")
                continue
                
            for ing_string in ingredients:
                try:
                    qty, unit, name = parse_ingredient_string(ing_string)
                    norm = normalize_ingredient_name(name) # Normalize the extracted name part

                    # Use the parsed quantity and unit with estimate_weight
                    est_weight = estimate_weight(qty, unit)

                    # Aggregate by normalized name and estimated weight (using a common unit like kg implicitly)
                    # For simplicity, let's aggregate total estimated weight per ingredient
                    if norm not in needed_ingredients:
                        needed_ingredients[norm] = {"kg": 0.0} # Use kg as a common unit for aggregation
                    needed_ingredients[norm]["kg"] += est_weight
                    
                    print(f"DEBUG: Processed ingredient: {ing_string} -> {norm} ({est_weight} kg)")
                except Exception as e:
                    print(f"DEBUG: Error processing ingredient {ing_string}: {str(e)}")
                    continue
        except Exception as e:
            print(f"DEBUG: Error processing recipe {recipe}: {str(e)}")
            continue


    # Compare with pantry
    # This part needs adjustment based on the new aggregation by estimated weight
    # We need to compare estimated weight in pantry with estimated weight needed from recipes
    print(f"DEBUG: Pantry map: {pantry_map}")
    print(f"DEBUG: Needed ingredients before pantry deduction: {needed_ingredients}")
    
    # Check if pantry is empty
    if not pantry_map:
        print(f"DEBUG: Pantry is empty, skipping pantry deduction")
    else:
        print(f"DEBUG: Pantry has {len(pantry_map)} items, performing pantry deduction")
        print(f"DEBUG: Pantry map keys: {list(pantry_map.keys())}")
        print(f"DEBUG: Needed ingredients keys: {list(needed_ingredients.keys())}")
        
        # Try to match pantry items with needed ingredients using different normalization methods
        for ing, units in pantry_map.items():
            try:
                if ing in needed_ingredients:
                    print(f"DEBUG: Found exact matching ingredient in pantry: {ing}")
                    # Calculate total estimated weight for this ingredient in the pantry
                    pantry_total_weight = sum(estimate_weight(qty, unit) for unit, qty in units.items())
                    print(f"DEBUG: Pantry total weight for {ing}: {pantry_total_weight} kg")
                    print(f"DEBUG: Before deduction: needed_ingredients[{ing}]['kg'] = {needed_ingredients[ing]['kg']}")
                    # Subtract pantry weight from needed weight
                    needed_ingredients[ing]["kg"] -= pantry_total_weight
                    print(f"DEBUG: After deduction: needed_ingredients[{ing}]['kg'] = {needed_ingredients[ing]['kg']}")
                    # Remove the ingredient if the needed quantity is zero or less
                    if needed_ingredients[ing]["kg"] <= 0:
                        print(f"DEBUG: Removing {ing} from needed_ingredients as it's fully covered by pantry")
                        del needed_ingredients[ing]
                else:
                    # Try to find a match using different normalization methods
                    print(f"DEBUG: No exact match found for pantry item {ing} in needed_ingredients")
                    print(f"DEBUG: Available needed ingredients: {list(needed_ingredients.keys())}")
                    
                    # Try to find a match by removing 's' at the end
                    if ing.endswith('s') and ing[:-1] in needed_ingredients:
                        matched_ing = ing[:-1]
                        print(f"DEBUG: Found match by removing 's': {matched_ing}")
                        pantry_total_weight = sum(estimate_weight(qty, unit) for unit, qty in units.items())
                        print(f"DEBUG: Pantry total weight for {ing} (matched as {matched_ing}): {pantry_total_weight} kg")
                        print(f"DEBUG: Before deduction: needed_ingredients[{matched_ing}]['kg'] = {needed_ingredients[matched_ing]['kg']}")
                        needed_ingredients[matched_ing]["kg"] -= pantry_total_weight
                        print(f"DEBUG: After deduction: needed_ingredients[{matched_ing}]['kg'] = {needed_ingredients[matched_ing]['kg']}")
                        if needed_ingredients[matched_ing]["kg"] <= 0:
                            print(f"DEBUG: Removing {matched_ing} from needed_ingredients as it's fully covered by pantry")
                            del needed_ingredients[matched_ing]
                    # Try to find a match by adding 's' at the end
                    elif ing + 's' in needed_ingredients:
                        matched_ing = ing + 's'
                        print(f"DEBUG: Found match by adding 's': {matched_ing}")
                        pantry_total_weight = sum(estimate_weight(qty, unit) for unit, qty in units.items())
                        print(f"DEBUG: Pantry total weight for {ing} (matched as {matched_ing}): {pantry_total_weight} kg")
                        print(f"DEBUG: Before deduction: needed_ingredients[{matched_ing}]['kg'] = {needed_ingredients[matched_ing]['kg']}")
                        needed_ingredients[matched_ing]["kg"] -= pantry_total_weight
                        print(f"DEBUG: After deduction: needed_ingredients[{matched_ing}]['kg'] = {needed_ingredients[matched_ing]['kg']}")
                        if needed_ingredients[matched_ing]["kg"] <= 0:
                            print(f"DEBUG: Removing {matched_ing} from needed_ingredients as it's fully covered by pantry")
                            del needed_ingredients[matched_ing]
                    else:
                        print(f"DEBUG: No match found for pantry item {ing} using any normalization method")
            except Exception as e:
                print(f"DEBUG: Error processing pantry item {ing}: {str(e)}")
                continue
    
    print(f"DEBUG: Needed ingredients after pantry deduction: {needed_ingredients}")


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
