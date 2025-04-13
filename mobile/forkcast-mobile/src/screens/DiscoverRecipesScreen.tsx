// src/screens/DiscoverRecipesScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import fallbackRecipes from '../data/fallbackRecipes';
import screenStyles from '../styles/screenStyle';
import RecipeCard from '../components/RecipeCard';
import { useContext } from 'react';
import { RecipesContext } from '../context/RecipesContext';
import { useNavigation } from '@react-navigation/native';

const categories = ['All', 'South Asian', 'Italian', 'Mexican', 'Japanese'];
const sortOptions = ['Trending', 'Recently Added', 'Most Popular', 'Favorites'];

export default function DiscoverRecipesScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Trending');
  const [showSort, setShowSort] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const { selectedIds, toggleSelection } = useContext(RecipesContext);
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const filteredRecipes = fallbackRecipes.filter(
    (r) => selectedCategory === 'All' || r.cuisine === selectedCategory,
  );

  const handleCardExpand = (id: string) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  return (
    <View style={styles.container}>
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
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.cardContainer, { width: isTablet ? width / 2 - 32 : width - 32 }]}>
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
          isTablet && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
        ]}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'two-column' : 'one-column'}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
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
    alignSelf: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 8,
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
