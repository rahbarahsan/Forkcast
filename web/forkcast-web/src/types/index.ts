export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  image: string | number; // allow both URL and local require
  ingredients: string[];
  instructions: string;
  prepTime: string;
  cookTime: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: string; // You can update to include unit (e.g., '2 pcs', '50g')
}

export interface Plan {
  id: string;
  recipeIds: string[];
  // Add other properties of Plan if they become apparent later
}
