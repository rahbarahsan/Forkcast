from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class RecipeInput(Input):
    title: Text
    cuisine: str = Field(default="Home cooking", max_length=100)
    image: str = Field(default="placeholder", max_length=2000)
    ingredients: list[Text] = Field(min_length=1, max_length=200)
    instructions: str = Field(min_length=1, max_length=30000)
    prep_time: str = Field(default="", max_length=100)
    cook_time: str = Field(default="", max_length=100)
    servings: int = Field(default=4, ge=1, le=100)
    source_url: str = Field(default="", max_length=2000, pattern=r"^(https://[^\s]+)?$")
    source_name: str = Field(default="", max_length=200)
    halal_notes: str = Field(default="", max_length=2000)


class PantryInput(Input):
    name: Text
    quantity: str = Field(default="", max_length=100)


class PlanInput(Input):
    name: Text = "Meal plan"
    recipeIds: list[str] = Field(default_factory=list, max_length=100)
    startDate: date | None = None
    endDate: date | None = None
    isActive: bool = False

    @model_validator(mode="after")
    def valid_dates(self):
        if self.startDate and self.endDate and self.startDate > self.endDate:
            raise ValueError("End date must be on or after start date")
        self.recipeIds = list(dict.fromkeys(self.recipeIds))
        return self


class PantryItem(PantryInput):
    id: str | None = None


class GroceryRequest(Input):
    recipe_ids: list[str] = Field(default_factory=list, max_length=100)
    selected_ids: list[str] = Field(default_factory=list, max_length=100)
    plan_ids: list[str] = Field(default_factory=list, max_length=100)
    pantry_items: list[PantryItem] | None = None
    is_guest: bool = True
    intelligence: Literal["auto", "local", "model"] = "auto"
    scale: dict[str, float] = Field(default_factory=dict, max_length=100)

    @model_validator(mode="after")
    def valid_scale(self):
        if any(not 0 < value <= 20 for value in self.scale.values()):
            raise ValueError("Recipe multipliers must be above zero and at most 20")
        return self


class GroceryResponse(BaseModel):
    categorized: dict[str, list[str]]
    raw: dict[str, dict[str, float]]
    items: list[dict] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    method: str = "local"
    pantry_deductions: list[dict] = Field(default_factory=list)


class HistoryInput(Input):
    name: Text = "Shopping list"
    recipe_ids: list[str] = Field(default_factory=list, max_length=100)
    checked: list[str] = Field(default_factory=list, max_length=500)
    grocery_list: GroceryResponse


class ActivePlan(Input):
    id: str | None


class TextImport(Input):
    text: str = Field(min_length=1, max_length=100000)


class PantryBatch(Input):
    items: list[PantryInput] = Field(min_length=1, max_length=200)


class OfferInput(Input):
    name: Text
    store: Text
    price: float = Field(gt=0, le=100000, multiple_of=0.01)
    quantity: float = Field(gt=0, le=1000000)
    unit: Literal["g", "kg", "ml", "l", "pcs", "clove"]
    currency: str = Field(default="CAD", pattern=r"^[A-Z]{3}$")
    valid_until: date | None = None


class OfferBatch(Input):
    items: list[OfferInput] = Field(min_length=1, max_length=200)


class OptimizeRequest(GroceryRequest):
    currency: str = Field(default="CAD", pattern=r"^[A-Z]{3}$")


class ExtractInput(Input):
    task: Literal["recipe", "pantry", "offers"]
    text: str = Field(default="", max_length=100000)
    image: str | None = Field(default=None, max_length=7500000)

    @model_validator(mode="after")
    def has_material(self):
        if not self.text.strip() and not self.image:
            raise ValueError("Provide text or an image")
        return self


class YouTubeInput(Input):
    url: str = Field(min_length=1, max_length=2000)
    pasted_text: str = Field(default="", max_length=90000)
    use_model: bool = True
    languages: list[str] = Field(
        default_factory=lambda: ["en", "ur", "hi", "ar"], min_length=1, max_length=5
    )


class StoreSearch(Input):
    location: str = Field(min_length=3, max_length=200)
    radius: int = Field(default=5000, ge=500, le=15000)


class ModelSettings(Input):
    provider: Literal["none", "codex", "claude", "openai", "anthropic", "google"]
    model: str = Field(default="", max_length=200, pattern=r"^[A-Za-z0-9._:/-]*$")
