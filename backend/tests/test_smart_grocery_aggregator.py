import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from smart_grocery_aggregator.smart_grocery_aggregator import smart_grocery_aggregation, SmartGroceryAggregator

def test_simple_exclusion_from_pantry():
    recipes = [
        {"id": "1", "ingredients": ["2 pcs onion", "1 kg rice", "500 g chicken"]}
    ]
    pantry = [
        {"name": "onion", "quantity": "2 pcs"},
        {"name": "rice", "quantity": "1 kg"},
    ]
    needed_ingredients, categorized_ingredients = smart_grocery_aggregation(recipes, pantry)

    ingredients = list(needed_ingredients.keys())
    assert "onion" not in ingredients
    assert "rice" not in ingredients
    assert "chicken" in ingredients

def test_plural_handling():
    """"3 eggs" and "1 egg" are the same ingredient and must aggregate into one."""
    recipes = [
        {"id": "1", "ingredients": ["3 eggs", "1 egg"]}
    ]
    needed_ingredients, categorized_ingredients = smart_grocery_aggregation(recipes, [])

    names = list(needed_ingredients.keys())
    assert "egg" in names
    assert len(needed_ingredients) == 1


def test_pantry_match_removes_ingredient_entirely():
    """Owning an ingredient drops it from the list; the amount is not subtracted.

    This is deliberate. Pantry quantities and recipe quantities are rarely in
    comparable units -- 2kg of flour in the cupboard against 2 tablespoons in a
    recipe -- so subtracting one from the other produces confident nonsense.
    Treating "it is in the pantry" as "I do not need to buy it" is coarser but
    is right far more often than a bad unit conversion would be.
    """
    recipes = [
        {"id": "1", "ingredients": ["3 eggs", "1 egg"]}
    ]
    pantry = [{"name": "egg", "quantity": "2"}]
    needed_ingredients, _ = smart_grocery_aggregation(recipes, pantry)

    assert "egg" not in needed_ingredients

    def test_synonym_resolution():
        recipes = [
            {"id": "1", "ingredients": ["pyaz", "2 tbsp oil"]} # Simplified ingredient string
        ]
        pantry = [{"name": "onion", "quantity": "1"}]
        needed_ingredients, categorized_ingredients = smart_grocery_aggregation(recipes, pantry)

        assert "onion" in needed_ingredients

def test_category_resolution():
    recipes = [
        {"id": "1", "ingredients": ["1 tbsp ghee", "1 tbsp lal mirch powder"]}
    ]
    pantry = []
    needed_ingredients, categorized_ingredients = smart_grocery_aggregation(recipes, pantry)

    assert "ghee" in needed_ingredients
    assert "chili powder" in needed_ingredients
    assert categorized_ingredients["Dairy"] == ["ghee"]
    assert categorized_ingredients["Condiments & Spices"] == ["chili powder"]

def test_uncategorized():
    recipes = [
        {"id": "1", "ingredients": ["1 jar mystery mix"]}
    ]
    pantry = []
    needed_ingredients, categorized_ingredients = smart_grocery_aggregation(recipes, pantry)

    assert "mystery mix" in needed_ingredients
    assert categorized_ingredients["Unknown"] == ["mystery mix"]

def test_vegetable_oil_deduction():
    """Test that vegetable oil in pantry is correctly deducted from grocery list."""
    recipes = [
        {"id": "1", "ingredients": ["1 tbsp vegetable oil", "2 tbsp vegetable oil"]}
    ]
    pantry = [
        {"name": "vegetable oil", "quantity": "1 litre"}
    ]
    needed_ingredients, categorized_ingredients = smart_grocery_aggregation(recipes, pantry)

    # Vegetable oil should be completely deducted from the grocery list
    assert "vegetable oil" not in needed_ingredients
    
    # Check that the vegetable oil is not in any category
    for category, ingredients in categorized_ingredients.items():
        assert "vegetable oil" not in ingredients

def test_vegetable_oil_deduction_with_quantity_name():
    """Test that vegetable oil in pantry is correctly deducted when the name is in the quantity field."""
    recipes = [
        {"id": "1", "ingredients": ["1 tbsp vegetable oil", "2 tbsp vegetable oil"]}
    ]
    pantry = [
        {"name": "oil", "quantity": "1 litre vegetable"}
    ]
    needed_ingredients, categorized_ingredients = smart_grocery_aggregation(recipes, pantry)

    # Vegetable oil should be completely deducted from the grocery list
    assert "vegetable oil" not in needed_ingredients
    
    # Check that the vegetable oil is not in any category
    for category, ingredients in categorized_ingredients.items():
        assert "vegetable oil" not in ingredients

def test_unit_conversion_and_merging():
    """Test that ingredients with different units are properly converted and merged."""
    recipes = [
        {"id": "1", "ingredients": ["1 tbsp oil", "2 tbsp oil", "1 cup oil"]}
    ]
    pantry = []
    needed_ingredients, categorized_ingredients = smart_grocery_aggregation(recipes, pantry)

    # All oil entries should be merged into a single entry
    assert "oil" in needed_ingredients
    
    # The oil should be in the Condiments & Spices category
    assert "oil" in categorized_ingredients.get("Condiments & Spices", [])

