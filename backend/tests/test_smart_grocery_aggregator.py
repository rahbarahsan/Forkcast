import sys
import os
import pytest

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from smart_grocery_aggregator.smart_grocery_aggregator import smart_grocery_aggregation

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
    recipes = [
        {"id": "1", "ingredients": ["3 eggs", "1 egg"]}
    ]
    pantry = [{"name": "egg", "quantity": "2"}]
    needed_ingredients, categorized_ingredients = smart_grocery_aggregation(recipes, pantry)

    names = list(needed_ingredients.keys())
    assert "egg" in names
    assert len(needed_ingredients) == 1

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
