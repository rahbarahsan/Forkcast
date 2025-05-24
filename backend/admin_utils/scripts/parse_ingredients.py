import csv
import os
import re
import openai
import time
import json
from typing import List, Dict
from dotenv import load_dotenv
from .llm_toggle_loader import get_llm_mode
import nltk
from nltk import pos_tag, word_tokenize

# Import caching and logging utilities
try:
    from ..utils.llm_cache import create_ingredient_parsing_cache
    from ..utils.api_logger import create_api_logger
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False
    print("⚠️ Cache and logging utilities not available")

# Force custom NLTK path
NLTK_DATA_PATH = os.path.join(os.path.dirname(__file__), "../nltk_data")
nltk.data.path.clear()
nltk.data.path.append(os.path.abspath(NLTK_DATA_PATH))


# Don't re-download every time
try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt", download_dir="./nltk_data")

try:
    nltk.data.find("taggers/averaged_perceptron_tagger")
except LookupError:
    nltk.download("averaged_perceptron_tagger", download_dir="./nltk_data")

try:
    nltk.data.find("taggers/universal_tagset")
except LookupError:
    nltk.download("universal_tagset", download_dir="./nltk_data")

try:
    nltk.data.find("taggers/averaged_perceptron_tagger_eng")
except LookupError:
    # This is a workaround for a specific NLTK version issue
    # Create a symlink or copy from averaged_perceptron_tagger to averaged_perceptron_tagger_eng
    source_dir = os.path.join(NLTK_DATA_PATH, "taggers", "averaged_perceptron_tagger")
    target_dir = os.path.join(NLTK_DATA_PATH, "taggers", "averaged_perceptron_tagger_eng")
    if os.path.exists(source_dir) and not os.path.exists(target_dir):
        os.makedirs(os.path.dirname(target_dir), exist_ok=True)
        # Copy the directory contents
        import shutil
        shutil.copytree(source_dir, target_dir)

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "config", ".env"))
# Add these debug logs
print("🔐 ENV DEBUG:")
print("OPENAI_API_KEY:", "✔️ Loaded" if os.getenv("OPENAI_API_KEY") else "❌ MISSING")
print("OPENAI_BASE_URL:", os.getenv("OPENAI_BASE_URL"))
print("OPENROUTER_MODEL:", os.getenv("OPENROUTER_MODEL"))

# Configure OpenAI with the base URL
if os.getenv("OPENAI_BASE_URL"):
    openai.api_base = os.getenv("OPENAI_BASE_URL")
if os.getenv("OPENAI_API_KEY"):
    openai.api_key = os.getenv("OPENAI_API_KEY")

# Load config file for gpt_model
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "pipeline_config.json")
if os.path.exists(CONFIG_PATH):
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)
    # Use gpt_model from pipeline.config instead of OPENROUTER_MODEL from .env
    model_name = config.get("gpt_model", "openai/chatgpt-4o-latest")
else:
    # Fallback to environment variable if config file doesn't exist
    model_name = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3-haiku-20240307")




