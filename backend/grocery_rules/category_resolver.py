try:
    from ..aggregator import IngredientCatalog
except ImportError:
    from aggregator import IngredientCatalog


def get_category(ingredient):
    return IngredientCatalog().category(ingredient)
