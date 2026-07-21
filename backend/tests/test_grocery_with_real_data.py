import sys
import os
import json
from pprint import pprint

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from aggregator import SmartGroceryAggregator
from supabase_client import supabase

def test_with_real_data():
    """
    Test the SmartGroceryAggregator with real data from Supabase.
    This will:
    1. Fetch recipes from Supabase
    2. Check if the grocery_items_per_recipe table exists and has data
    3. Generate a grocery list using the SmartGroceryAggregator
    4. Print the results
    """
    print("\n" + "="*80)
    print("TESTING SMART GROCERY AGGREGATOR WITH REAL SUPABASE DATA")
    print("="*80 + "\n")
    
    # Step 1: Check if the grocery_items_per_recipe table exists
    try:
        print("Checking if grocery_items_per_recipe table exists...")
        table_check = supabase.table("grocery_items_per_recipe").select("count(*)").limit(1).execute()
        print(f"Table check result: {table_check.data}")
        
        # Check if there are any entries in the table
        print("Checking for sample entries in grocery_items_per_recipe...")
        sample_entries = supabase.table("grocery_items_per_recipe").select("*").limit(5).execute()
        print(f"Found {len(sample_entries.data)} sample entries:")
        for entry in sample_entries.data:
            print(f"  - Recipe ID: {entry.get('recipe_id')}, Name: {entry.get('name')}")
    except Exception as e:
        print(f"Error checking grocery_items_per_recipe table: {str(e)}")
        print("Continuing with test anyway...")
    
    # Step 2: Fetch some recipes from Supabase
    try:
        print("\nFetching recipes from Supabase...")
        recipes_response = supabase.table("recipes").select("*").limit(3).execute()
        recipes = recipes_response.data
        
        if not recipes:
            print("No recipes found in Supabase. Using test recipes instead.")
            recipes = [
                {
                    "id": "test1",
                    "title": "Test Recipe 1",
                    "ingredients": ["2 cloves garlic, minced", "1 tbsp olive oil"]
                }
            ]
        else:
            print(f"Found {len(recipes)} recipes:")
            for recipe in recipes:
                print(f"  - ID: {recipe.get('id')}, Title: {recipe.get('title')}")
                print(f"    Ingredients: {len(recipe.get('ingredients', []))} items")
    except Exception as e:
        print(f"Error fetching recipes: {str(e)}")
        print("Using test recipes instead.")
        recipes = [
            {
                "id": "test1",
                "title": "Test Recipe 1",
                "ingredients": ["2 cloves garlic, minced", "1 tbsp olive oil"]
            }
        ]
    
    # Step 3: Create a SmartGroceryAggregator instance
    print("\nCreating SmartGroceryAggregator instance...")
    pantry_items = [
        {"name": "garlic", "quantity": "1 clove"}
    ]
    aggregator = SmartGroceryAggregator(recipes, pantry_items)
    
    # Step 4: Generate a grocery list
    print("Generating grocery list...")
    try:
        categorized, raw = aggregator.generate()
        
        # Step 5: Print the results
        print("\n" + "="*80)
        print("RESULTS")
        print("="*80)
        
        print("\nCategorized Ingredients:")
        for category, ingredients in categorized.items():
            print(f"  {category}:")
            for ingredient in ingredients:
                print(f"    - {ingredient}")
        
        print("\nRaw Ingredients:")
        pprint(raw)
        
        print("\n" + "="*80)
        print("TEST COMPLETED SUCCESSFULLY")
        print("="*80 + "\n")
        
        return True
    except Exception as e:
        print(f"Error generating grocery list: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        
        print("\n" + "="*80)
        print("TEST FAILED")
        print("="*80 + "\n")
        
        return False

if __name__ == "__main__":
    test_with_real_data()
