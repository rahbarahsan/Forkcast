from typing import List, Dict, Set, Tuple, Optional
import re
from unittest.mock import MagicMock
from difflib import SequenceMatcher

# Handle imports for both direct execution and module import
try:
    # Try relative imports (for when the file is imported as part of a package)
    from ..grocery_rules.unit_threshold_rules import estimate_weight
    from ..grocery_rules.synonym_resolver import get_canonical_name
    from ..grocery_rules.category_resolver import get_category
    from ..grocery_rules.plural_resolver import normalize_plural
    from ..supabase_client import supabase
except ImportError:
    # Fall back to absolute imports (for when the file is run directly)
    from grocery_rules.unit_threshold_rules import estimate_weight
    from grocery_rules.synonym_resolver import get_canonical_name
    from grocery_rules.category_resolver import get_category
    from grocery_rules.plural_resolver import normalize_plural
    from supabase_client import supabase

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
            
            # Get recipe IDs for fetching pre-processed ingredients
            recipe_ids = []
            for recipe in self.recipes:
                if isinstance(recipe, dict) and 'id' in recipe:
                    recipe_ids.append(recipe['id'])
                elif hasattr(recipe, 'id') and recipe.id:
                    recipe_ids.append(recipe.id)
            
            # Fetch pre-processed ingredients from grocery_items_per_recipe
            preprocessed_ingredients = {}
            if recipe_ids:
                try:
                    print(f"DEBUG: Fetching pre-processed ingredients for recipe IDs: {recipe_ids}")
                    # Use the correct filter syntax for the Supabase client
                    print(f"DEBUG: Recipe IDs for grocery_items_per_recipe query: {recipe_ids}")
                    
                    # First, check if the table exists
                    try:
                        table_check = supabase.table("grocery_items_per_recipe").select("*").limit(1).execute()
                        print(f"DEBUG: Table check result: {table_check.data}")
                    except Exception as e:
                        print(f"DEBUG: Error checking table: {str(e)}")
                    
                    # Now query for the recipe IDs using the correct filter syntax
                    try:
                        print(f"DEBUG: Querying for recipe IDs: {recipe_ids}")
                        response = supabase.table("grocery_items_per_recipe").select("*").in_("recipe_id", recipe_ids).execute()
                    except Exception as e:
                        print(f"DEBUG: Error with in_ filter: {str(e)}")
                        # Try an alternative approach with eq filters
                        print(f"DEBUG: Trying alternative approach with multiple queries")
                        all_items = []
                        for rid in recipe_ids:
                            try:
                                single_response = supabase.table("grocery_items_per_recipe").select("*").eq("recipe_id", rid).execute()
                                if single_response.data:
                                    all_items.extend(single_response.data)
                            except Exception as e2:
                                print(f"DEBUG: Error querying for recipe_id {rid}: {str(e2)}")
                        
                        # Create a mock response object with the combined data
                        response = MagicMock()
                        response.data = all_items
                    
                    print(f"DEBUG: Response data: {response.data}")
                    
                    if response.data:
                        # Group by recipe_id for efficient lookup
                        for item in response.data:
                            recipe_id = item.get('recipe_id')
                            if not recipe_id:
                                print(f"DEBUG: Skipping item with no recipe_id: {item}")
                                continue
                                
                            if recipe_id not in preprocessed_ingredients:
                                preprocessed_ingredients[recipe_id] = []
                            preprocessed_ingredients[recipe_id].append(item)
                        
                        # Log detailed information about what we found
                        for rid, items in preprocessed_ingredients.items():
                            print(f"DEBUG: Found {len(items)} pre-processed ingredients for recipe {rid}")
                            for item in items:
                                print(f"DEBUG:   - {item.get('name')} ({item.get('quantity')} {item.get('unit')}) [category: {item.get('category')}]")
                    else:
                        print(f"DEBUG: No pre-processed ingredients found for recipe IDs: {recipe_ids}")
                        print(f"DEBUG: Checking if any grocery_items_per_recipe entries exist")
                        try:
                            check_any = supabase.table("grocery_items_per_recipe").select("*").limit(5).execute()
                            print(f"DEBUG: Sample entries: {check_any.data}")
                        except Exception as e:
                            print(f"DEBUG: Error checking for any entries: {str(e)}")
                except Exception as e:
                    print(f"DEBUG: Error fetching from grocery_items_per_recipe: {str(e)}")
                    import traceback
                    print(f"DEBUG: Traceback: {traceback.format_exc()}")
                    # Continue with fallback if fetch fails
            
            needed_ingredients, categorized_ingredients = smart_grocery_aggregation(
                self.recipes, self.pantry_items, preprocessed_ingredients
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
    if not name_part:
        return ""
    normalized_name_part = normalize_plural(name_part.strip().lower())
    canonical_name = get_canonical_name(normalized_name_part)
    return canonical_name if canonical_name is not None else normalized_name_part

def string_similarity(a: str, b: str) -> float:
    """
    Calculate the similarity ratio between two strings.
    Returns a float between 0 and 1, where 1 means the strings are identical.
    """
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def smart_grocery_aggregation(
    recipes: List,
    pantry: List,
    preprocessed_ingredients: Optional[Dict[str, List[Dict]]] = None
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
        if hasattr(item, 'name'):
            # It's a PantryItem object
            name_str = item.name
        else:
            # It's a dictionary
            name_str = item.get('name', "")
            
        # Normalize the name for matching
        norm_name = normalize_ingredient_name(name_str)
        
        # Add to pantry map - we only care about the name for matching
        if norm_name and norm_name != "":  # Skip empty names
            if norm_name not in pantry_map:
                pantry_map[norm_name] = {"kg": 1.0}  # Use a default weight of 1kg
            print(f"DEBUG: Added pantry item: {norm_name}")


    # Process each recipe
    for recipe in recipes:
        try:
            # Get recipe ID for looking up pre-processed ingredients
            recipe_id = None
            if isinstance(recipe, dict) and 'id' in recipe:
                recipe_id = recipe['id']
            elif hasattr(recipe, 'id'):
                recipe_id = recipe.id
            
            # Check if we have pre-processed ingredients for this recipe
            if preprocessed_ingredients and recipe_id and recipe_id in preprocessed_ingredients:
                print(f"DEBUG: Using pre-processed ingredients for recipe {recipe_id} - found {len(preprocessed_ingredients[recipe_id])} items")
                
                # Process pre-processed ingredients
                for item in preprocessed_ingredients[recipe_id]:
                    try:
                        # Extract data from pre-processed ingredient
                        name = item.get('name', '')
                        if not name:
                            continue
                            
                        # Get quantity and unit for weight estimation
                        qty_str = item.get('quantity', '0')
                        unit = item.get('unit', '')
                        
                        # Convert quantity to float
                        try:
                            qty = float(qty_str) if qty_str else 0.0
                        except ValueError:
                            qty = 0.0
                        
                        # Use the parsed quantity and unit with estimate_weight
                        est_weight = estimate_weight(qty, unit)
                        
                        # Aggregate by name and estimated weight
                        if name not in needed_ingredients:
                            needed_ingredients[name] = {"kg": 0.0}
                        needed_ingredients[name]["kg"] += est_weight
                        
                        # Store category information for later use
                        category = item.get('category', '')
                        if category and category not in categorized_ingredients:
                            categorized_ingredients[category] = []
                        if category and name not in categorized_ingredients.get(category, []):
                            categorized_ingredients[category].append(name)
                            
                        print(f"DEBUG: Processed pre-processed ingredient: {name} ({est_weight} kg)")
                    except Exception as e:
                        print(f"DEBUG: Error processing pre-processed ingredient: {str(e)}")
                        continue
            else:
                # Fall back to parsing raw ingredients
                print(f"DEBUG: No pre-processed ingredients found for recipe {recipe_id}, using fallback")
                
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
        
        # Create a mapping of plural forms to ingredient names for better matching
        plural_to_ingredient = {}
        
        # First, collect all plural forms from pre-processed ingredients
        if preprocessed_ingredients:
            for recipe_items in preprocessed_ingredients.values():
                for item in recipe_items:
                    name = item.get('name', '')
                    plural = item.get('plural', '')
                    if name and plural and plural != name:
                        plural_to_ingredient[plural.lower()] = name
        
        # Try to match pantry items with needed ingredients using different normalization methods
        for ing, units in pantry_map.items():
            try:
                # Check for direct match (case-insensitive)
                matched = False
                for needed_ing in list(needed_ingredients.keys()):
                    # Case 1: Direct match (case-insensitive)
                    if ing.lower() == needed_ing.lower():
                        print(f"DEBUG: Found exact matching ingredient in pantry: {ing} -> {needed_ing}")
                        pantry_total_weight = sum(estimate_weight(qty, unit) for unit, qty in units.items())
                        print(f"DEBUG: Pantry total weight for {ing}: {pantry_total_weight} kg")
                        print(f"DEBUG: Before deduction: needed_ingredients[{needed_ing}]['kg'] = {needed_ingredients[needed_ing]['kg']}")
                        needed_ingredients[needed_ing]["kg"] -= pantry_total_weight
                        print(f"DEBUG: After deduction: needed_ingredients[{needed_ing}]['kg'] = {needed_ingredients[needed_ing]['kg']}")
                        if needed_ingredients[needed_ing]["kg"] <= 0:
                            print(f"DEBUG: Removing {needed_ing} from needed_ingredients as it's fully covered by pantry")
                            del needed_ingredients[needed_ing]
                        matched = True
                        break
                
                if matched:
                    continue
                
                # Case 2: Check if this is a plural form in our mapping
                for needed_ing in list(needed_ingredients.keys()):
                    if ing in plural_to_ingredient and plural_to_ingredient[ing].lower() == needed_ing.lower():
                        print(f"DEBUG: Found match using plural mapping: {ing} -> {needed_ing}")
                        pantry_total_weight = sum(estimate_weight(qty, unit) for unit, qty in units.items())
                        print(f"DEBUG: Pantry total weight for {ing} (matched as {needed_ing}): {pantry_total_weight} kg")
                        print(f"DEBUG: Before deduction: needed_ingredients[{needed_ing}]['kg'] = {needed_ingredients[needed_ing]['kg']}")
                        needed_ingredients[needed_ing]["kg"] -= pantry_total_weight
                        print(f"DEBUG: After deduction: needed_ingredients[{needed_ing}]['kg'] = {needed_ingredients[needed_ing]['kg']}")
                        if needed_ingredients[needed_ing]["kg"] <= 0:
                            print(f"DEBUG: Removing {needed_ing} from needed_ingredients as it's fully covered by pantry")
                            del needed_ingredients[needed_ing]
                        matched = True
                        break
                
                if matched:
                    continue
                
                # Case 3: Try to find a match using basic plural normalization
                for needed_ing in list(needed_ingredients.keys()):
                    # Try removing 's' at the end
                    if ing.lower().endswith('s') and ing.lower()[:-1] == needed_ing.lower():
                        print(f"DEBUG: Found match by removing 's': {ing} -> {needed_ing}")
                        pantry_total_weight = sum(estimate_weight(qty, unit) for unit, qty in units.items())
                        print(f"DEBUG: Pantry total weight for {ing} (matched as {needed_ing}): {pantry_total_weight} kg")
                        print(f"DEBUG: Before deduction: needed_ingredients[{needed_ing}]['kg'] = {needed_ingredients[needed_ing]['kg']}")
                        needed_ingredients[needed_ing]["kg"] -= pantry_total_weight
                        print(f"DEBUG: After deduction: needed_ingredients[{needed_ing}]['kg'] = {needed_ingredients[needed_ing]['kg']}")
                        if needed_ingredients[needed_ing]["kg"] <= 0:
                            print(f"DEBUG: Removing {needed_ing} from needed_ingredients as it's fully covered by pantry")
                            del needed_ingredients[needed_ing]
                        matched = True
                        break
                    
                    # Try adding 's' at the end
                    if ing.lower() + 's' == needed_ing.lower():
                        print(f"DEBUG: Found match by adding 's': {ing} -> {needed_ing}")
                        pantry_total_weight = sum(estimate_weight(qty, unit) for unit, qty in units.items())
                        print(f"DEBUG: Pantry total weight for {ing} (matched as {needed_ing}): {pantry_total_weight} kg")
                        print(f"DEBUG: Before deduction: needed_ingredients[{needed_ing}]['kg'] = {needed_ingredients[needed_ing]['kg']}")
                        needed_ingredients[needed_ing]["kg"] -= pantry_total_weight
                        print(f"DEBUG: After deduction: needed_ingredients[{needed_ing}]['kg'] = {needed_ingredients[needed_ing]['kg']}")
                        if needed_ingredients[needed_ing]["kg"] <= 0:
                            print(f"DEBUG: Removing {needed_ing} from needed_ingredients as it's fully covered by pantry")
                            del needed_ingredients[needed_ing]
                        matched = True
                        break
                
                if matched:
                    continue
                
                # Case 4: Try more complex plural forms using normalize_plural
                singular_form = normalize_plural(ing)
                for needed_ing in list(needed_ingredients.keys()):
                    if singular_form.lower() != ing.lower() and singular_form.lower() == needed_ing.lower():
                        print(f"DEBUG: Found match using normalize_plural: {ing} -> {needed_ing}")
                        pantry_total_weight = sum(estimate_weight(qty, unit) for unit, qty in units.items())
                        print(f"DEBUG: Pantry total weight for {ing} (matched as {needed_ing}): {pantry_total_weight} kg")
                        print(f"DEBUG: Before deduction: needed_ingredients[{needed_ing}]['kg'] = {needed_ingredients[needed_ing]['kg']}")
                        needed_ingredients[needed_ing]["kg"] -= pantry_total_weight
                        print(f"DEBUG: After deduction: needed_ingredients[{needed_ing}]['kg'] = {needed_ingredients[needed_ing]['kg']}")
                        if needed_ingredients[needed_ing]["kg"] <= 0:
                            print(f"DEBUG: Removing {needed_ing} from needed_ingredients as it's fully covered by pantry")
                            del needed_ingredients[needed_ing]
                        matched = True
                        break
                
                if matched:
                    continue
                
                # Case 5: Try fuzzy matching with 90% similarity threshold
                best_match = None
                best_score = 0.0
                for needed_ing in needed_ingredients.keys():
                    score = string_similarity(ing, needed_ing)
                    if score >= 0.9 and score > best_score:  # 90% similarity threshold
                        best_match = needed_ing
                        best_score = score
                
                if best_match:
                    print(f"DEBUG: Found fuzzy match: {ing} -> {best_match} (similarity: {best_score:.2f})")
                    pantry_total_weight = sum(estimate_weight(qty, unit) for unit, qty in units.items())
                    print(f"DEBUG: Pantry total weight for {ing} (matched as {best_match}): {pantry_total_weight} kg")
                    print(f"DEBUG: Before deduction: needed_ingredients[{best_match}]['kg'] = {needed_ingredients[best_match]['kg']}")
                    needed_ingredients[best_match]["kg"] -= pantry_total_weight
                    print(f"DEBUG: After deduction: needed_ingredients[{best_match}]['kg'] = {needed_ingredients[best_match]['kg']}")
                    if needed_ingredients[best_match]["kg"] <= 0:
                        print(f"DEBUG: Removing {best_match} from needed_ingredients as it's fully covered by pantry")
                        del needed_ingredients[best_match]
                    continue
                
                print(f"DEBUG: No match found for pantry item {ing} using any normalization method")
            except Exception as e:
                print(f"DEBUG: Error processing pantry item {ing}: {str(e)}")
                continue
    
    print(f"DEBUG: Needed ingredients after pantry deduction: {needed_ingredients}")


    # First, remove any ingredients from categorized_ingredients that were fully deducted
    # This ensures they don't appear in the final grocery list
    for cat in list(categorized_ingredients.keys()):
        categorized_ingredients[cat] = [ing for ing in categorized_ingredients[cat] if ing in needed_ingredients]
        # Remove empty categories
        if not categorized_ingredients[cat]:
            del categorized_ingredients[cat]
    
    # Then categorize ingredients that don't already have a category
    # Iterate through the keys of needed_ingredients (which are normalized names)
    for ing in needed_ingredients.keys():
        # Skip ingredients that already have a category assigned
        already_categorized = False
        for cat, ingredients in categorized_ingredients.items():
            if ing in ingredients:
                already_categorized = True
                break
        
        if not already_categorized:
            cat = get_category(ing)
            # If get_category returns None (shouldn't happen with the updated get_category, but as a safeguard)
            if cat is None:
                cat = "Unknown" # Assign to Unknown category

            if cat not in categorized_ingredients:
                categorized_ingredients[cat] = []
            categorized_ingredients[cat].append(ing)

    return needed_ingredients, categorized_ingredients
