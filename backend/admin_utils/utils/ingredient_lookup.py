# admin_utils/utils/ingredient_lookup.py

import inflect

# Initialize inflect engine for plural handling
p = inflect.engine()

def find_ingredient_in_lookup(search_term, lookup_table):
    """
    Universal lookup function used across admin_utils
    Searches canonical, synonym, and plurals columns
    Returns the complete lookup entry if found, None otherwise
    """
    if not search_term or not lookup_table:
        return None
        
    search_term = search_term.lower().strip()
    
    for entry in lookup_table:
        # 1. Check canonical column
        canonical = entry.get('canonical', '').lower().strip()
        if canonical == search_term:
            return entry
            
        # 2. Check synonym column
        synonyms_str = entry.get('synonym', '')
        if synonyms_str:
            synonyms = [s.strip().lower() for s in synonyms_str.split(',') if s.strip()]
            if search_term in synonyms:
                return entry
                
        # 3. Check plurals column  
        plurals_str = entry.get('plurals', '')
        if plurals_str:
            plurals = [p.strip().lower() for p in plurals_str.split(',') if p.strip()]
            if search_term in plurals:
                return entry
    
    return None

def find_ingredient_in_lookup_enhanced(search_term, lookup_table):
    """
    Enhanced lookup with inflect-powered singular/plural matching
    Tries multiple forms of the search term to find matches
    """
    if not search_term or not lookup_table:
        return None
        
    search_term = search_term.lower().strip()
    
    # Try direct search first
    result = find_ingredient_in_lookup(search_term, lookup_table)
    if result:
        return result
    
    # Try singular form if search_term might be plural
    singular_form = normalize_to_singular(search_term)
    if singular_form != search_term:
        result = find_ingredient_in_lookup(singular_form, lookup_table)
        if result:
            return result
    
    # Try plural form if search_term might be singular
    plural_form = generate_plural(search_term)
    if plural_form != search_term:
        result = find_ingredient_in_lookup(plural_form, lookup_table)
        if result:
            return result
    
    return None

def generate_plural(word):
    """Generate plural using inflect - handles all edge cases"""
    if not word:
        return ""
    
    try:
        plural = p.plural(word.strip())
        return plural if plural else word
    except Exception:
        # Fallback to original word if inflect fails
        return word

def normalize_to_singular(word):
    """Convert plural to singular using inflect"""
    if not word:
        return word
    
    try:
        # inflect can detect if word is already plural and convert
        singular = p.singular_noun(word.strip())
        return singular if singular else word  # Return original if not plural
    except Exception:
        # Fallback to original word if inflect fails
        return word

def split_and_clean(value):
    """Split comma-separated values and clean them"""
    if not value:
        return set()
    return set(item.strip().lower() for item in str(value).split(",") if item.strip())

def join_set(value_set):
    """Join set values into comma-separated string"""
    return ", ".join(sorted(value_set)) if value_set else ""

def create_lookup_dict(lookup_data):
    """Create a dictionary for efficient lookups by canonical name"""
    lookup_dict = {}
    for item in lookup_data:
        canonical = item.get("canonical", "").strip().lower()
        if canonical:
            lookup_dict[canonical] = item
    return lookup_dict
