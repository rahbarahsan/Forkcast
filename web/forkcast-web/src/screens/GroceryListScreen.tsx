import React, { useContext, useState, useEffect, useMemo } from 'react';
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
import { PantryItem } from '../types';
import { useResponsive } from '../hooks/useResponsive';
import { useGroceryList } from '../hooks/useGroceryList';
import styles from '../styles/GroceryListScreenStyle';

export default function GroceryListScreen() {
  const { selectedIds, setSelectedIds } = useContext(RecipesContext);
  const { items: pantryItems } = useContext(PantryContext);
  const { plans, activePlanId } = useContext(PlannerContext);
  const responsive = useResponsive();
  const responsiveStyles = styles.getResponsiveStyles(responsive.screenSize);

  const [viewMode, setViewMode] = useState<'all' | 'byPlan'>('byPlan');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(activePlanId);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const getRecipeIdsFromPlan = (planId: string | null): string[] => {
    if (!planId) return [];
    const plan = plans.find((p) => p.id === planId);
    return plan ? plan.recipeIds : [];
  };

  const recipeIdsFromPlan = getRecipeIdsFromPlan(selectedPlanId);

  const recipeIds = useMemo(() => {
    if (viewMode === 'all') {
      return [...new Set(plans.flatMap((p) => p.recipeIds))]; // avoid duplicates
    } else if (viewMode === 'byPlan' && selectedPlanId) {
      const plan = plans.find((p) => p.id === selectedPlanId);
      return plan?.recipeIds || [];
    }
    return [];
  }, [viewMode, selectedPlanId, plans]);

  const { groceryList, loading, error } = useGroceryList({
    isGuest: true,
    userId: undefined, // we’re in guest mode
    recipeIds,
    pantryItems,
  });

  const ingredientsByCategory = groceryList?.categorized || {};
  const neededIngredients = groceryList?.raw ? Object.keys(groceryList.raw) : [];

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

  const renderPlanSelector = () => (
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
            const allIds = plans.flatMap((p) => p.recipeIds);
            setSelectedIds(new Set(allIds)); // ensure unique
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
              setSelectedIds(new Set(plan.recipeIds)); // update selectedIds with recipes of this plan
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
              Select a plan or recipe to generate your grocery list
            </Text>
          </View>
        }
      />
    );
  };

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
