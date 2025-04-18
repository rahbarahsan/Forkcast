import { StyleSheet } from 'react-native';

export const webDateInputStyle = {
  padding: 8,
  backgroundColor: '#f0f0f0',
  borderRadius: 5,
  borderColor: '#ccc',
  borderWidth: 1,
  width: 160,
  marginTop: 4,
};

export const dateTextStyle = {
  padding: 8,
  backgroundColor: '#e0e0e0',
  borderRadius: 5,
  marginTop: 4,
};

export const styles = StyleSheet.create({
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
