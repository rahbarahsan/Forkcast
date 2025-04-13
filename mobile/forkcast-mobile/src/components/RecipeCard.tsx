// src/components/RecipeCard.tsx

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Recipe } from '../types';

interface Props {
  recipe: Recipe;
  isSelected: boolean;
  onToggleSelect: () => void;
  expanded: boolean;
  onExpand: () => void;
}

export default function RecipeCard({
  recipe,
  isSelected,
  onToggleSelect,
  expanded,
  onExpand,
}: Props) {
  const getImageSource = (img: string | any) => {
    try {
      if (typeof img === 'string') {
        return { uri: img };
      } else if (img) {
        return img;
      }
    } catch {
      // Fallback silently
    }
    return require('../../assets/images/placeholder.jpg');
  };

  return (
    <TouchableOpacity onPress={onExpand} style={[styles.card, isSelected && styles.selectedCard]}>
      <Image source={getImageSource(recipe.image)} style={styles.image} resizeMode="cover" />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.selectText}>{isSelected ? '✅' : '⬜'}</Text>
        </View>
        <Text style={styles.ingredientCount}>{recipe.ingredients.length} ingredients</Text>

        {expanded && (
          <View style={styles.detailsBox}>
            <Text style={styles.metaText}>
              Prep: {recipe.prepTime} | Cook: {recipe.cookTime}
            </Text>
            <Text style={styles.sectionHeader}>Ingredients:</Text>
            <Text>{recipe.ingredients.join(', ')}</Text>
            <Text style={styles.sectionHeader}>Instructions:</Text>
            <Text>{recipe.instructions}</Text>
          </View>
        )}

        <TouchableOpacity onPress={onToggleSelect} style={{ marginTop: 8 }}>
          <Text style={styles.toggleButton}>{isSelected ? 'Unselect' : 'Select'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  ingredientCount: {
    color: '#666',
    fontSize: 14,
  },
  footer: {
    marginTop: 10,
  },
  selectText: {
    fontSize: 18,
    marginLeft: 8,
  },
  toggleButton: {
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'right',
  },
  detailsBox: {
    marginTop: 10,
  },
  sectionHeader: {
    fontWeight: 'bold',
    marginTop: 6,
  },
  metaText: {
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
});
