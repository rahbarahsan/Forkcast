try:
    from ..aggregator import IngredientCatalog
except ImportError:
    from aggregator import IngredientCatalog


def get_canonical_name(ingredient):
    return IngredientCatalog().canonical(ingredient)
