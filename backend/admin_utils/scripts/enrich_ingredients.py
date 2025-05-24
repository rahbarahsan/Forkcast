import csv
import os
import re
import inflect

# Optional: synonym and category maps (can be expanded)
SYNONYM_MAP = {
    "brinjal": "eggplant",
    "garbanzo beans": "chickpeas",
    "scallion": "green onion",
    "curd": "yogurt",
    "capsicum": "bell pepper",
    "coriander leaves": "cilantro",
    "chili": "chili pepper",
}

CATEGORY_MAP = {
    "onion": "produce",
    "garlic": "produce",
    "milk": "dairy",
    "cheese": "dairy",
    "chicken": "meat",
    "egg": "protein",
    "tomato": "produce",
    "cumin": "spices",
    "turmeric": "spices",
    "yogurt": "dairy",
    "bell pepper": "produce",
    "rice": "grains",
    "flour": "grains",
    "salt": "spices",
    "pepper": "spices",
    "oil": "condiments",
    "butter": "dairy",
    "eggplant": "produce",
    "chickpeas": "canned",
    "green onion": "produce",
    "cilantro": "herbs",
}

p = inflect.engine()

def to_singular(word):
    singular = p.singular_noun(word)
    return singular if singular else word

def normalize_name(name):
    name_clean = name.lower().strip()
    name_singular = to_singular(name_clean)
    return SYNONYM_MAP.get(name_singular, name_singular)

def enrich_row(row):
    original = row["name"]
    normalized = normalize_name(original)
    category = CATEGORY_MAP.get(normalized, "")
    return {
        **row,
        "name": normalized,
        "category": category,
        "synonym_of": original if original != normalized else ""
    }

def enrich_file(source, target):
    with open(source, newline='', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        enriched_rows = [enrich_row(row) for row in reader]

    fieldnames = list(enriched_rows[0].keys())
    with open(target, "w", newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(enriched_rows)

if __name__ == "__main__":
    source_path = os.path.join("csv", "parsed_ingredients.csv")
    target_path = os.path.join("csv", "final_enriched_ingredients.csv")
    enrich_file(source_path, target_path)
    print(f"✅ Enriched file saved to {target_path}")
