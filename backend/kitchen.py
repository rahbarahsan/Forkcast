"""Local kitchen tools: coverage, inventory text, and comparable pack prices."""

import re
from datetime import date
from decimal import ROUND_CEILING, Decimal

try:
    from .aggregator import IngredientCatalog, SmartGroceryAggregator, parse_ingredient_string
except ImportError:
    from aggregator import IngredientCatalog, SmartGroceryAggregator, parse_ingredient_string


def suggestions(recipes, pantry, lookup, preprocessed=None):
    catalog = IngredientCatalog(lookup)
    owned = {catalog.canonical(p["name"]) for p in pantry}
    result = []
    for recipe in recipes:
        _, raw = SmartGroceryAggregator([recipe], [], lookup, preprocessed).generate()
        names = set(raw)
        present = sorted(names & owned)
        missing = sorted(names - owned)
        result.append(
            {
                "recipe_id": recipe["id"],
                "available": present,
                "missing": missing,
                "coverage": round(len(present) / max(len(names), 1), 3),
            }
        )
    return sorted(result, key=lambda r: (-r["coverage"], len(r["missing"]), r["recipe_id"]))


def pantry_preview(text):
    result = []
    for line in re.split(r"[\n;]+", text):
        line = re.sub(r"^\s*[-*•]\s*", "", line).strip()
        if not line:
            continue
        quantity, unit, name = parse_ingredient_string(line)
        result.append(
            {"name": name, "quantity": f"{quantity:g} {unit}".strip() if quantity else ""}
        )
    return result


PACK_UNITS = {
    "kg": (Decimal(1000), "g"),
    "g": (Decimal(1), "g"),
    "l": (Decimal(1000), "ml"),
    "ml": (Decimal(1), "ml"),
    "pcs": (Decimal(1), "pcs"),
    "clove": (Decimal(1), "clove"),
}


def optimize(grocery, offers, lookup, currency):
    catalog = IngredientCatalog(lookup)
    valid = [
        o
        for o in offers
        if o["currency"] == currency
        and (not o.get("valid_until") or o["valid_until"] >= date.today().isoformat())
    ]
    lines, unpriced = [], []
    total = Decimal(0)
    for name, amounts in grocery["raw"].items():
        for unit, required in amounts.items():
            candidates = []
            for offer in valid:
                factor, normalized_unit = PACK_UNITS[offer["unit"]]
                if (
                    catalog.canonical(offer["name"]) != name
                    or normalized_unit != unit
                    or required <= 0
                ):
                    continue
                pack_size = Decimal(str(offer["quantity"])) * factor
                packs = int(
                    (Decimal(str(required)) / pack_size).to_integral_value(rounding=ROUND_CEILING)
                )
                cost = Decimal(str(offer["price"])) * packs
                candidates.append((cost, packs, offer))
            if not candidates:
                unpriced.append({"name": name, "quantity": required, "unit": unit})
                continue
            cost, packs, offer = min(candidates, key=lambda c: (c[0], c[2]["store"], c[2]["id"]))
            total += cost
            lines.append(
                {
                    "name": name,
                    "required": required,
                    "unit": unit,
                    "store": offer["store"],
                    "packs": packs,
                    "pack_quantity": offer["quantity"],
                    "pack_unit": offer["unit"],
                    "pack_price": offer["price"],
                    "cost": float(cost.quantize(Decimal(".01"))),
                }
            )
    return {
        "currency": currency,
        "total": float(total.quantize(Decimal(".01"))),
        "items": lines,
        "unpriced": unpriced,
        "method": "Lowest whole-pack cost per ingredient and comparable unit; travel costs and mixed pack sizes are excluded.",
    }
