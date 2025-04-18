# /backend/grocery_rules/unit_threshold_rules.py

"""
Unit estimation logic for Smart Grocery Aggregator
This module maps quantity-unit combinations to approximate weights (in kg)
"""

from typing import List, Tuple


# Each rule defines (quantity_range, approx_weight_in_kg)
UNIT_THRESHOLD_RULES = {
    "pcs": [
        (range(1, 3), 0.25),     # 1-2 pcs ≈ 250g
        (range(3, 6), 0.5),      # 3-5 pcs ≈ 500g
        (range(6, 9), 0.75),     # 6-8 pcs ≈ 750g
        (range(9, 100), 1.0),    # 9+ pcs ≈ 1kg
    ],
    "cup": [
        (range(1, 2), 0.25),
        (range(2, 3), 0.5),
        (range(3, 5), 0.75),
        (range(5, 100), 1.0),
    ],
    "tbsp": [
        (range(1, 4), 0.05),     # 1–3 tbsp ≈ 50g
        (range(4, 7), 0.1),
        (range(7, 100), 0.2),
    ],
    "tsp": [
        (range(1, 4), 0.01),
        (range(4, 10), 0.025),
        (range(10, 100), 0.05),
    ],
    "g": [
        (range(0, 100), 0.05),
        (range(100, 250), 0.1),
        (range(250, 500), 0.25),
        (range(500, 1000), 0.5),
        (range(1000, 10000), 1.0),
    ],
    "kg": [
        (range(0, 2), 1.0),  # assume 1kg minimum if unit is kg
    ],
    "ml": [
        (range(0, 250), 0.1),
        (range(250, 500), 0.25),
        (range(500, 1000), 0.5),
        (range(1000, 10000), 1.0),
    ],
    "litre": [
        (range(0, 2), 1.0),
    ],
    "cloves": [
        (range(1, 4), 0.05),
        (range(4, 10), 0.1),
        (range(10, 20), 0.2),
        (range(20, 100), 0.25),
    ],
}


def estimate_weight(quantity: float, unit: str) -> float:
    """
    Estimate the weight in kg given a quantity and unit using the defined thresholds.

    Args:
        quantity (float): the amount from the parsed string.
        unit (str): the unit (e.g. "pcs", "cup", "kg", etc.)

    Returns:
        float: estimated weight in kg
    """
    unit = unit.lower()
    rules: List[Tuple[range, float]] = UNIT_THRESHOLD_RULES.get(unit, [])

    for q_range, weight in rules:
        if int(quantity) in q_range:
            return weight

    # Default fallback
    return 0.5  # Conservative estimate if no match
