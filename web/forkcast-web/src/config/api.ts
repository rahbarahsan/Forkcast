const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  recipes: `${BASE_URL}/api/recipes`,
  groceryList: `${BASE_URL}/api/grocery-list`,
  // Add more endpoints here as needed
};
