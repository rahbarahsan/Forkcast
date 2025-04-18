// src/data/ingredientDictionary.ts

export interface IngredientEntry {
  canonical: string;
  synonyms: string[]; // various ways users/recipes refer to this item
  category: string; // broad grocery category
  exceptions?: string[]; // words that look similar but belong elsewhere
}

// Focused on South Asian & general cuisines
export const IngredientDictionary: IngredientEntry[] = [
  {
    canonical: 'onion',
    synonyms: ['onion', 'onions', 'pyaz', 'shallot', 'scallion', 'spring onion'],
    category: 'Vegetables',
  },
  {
    canonical: 'garlic',
    synonyms: ['garlic', 'lahsun', 'garlic clove', 'garlic cloves'],
    category: 'Vegetables',
  },
  {
    canonical: 'tomato',
    synonyms: ['tomato', 'tomatoes', 'tamatar'],
    category: 'Vegetables',
  },
  {
    canonical: 'rice',
    synonyms: ['rice', 'basmati rice', 'chawal', 'brown rice', 'white rice'],
    category: 'Grains & Bakery',
  },
  {
    canonical: 'lentil',
    synonyms: ['lentil', 'dal', 'moong dal', 'masoor dal', 'toor dal'],
    category: 'Grains & Bakery',
  },
  {
    canonical: 'yogurt',
    synonyms: ['yogurt', 'dahi', 'curd'],
    category: 'Dairy',
  },
  {
    canonical: 'chicken',
    synonyms: ['chicken', 'murgh', 'poultry'],
    category: 'Meat & Seafood',
  },
  {
    canonical: 'beef',
    synonyms: ['beef', 'gomash'],
    category: 'Meat & Seafood',
  },
  {
    canonical: 'potato',
    synonyms: ['potato', 'aloo'],
    category: 'Vegetables',
  },
  {
    canonical: 'oil',
    synonyms: ['oil', 'cooking oil', 'mustard oil', 'olive oil', 'vegetable oil'],
    category: 'Condiments & Spices',
    exceptions: ['soy sauce', 'fish sauce'], // “sauce” belongs elsewhere
  },
  {
    canonical: 'salt',
    synonyms: ['salt', 'namak', 'sea salt', 'table salt'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'pepper',
    synonyms: ['pepper', 'black pepper', 'kali mirch'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'turmeric',
    synonyms: ['turmeric', 'haldi'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'chili powder',
    synonyms: ['chili powder', 'red chili powder', 'lal mirch powder'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'coriander',
    synonyms: ['coriander', 'dhaniya'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'ginger',
    synonyms: ['ginger', 'adrak'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'butter',
    synonyms: ['butter', 'makhan'],
    category: 'Dairy',
  },
  {
    canonical: 'cream',
    synonyms: ['cream', 'malai', 'heavy cream'],
    category: 'Dairy',
  },
  {
    canonical: 'milk',
    synonyms: ['milk', 'doodh'],
    category: 'Dairy',
  },
  {
    canonical: 'flour',
    synonyms: ['flour', 'atta', 'maida'],
    category: 'Grains & Bakery',
  },
  {
    canonical: 'egg',
    synonyms: ['egg', 'eggs', 'anda'],
    category: 'Meat & Seafood',
  },
  {
    canonical: 'banana',
    synonyms: ['banana', 'kela'],
    category: 'Fruits',
  },
  {
    canonical: 'apple',
    synonyms: ['apple', 'seb'],
    category: 'Fruits',
  },
  {
    canonical: 'mango',
    synonyms: ['mango', 'aam'],
    category: 'Fruits',
  },
  {
    canonical: 'coconut',
    synonyms: ['coconut', 'nariyal'],
    category: 'Other',
  },
  {
    canonical: 'cumin',
    synonyms: ['cumin', 'jeera'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'garam masala',
    synonyms: ['garam masala'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'mustard seeds',
    synonyms: ['mustard seeds', 'rai'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'fenugreek',
    synonyms: ['fenugreek', 'methi'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'cardamom',
    synonyms: ['cardamom', 'elaichi'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'cloves',
    synonyms: ['cloves', 'laung'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'cinnamon',
    synonyms: ['cinnamon', 'dalchini'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'bay leaves',
    synonyms: ['bay leaves', 'tej patta'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'curry leaves',
    synonyms: ['curry leaves', 'kari patta'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'ghee',
    synonyms: ['ghee', 'clarified butter'],
    category: 'Dairy',
  },
  {
    canonical: 'paneer',
    synonyms: ['paneer', 'indian cheese'],
    category: 'Dairy',
  },
  {
    canonical: 'chickpeas',
    synonyms: ['chickpeas', 'chana', 'garbanzo beans'],
    category: 'Grains & Bakery',
  },
  {
    canonical: 'kidney beans',
    synonyms: ['kidney beans', 'rajma'],
    category: 'Grains & Bakery',
  },
  {
    canonical: 'spinach',
    synonyms: ['spinach', 'palak'],
    category: 'Vegetables',
  },
  {
    canonical: 'okra',
    synonyms: ['okra', 'bhindi'],
    category: 'Vegetables',
  },
  {
    canonical: 'eggplant',
    synonyms: ['eggplant', 'baingan', 'aubergine'],
    category: 'Vegetables',
  },
  {
    canonical: 'cauliflower',
    synonyms: ['cauliflower', 'gobhi'],
    category: 'Vegetables',
  },
  {
    canonical: 'green chili',
    synonyms: ['green chili', 'hari mirch'],
    category: 'Vegetables',
  },
  {
    canonical: 'tamarind',
    synonyms: ['tamarind', 'imli'],
    category: 'Condiments & Spices',
  },
  {
    canonical: 'coconut milk',
    synonyms: ['coconut milk'],
    category: 'Dairy',
  },
  // …you can extend this list over time or load from a CSV…
];
