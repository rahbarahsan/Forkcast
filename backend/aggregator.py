"""Deterministic ingredient parsing and aggregation; no network or model required."""

import json
import math
import re
from collections import defaultdict
from fractions import Fraction
from pathlib import Path

try:
    from .grocery_rules.plural_resolver import normalize_plural
except ImportError:
    from grocery_rules.plural_resolver import normalize_plural

UNIT_ALIASES = {
    "liter": "l",
    "liters": "l",
    "litre": "l",
    "litres": "l",
    "gram": "g",
    "grams": "g",
    "gm": "g",
    "kilogram": "kg",
    "kilograms": "kg",
    "millilitre": "ml",
    "millilitres": "ml",
    "milliliter": "ml",
    "milliliters": "ml",
    "cloves": "clove",
    "piece": "pcs",
    "pieces": "pcs",
    "pc": "pcs",
    "cups": "cup",
    "tablespoon": "tbsp",
    "tablespoons": "tbsp",
    "tbsps": "tbsp",
    "teaspoon": "tsp",
    "teaspoons": "tsp",
    "tsps": "tsp",
    # Containers remain distinct from individual pieces.
    "jar": "jar",
    "jars": "jar",
    "can": "can",
    "cans": "can",
    "tin": "tin",
    "tins": "tin",
    "bottle": "bottle",
    "bottles": "bottle",
    "packet": "packet",
    "packets": "packet",
    "pack": "pack",
    "packs": "pack",
    "bunch": "bunch",
    "bunches": "bunch",
    "head": "head",
    "heads": "head",
    "handful": "handful",
    "handfuls": "handful",
    "pinch": "pinch",
    "pinches": "pinch",
    "slice": "slice",
    "slices": "slice",
    "sprig": "sprig",
    "sprigs": "sprig",
    "stalk": "stalk",
    "stalks": "stalk",
}

KNOWN_UNITS = {"g", "kg", "ml", "l", "cup", "tbsp", "tsp", "pcs", "clove"} | set(UNIT_ALIASES)


def _canonical_unit(token: str) -> str:
    """Normalize unit spelling while preserving the kind of measure."""
    return UNIT_ALIASES.get(token, token)


_NUMBER_RE = re.compile(r"^(\d+(?:\.\d+)?)$")
_FRACTION_RE = re.compile(r"^(\d+)/(\d+)$")
# "320g", "150ml" -- quantity and unit written without a space
_GLUED_RE = re.compile(r"^(\d+(?:\.\d+)?)([a-z]+)$")


def _to_float(token: str) -> float | None:
    """Parse '2', '1.5' or '1/2'. Returns None if the token is not numeric."""
    match = _NUMBER_RE.match(token)
    if match:
        return float(match.group(1))
    match = _FRACTION_RE.match(token)
    if match and float(match.group(2)) != 0:
        return float(match.group(1)) / float(match.group(2))
    return None


def parse_ingredient_string(ingredient_string: str) -> tuple[float, str, str]:
    """
    Parses an ingredient string to extract quantity, unit, and ingredient name.

    Handles 'quantity unit name' ("2 cloves garlic"), 'quantity name'
    ("3 eggs"), glued forms ("320g Arborio rice") and a bare name ("salt").
    Preparation notes are dropped, so "2 cloves garlic, minced" yields the
    ingredient "garlic" rather than "cloves garlic, minced".

    Returns (quantity, unit, name); quantity is 0.0 and unit "" when absent.
    """
    text = ingredient_string.strip().lower()
    for glyph, fraction in {
        "½": "1/2",
        "¼": "1/4",
        "¾": "3/4",
        "⅓": "1/3",
        "⅔": "2/3",
        "⅛": "1/8",
    }.items():
        text = text.replace(glyph, " " + fraction + " ")

    # "1L stock (warm), heated" -> "1l stock": everything after a comma and
    # anything parenthesised is preparation detail, not part of the ingredient.
    text = re.sub(r"\(.*?\)", " ", text)
    text = text.split(",")[0].strip()

    parts = text.split()
    quantity = 0.0
    unit = ""

    if parts:
        value = _to_float(parts[0])
        if value is not None:
            quantity = value
            parts = parts[1:]
            if parts and _FRACTION_RE.match(parts[0]):
                fraction = _to_float(parts[0])
                if fraction is not None:
                    quantity += fraction
                    parts = parts[1:]
            if parts and parts[0] in KNOWN_UNITS:
                unit = _canonical_unit(parts[0])
                parts = parts[1:]
        else:
            glued = _GLUED_RE.match(parts[0])
            if glued and glued.group(2) in KNOWN_UNITS:
                quantity = float(glued.group(1))
                unit = _canonical_unit(glued.group(2))
                parts = parts[1:]

    name = " ".join(parts).strip()

    # A numeric quantity without a measure is a count.
    if quantity and not unit:
        unit = "pcs"

    # A string that is only a quantity and unit has no ingredient to speak of;
    # fall back to the original text rather than returning an empty name.
    if not name:
        name = ingredient_string.strip().lower()

    return quantity, unit, name


