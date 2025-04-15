// src/screens/RecipesScreen.tsx
import React, { useEffect, useContext, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator } from 'react-native';
import screenStyles from '../styles/screenStyle';
import fallbackRecipes from '../data/fallbackRecipes';
import { RecipesContext } from '../context/RecipesContext';
import RecipeCard from '../components/RecipeCard';
import { Recipe } from '../types';

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedIds, toggleSelection } = useContext(RecipesContext);

  const fetchRecipes = async () => {
    try {
      const res = await fetch('http://localhost:8000/recipes');
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      setRecipes(data);
    } catch (err) {
      console.warn('Using fallback recipes:', err);
      setRecipes(fallbackRecipes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  if (loading) {
    return (
      <View style={screenStyles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={screenStyles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            isSelected={selectedIds.has(item.id)}
            onToggleSelect={() => toggleSelection(item.id)}
          />
        )}
        ListFooterComponent={
          <View style={{ marginTop: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: '#888' }}>+ Add Custom Recipe (Coming Soon)</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}
