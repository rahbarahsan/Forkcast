// src/screens/DiscoverRecipesScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TextInput,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import fallbackRecipes from '../data/fallbackRecipes';
import RecipeCard from '../components/RecipeCard';
import { useContext } from 'react';
import { RecipesContext } from '../context/RecipesContext';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useRecipes } from '../hooks/useRecipes';

// Define the navigation param list type
type RootTabParamList = {
  Home: undefined;
  Discover: undefined;
  Planner: undefined;
  Pantry: undefined;
  Groceries: undefined;
  History: undefined;
};

type DiscoverScreenNavigationProp = BottomTabNavigationProp<RootTabParamList>;

const categories = ['All', 'South Asian', 'Italian', 'Mexican', 'Japanese'];
const sortOptions = ['Trending', 'Recently Added', 'Most Popular', 'Favorites'];

export default function DiscoverRecipesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Trending');
  const [showSort, setShowSort] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const { selectedIds, toggleSelection } = useContext(RecipesContext);
  const navigation = useNavigation<DiscoverScreenNavigationProp>();
  const { width, isMobile, isTablet, isDesktop, isLargeDesktop, isWeb } = useResponsive();

  const isLargeScreen = isDesktop || isLargeDesktop;

  // Adjust items per page based on screen size
  useEffect(() => {
    if (isLargeDesktop) {
      setItemsPerPage(20);
    } else if (isDesktop) {
      setItemsPerPage(16);
    } else if (isTablet) {
      setItemsPerPage(12);
    } else {
      setItemsPerPage(8);
    }
  }, [isLargeDesktop, isDesktop, isTablet, isMobile]);

  // Determine number of columns based on screen size
  const getNumColumns = () => {
    if (isLargeDesktop) return 5;
    if (isDesktop) return 4;
    if (isTablet) return 3;
    if (isMobile && width > 480) return 2;
    return 1;
  };

  // Filter and sort recipes
  const { recipes } = useRecipes();
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory = selectedCategory === 'All' || recipe.cuisine === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.ingredients.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Sort recipes based on selected sort option
  const sortedRecipes = [...filteredRecipes].sort((a, b) => {
    switch (sortBy) {
      case 'Recently Added':
        // Assuming newer recipes have higher IDs or you could add a timestamp field
        return b.id.localeCompare(a.id);
      case 'Most Popular':
        // This would ideally use a popularity metric
        return b.ingredients.length - a.ingredients.length;
      case 'Favorites':
        // Show selected recipes first
        return (selectedIds.has(b.id) ? 1 : 0) - (selectedIds.has(a.id) ? 1 : 0);
      case 'Trending':
      default:
        // Default sorting logic
        return a.title.localeCompare(b.title);
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedRecipes.length / itemsPerPage);
  const paginatedRecipes = sortedRecipes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy]);

  const handleCardExpand = (id: string) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {isWeb && (
          <View style={styles.header}>
            <Text style={styles.heading}>Discover Recipes</Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={[styles.searchContainer, { margin: 16 }]}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes or ingredients..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryChip, selectedCategory === cat && styles.activeChip]}
              >
                <Text
                  style={{ color: selectedCategory === cat ? 'white' : 'black', fontWeight: '600' }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sortSection}>
          <TouchableOpacity onPress={() => setShowSort(true)} style={styles.dropdownButton}>
            <Text style={styles.dropdownText}>Sort By: {sortBy} ⏷</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={paginatedRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.cardContainer,
                {
                  width: isLargeDesktop
                    ? width / 5 - 32
                    : isDesktop
                      ? width / 4 - 32
                      : isTablet
                        ? width / 3 - 32
                        : isMobile && width > 480
                          ? width / 2 - 32
                          : width - 32,
                },
              ]}
            >
              <RecipeCard
                recipe={item}
                isSelected={selectedIds.has(item.id)}
                onToggleSelect={() => toggleSelection(item.id)}
                expanded={expandedCardId === item.id}
                onExpand={() => handleCardExpand(item.id)}
              />
            </View>
          )}
          contentContainerStyle={[
            styles.listContent,
            (isTablet || isLargeScreen) && {
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
            },
          ]}
          numColumns={Platform.OS === 'web' ? getNumColumns() : 1}
          key={`${getNumColumns()}-column-layout`}
          ListFooterComponent={() => (
            <View style={styles.paginationContainer}>
              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[styles.pageButton, currentPage === 1 && styles.disabledPageButton]}
                    onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <Text style={styles.pageButtonText}>Previous</Text>
                  </TouchableOpacity>

                  <View style={styles.pageInfo}>
                    <Text style={styles.pageInfoText}>
                      Page {currentPage} of {totalPages}
                    </Text>
                    <Text style={styles.resultsCount}>{sortedRecipes.length} recipes found</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.pageButton,
                      currentPage === totalPages && styles.disabledPageButton,
                    ]}
                    onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <Text style={styles.pageButtonText}>Next</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />

        <Modal visible={showSort} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sort By</Text>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalItem}
                  onPress={() => {
                    setSortBy(option);
                    setShowSort(false);
                  }}
                >
                  <Text style={option === sortBy ? styles.activeSort : {}}>{option}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowSort(false)} style={styles.modalCancel}>
                <Text style={{ color: 'red' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {selectedIds.size > 0 && (
          <TouchableOpacity style={styles.floater} onPress={() => navigation.navigate('Planner')}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              ✅ {selectedIds.size} Selected - Plan
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  paginationContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  disabledPageButton: {
    backgroundColor: '#ccc',
  },
  pageButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  pageInfo: {
    alignItems: 'center',
  },
  pageInfoText: {
    fontSize: 14,
    color: '#333',
  },
  resultsCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  categorySection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    marginRight: 10,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#eee',
    minHeight: 40,
    justifyContent: 'center',
  },
  activeChip: {
    backgroundColor: '#007AFF',
  },
  sortSection: {
    padding: 16,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  dropdownButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontWeight: '500',
  },
  cardContainer: {
    margin: 8,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 16,
    paddingHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 40,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  activeSort: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalItem: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCancel: {
    paddingVertical: 10,
    marginTop: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  floater: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
