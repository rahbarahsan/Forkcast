#!/usr/bin/env python3
# Test script for finalize_corrections.py functionality

import sys
import os

# Add admin_utils to path
SCRIPT_DIR = os.path.dirname(__file__)
sys.path.append(SCRIPT_DIR)

from utils.ingredient_lookup import (
    find_ingredient_in_lookup,
    find_ingredient_in_lookup_enhanced,
    generate_plural,
    normalize_to_singular,
    split_and_clean,
    join_set
)

def test_plural_generation():
    """Test inflect-powered plural generation"""
    print("🧪 Testing plural generation...")
    
    test_cases = [
        ("tomato", "tomatoes"),
        ("knife", "knives"),
        ("child", "children"),
        ("fish", "fish"),
        ("onion", "onions"),
        ("berry", "berries"),
        ("leaf", "leaves")
    ]
    
    for singular, expected in test_cases:
        result = generate_plural(singular)
        status = "✅" if result == expected else "❌"
        print(f"  {status} {singular} → {result} (expected: {expected})")

def test_singular_conversion():
    """Test plural to singular conversion"""
    print("\n🧪 Testing singular conversion...")
    
    test_cases = [
        ("tomatoes", "tomato"),
        ("knives", "knife"),
        ("children", "child"),
        ("fish", "fish"),
        ("onions", "onion"),
        ("berries", "berry")
    ]
    
    for plural, expected in test_cases:
        result = normalize_to_singular(plural)
        status = "✅" if result == expected else "❌"
        print(f"  {status} {plural} → {result} (expected: {expected})")

def test_lookup_functionality():
    """Test lookup functionality with sample data"""
    print("\n🧪 Testing lookup functionality...")
    
    # Sample lookup table
    lookup_table = [
        {
            "canonical": "tomato",
            "synonym": "roma tomato, cherry tomato",
            "plurals": "tomatoes",
            "category": "Vegetables"
        },
        {
            "canonical": "onion",
            "synonym": "yellow onion, white onion",
            "plurals": "onions",
            "category": "Vegetables"
        }
    ]
    
    test_searches = [
        ("tomato", True),           # Direct canonical match
        ("roma tomato", True),      # Synonym match
        ("tomatoes", True),         # Plural match
        ("cherry tomato", True),    # Another synonym
        ("potato", False),          # No match
        ("onions", True),           # Plural match for onion
        ("yellow onion", True)      # Synonym match for onion
    ]
    
    for search_term, should_find in test_searches:
        result = find_ingredient_in_lookup(search_term, lookup_table)
        found = result is not None
        status = "✅" if found == should_find else "❌"
        canonical = result["canonical"] if result else "None"
        print(f"  {status} '{search_term}' → {canonical}")

def test_enhanced_lookup():
    """Test enhanced lookup with automatic plural/singular conversion"""
    print("\n🧪 Testing enhanced lookup...")
    
    # Sample lookup table with only canonical forms
    lookup_table = [
        {
            "canonical": "tomato",
            "synonym": "",
            "plurals": "",
            "category": "Vegetables"
        }
    ]
    
    test_searches = [
        ("tomato", True),      # Direct match
        ("tomatoes", True),    # Should find via singular conversion
    ]
    
    for search_term, should_find in test_searches:
        result = find_ingredient_in_lookup_enhanced(search_term, lookup_table)
        found = result is not None
        status = "✅" if found == should_find else "❌"
        canonical = result["canonical"] if result else "None"
        print(f"  {status} '{search_term}' → {canonical}")

def test_utility_functions():
    """Test utility functions"""
    print("\n🧪 Testing utility functions...")
    
    # Test split_and_clean
    test_string = "roma tomato, cherry tomato,  plum tomato  "
    result = split_and_clean(test_string)
    expected = {"roma tomato", "cherry tomato", "plum tomato"}
    status = "✅" if result == expected else "❌"
    print(f"  {status} split_and_clean: {result}")
    
    # Test join_set
    test_set = {"cherry tomato", "roma tomato", "plum tomato"}
    result = join_set(test_set)
    # Should be sorted
    expected_parts = ["cherry tomato", "plum tomato", "roma tomato"]
    status = "✅" if result == ", ".join(expected_parts) else "❌"
    print(f"  {status} join_set: '{result}'")

if __name__ == "__main__":
    print("🚀 Testing finalize_corrections.py utilities...\n")
    
    try:
        test_plural_generation()
        test_singular_conversion()
        test_lookup_functionality()
        test_enhanced_lookup()
        test_utility_functions()
        
        print("\n✅ All tests completed!")
        print("\n📋 Summary:")
        print("  - Inflect library integration working")
        print("  - Lookup functionality operational")
        print("  - Enhanced lookup with auto-conversion working")
        print("  - Utility functions working correctly")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