def extract_nouns(text):
    """
    Extract likely nouns from ingredient text using a heuristic approach.
    This avoids NLTK POS tagging issues while still identifying likely ingredient names.
    """
    # Common adjectives and non-noun words in ingredients to filter out
    non_nouns = {
        "dried", "frozen", "canned", "chopped", "minced", "sliced", "diced",
        "grated", "ground", "whole", "peeled", "raw", "cooked", "boiled", "baked",
        "roasted", "fried", "steamed", "hot", "cold", "warm", "sweet", "sour", "bitter",
        "salty", "spicy", "mild", "strong", "ripe", "unripe", "green", "red", "yellow",
        "white", "black", "brown", "organic", "natural", "artificial", "large", "small",
        "medium", "extra", "virgin", "pure", "refined", "unrefined", "seedless", "boneless",
        "skinless", "lean", "fatty", "low-fat", "non-fat", "full-fat", "unsalted", "salted",
        "unsweetened", "sweetened", "plain", "flavored", "crushed", "cracked", "powdered"
    }
    
    # Common prepositions and articles to filter out - but keep some for special phrases
    stop_words = {
        "or", "with", "without", "in", "on", "at", "by", "from",
        "a", "an", "the", "this", "that", "these", "those"
    }
    
    # Common units
    units = {
        "g", "kg", "mg", "ml", "l", "tsp", "tbsp", "cup", "cups", "oz", "pcs",
        "clove", "cloves", "slice", "slices", "litre", "teaspoon", "tablespoon",
        "handful", "pinch", "dash", "bunch"
    }
    
    # Special case: preserve phrases with "to taste"
    if "to taste" in text.lower():
        return [text.lower()]
    
    # Special case: preserve phrases with "for garnish"
    if "for garnish" in text.lower() or "for serving" in text.lower():
        return [text.lower()]
    
    # Special case: if text starts with "for garnish" or similar, keep that phrase
    if text.lower().startswith(("for garnish", "for serving", "to serve")):
        return [text.lower()]
    
    # Special case: if text contains "juice of", extract the full phrase
    if "juice of" in text.lower():
        return ["juice of " + " ".join(text.lower().split("juice of")[1].strip().split())]
    
    # Handle parenthetical content
    main_text = text
    parenthetical_content = ""
    if "(" in text and ")" in text:
        open_idx = text.find("(")
        close_idx = text.find(")")
        if open_idx < close_idx:
            parenthetical_content = text[open_idx:close_idx+1]
            main_text = text[:open_idx] + " " + text[close_idx+1:]
    
    # Split the text into tokens
    tokens = main_text.lower().split()
    
    # Special case: preserve "and" in specific phrases
    if "salt and pepper" in main_text.lower() or "salt and black pepper" in main_text.lower():
        return ["salt and pepper to taste" if "to taste" in main_text.lower() else "salt and pepper"]
    
    # Special case: preserve "fresh" in ingredient names
    preserve_fresh = "fresh" in main_text.lower()
    
    # Remove common units, stop words, and non-nouns
    filtered_tokens = []
    for i, t in enumerate(tokens):
        # Skip numbers
        if t.replace('.', '', 1).isdigit():
            continue
        
        # Skip units
        if t in units:
            continue
        
        # Keep "fresh" if it's part of the ingredient
        if t == "fresh" and preserve_fresh:
            filtered_tokens.append(t)
            continue
            
        # Skip other non-nouns
        if t in non_nouns:
            continue
            
        # Skip stop words
        if t in stop_words:
            continue
            
        filtered_tokens.append(t)
    
    # If we have tokens left, combine them with parenthetical content
    if filtered_tokens:
        result = " ".join(filtered_tokens)
        if parenthetical_content:
            result += " " + parenthetical_content
        return [result.strip()]
    
    # Fallback: return all words except units and numbers
    filtered_tokens = [t for t in tokens if not t.replace('.', '', 1).isdigit() and t not in units]
    
    result = " ".join(filtered_tokens)
    if parenthetical_content:
        result += " " + parenthetical_content
    
    return [result.strip()] if result.strip() else [text.lower()]

