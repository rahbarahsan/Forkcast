import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl;

console.log('API BASE_URL:', BASE_URL);

export const API_ENDPOINTS = {
  recipes: `${BASE_URL}/recipes`,
  groceryList: `${BASE_URL}/grocery-list`,
  // Add more endpoints here as needed
};

console.log('API_ENDPOINTS:', API_ENDPOINTS);
