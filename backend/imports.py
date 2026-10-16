"""Parse portable recipe files and structured pasted text without fetching URLs."""
from html import unescape
import json
import re

try:
    from .models import RecipeInput
except ImportError:
    from models import RecipeInput


def recipe_preview(text: str):
    text = text.strip()
    if text.startswith(("{", "[")):
        data = json.loads(text)
        if isinstance(data, list):
            data = data[0]
        if "@graph" in data:
            data = next(item for item in data["@graph"] if item.get("@type") == "Recipe")
        if "recipeIngredient" in data:
            steps = data.get("recipeInstructions", "")
            if isinstance(steps, list):
                steps = "\n".join(step if isinstance(step, str) else step.get("text", "") for step in steps)
            data = {
                "title": data.get("name", "Imported recipe"), "ingredients": data["recipeIngredient"],
                "instructions": unescape(steps), "cuisine": data.get("recipeCuisine", "Home cooking"),
                "prep_time": data.get("prepTime", ""), "cook_time": data.get("cookTime", ""),
            }
        else:
            data = {key: value for key, value in data.items() if key in RecipeInput.model_fields}
        return RecipeInput.model_validate(data)

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if len(lines) < 3:
        raise ValueError("Paste a recipe with a title, Ingredients heading, and Instructions heading, or a recipe JSON file")
    title = lines.pop(0).removeprefix("Title:").strip()
    ingredients, instructions = [], []
    section = "ingredients"
    for line in lines:
        heading = line.lower().rstrip(":")
        if heading in ("ingredients", "ingredient list"):
            section = "ingredients"
        elif heading in ("instructions", "method", "directions", "steps"):
            section = "instructions"
        elif section == "ingredients":
            ingredients.append(re.sub(r"^[-*•]\s*", "", line))
        else:
            instructions.append(line)
    if not instructions:
        raise ValueError("An Instructions or Method heading is required for text import; use model extraction for a transcript")
    return RecipeInput(title=title, ingredients=ingredients, instructions="\n".join(instructions))
