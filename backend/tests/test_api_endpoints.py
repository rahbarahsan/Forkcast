import json
import sys
import os
import pytest

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