@patch('smart_grocery_aggregator.smart_grocery_aggregator.supabase')
def test_preprocessed_ingredients(mock_supabase):
    """Test that pre-processed ingredients are used when available."""
    # Configure the mock to return different responses based on the method chain
    def side_effect(*args, **kwargs):
        mock = MagicMock()
        if args and args[0] == "grocery_items_per_recipe":
            # For table check
            if 'limit' in str(kwargs):
                mock_response = MagicMock()
                mock_response.data = [{"count": 2}]
                return mock_response
            # For recipe ingredients
            else:
                mock_response = MagicMock()
                mock_response.data = [
                    {
                        "recipe_id": "1",
                        "raw_text": "2 cloves garlic, minced",
                        "quantity": "2",
                        "unit": "cloves",
                        "name": "garlic",
                        "modifiers": "minced",
                        "category": "Vegetables",
                        "plural": "garlics"
                    },
                    {
                        "recipe_id": "1",
                        "raw_text": "1 tbsp olive oil",
                        "quantity": "1",
                        "unit": "tbsp",
                        "name": "olive oil",
                        "modifiers": "",
                        "category": "Condiments & Spices",
                        "plural": ""
                    }
                ]
                return mock_response
        return MagicMock()
    
    # Set up the mock to use the side effect
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.side_effect = side_effect
    mock_supabase.table.return_value.select.return_value.in_.return_value.execute.side_effect = side_effect
    
    # Create test data
    recipes = [
        {"id": "1", "ingredients": ["2 cloves garlic, minced", "1 tbsp olive oil"]}
    ]
    pantry = []
    
    # Create the aggregator
    aggregator = SmartGroceryAggregator(recipes, pantry)
    categorized, raw = aggregator.generate()
    
    # Verify that the pre-processed ingredients were used
    assert "garlic" in raw
    # ingredient_lookup lists "olive oil" as a synonym of the canonical "oil",
    # so aggregation is expected to collapse it -- that is the whole point of
    # the synonym resolver.
    assert "oil" in raw
    assert "Vegetables" in categorized
    assert "garlic" in categorized["Vegetables"]
    assert "Condiments & Spices" in categorized
    assert "oil" in categorized["Condiments & Spices"]
    
    # Verify that Supabase was called with the correct parameters
    mock_supabase.table.assert_called_with("grocery_items_per_recipe")
    mock_supabase.table.return_value.select.assert_called_with("*")
    # The aggregator batches the lookup with .in_("recipe_id", [...])
    mock_supabase.table.return_value.select.return_value.in_.assert_called()

@patch('smart_grocery_aggregator.smart_grocery_aggregator.supabase')
def test_fallback_to_original_implementation(mock_supabase):
    """Test that the original implementation is used when pre-processed ingredients are not available."""
    # Configure the mock to return different responses based on the method chain
    def side_effect(*args, **kwargs):
        mock = MagicMock()
        if args and args[0] == "grocery_items_per_recipe":
            # For table check
            if 'limit' in str(kwargs):
                mock_response = MagicMock()
                mock_response.data = [{"count": 0}]
                return mock_response
            # For recipe ingredients
            else:
                mock_response = MagicMock()
                mock_response.data = []
                return mock_response
        return MagicMock()
    
    # Set up the mock to use the side effect
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.side_effect = side_effect
    mock_supabase.table.return_value.select.return_value.in_.return_value.execute.side_effect = side_effect
    
    # Create test data
    recipes = [
        {"id": "1", "ingredients": ["2 cloves garlic, minced", "1 tbsp olive oil"]}
    ]
    pantry = []
    
    # Create the aggregator
    aggregator = SmartGroceryAggregator(recipes, pantry)
    categorized, raw = aggregator.generate()
    
    # Verify that the original implementation was used
    assert "garlic" in raw
    # ingredient_lookup lists "olive oil" as a synonym of the canonical "oil",
    # so aggregation is expected to collapse it -- that is the whole point of
    # the synonym resolver.
    assert "oil" in raw
    
    # Verify that Supabase was called with the correct parameters
    mock_supabase.table.assert_called_with("grocery_items_per_recipe")
    mock_supabase.table.return_value.select.assert_called_with("*")
    # The aggregator batches the lookup with .in_("recipe_id", [...])
    mock_supabase.table.return_value.select.return_value.in_.assert_called()

@patch('smart_grocery_aggregator.smart_grocery_aggregator.supabase')
def test_pantry_deduction_with_plural_forms(mock_supabase):
    """Test that pantry deduction works with plural forms from pre-processed ingredients."""
    # Configure the mock to return different responses based on the method chain
    def side_effect(*args, **kwargs):
        mock = MagicMock()
        if args and args[0] == "grocery_items_per_recipe":
            # For table check
            if 'limit' in str(kwargs):
                mock_response = MagicMock()
                mock_response.data = [{"count": 1}]
                return mock_response
            # For recipe ingredients
            else:
                mock_response = MagicMock()
                mock_response.data = [
                    {
                        "recipe_id": "1",
                        "raw_text": "2 tomatoes, diced",
                        "quantity": "2",
                        "unit": "",
                        "name": "tomato",
                        "modifiers": "diced",
                        "category": "Vegetables",
                        "plural": "tomatoes"
                    }
                ]
                return mock_response
        return MagicMock()
    
    # Set up the mock to use the side effect
    mock_supabase.table.return_value.select.return_value.limit.return_value.execute.side_effect = side_effect
    mock_supabase.table.return_value.select.return_value.in_.return_value.execute.side_effect = side_effect
    
    # Create test data
    recipes = [
        {"id": "1", "ingredients": ["2 tomatoes, diced"]}
    ]
    pantry = [
        {"name": "tomatoes", "quantity": "2"}
    ]
    
    # Create the aggregator
    aggregator = SmartGroceryAggregator(recipes, pantry)
    categorized, raw = aggregator.generate()
    
    # Verify that the tomatoes were deducted from the pantry
    assert "tomato" not in raw
    
    # Verify that Supabase was called with the correct parameters
    mock_supabase.table.assert_called_with("grocery_items_per_recipe")
    mock_supabase.table.return_value.select.assert_called_with("*")
    # The aggregator batches the lookup with .in_("recipe_id", [...])
    mock_supabase.table.return_value.select.return_value.in_.assert_called()