# --- Local Parsing using regex ---
def parse_ingredient_line_local(text: str, ingredient_lookup: list = None) -> Dict[str, str]:
    quantity = ""
    unit = ""
    name = ""
    modifiers = ""

    raw = text.strip()
    
    # Special case: "Salt to taste", "Salt and pepper to taste", etc.
    to_taste_match = re.match(r"^(salt|salt and(?: black)? pepper)(?:\s+to\s+taste)?$", raw, re.IGNORECASE)
    if to_taste_match:
        name = to_taste_match.group(1).lower() + " to taste"
        return {
            "raw_text": text,
            "quantity": "",
            "unit": "",
            "name": name,
            "modifiers": "",
            "canonical": name,
            "category": "Condiments & Spices",
            "synonym_of": "",
            "plural": ""
        }
    
    # Special case: "Juice of X lemon/lime/etc"
    juice_match = re.match(r"^juice\s+of\s+([\d\s\/¼½¾⅓⅔⅛⅜⅝⅞\.]+)\s+(.+)", raw, re.IGNORECASE)
    if juice_match:
        quantity = juice_match.group(1).strip()
        name = "juice of " + juice_match.group(2).strip()
        fruit_name = juice_match.group(2).strip().lower()
        category = "Fruits" if any(fruit in fruit_name for fruit in ["lemon", "lime", "orange", "grapefruit", "citrus"]) else "Other"
        return {
            "raw_text": text,
            "quantity": quantity,
            "unit": "",
            "name": name,
            "modifiers": "",
            "canonical": name,
            "category": category,
            "synonym_of": "",
            "plural": ""
        }
    
    # Special case: "For garnish: X, Y, Z"
    garnish_match = re.match(r"^for\s+garnish:\s+(.+)", raw, re.IGNORECASE)
    if garnish_match:
        garnish_items = [item.strip() for item in garnish_match.group(1).split(",")]
        results = []
        for item in garnish_items:
            # Determine category based on item name
            category = "Other"
            if any(veg in item.lower() for veg in ["tomato", "onion", "garlic", "pepper", "carrot", "lettuce", "cucumber", "spinach", "kale", "broccoli", "cabbage", "celery", "potato", "zucchini", "eggplant", "basil", "cilantro", "parsley"]):
                category = "Vegetables"
            elif any(fruit in item.lower() for fruit in ["apple", "orange", "banana", "lemon", "lime", "berry", "strawberry", "blueberry", "grape", "melon", "watermelon", "peach", "pear", "plum", "cherry", "mango", "pineapple", "avocado"]):
                category = "Fruits"
            
            # Determine plural form if different from name
            plural = ""
            if item.endswith("y") and not item.endswith("ey"):
                plural = item[:-1] + "ies"
            elif item.endswith(("s", "x", "z", "ch", "sh")):
                plural = item + "es"
            elif not item.endswith("s"):
                plural = item + "s"
            
            # Only set plural if it's different from name
            if plural == item:
                plural = ""
                
            results.append({
                "raw_text": text,
                "quantity": "",
                "unit": "",
                "name": item,
                "modifiers": "for garnish",
                "canonical": item,
                "category": category,
                "synonym_of": "",
                "plural": plural
            })
        return results
    
    # Special case: "Fresh X for garnish"
    fresh_garnish_match = re.match(r"^fresh\s+(\w+)(?:\s+for\s+garnish)?$", raw, re.IGNORECASE)
    if fresh_garnish_match:
        herb = fresh_garnish_match.group(1).strip()
        name = "fresh " + herb + (" for garnish" if "for garnish" in raw.lower() else "")
        
        # Determine category based on herb name
        category = "Vegetables"
        if any(spice in herb.lower() for spice in ["basil", "cilantro", "parsley", "mint", "dill", "thyme", "rosemary", "sage", "oregano"]):
            category = "Condiments & Spices"
        
        # Determine plural form if different from herb
        plural = ""
        if herb.endswith("y") and not herb.endswith("ey"):
            plural = herb[:-1] + "ies"
        elif herb.endswith(("s", "x", "z", "ch", "sh")):
            plural = herb + "es"
        elif not herb.endswith("s"):
            plural = herb + "s"
        
        # Only set plural if it's different from herb
        if plural == herb:
            plural = ""
            
        return {
            "raw_text": text,
            "quantity": "",
            "unit": "",
            "name": name,
            "modifiers": "",
            "canonical": herb,
            "category": category,
            "synonym_of": "",
            "plural": plural
        }
    
    # Special case: "X to serve"
    to_serve_match = re.match(r"^(\w+)(?:\s+rice)?,?\s+to\s+serve$", raw, re.IGNORECASE)
    if to_serve_match:
        item = to_serve_match.group(1).strip()
        name = item + (" rice" if "rice" in raw.lower() else "") + " to serve"
        
        # Determine category based on item name
        category = "Other"
        if "rice" in raw.lower():
            category = "Grains & Bakery"
        elif any(veg in item.lower() for veg in ["tomato", "onion", "garlic", "pepper", "carrot", "lettuce", "cucumber", "spinach", "kale", "broccoli", "cabbage", "celery", "potato", "zucchini", "eggplant", "basil", "cilantro", "parsley"]):
            category = "Vegetables"
        elif any(fruit in item.lower() for fruit in ["apple", "orange", "banana", "lemon", "lime", "berry", "strawberry", "blueberry", "grape", "melon", "watermelon", "peach", "pear", "plum", "cherry", "mango", "pineapple", "avocado"]):
            category = "Fruits"
        
        # Determine plural form if different from item
        plural = ""
        if item.endswith("y") and not item.endswith("ey"):
            plural = item[:-1] + "ies"
        elif item.endswith(("s", "x", "z", "ch", "sh")):
            plural = item + "es"
        elif not item.endswith("s"):
            plural = item + "s"
        
        # Only set plural if it's different from item
        if plural == item:
            plural = ""
            
        return {
            "raw_text": text,
            "quantity": "",
            "unit": "",
            "name": name,
            "modifiers": "to serve",
            "canonical": item + (" rice" if "rice" in raw.lower() else ""),
            "category": category,
            "synonym_of": "",
            "plural": plural
        }
    
    # Handle spelled-out numbers
    number_words = {
        "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
        "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
        "half": "1/2", "quarter": "1/4", "third": "1/3"
    }
    
    for word, num in number_words.items():
        if raw.lower().startswith(word + " "):
            raw = raw.lower().replace(word, num, 1)
            break
    
    tokens = raw.split()

    units = [
        "g", "kg", "mg", "ml", "l", "tsp", "tbsp", "cup", "cups", "oz", "pcs",
        "clove", "cloves", "slice", "slices", "litre", "teaspoon", "tablespoon",
        "handful", "pinch", "dash", "bunch"
    ]

    # Extract quantity - improved regex to catch more formats
    quantity_match = re.match(r"^([\d\s\/¼½¾⅓⅔⅛⅜⅝⅞\.]+)", raw)
    if quantity_match:
        quantity = quantity_match.group(1).strip()
        raw = raw[len(quantity):].strip()
        tokens = raw.split()

    # Extract unit
    if tokens and tokens[0].lower() in units:
        unit = tokens[0].lower()
        raw = " ".join(tokens[1:]).strip()
    elif len(tokens) > 0 and tokens[0].lower().endswith('s'):
        singular_unit = tokens[0].lower().rstrip('s')
        if singular_unit in units:
            unit = singular_unit
            raw = " ".join(tokens[1:]).strip()

    # Use noun-only fallback if unit not found
    if not unit and not quantity:
        noun_list = extract_nouns(text)
        best_guess = " ".join(noun_list).strip()
        
        # Determine category based on best guess
        category = "Other"
        if any(veg in best_guess.lower() for veg in ["tomato", "onion", "garlic", "pepper", "carrot", "lettuce", "cucumber", "spinach", "kale", "broccoli", "cabbage", "celery", "potato", "zucchini", "eggplant", "basil", "cilantro", "parsley"]):
            category = "Vegetables"
        elif any(fruit in best_guess.lower() for fruit in ["apple", "orange", "banana", "lemon", "lime", "berry", "strawberry", "blueberry", "grape", "melon", "watermelon", "peach", "pear", "plum", "cherry", "mango", "pineapple", "avocado"]):
            category = "Fruits"
        elif any(meat in best_guess.lower() for meat in ["beef", "chicken", "pork", "lamb", "turkey", "fish", "salmon", "tuna", "shrimp", "prawn", "crab", "lobster", "meat", "steak", "ground", "mince", "sausage", "bacon", "ham"]):
            category = "Meat & Seafood"
        elif any(dairy in best_guess.lower() for dairy in ["milk", "cream", "cheese", "yogurt", "butter", "egg", "curd", "ghee"]):
            category = "Dairy"
        elif any(grain in best_guess.lower() for grain in ["flour", "rice", "pasta", "bread", "oat", "cereal", "grain", "wheat", "barley", "corn", "noodle", "tortilla", "pita"]):
            category = "Grains & Bakery"
        elif any(condiment in best_guess.lower() for condiment in ["salt", "pepper", "spice", "herb", "sauce", "oil", "vinegar", "sugar", "honey", "syrup", "ketchup", "mustard", "mayonnaise", "soy", "chili", "cumin", "coriander", "cinnamon", "nutmeg", "vanilla"]):
            category = "Condiments & Spices"
        
        # Determine plural form if different from best guess
        plural = ""
        if best_guess.endswith("y") and not best_guess.endswith("ey"):
            plural = best_guess[:-1] + "ies"
        elif best_guess.endswith(("s", "x", "z", "ch", "sh")):
            plural = best_guess + "es"
        elif not best_guess.endswith("s"):
            plural = best_guess + "s"
        
        # Only set plural if it's different from best guess
        if plural == best_guess:
            plural = ""
            
        return {
            "raw_text": text,
            "quantity": "",
            "unit": "",
            "name": best_guess if best_guess else None,
            "modifiers": "",
            "canonical": best_guess,
            "category": category,
            "synonym_of": "",
            "plural": plural
        }

    # Common cooking preparation terms that indicate modifiers
    prep_terms = [
        "chopped", "minced", "diced", "sliced", "grated", "shredded", "julienned",
        "cubed", "quartered", "halved", "crushed", "cracked", "ground", "powdered",
        "peeled", "trimmed", "cored", "seeded", "pitted", "stemmed", "hulled",
        "washed", "rinsed", "drained", "dried", "soaked", "marinated", "brined",
        "boiled", "steamed", "roasted", "grilled", "fried", "sautéed", "baked",
        "broiled", "poached", "simmered", "blanched", "toasted", "melted", "whipped",
        "beaten", "whisked", "stirred", "mixed", "blended", "puréed", "mashed",
        "strained", "sifted", "kneaded", "rolled", "folded", "chilled", "frozen",
        "thawed", "room temperature", "softened", "warmed", "heated", "cooled"
    ]
    
    # Improved comma handling for name and modifiers
    if "," in raw:
        # Check if there's a parenthesis before the first comma
        first_comma = raw.find(",")
        open_paren = raw.find("(")
        close_paren = raw.find(")")
        
        # If there's an open parenthesis before the first comma and the close parenthesis is after it
        if 0 <= open_paren < first_comma and close_paren > first_comma:
            # Include everything up to the close parenthesis in the name
            name_end = close_paren + 1
            name = raw[:name_end].strip()
            if len(raw) > name_end + 1 and raw[name_end] == ',':
                modifiers = raw[name_end + 1:].strip()
            else:
                modifiers = raw[name_end:].strip()
                if modifiers.startswith(","):
                    modifiers = modifiers[1:].strip()
        else:
            parts = raw.split(",")
            name = parts[0].strip()
            if len(parts) > 1:
                modifiers = ", ".join([p.strip() for p in parts[1:]])
    else:
        # No comma, but check for parenthetical content which often contains modifiers
        if "(" in raw and ")" in raw:
            open_paren = raw.find("(")
            close_paren = raw.find(")")
            if open_paren < close_paren:
                name = raw[:open_paren].strip()
                modifiers = raw[open_paren:close_paren+1].strip()
        else:
            # No comma or parentheses, check for prep terms
            name = raw.strip()
            name_tokens = name.lower().split()
            
            # Check if any prep terms are in the name
            for term in prep_terms:
                if term in name_tokens:
                    # Split at the prep term
                    term_index = name_tokens.index(term)
                    name = " ".join(name_tokens[:term_index])
                    modifiers = " ".join(name_tokens[term_index:])
                    break
    
    # Fix "sour cream" in garnish items
    if "cream" in name and "for garnish" in name.lower():
        name = name.replace("cream", "sour cream")
    
    # Fix missing "slices" in avocado
    if "avocado" in name and "slice" not in name and "for garnish" in name.lower():
        name = name.replace("avocado", "avocado slices")
    
    # Fix "Fresh cilantro chopped (for garnish)"
    if "cilantro" in name.lower() and "for garnish" in raw.lower():
        if "fresh" in raw.lower() and "fresh" not in name.lower():
            name = "fresh " + name
        if "chopped" in raw.lower() and "chopped" not in name.lower() and "chopped" not in modifiers.lower():
            modifiers = ("chopped, " + modifiers) if modifiers else "chopped"
    
    # Extract modifiers from the name if they contain prep terms, but only if name has multiple words
    if not modifiers and len(name.split()) > 1:
        name_tokens = name.lower().split()
        for term in prep_terms:
            if term in name_tokens:
                # Split at the prep term
                term_index = name_tokens.index(term)
                # Only extract as modifier if we're not left with an empty name
                if term_index > 0:
                    name = " ".join(name_tokens[:term_index])
                    modifiers = " ".join(name_tokens[term_index:])
                break
    
    # Remove leading "s " that sometimes appears after removing a unit
    if name.startswith("s "):
        name = name[2:]
    
    # If we have a quantity and unit but no modifiers, check if there are prep terms in the raw text
    if quantity and unit and not modifiers:
        raw_tokens = raw.lower().split()
        for term in prep_terms:
            if term in raw_tokens:
                # Make sure the term isn't the only word in the name
                if len(name.split()) > 1 or term not in name.lower():
                    modifiers = term
                break
    
    # If we have a quantity but no modifiers, and the name has multiple words,
    # check if the last word is a prep term
    if quantity and not modifiers and len(name.split()) > 1:
        last_word = name.split()[-1].lower()
        if last_word in prep_terms:
            name = " ".join(name.split()[:-1])
            modifiers = last_word
    
    # Special case handling for ingredients where the prep term is part of the name
    spice_terms = ["ground", "powdered", "crushed", "cracked"]
    spice_ingredients = ["cumin", "coriander", "cinnamon", "pepper", "chili", "paprika", "oregano"]
    
    # If we have a spice ingredient with a prep term but no name, move the prep term back to the name
    if not name and modifiers:
        modifiers_tokens = modifiers.lower().split()
        for term in spice_terms:
            if term in modifiers_tokens:
                term_index = modifiers_tokens.index(term)
                # Check if the next word is a spice ingredient
                if term_index < len(modifiers_tokens) - 1 and modifiers_tokens[term_index + 1] in spice_ingredients:
                    name = term + " " + modifiers_tokens[term_index + 1]
                    # Remove these tokens from modifiers
                    new_modifiers = []
                    for i, token in enumerate(modifiers_tokens):
                        if i != term_index and i != term_index + 1:
                            new_modifiers.append(token)
                    modifiers = " ".join(new_modifiers)
                    break
    
    # If we still don't have a name but have modifiers, use the modifiers as the name
    if not name and modifiers:
        name = modifiers
        modifiers = ""
    
    # Ensure name is not empty
    if not name:
        name = raw.strip()

    # Normalize name by checking against ingredient_lookup
    canonical = ""
    if ingredient_lookup:
        for item in ingredient_lookup:
            if item["canonical"].lower() == name.lower():
                canonical = item["canonical"]
                break
    
    # Determine category based on name
    category = ""
    if any(veg in name.lower() for veg in ["tomato", "onion", "garlic", "pepper", "carrot", "lettuce", "cucumber", "spinach", "kale", "broccoli", "cabbage", "celery", "potato", "zucchini", "eggplant", "basil", "cilantro", "parsley"]):
        category = "Vegetables"
    elif any(fruit in name.lower() for fruit in ["apple", "orange", "banana", "lemon", "lime", "berry", "strawberry", "blueberry", "grape", "melon", "watermelon", "peach", "pear", "plum", "cherry", "mango", "pineapple", "avocado"]):
        category = "Fruits"
    elif any(meat in name.lower() for meat in ["beef", "chicken", "pork", "lamb", "turkey", "fish", "salmon", "tuna", "shrimp", "prawn", "crab", "lobster", "meat", "steak", "ground", "mince", "sausage", "bacon", "ham"]):
        category = "Meat & Seafood"
    elif any(dairy in name.lower() for dairy in ["milk", "cream", "cheese", "yogurt", "butter", "egg", "curd", "ghee"]):
        category = "Dairy"
    elif any(grain in name.lower() for grain in ["flour", "rice", "pasta", "bread", "oat", "cereal", "grain", "wheat", "barley", "corn", "noodle", "tortilla", "pita"]):
        category = "Grains & Bakery"
    elif any(condiment in name.lower() for condiment in ["salt", "pepper", "spice", "herb", "sauce", "oil", "vinegar", "sugar", "honey", "syrup", "ketchup", "mustard", "mayonnaise", "soy", "chili", "cumin", "coriander", "cinnamon", "nutmeg", "vanilla"]):
        category = "Condiments & Spices"
    else:
        category = "Other"
    
    # Determine plural form if different from name
    plural = ""
    if name.endswith("y") and not name.endswith("ey"):
        plural = name[:-1] + "ies"
    elif name.endswith(("s", "x", "z", "ch", "sh")):
        plural = name + "es"
    elif not name.endswith("s"):
        plural = name + "s"
    
    # Only set plural if it's different from name
    if plural == name:
        plural = ""
    
    return {
        "raw_text": text,
        "quantity": quantity,
        "unit": unit,
        "name": name,
        "modifiers": modifiers,
        "canonical": canonical,
        "category": category,
        "synonym_of": "",
        "plural": plural
    }


