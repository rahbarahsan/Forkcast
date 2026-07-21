// src/screens/PlannerScreen.tsx
import React, { useContext, useState, useRef } from 'react';
import {
  View,
  Text,
  Button,
  TouchableOpacity,
  Platform,
  Animated,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { webDateInputStyle, dateTextStyle, styles } from '../styles/plannerScreenStyles';
import { useResponsive } from '../hooks/useResponsive';
import { createElement } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RecipesContext } from '../context/RecipesContext';
import { PlannerContext } from '../context/PlannerContext';
import PlannerCard from '../components/PlannerCard';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';
import { useRecipes } from '../hooks/useRecipes';

export function PlannerScreen() {
  const { selectedIds, toggleSelection } = useContext(RecipesContext);
  const { plans, addPlan, deletePlan, activePlanId, setActivePlan } = useContext(PlannerContext);
  const { recipes } = useRecipes();
  const selected = recipes.filter((r) => selectedIds.has(r.id));
  const { isTablet, isDesktop, isLargeDesktop } = useResponsive();

  // Combine responsive styles directly
  const getResponsiveStyle = (mobile: any, tablet: any, desktop: any) => {
    if (isDesktop || isLargeDesktop) return desktop;
    if (isTablet) return tablet;
    return mobile;
  };

  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(today);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [showAlert, setShowAlert] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Calculate pagination
  const totalPages = Math.ceil(plans.length / itemsPerPage);
  const paginatedPlans = plans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddPlan = () => {
    if (selected.length === 0) {
      setShowAlert(true);
      return;
    }
    setShowConfirm(true);
  };

  // Run animation when a new plan is added
  const runAddAnimation = () => {
    setShowAnimation(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowAnimation(false);
          fadeAnim.setValue(0);
          scaleAnim.setValue(0.8);
        });
      }, 1500);
    });
  };

  // Fixed header component
  const FixedHeader = () => {
    // For desktop view, we'll use a horizontal layout
    if (isDesktop || isLargeDesktop) {
      return (
        <View style={styles.desktopHeaderContainer}>
          {/* Horizontal container for desktop */}
          <View style={styles.desktopHorizontalContainer}>
            {/* Left side - Date selection */}
            <View style={styles.desktopDateSection}>
              <Text style={styles.headerTitle}>📅 Select Planning Dates</Text>

              <View style={styles.desktopDatePickerContainer}>
                {/* Start Date */}
                <View>
                  <Text>Start Date:</Text>
                  {Platform.OS === 'web' ? (
                    <View style={webDateInputStyle}>
                      {createElement('input', {
                        type: 'date',
                        value: startDate.toISOString().substring(0, 10),
                        onChange: (e: any) => setStartDate(new Date(e.target.value)),
                        style: {
                          border: 'none',
                          background: 'transparent',
                          width: '100%',
                          outline: 'none',
                        },
                      })}
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                        <Text style={dateTextStyle}>{startDate.toDateString()}</Text>
                      </TouchableOpacity>
                      {showStartPicker && (
                        <DateTimePicker
                          value={startDate}
                          mode="date"
                          display="default"
                          onChange={(e, date) => {
                            setShowStartPicker(false);
                            if (date) setStartDate(date);
                          }}
                        />
                      )}
                    </>
                  )}
                </View>

                {/* End Date */}
                <View>
                  <Text>End Date:</Text>
                  {Platform.OS === 'web' ? (
                    <View style={webDateInputStyle}>
                      {createElement('input', {
                        type: 'date',
                        value: endDate.toISOString().substring(0, 10),
                        onChange: (e: any) => setEndDate(new Date(e.target.value)),
                        style: {
                          border: 'none',
                          background: 'transparent',
                          width: '100%',
                          outline: 'none',
                        },
                      })}
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                        <Text style={dateTextStyle}>{endDate.toDateString()}</Text>
                      </TouchableOpacity>
                      {showEndPicker && (
                        <DateTimePicker
                          value={endDate}
                          mode="date"
                          display="default"
                          onChange={(e, date) => {
                            setShowEndPicker(false);
                            if (date) setEndDate(date);
                          }}
                        />
                      )}
                    </>
                  )}
                </View>

                <View style={styles.addButtonContainer}>
                  <Button title="➕ ADD TO PLAN" onPress={handleAddPlan} />
                </View>
              </View>
            </View>

            {/* Right side - Selected recipes */}
            <View style={styles.desktopRecipesSection}>
              <Text style={styles.sectionTitle}>📝 Selected Recipes ({selected.length})</Text>

              {selected.length === 0 ? (
                <Text>No recipes selected yet.</Text>
              ) : (
                <ScrollView
                  style={styles.desktopSelectedRecipesScrollContainer}
                  contentContainerStyle={styles.desktopSelectedRecipesContainer}
                >
                  {selected.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.recipeCard,
                        styles.desktopRecipeCard,
                        { position: 'relative', paddingTop: 22 },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => toggleSelection(item.id)}
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 6,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          justifyContent: 'flex-end',
                          alignItems: 'flex-end',
                          padding: 4, // Add padding for easier tapping
                        }}
                      >
                        <Text
                          style={{
                            color: 'black', // Change color to black
                            fontSize: 16, // Slightly larger icon
                            fontWeight: 'bold',
                          }}
                        >
                          {/* Using a more standard close icon */}×
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.recipeTitle}>🍽 {item.title}</Text>
                      <Text>{item.ingredients.length} ingredients</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      );
    }

    // For mobile and tablet, keep the vertical layout
    return (
      <View
        style={getResponsiveStyle(
          styles.headerContainer,
          styles.tabletHeaderContainer,
          styles.desktopHeaderContainer,
        )}
      >
        <Text style={styles.headerTitle}>📅 Select Planning Dates</Text>

        <View
          style={getResponsiveStyle(
            styles.datePickerContainer,
            styles.tabletDatePickerContainer,
            styles.desktopDatePickerContainer,
          )}
        >
          {/* Start Date */}
          <View>
            <Text>Start Date:</Text>
            {Platform.OS === 'web' ? (
              <View style={webDateInputStyle}>
                {createElement('input', {
                  type: 'date',
                  value: startDate.toISOString().substring(0, 10),
                  onChange: (e: any) => setStartDate(new Date(e.target.value)),
                  style: {
                    border: 'none',
                    background: 'transparent',
                    width: '100%',
                    outline: 'none',
                  },
                })}
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                  <Text style={dateTextStyle}>{startDate.toDateString()}</Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                      setShowStartPicker(false);
                      if (date) setStartDate(date);
                    }}
                  />
                )}
              </>
            )}
          </View>

          {/* End Date */}
          <View>
            <Text>End Date:</Text>
            {Platform.OS === 'web' ? (
              <View style={webDateInputStyle}>
                {createElement('input', {
                  type: 'date',
                  value: endDate.toISOString().substring(0, 10),
                  onChange: (e: any) => setEndDate(new Date(e.target.value)),
                  style: {
                    border: 'none',
                    background: 'transparent',
                    width: '100%',
                    outline: 'none',
                  },
                })}
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                  <Text style={dateTextStyle}>{endDate.toDateString()}</Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                      setShowEndPicker(false);
                      if (date) setEndDate(date);
                    }}
                  />
                )}
              </>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>📝 Selected Recipes ({selected.length})</Text>

        {selected.length === 0 ? (
          <Text>No recipes selected yet.</Text>
        ) : (
          <ScrollView
            style={getResponsiveStyle(
              styles.mobileSelectedRecipesScrollContainer,
              styles.tabletSelectedRecipesScrollContainer,
              styles.desktopSelectedRecipesScrollContainer,
            )}
            contentContainerStyle={getResponsiveStyle(
              styles.selectedRecipesContainer,
              styles.tabletSelectedRecipesContainer,
              styles.desktopSelectedRecipesContainer,
            )}
          >
            {selected.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.recipeCard,
                  isTablet ? styles.tabletRecipeCard : null,
                  { position: 'relative' },
                ]}
              >
                <TouchableOpacity
                  onPress={() => toggleSelection(item.id)}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: 5,
                    padding: 4,
                    zIndex: 10,
                  }}
                >
                  <Text style={{ color: 'black', fontWeight: 'bold', fontSize: 16 }}>
                    {/* Using a more standard close icon */}×
                  </Text>
                </TouchableOpacity>
                <Text style={styles.recipeTitle}>🍽 {item.title}</Text>
                <Text>{item.ingredients.length} ingredients</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.addButtonContainer}>
          <Button title="➕ ADD TO PLAN" onPress={handleAddPlan} />
        </View>
      </View>
    );
  };

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.disabledPageButton]}
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <Text style={styles.pageButtonText}>Previous</Text>
        </TouchableOpacity>

        <View style={styles.pageNumbersContainer}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <TouchableOpacity
              key={page}
              style={[styles.pageNumberButton, currentPage === page && styles.activePageButton]}
              onPress={() => setCurrentPage(page)}
            >
              <Text
                style={[styles.pageNumberText, currentPage === page && styles.activePageNumberText]}
              >
                {page}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.disabledPageButton]}
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.pageButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/images/placeholder.jpg')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.05 }}
    >
      <View style={styles.screenContainer}>
        {/* Fixed header section */}
        <View style={styles.fixedHeaderContainer}>
          <FixedHeader />
        </View>

        {/* Scrollable content section with the "Your Meal Plans" title */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={getResponsiveStyle(
            styles.contentContainer,
            styles.tabletContentContainer,
            styles.desktopContentContainer,
          )}
        >
          <Text
            style={[
              styles.sectionTitle,
              getResponsiveStyle(
                styles.mealPlansTitleMobile,
                styles.mealPlansTitleTablet,
                styles.mealPlansTitleDesktop,
              ),
            ]}
          >
            📖 Your Meal Plans
          </Text>

          {plans.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No meal plans yet. Add your first plan above!
              </Text>
            </View>
          ) : (
            <>
              {paginatedPlans.map((item) => (
                <View
                  key={item.id}
                  style={getResponsiveStyle(
                    styles.plannerCardContainer,
                    styles.tabletPlannerCardContainer,
                    styles.desktopPlannerCardContainer,
                  )}
                >
                  <PlannerCard
                    id={item.id}
                    startDate={item.startDate || new Date().toISOString()}
                    endDate={item.endDate || new Date().toISOString()}
                    recipes={recipes
                      .filter((r) => item.recipeIds.includes(r.id))
                      .map((r) => ({
                        id: r.id,
                        title: r.title,
                        image: typeof r.image === 'string' ? r.image : undefined,
                      }))}
                    onDelete={(id) => deletePlan(id)}
                  />
                </View>
              ))}

              {renderPagination()}
            </>
          )}
        </ScrollView>
      </View>

      {/* Success animation overlay */}
      {showAnimation && (
        <Animated.View style={[styles.animationOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.animationContainer, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.animationText}>Plan Added Successfully! 🎉</Text>
            <Text style={styles.animationSubtext}>Your meals are ready to go!</Text>
          </Animated.View>
        </Animated.View>
      )}

      <AlertDialog
        visible={showAlert}
        message="Please select recipes from Discover first."
        onClose={() => setShowAlert(false)}
      />

      <ConfirmDialog
        visible={showConfirm}
        message={`Add ${selected.length} recipes from ${startDate.toDateString()} to ${endDate.toDateString()}?`}
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => {
          // Create a new plan with the PlannerContext
          const newPlan = {
            recipeIds: selected.map((r) => r.id),
            name: `Plan ${plans.length + 1}`,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          };

          console.log('Adding new plan:', newPlan);
          addPlan(newPlan).then((plan) => {
            console.log('Plan added successfully:', plan);
            setShowConfirm(false);
            runAddAnimation();

            // If adding a new plan would create a new page and we're not on the last page,
            // navigate to the new last page
            const newTotalPages = Math.ceil((plans.length + 1) / itemsPerPage);
            if (newTotalPages > totalPages) {
              setCurrentPage(newTotalPages);
            }
          });
        }}
      />
    </ImageBackground>
  );
}
