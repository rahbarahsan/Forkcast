# Shared recipe catalog

The catalog contains 50 halal recipe adaptations researched from nine original
publishers, with 18 cuisine/region labels. Each recipe links to its original
recipe card and records its halal assumptions and adaptation choices.

The dataset includes 933 prepared ingredient lines and 239 canonical lookup
entries. Grocery reconciliation accounts for 859 purchase source lines across
235 grocery names; cooking water and three explicitly reused cooking liquids
are excluded from purchases. Methods are independently worded for this catalog;
source recipe photos and articles are not bundled.

Use halal meat and suitable packaged ingredients as described in each recipe.
These adaptations do not certify a publisher, brand, store, or product. Original
measures, forms, and explicit weight equivalents are retained; source range choices,
piece-to-serving assumptions and inconsistent equivalents are explained in notes.
Fresh/dried, raw/cooked, rice varieties, meat cuts, oils, and salt types stay distinct.
The recipes have not been tested in a kitchen as part of this repository.

Run python scripts/validate_catalog.py to check every prepared line, provenance,
aisle and independent grocery-total reconciliation without any model or network.
Runtime personal recipes never update this dataset. Startup refreshes the shared
reference rows. Personal overrides and recipes used by existing plans survive a
catalog replacement; retired starter recipes are explicitly marked unreviewed.

## Original publishers

- Feel Good Foodie: 5 recipes
- Hungry Paprikas: 5 recipes
- Immaculate Bites: 2 recipes
- Rasa Malaysia: 9 recipes
- RecipeTin Eats: 4 recipes
- Swasthi's Recipes: 11 recipes
- Taste of Maroc: 1 recipes
- Tea for Turmeric: 7 recipes
- The Mediterranean Dish: 6 recipes

## Source index

