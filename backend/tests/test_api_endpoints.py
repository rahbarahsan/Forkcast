import json
import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# Add the parent directory to the path so we can import from backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_grocery_list_endpoint_guest():
    """Test the /api/grocery-list endpoint with guest user data."""
    # Test data for a guest user
    test_data = {
        "is_guest": True,
        "selected_ids": ["1"],  # Assuming recipe ID 1 exists
        "pantry_items": [
            {"id": "1", "name": "onion", "quantity": "2 pcs"}
        ]
    }
    
    response = client.post("/api/grocery-list", json=test_data)
    print(f"Status code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert "categorized" in response.json()
    assert "raw" in response.json()

def test_grocery_list_endpoint_empty():
    """Test the /api/grocery-list endpoint with an empty request."""
    test_data = {
        "is_guest": True,
        "selected_ids": [],
        "pantry_items": []
    }
    
    response = client.post("/api/grocery-list", json=test_data)
    assert response.status_code == 200
    assert "categorized" in response.json()
    assert "raw" in response.json()
    # Empty request should return empty results
    assert len(response.json()["raw"]) == 0
    assert len(response.json()["categorized"]) == 0

def test_grocery_list_endpoint_with_recipe_ids():
    """Test the /api/grocery-list endpoint with recipe_ids parameter."""
    test_data = {
        "is_guest": True,
        "recipe_ids": ["1"],  # Assuming recipe ID 1 exists
        "pantry_items": []
    }
    
    response = client.post("/api/grocery-list", json=test_data)
    print(f"Status code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert "categorized" in response.json()
    assert "raw" in response.json()

@patch('main.supabase')
@patch('aggregator.supabase')
def test_grocery_list_with_preprocessed_ingredients(mock_supabase, mock_main_supabase):
    """Test the /api/grocery-list endpoint with pre-processed ingredients."""
    # Mock the Supabase response for recipes
    mock_recipes_response = MagicMock()
    mock_recipes_response.data = [
        {
            "id": "1",
            "title": "Test Recipe",
            "cuisine": "Test",
            "image": "test.jpg",
            "ingredients": ["2 cloves garlic, minced", "1 tbsp olive oil"],
            "instructions": "Test instructions",
            "prep_time": "10 min",
            "cook_time": "20 min"
        }
    ]
    
    # Mock the Supabase response for grocery_items_per_recipe
    mock_grocery_response = MagicMock()
    mock_grocery_response.data = [
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
    
    # Configure the mock to return different responses based on the table being queried
    def side_effect(*args, **kwargs):
        mock = MagicMock()
        if args[0] == "recipes":
            mock.select.return_value.execute.return_value = mock_recipes_response
            mock.select.return_value.eq.return_value.execute.return_value = mock_recipes_response
        elif args[0] == "grocery_items_per_recipe":
            # For table check
            mock_table_check = MagicMock()
            mock_table_check.data = [{"count": 2}]
            mock.select.return_value.limit.return_value.execute.return_value = mock_table_check
            
            # For recipe ingredients -- the aggregator batches these with .in_()
            mock.select.return_value.in_.return_value.execute.return_value = mock_grocery_response
        return mock

    mock_supabase.table.side_effect = side_effect
    # main.py holds its own reference to the Supabase client, so patching only
    # the aggregator's would let the recipe lookup hit the real database.
    mock_main_supabase.table.side_effect = side_effect
    
    # Test data
    test_data = {
        "is_guest": True,
        "recipe_ids": ["1"],
        "pantry_items": []
    }
    
    response = client.post("/api/grocery-list", json=test_data)
    print(f"Status code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    assert response.status_code == 200
    assert "categorized" in response.json()
    assert "raw" in response.json()
    
    # Verify that the pre-processed ingredients were used
    response_data = response.json()
    assert "Vegetables" in response_data["categorized"]
    assert "garlic" in response_data["categorized"]["Vegetables"]
    assert "Condiments & Spices" in response_data["categorized"]
    # Supabase is fully mocked here, so ingredient_lookup returns nothing and the
    # synonym resolver leaves the pre-processed name as-is. (The aggregator unit
    # tests query the real lookup table and do see "olive oil" collapse to "oil".)
    assert "olive oil" in response_data["categorized"]["Condiments & Spices"]