# --- API Parsing (OpenRouter or OpenAI) with Caching ---
def parse_ingredient_line_api(text: str, ingredient_lookup: list = None, cache=None, api_logger=None) -> Dict[str, str]:
    """
    Parse ingredient using API with caching and logging support.
    
    Args:
        text: Ingredient text to parse
        ingredient_lookup: Lookup table for normalization
        cache: LLMCache instance for caching results
        api_logger: APILogger instance for logging API calls
    """
    # Check cache first
    if cache and CACHE_AVAILABLE:
        cached_result = cache.get(text, model_name, "ingredient_parsing")
        if cached_result:
            if api_logger:
                api_logger.log_api_call(
                    input_text=text,
                    output_data=cached_result,
                    model=model_name,
                    success=True,
                    cache_hit=True
                )
            return cached_result
    
    # Enhanced prompt with correct categories and better examples
    prompt = f"""Parse this ingredient text into structured JSON format: "{text}"

Return a JSON object with exactly these keys:
- quantity: numeric amount (empty string if none)
- unit: measurement unit (empty string if none) 
- name: main ingredient name (required)
- modifiers: preparation/description terms (empty string if none)
- canonical: normalized ingredient name for database lookup (empty string if same as name)
- category: food category from [Vegetables, Fruits, Meat & Seafood, Dairy, Grains & Bakery, Condiments & Spices, Other] (always include a category)
- synonym_of: if this is a synonym of another ingredient (empty string if not)
- plural: plural form if different from name (empty string if same)

Examples:
"2 cups diced tomatoes" → {{"quantity": "2", "unit": "cups", "name": "tomatoes", "modifiers": "diced", "canonical": "tomato", "category": "Vegetables", "synonym_of": "", "plural": "tomatoes"}}
"salt to taste" → {{"quantity": "", "unit": "", "name": "salt", "modifiers": "to taste", "canonical": "salt", "category": "Condiments & Spices", "synonym_of": "", "plural": ""}}
"fresh basil leaves" → {{"quantity": "", "unit": "", "name": "basil leaves", "modifiers": "fresh", "canonical": "basil", "category": "Vegetables", "synonym_of": "", "plural": "leaves"}}
"400ml coconut milk" → {{"quantity": "400", "unit": "ml", "name": "coconut milk", "modifiers": "", "canonical": "coconut milk", "category": "Dairy", "synonym_of": "", "plural": ""}}
"2 cloves garlic, minced" → {{"quantity": "2", "unit": "cloves", "name": "garlic", "modifiers": "minced", "canonical": "garlic", "category": "Vegetables", "synonym_of": "", "plural": ""}}
"olive oil" → {{"quantity": "", "unit": "", "name": "olive oil", "modifiers": "", "canonical": "olive oil", "category": "Condiments & Spices", "synonym_of": "", "plural": ""}}

JSON:"""

    start_time = time.time()
    success = False
    error_message = ""
    estimated_cost = 0.002  # Rough estimate for small requests
    result = None
    
    try:
        # Using the new OpenAI API format (v1.0.0+)
        client = openai.OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are a precise ingredient parser. Always return valid JSON with the exact keys requested."},
                {"role": "user", "content": prompt}
            ],
            temperature=0,
            max_tokens=150  # Limit tokens for cost control
        )
        
        response_time_ms = (time.time() - start_time) * 1000
        content = response.choices[0].message.content
        success = True
        
        # Try to parse the JSON response
        try:
            # Check if the response contains a JSON string embedded in text
            json_pattern = r'({[\s\S]*})'
            json_match = re.search(json_pattern, content)
            
            if json_match:
                # Extract the JSON part from the text
                json_str = json_match.group(1)
                # Clean up the JSON string (remove newlines, fix quotes if needed)
                json_str = json_str.replace('\n', ' ').replace('  ', ' ')
                try:
                    parsed_json = json.loads(json_str)
                except json.JSONDecodeError:
                    # If embedded JSON parsing fails, try the whole content
                    parsed_json = json.loads(content)
            else:
                # No embedded JSON found, try parsing the whole content
                parsed_json = json.loads(content)
            
            name = parsed_json.get("name", "")
            
            # Normalize name by checking against ingredient_lookup
            canonical = ""
            if ingredient_lookup:
                for item in ingredient_lookup:
                    if item["canonical"].lower() == name.lower():
                        canonical = item["canonical"]
                        break
            
            result = {
                "raw_text": text,
                "quantity": parsed_json.get("quantity", ""),
                "unit": parsed_json.get("unit", ""),
                "name": name,
                "modifiers": parsed_json.get("modifiers", ""),
                "canonical": canonical,
                "category": parsed_json.get("category", ""),
                "synonym_of": parsed_json.get("synonym_of", ""),
                "plural": parsed_json.get("plural", "")
            }
            
        except json.JSONDecodeError:
            # Special case for "Salt and pepper to taste" type responses
            if "salt and pepper" in content.lower() and "to taste" in content.lower():
                result = {
                    "raw_text": text,
                    "quantity": "",
                    "unit": "",
                    "name": "Salt and pepper",
                    "modifiers": "to taste",
                    "canonical": "",
                    "category": "",
                    "synonym_of": "",
                    "plural": ""
                }
            else:
                # If all JSON parsing fails, use the content as the name
                result = {
                    "raw_text": text,
                    "quantity": "",
                    "unit": "",
                    "name": content.strip(),
                    "modifiers": "",
                    "canonical": "",
                    "category": "",
                    "synonym_of": "",
                    "plural": ""
                }
                
    except Exception as e:
        success = False
        error_message = str(e)
        response_time_ms = (time.time() - start_time) * 1000
        result = {
            "raw_text": text,
            "quantity": "",
            "unit": "",
            "name": f"ERROR: {e}",
            "modifiers": "",
            "canonical": "",
            "category": "",
            "synonym_of": "",
            "plural": ""
        }
    
    # Log the API call
    if api_logger:
        api_logger.log_api_call(
            input_text=text,
            output_data=result,
            model=model_name,
            success=success,
            error_message=error_message,
            response_time_ms=response_time_ms,
            estimated_cost=estimated_cost,
            cache_hit=False
        )
    
    # Cache the result if successful
    if cache and CACHE_AVAILABLE and success and result:
        cache.set(text, result, model_name, "ingredient_parsing", estimated_cost)
    
    return result