| Recipe | Cuisine | Original recipe |
|---|---|---|
| Aloo Baingan | Pakistani | [Tea for Turmeric](https://www.teaforturmeric.com/aloo-baingan-eggplant-and-potato-curry/) |
| Aloo Gobi | North Indian | [Swasthi's Recipes](https://www.indianhealthyrecipes.com/aloo-gobi-recipe/) |
| Aloo Keema | Pakistani | [Tea for Turmeric](https://www.teaforturmeric.com/aloo-keema/) |
| Ayam Masak Merah | Malaysian | [Rasa Malaysia](https://rasamalaysia.com/ayam-masak-merah-recipe/) |
| Beef Rendang | Malaysian | [Rasa Malaysia](https://rasamalaysia.com/beef-rendang-recipe-rendang-daging/) |
| Bhindi Masala | North Indian | [Swasthi's Recipes](https://www.indianhealthyrecipes.com/bhindi-masala-recipe/) |
| Chana Masala | North Indian | [Swasthi's Recipes](https://www.indianhealthyrecipes.com/chana-masala/) |
| Chapli Kabab | Pakistani | [Tea for Turmeric](https://www.teaforturmeric.com/chapli-kabab/) |
| Chicken Machboos | Arabian Gulf | [Hungry Paprikas](https://www.hungrypaprikas.com/chicken-machboos/) |
| Chicken Mandi with Yellow Rice | Yemeni | [Hungry Paprikas](https://www.hungrypaprikas.com/chicken-mandi-yemeni-chicken-rice/) |
| Chicken Pepper Soup | West African | [Immaculate Bites](https://www.africanbites.com/african-pepper-soupchicken/) |
| Chicken Shawarma Pitas | Levantine | [The Mediterranean Dish](https://www.themediterraneandish.com/chicken-shawarma-recipe/) |
| Chicken Tikka Masala | Indian | [RecipeTin Eats](https://www.recipetineats.com/chicken-tikka-masala/) |
| Dal Tadka | North Indian | [Swasthi's Recipes](https://www.indianhealthyrecipes.com/dal-tadka/) |
| Fattoush Salad | Levantine | [The Mediterranean Dish](https://www.themediterraneandish.com/fattoush-salad/) |
| Garlic Butter Salmon Kebabs | American | [Rasa Malaysia](https://rasamalaysia.com/garlic-butter-salmon-kebab/) |
| Hummus | Levantine | [RecipeTin Eats](https://www.recipetineats.com/hummus/) |
| Indian Chicken Curry | Indian | [Swasthi's Recipes](https://www.indianhealthyrecipes.com/chicken-curry/) |
| Iraqi Dolma | Iraqi | [Hungry Paprikas](https://www.hungrypaprikas.com/iraqi-dolma/) |
| Lebanese Baba Ghanoush | Lebanese | [Feel Good Foodie](https://feelgoodfoodie.net/recipe/baba-ghanoush/) |
| Lebanese Falafel | Lebanese | [Feel Good Foodie](https://feelgoodfoodie.net/recipe/falafel/) |
| Lebanese Mujadara | Lebanese | [Feel Good Foodie](https://feelgoodfoodie.net/recipe/mujadara/) |
| Lebanese Rice with Vermicelli | Lebanese | [Feel Good Foodie](https://feelgoodfoodie.net/recipe/lebanese-rice/) |
| Maafe (West African Peanut Soup with Beef) | West African | [Immaculate Bites](https://www.africanbites.com/maafe-west-african-peanut-soup/) |
| Malaysian Chicken Curry | Malaysian | [Rasa Malaysia](https://rasamalaysia.com/malaysian-chicken-curry/) |
| Malaysian Chicken Satay | Malaysian | [Rasa Malaysia](https://rasamalaysia.com/recipe-chicken-satay/) |
| Malaysian Satay Chicken Curry | Malaysian | [RecipeTin Eats](https://www.recipetineats.com/chicken-satay-curry/) |
| Masala Dosa | South Indian | [Swasthi's Recipes](https://www.indianhealthyrecipes.com/masala-dosa-recipe/) |
| Masoor Dal | Pakistani | [Tea for Turmeric](https://www.teaforturmeric.com/masoor-dal/) |
| Moroccan Harira | Moroccan | [The Mediterranean Dish](https://www.themediterraneandish.com/harira-recipe/) |
| Moroccan Meatball Tagine in Tomato Sauce (Kefta Mkaoura) | Moroccan | [Taste of Maroc](https://tasteofmaroc.com/moroccan-meatball-tagine-tomato-sauce/) |
| Musakhan Rolls | Palestinian | [Hungry Paprikas](https://www.hungrypaprikas.com/musakhan-rolls/) |
| Mushroom Masala Curry | Indian | [Swasthi's Recipes](https://www.indianhealthyrecipes.com/mushroom-curry/) |
| Nasi Goreng with Chicken | Indonesian | [RecipeTin Eats](https://www.recipetineats.com/nasi-goreng-indonesian-fried-rice/) |
| Nasi Lemak | Malaysian | [Rasa Malaysia](https://rasamalaysia.com/nasi-lemak-recipe/) |
| Pakistani Chicken Biryani | Pakistani | [Tea for Turmeric](https://www.teaforturmeric.com/chicken-biryani/) |
| Pakistani Chicken Karahi | Pakistani | [Tea for Turmeric](https://www.teaforturmeric.com/chicken-karahi/) |
| Pakistani Chicken Yakhni Pulao | Pakistani | [Tea for Turmeric](https://www.teaforturmeric.com/chicken-pulao-yakhni-pulao/) |
| Palak Paneer | North Indian | [Swasthi's Recipes](https://www.indianhealthyrecipes.com/palak-paneer-recipe-easy-paneer-recipes-step-by-step-pics/) |
| Paneer Tikka Masala | North Indian | [Swasthi's Recipes](https://www.indianhealthyrecipes.com/paneer-tikka-masala-recipe-sanjeev-kapoor/) |
| Punjabi Rajma Masala | North Indian | [Swasthi's Recipes](https://www.indianhealthyrecipes.com/rajma-recipe-rajma-masala-recipe/) |
| Roti Canai | Malaysian | [Rasa Malaysia](https://rasamalaysia.com/roti-canai-roti-paratha-recipe/) |
| Shakshuka | Tunisian | [The Mediterranean Dish](https://www.themediterraneandish.com/shakshuka-recipe/) |
| Shish Barak (Beef Dumplings in Yogurt Sauce) | Lebanese | [Hungry Paprikas](https://www.hungrypaprikas.com/shish-barak/) |
| Shish Tawook | Lebanese | [Feel Good Foodie](https://feelgoodfoodie.net/recipe/shish-tawook/) |
| Spanakorizo (Greek Spinach Rice) | Greek | [The Mediterranean Dish](https://www.themediterraneandish.com/spanakorizo-greek-spinach-rice/) |
| Tabouli Salad | Levantine | [The Mediterranean Dish](https://www.themediterraneandish.com/tabouli-salad/) |
| Tandoori Chicken | Indian | [Rasa Malaysia](https://rasamalaysia.com/tandoori-chicken-recipe/) |
| Thai Green Chicken Curry | Thai | [Rasa Malaysia](https://rasamalaysia.com/green-curry/) |
| Vegetable Biryani | Indian | [Swasthi's Recipes](https://www.indianhealthyrecipes.com/veg-biryani/) |

## Grocery evaluation

grocery-evaluation.json is a fixed twelve-case interpretation benchmark covering
spelling, fresh/dried and raw/cooked distinctions, meat forms, quantities and aisles.
Optional subscription runs use scripts/evaluate_groceries.py. Results are local
evaluation artifacts and do not enter the recipe catalog or personal database.
