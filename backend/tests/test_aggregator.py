import pytest
from aggregator import SmartGroceryAggregator, parse_ingredient_string


@pytest.mark.parametrize(
    "line,expected",
    [
        ("2 cloves garlic, minced", (2, "clove", "garlic")),
        ("320g Arborio rice", (320, "g", "arborio rice")),
        ("1/2 tsp chili powder", (0.5, "tsp", "chili powder")),
        ("1L vegetable stock", (1, "l", "vegetable stock")),
        ("3 eggs", (3, "pcs", "eggs")),
    ],
)
def test_parse_ingredient(line, expected):
    assert parse_ingredient_string(line) == expected


def test_units_merge_without_inventing_density_and_synonyms_deduct_pantry():
    recipes = [
        {
            "id": "1",
            "ingredients": [
                "1 kg rice",
                "500 g rice",
                "1 cup rice",
                "2 tbsp oil",
                "2 tomatoes",
                "pyaz",
            ],
        }
    ]
    categories, raw = SmartGroceryAggregator(recipes, [{"name": "onions"}]).generate()
    assert raw["rice"] == {"g": 1500, "ml": 240}
    assert raw["oil"] == {"ml": 30}
    assert raw["tomato"] == {"pcs": 2}
    assert "onion" not in raw
    assert "tomato" in categories["Vegetables"]


def test_bad_prepared_quantity_falls_back_to_recipe_line():
    recipes = [{"id": "1", "ingredients": ["1/2 tsp chili powder"]}]
    prepared = {
        "1": [
            {
                "raw_text": "1/2 tsp chili powder",
                "quantity": "02-Jan",
                "unit": "tsp",
                "name": "chili powder",
            }
        ]
    }
    _, raw = SmartGroceryAggregator(recipes, [], preprocessed=prepared).generate()
    assert raw["chili powder"]["ml"] == 2.5
