import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Recipe } from '../types';

interface Props {
  recipe: Recipe;
  isSelected: boolean;
  onToggleSelect: () => void;
  expanded: boolean;
  onExpand: () => void;
}

const FALLBACK_IMAGE_URL =
  'https://pmhjdiniwseslpczkokw.supabase.co/storage/v1/object/sign/recipes/placeholder.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzdkMTYwZTY4LWZhNTktNDc5Zi05MjE3LTA4NmM2YTA4YTcyNSJ9.eyJ1cmwiOiJyZWNpcGVzL3BsYWNlaG9sZGVyLmpwZyIsImlhdCI6MTc0NDY5MDAzNywiZXhwIjoxNzc2MjI2MDM3fQ.49V_5VD7hyH_0QKDcFiTnEaxv4bMdEJk7Ipw-tO_1dA';

export default function RecipeCard({
  recipe,
  isSelected,
  onToggleSelect,
  expanded,
  onExpand,
}: Props) {
  const getImageSource = (img: string | any) => {
    if (
      typeof img === 'string' &&
      img.startsWith('http') &&
      img.length > 10 &&
      img !== FALLBACK_IMAGE_URL
    ) {
      return { uri: img };
    }
    return { uri: FALLBACK_IMAGE_URL };
  };

  const imageSource = getImageSource(recipe.image);
  const isRemote = imageSource.uri !== FALLBACK_IMAGE_URL;

  const [loading, setLoading] = useState(isRemote);

  useEffect(() => {
    if (isRemote) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [imageSource.uri]);

  return (
    <TouchableOpacity onPress={onExpand} style={[styles.card, isSelected && styles.selectedCard]}>
      <View style={{ position: 'relative', width: '100%', height: 150, backgroundColor: '#eee' }}>
        {isRemote && loading && (
          <ActivityIndicator size="small" color="#999" style={styles.spinner} />
        )}
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          onLoadEnd={() => setLoading(false)}
        />
      </View>

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
    borderRadius: 0,
  },
  spinner: {
    position: 'absolute',
    top: '45%',
    left: '45%',
    zIndex: 1,
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
