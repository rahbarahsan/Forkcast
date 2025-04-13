// src/screens/GroceryListScreen.tsx

import React, { useContext, useState, useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import screenStyles from '../styles/screenStyle';
import { RecipesContext } from '../context/RecipesContext';
import { PantryContext } from '../context/PantryContext';
import fallbackRecipes from '../data/fallbackRecipes';
import { PantryItem, Recipe } from '../types';

function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/s$/, '');
}

export default function GroceryListScreen() {
  const { selectedIds } = useContext(RecipesContext);
  const { items: pantryItems } = useContext(PantryContext);

  const [neededIngredients, setNeededIngredients] = useState<string[]>([]);

  useEffect(() => {
    const selectedRecipes: Recipe[] = fallbackRecipes.filter((r) => selectedIds.has(r.id));

    // Flatten and normalize recipe ingredients
    const allIngredients = selectedRecipes.flatMap((r) => r.ingredients.map((i) => normalize(i)));

    // Normalize pantry names
    const pantrySet = new Set(pantryItems.map((p) => normalize(p.name)));

    const needed = allIngredients.filter((ing) => !pantrySet.has(ing));

    // Remove duplicates
    setNeededIngredients([...new Set(needed)]);
  }, [selectedIds, pantryItems]);

  return (
    <View style={screenStyles.container}>
      {neededIngredients.length === 0 ? (
        <Text>All ingredients are available in your pantry 🎉</Text>
      ) : (
        <FlatList
          data={neededIngredients}
          keyExtractor={(item, index) => `${item}-${index}`}
          renderItem={({ item }) => <Text>🛒 {item}</Text>}
        />
      )}
    </View>
  );
}
