import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { RecipesContext } from '../context/RecipesContext';
import { PantryContext } from '../context/PantryContext';
import { PlannerContext } from '../context/PlannerContext';
import fallbackRecipes from '../data/fallbackRecipes';
import { PantryItem, Recipe, Plan } from '../types';
import { useResponsive } from '../hooks/useResponsive';
import styles from '../styles/GroceryListScreenStyle';

function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/s$/, '');
}

export default function GroceryListScreen() {
  const { selectedIds } = useContext(RecipesContext);
  const { items: pantryItems } = useContext(PantryContext);
  const { plans, activePlanId } = useContext(PlannerContext);
  const responsive = useResponsive();

  // Get responsive styles based on current screen size
  const responsiveStyles = styles.getResponsiveStyles(responsive.screenSize);

  const [neededIngredients, setNeededIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'all' | 'byPlan'>('byPlan');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(activePlanId);
  const [ingredientsByCategory, setIngredientsByCategory] = useState<{ [key: string]: string[] }>(
    {},
  );
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Helper function to categorize ingredients
  const categorizeIngredient = (ingredient: string): string => {
    const lowerIngredient = ingredient.toLowerCase();
    if (
      lowerIngredient.includes('milk') ||
      lowerIngredient.includes('cheese') ||
      lowerIngredient.includes('yogurt') ||
      lowerIngredient.includes('butter')
    ) {
      return 'Dairy';
    } else if (
      lowerIngredient.includes('apple') ||
      lowerIngredient.includes('banana') ||
      lowerIngredient.includes('berry') ||
      lowerIngredient.includes('fruit')
    ) {
      return 'Fruits';
    } else if (
      lowerIngredient.includes('carrot') ||
      lowerIngredient.includes('lettuce') ||
      lowerIngredient.includes('onion') ||
      lowerIngredient.includes('potato')
    ) {
      return 'Vegetables';
    } else if (
      lowerIngredient.includes('beef') ||
      lowerIngredient.includes('chicken') ||
      lowerIngredient.includes('pork') ||
      lowerIngredient.includes('fish')
    ) {
      return 'Meat & Seafood';
    } else if (
      lowerIngredient.includes('pasta') ||
      lowerIngredient.includes('rice') ||
      lowerIngredient.includes('bread') ||
      lowerIngredient.includes('flour')
    ) {
      return 'Grains & Bakery';
    } else if (
      lowerIngredient.includes('oil') ||
      lowerIngredient.includes('vinegar') ||
      lowerIngredient.includes('sauce') ||
      lowerIngredient.includes('spice')
    ) {
      return 'Condiments & Spices';
    } else {
      return 'Other';
    }
  };

  useEffect(() => {
    const fetchGroceryList = async () => {
      setLoading(true);
      try {
        // In the future, this would be an API call to your FastAPI backend
        // const response = await fetch('api/grocery-list', {
        //   method: 'POST',
        //   body: JSON.stringify({ planId: selectedPlanId })
        // });
        // const data = await response.json();
        // setNeededIngredients(data.ingredients);

        // For now, we'll use the fallback logic
        let recipesToUse: Recipe[] = [];

        if (viewMode === 'byPlan' && selectedPlanId) {
          const selectedPlan = plans.find((p) => p.id === selectedPlanId);
          if (selectedPlan) {
            recipesToUse = fallbackRecipes.filter((r) => selectedPlan.recipeIds.includes(r.id));
          }
        } else {
          recipesToUse = fallbackRecipes.filter((r) => selectedIds.has(r.id));
        }

        // Flatten and normalize recipe ingredients
        const allIngredients = recipesToUse.flatMap((r) => r.ingredients.map((i) => normalize(i)));

        // Normalize pantry names
        const pantrySet = new Set(pantryItems.map((p) => normalize(p.name)));

        const needed = allIngredients.filter((ing) => !pantrySet.has(ing));

        // Remove duplicates and sort alphabetically
        const uniqueNeeded = [...new Set(needed)].sort();
        setNeededIngredients(uniqueNeeded);

        // Categorize ingredients
        const categorized: { [key: string]: string[] } = {};
        uniqueNeeded.forEach((ingredient) => {
          const category = categorizeIngredient(ingredient);
          if (!categorized[category]) {
            categorized[category] = [];
          }
          categorized[category].push(ingredient);
        });

        setIngredientsByCategory(categorized);
      } catch (error) {
        console.error('Error fetching grocery list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroceryList();
  }, [selectedIds, pantryItems, selectedPlanId, viewMode, plans, activePlanId]);

  const toggleItemCompletion = (item: string) => {
    setCompletedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  };

  const renderPlanSelector = () => {
    return (
      <View style={responsiveStyles.planSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              responsiveStyles.planButton,
              viewMode === 'all' && responsiveStyles.activePlanButton,
            ]}
            onPress={() => {
              setViewMode('all');
              setSelectedPlanId(null);
            }}
          >
            <Text
              style={[
                responsiveStyles.planButtonText,
                viewMode === 'all' && responsiveStyles.activePlanButtonText,
              ]}
            >
              All Recipes
            </Text>
          </TouchableOpacity>

          {plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                responsiveStyles.planButton,
                viewMode === 'byPlan' &&
                  selectedPlanId === plan.id &&
                  responsiveStyles.activePlanButton,
              ]}
              onPress={() => {
                setViewMode('byPlan');
                setSelectedPlanId(plan.id);
              }}
            >
              <Text
                style={[
                  responsiveStyles.planButtonText,
                  viewMode === 'byPlan' &&
                    selectedPlanId === plan.id &&
                    responsiveStyles.activePlanButtonText,
                ]}
              >
                {plan.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCategoryHeader = (category: string) => {
    const count = ingredientsByCategory[category]?.length || 0;
    const completedCount =
      ingredientsByCategory[category]?.filter((item) => completedItems.has(item)).length || 0;

    return (
      <View style={responsiveStyles.categoryHeader}>
        <Text style={responsiveStyles.categoryTitle}>{category}</Text>
        <Text style={responsiveStyles.categoryCount}>
          {completedCount}/{count}
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: string }) => {
    const isCompleted = completedItems.has(item);

    return (
      <TouchableOpacity
        style={responsiveStyles.groceryItem}
        onPress={() => toggleItemCompletion(item)}
      >
        <View style={[responsiveStyles.checkbox, isCompleted && responsiveStyles.checkboxChecked]}>
          {isCompleted && <Feather name="check" size={16} color="#fff" />}
        </View>
        <Text
          style={[
            responsiveStyles.groceryText,
            isCompleted && responsiveStyles.groceryTextCompleted,
          ]}
        >
          {item.charAt(0).toUpperCase() + item.slice(1)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSectionList = () => {
    const categories = Object.keys(ingredientsByCategory).sort();

    return (
      <FlatList
        data={categories}
        keyExtractor={(category) => category}
        renderItem={({ item: category }) => (
          <View style={responsiveStyles.categoryContainer}>
            {renderCategoryHeader(category)}
            {ingredientsByCategory[category].map((ingredient, index) => (
              <View key={`${ingredient}-${index}`}>{renderItem({ item: ingredient })}</View>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={responsiveStyles.emptyContainer}>
            <Feather name="shopping-bag" size={64} color="#BDBDBD" />
            <Text style={responsiveStyles.emptyTitle}>Your shopping list is empty</Text>
            <Text style={responsiveStyles.emptySubtitle}>
              Add recipes to your meal plan to generate a shopping list
            </Text>
          </View>
        }
      />
    );
  };

  // Adjust layout based on screen size
  const containerStyle = [
    responsiveStyles.container,
    responsive.isDesktop && { maxWidth: 800, alignSelf: 'center' as const },
  ];

  return (
    <SafeAreaView style={responsiveStyles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={responsiveStyles.header}>
        <Text style={responsiveStyles.headerTitle}>Grocery List</Text>
        <View style={responsiveStyles.headerActions}>
          <TouchableOpacity style={responsiveStyles.shareButton}>
            <Feather name="share" size={20} color="#3498db" />
          </TouchableOpacity>
        </View>
      </View>

      {renderPlanSelector()}

      <View style={containerStyle}>
        {loading ? (
          <View style={responsiveStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={responsiveStyles.loadingText}>Preparing your grocery list...</Text>
          </View>
        ) : (
          <>
            <View style={responsiveStyles.statsContainer}>
              <View style={responsiveStyles.statItem}>
                <Text style={responsiveStyles.statValue}>
                  {completedItems.size}/{neededIngredients.length}
                </Text>
                <Text style={responsiveStyles.statLabel}>Items collected</Text>
              </View>
              <View style={responsiveStyles.statItem}>
                <Text style={responsiveStyles.statValue}>
                  {Object.keys(ingredientsByCategory).length}
                </Text>
                <Text style={responsiveStyles.statLabel}>Categories</Text>
              </View>
            </View>

            {renderSectionList()}

            {neededIngredients.length > 0 && (
              <TouchableOpacity
                style={responsiveStyles.clearButton}
                onPress={() => setCompletedItems(new Set())}
              >
                <Text style={responsiveStyles.clearButtonText}>Clear selections</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
