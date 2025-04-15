import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
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
  const { isMobile, isTablet, isDesktop, isLargeDesktop, isWeb } = useResponsive();
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
    <TouchableOpacity
      onPress={onExpand}
      style={[styles.card, isSelected && styles.selectedCard]}
      // Web-specific styles would need to be applied via CSS or a web-specific styling solution
    >
      <View
        style={[
          styles.imageContainer,
          isMobile && styles.imageContainerSmall,
          isTablet && styles.imageContainerMedium,
          (isDesktop || isLargeDesktop) && styles.imageContainerLarge,
        ]}
      >
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

      <View
        style={[
          styles.content,
          isMobile && styles.contentSmall,
          isTablet && styles.contentMedium,
          (isDesktop || isLargeDesktop) && styles.contentLarge,
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>{recipe.title}</Text>
          <Text style={styles.selectText}>{isSelected ? '✅' : '⬜'}</Text>
        </View>
        <Text style={styles.ingredientCount}>{recipe.ingredients.length} ingredients</Text>

        {expanded && (
          <View style={styles.detailsBox}>
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Prep Time</Text>
                <Text style={styles.metaValue}>{recipe.prepTime}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Cook Time</Text>
                <Text style={styles.metaValue}>{recipe.cookTime}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Cuisine</Text>
                <Text style={styles.metaValue}>{recipe.cuisine}</Text>
              </View>
            </View>

            <Text style={styles.sectionHeader}>Ingredients:</Text>
            <View style={styles.ingredientsList}>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionHeader}>Instructions:</Text>
            <Text style={styles.instructionsText}>{recipe.instructions}</Text>
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  imageContainerSmall: {
    height: 150,
  },
  imageContainerMedium: {
    height: 180,
  },
  imageContainerLarge: {
    height: 200,
  },
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
  contentSmall: {
    padding: 10,
  },
  contentMedium: {
    padding: 14,
  },
  contentLarge: {
    padding: 16,
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
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  metaItem: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metaValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  sectionHeader: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    fontSize: 16,
    color: '#333',
  },
  ingredientsList: {
    marginBottom: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bulletPoint: {
    marginRight: 8,
    color: '#007AFF',
  },
  ingredientText: {
    flex: 1,
    lineHeight: 20,
  },
  instructionsText: {
    lineHeight: 20,
    color: '#333',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
});