# --- I/O ---
def load_input_lines(input_path: str) -> List[str]:
    with open(input_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return [row["raw_text"] for row in reader if row.get("raw_text")]

def write_output(data: List[Dict[str, str]], output_path: str):
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["raw_text", "quantity", "unit", "name", "modifiers", "canonical", "category", "synonym_of", "plural"])
        writer.writeheader()
        writer.writerows(data)

# --- Main ---
def main():
    input_path = os.path.join(os.path.dirname(__file__), "..", "csv", "raw_ingredients.csv")
    output_path = os.path.join(os.path.dirname(__file__), "..", "csv", "parsed_ingredients_haiku.csv")

    mode = get_llm_mode()
    print(f"🔁 Using LLM mode: {mode}")
    print(f"📱 Using model: {model_name}")

    # Initialize cache and logger for API mode
    cache = None
    api_logger = None
    
    if mode == "api" and CACHE_AVAILABLE:
        cache = create_ingredient_parsing_cache()
        api_logger = create_api_logger("ingredient_parsing")
        print("✅ Cache and API logging initialized")
        cache.print_stats()

    lines = load_input_lines(input_path)
    print(f"📄 Processing {len(lines)} ingredient lines...")

    if mode == "local":
        parsed = [parse_ingredient_line_local(line) for line in lines]
    else:
        parsed = []
        for i, line in enumerate(lines):
            if i % 10 == 0:  # Progress indicator
                print(f"🔄 Processing {i+1}/{len(lines)}...")
            result = parse_ingredient_line_api(line, ingredient_lookup=None, cache=cache, api_logger=api_logger)
            parsed.append(result)

    write_output(parsed, output_path)
    print(f"✅ Parsed {len(parsed)} ingredients → {output_path}")
    
    # Print final stats for API mode
    if mode == "api" and api_logger:
        api_logger.print_session_stats()
        api_logger.save_session_summary()
        
    if mode == "api" and cache:
        cache.print_stats()

if __name__ == "__main__":
    main()
