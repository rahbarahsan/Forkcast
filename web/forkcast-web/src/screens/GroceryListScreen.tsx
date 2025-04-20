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
import { PantryItem, Recipe, Plan } from '../types';
import { useResponsive } from '../hooks/useResponsive';
import { useGroceryList } from '../hooks/useGroceryList';
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

  const [viewMode, setViewMode] = useState<'all' | 'byPlan'>('byPlan');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(activePlanId);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  // Get all recipe IDs from the selected plan
  const getRecipeIdsFromPlan = (planId: string | null): string[] => {
    if (!planId) return [];
    console.log('GroceryListScreen - Looking for plan with ID:', planId);
    console.log('GroceryListScreen - Available plans:', plans);
    const plan = plans.find((p) => p.id === planId);
    console.log('GroceryListScreen - Found plan:', plan);
    return plan ? plan.recipeIds : [];
  };

  // Get recipe IDs based on the current view mode
  const getRecipeIdsForCurrentView = (): string[] => {
    if (viewMode === 'all') {
      return Array.from(selectedIds);
    } else if (viewMode === 'byPlan' && selectedPlanId) {
      const recipeIds = getRecipeIdsFromPlan(selectedPlanId);
      console.log('GroceryListScreen - Recipe IDs for plan:', recipeIds);
      return recipeIds;
    }
    return [];
  };

  // Use the useGroceryList hook to fetch the grocery list
  const { groceryList, loading, error } = useGroceryList({
    isGuest: true, // Use guest mode for now until sign-in is implemented
    selectedIds: [], // We'll handle this through recipeIds
    planIds: viewMode === 'byPlan' && selectedPlanId ? [selectedPlanId] : [],
    // Include recipe IDs based on the current view
    recipeIds: getRecipeIdsForCurrentView(),
    pantryItems: pantryItems,
  });

  // Log pantry items for debugging
  useEffect(() => {
    console.log('GroceryListScreen - pantryItems detail:', pantryItems);
  }, [pantryItems]);

  // Log grocery list data for debugging
  useEffect(() => {
    console.log('GroceryListScreen - groceryList:', groceryList);
    console.log('GroceryListScreen - loading:', loading);
    console.log('GroceryListScreen - error:', error);
    console.log('GroceryListScreen - selectedIds:', selectedIds);
    console.log('GroceryListScreen - planIds:', selectedPlanId);
    console.log('GroceryListScreen - pantryItems:', pantryItems);

    // Check if we have recipe IDs from the selected plan
    const recipeIds = getRecipeIdsFromPlan(selectedPlanId);
    console.log('GroceryListScreen - recipeIds from plan:', recipeIds);

    // Check if we have a valid plan
    if (selectedPlanId) {
      const plan = plans.find((p) => p.id === selectedPlanId);
      console.log('GroceryListScreen - selected plan:', plan);
    }
  }, [groceryList, loading, error, selectedIds, selectedPlanId, pantryItems, plans]);

  // Extract needed ingredients and categories from the grocery list
  const neededIngredients = groceryList?.raw ? Object.keys(groceryList.raw) : [];
  const ingredientsByCategory = groceryList?.categorized || {};

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

  // Log any errors
  useEffect(() => {
    if (error) {
      console.error('Error fetching grocery list:', error);
    }
  }, [error]);

  // Update the active plan when it changes
  useEffect(() => {
    if (activePlanId !== selectedPlanId) {
      setSelectedPlanId(activePlanId);
    }
  }, [activePlanId]);

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
              All
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

    console.log('Rendering section list with categories:', categories);
    console.log('ingredientsByCategory:', ingredientsByCategory);

    // Check if we have plans
    const hasPlans = plans && plans.length > 0;
    console.log('Has plans:', hasPlans);

    // Check if we have a selected plan
    const hasSelectedPlan = selectedPlanId && plans.some((p) => p.id === selectedPlanId);
    console.log('Has selected plan:', hasSelectedPlan);

    // Check if the selected plan has recipes
    const selectedPlan = plans.find((p) => p.id === selectedPlanId);
    const planHasRecipes =
      selectedPlan && selectedPlan.recipeIds && selectedPlan.recipeIds.length > 0;
    console.log('Plan has recipes:', planHasRecipes);

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
              {!hasPlans
                ? "You haven't made any plans yet"
                : viewMode === 'byPlan' && !hasSelectedPlan
                  ? 'Select a meal plan to see your grocery list'
                  : viewMode === 'byPlan' && !planHasRecipes
                    ? 'Add recipes to your selected meal plan to generate a shopping list'
                    : 'Select recipes to generate a shopping list'}
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
