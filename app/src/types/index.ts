/**
 * Shared data models.
 *
 * This is the single source of truth for the shapes below. They were
 * previously declared here, again in navigation/index.tsx and again in
 * context/PlannerContext.tsx, and the copies had already drifted apart.
 */

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
  quantity: string; // May include a unit, e.g. '2 pcs', '50g'
}

export interface Plan {
  id: string;
  recipeIds: string[];
  name?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  isActive?: boolean;
}