class IngredientCatalog:
    def __init__(self, lookup=None):
        if lookup is None:
            source = Path(__file__).resolve().parents[1] / "datasets" / "catalog.json"
            lookup = json.loads(source.read_text(encoding="utf-8"))["ingredient_lookup"]
        self.names = {}
        self.categories = {}
        for row in lookup:
            canonical = row["canonical"].strip().lower()
            self.categories[canonical] = row.get("category") or "Other"
            for name in [
                canonical,
                *row.get("synonyms", "").split(","),
                *(row.get("plurals") or "").split(","),
            ]:
                if name.strip():
                    self.names[name.strip().lower()] = canonical

    def canonical(self, name):
        name = re.sub(r"\b(to taste|for garnish|for serving)\b", "", name.lower()).strip()
        return (
            self.names.get(name) or self.names.get(normalize_plural(name)) or normalize_plural(name)
        )

    def category(self, name):
        return self.categories.get(self.canonical(name), "Other")


def normalize_ingredient_name(name):
    return IngredientCatalog().canonical(name)


def _amount(quantity, unit):
    conversions = {
        "kg": (1000, "g"),
        "l": (1000, "ml"),
        "tbsp": (15, "ml"),
        "tsp": (5, "ml"),
        "cup": (240, "ml"),
    }
    factor, unit = conversions.get(unit, (1, unit or "unspecified"))
    return quantity * factor, unit


class SmartGroceryAggregator:
    def __init__(self, recipes, pantry_items, lookup=None, preprocessed=None):
        self.recipes = [r.model_dump() if hasattr(r, "model_dump") else r for r in recipes]
        self.pantry = [p.model_dump() if hasattr(p, "model_dump") else p for p in pantry_items]
        self.catalog = IngredientCatalog(lookup)
        self.preprocessed = preprocessed or {}

    def generate(self):
        owned = {self.catalog.canonical(parse_ingredient_string(p["name"])[2]) for p in self.pantry}
        totals = defaultdict(lambda: defaultdict(float))
        for recipe in self.recipes:
            if not isinstance(recipe.get("ingredients"), list):
                raise ValueError("Recipe ingredients must be a list")
            prepared = self.preprocessed.get(recipe["id"], [])
            by_line = {row.get("raw_text", "").strip().lower(): row for row in prepared}
            for line in recipe["ingredients"]:
                quantity, unit, name = parse_ingredient_string(line)
                row = by_line.get(line.strip().lower())
                if row:
                    try:
                        parsed_quantity = float(Fraction(str(row.get("quantity") or "0")))
                        if not math.isfinite(parsed_quantity) or parsed_quantity < 0:
                            raise ValueError("Invalid quantity")
                        quantity, unit, name = (
                            parsed_quantity,
                            _canonical_unit(row.get("unit") or ""),
                            row["name"],
                        )
                    except (ValueError, ZeroDivisionError):
                        pass
                name = self.catalog.canonical(name)
                if not name or name in owned:
                    continue
                quantity, unit = _amount(quantity, unit)
                totals[name][unit] += quantity
        raw = {
            name: {u: round(q, 4) for u, q in sorted(amounts.items())}
            for name, amounts in sorted(totals.items())
        }
        categorized = defaultdict(list)
        for name in raw:
            categorized[self.catalog.category(name)].append(name)
        return dict(sorted(categorized.items())), raw


def smart_grocery_aggregation(recipes, pantry):
    categorized, raw = SmartGroceryAggregator(recipes, pantry).generate()
    return raw, categorized
