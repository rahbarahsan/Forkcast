// src/screens/PlannerScreen.tsx
import React, { useContext, useState, useRef } from 'react';
import {
  View,
  Text,
  Button,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Animated,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { createElement } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RecipesContext } from '../context/RecipesContext';
import PlannerCard from '../components/PlannerCard';
import ConfirmDialog from '../components/ConfirmDialog';
import AlertDialog from '../components/AlertDialog';
import { useRecipes } from '../hooks/useRecipes';

export default function PlannerScreen() {
  const { selectedIds } = useContext(RecipesContext);
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

  const [plans, setPlans] = useState<any[]>([]);
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
                    <View key={item.id} style={[styles.recipeCard, styles.desktopRecipeCard]}>
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
                style={[styles.recipeCard, isTablet ? styles.tabletRecipeCard : null]}
              >
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
                    startDate={item.startDate}
                    endDate={item.endDate}
                    recipes={item.recipes}
                    onDelete={(id) => setPlans(plans.filter((plan) => plan.id !== id))}
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
          const newPlan = {
            id: Date.now().toString(),
            recipes: selected,
            startDate,
            endDate,
          };

          setPlans([...plans, newPlan]);
          setShowConfirm(false);
          runAddAnimation();

          // If adding a new plan would create a new page and we're not on the last page,
          // navigate to the new last page
          const newTotalPages = Math.ceil((plans.length + 1) / itemsPerPage);
          if (newTotalPages > totalPages) {
            setCurrentPage(newTotalPages);
          }
        }}
      />
    </ImageBackground>
  );
}

const webDateInputStyle = {
  padding: 8,
  backgroundColor: '#f0f0f0',
  borderRadius: 5,
  borderColor: '#ccc',
  borderWidth: 1,
  width: 160,
  marginTop: 4,
};

const dateTextStyle = {
  padding: 8,
  backgroundColor: '#e0e0e0',
  borderRadius: 5,
  marginTop: 4,
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  fixedHeaderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40, // Extra padding at bottom for pagination
  },
  tabletContentContainer: {
    paddingHorizontal: '5%',
    paddingBottom: 40,
  },
  desktopContentContainer: {
    paddingHorizontal: '10%',
    paddingBottom: 40,
  },
  emptyStateContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  pageButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  disabledPageButton: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
  },
  pageNumberButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activePageButton: {
    backgroundColor: '#007AFF',
  },
  pageNumberText: {
    fontWeight: '600',
    color: '#333',
  },
  activePageNumberText: {
    color: 'white',
  },
  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  animationContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  animationText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  animationSubtext: {
    fontSize: 16,
    color: '#666',
  },
  headerContainer: {
    padding: 16,
    width: '100%',
  },
  tabletHeaderContainer: {
    width: '90%',
    paddingHorizontal: '5%',
    alignSelf: 'center',
    maxWidth: 700,
  },
  desktopHeaderContainer: {
    width: '80%',
    paddingHorizontal: '10%',
    alignSelf: 'center',
    maxWidth: 1200,
  },
  desktopHorizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  desktopDateSection: {
    width: '45%',
    paddingRight: 20,
  },
  desktopRecipesSection: {
    width: '55%',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  datePickerContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tabletDatePickerContainer: {
    justifyContent: 'flex-start',
  },
  desktopDatePickerContainer: {
    justifyContent: 'flex-start',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  mealPlansTitleMobile: {
    // Ensures consistent padding with header in mobile
    paddingHorizontal: 0,
  },
  mealPlansTitleTablet: {
    // Ensures consistent padding with header in tablet
    paddingHorizontal: 0,
  },
  mealPlansTitleDesktop: {
    // Ensures consistent padding with header in desktop
    paddingHorizontal: 0,
  },
  selectedRecipesContainer: {
    width: '100%',
  },
  tabletSelectedRecipesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mobileSelectedRecipesScrollContainer: {
    width: '100%',
    maxHeight: 200, // Limit height on mobile
  },
  tabletSelectedRecipesScrollContainer: {
    width: '100%',
    maxHeight: 250, // Slightly more space on tablet
  },
  desktopSelectedRecipesScrollContainer: {
    width: '100%',
    maxHeight: 300, // More space on desktop
  },
  desktopSelectedRecipesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
  },
  recipeCard: {
    padding: 10,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    marginVertical: 5,
    borderColor: '#eee',
    borderWidth: 1,
    width: '100%',
  },
  tabletRecipeCard: {
    width: '48%', // Two cards per row on tablet
  },
  desktopRecipeCard: {
    width: '32%', // Three cards per row on desktop
  },
  recipeTitle: {
    fontWeight: 'bold',
  },
  addButtonContainer: {
    marginVertical: 10,
    alignItems: 'flex-start',
  },
  plannerCardContainer: {
    width: '100%',
    marginBottom: 10,
  },
  tabletPlannerCardContainer: {
    width: '100%',
    marginBottom: 10,
  },
  desktopPlannerCardContainer: {
    width: '100%',
    marginBottom: 10,
  },
});
