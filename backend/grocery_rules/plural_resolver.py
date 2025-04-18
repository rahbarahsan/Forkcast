# backend/grocery_rules/plural_resolver.py

import re

IRREGULAR_PLURALS = {
    "tomatoes": "tomato",
    "potatoes": "potato",
    "chilies": "chili",
    "buses": "bus",
    "leaves": "leaf",
    "knives": "knife",
    "wives": "wife",
    "men": "man",
    "women": "woman",
    "children": "child",
    "feet": "foot",
    "teeth": "tooth",
    "mice": "mouse",
    "geese": "goose",
    "oxen": "ox",
    "lice": "louse",
    "cloves": "clove",
    "berries": "berry",
    "cherries": "cherry",
    "strawberries": "strawberry",
    "blueberries": "blueberry",
    "raspberries": "raspberry",
    "loaves": "loaf",
    "calves": "calf",
    "halves": "half",
    "fungi": "fungus",
    "fish": "fish",
    "sheep": "sheep",
    "shrimp": "shrimp",
    "salmon": "salmon",
    "trout": "trout",
    "pike": "pike",
    "cod": "cod",
    "haddock": "haddock",
    "mackerel": "mackerel",
    "squid": "squid",
    "poultry": "poultry",
}

def normalize_plural(word: str) -> str:
    """
    Converts plural to singular using basic English rules and known exceptions.
    """
    word = word.lower().strip()

    # Exact match first
    if word in IRREGULAR_PLURALS:
        return IRREGULAR_PLURALS[word]

    # Strip trailing 'es' where applicable
    if re.search(r'(ches|shes|xes|sses|zes)$', word):
        return word[:-2]

    # 'ies' → 'y'
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"

    # Regular plural ending in 's'
    if word.endswith("s") and len(word) > 3 and not word.endswith("ss"):
        return word[:-1]

    return word
