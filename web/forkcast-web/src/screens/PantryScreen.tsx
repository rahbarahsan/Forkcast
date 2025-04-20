import React, { useState, useRef, createRef } from 'react';
import {
  View,
  TextInput,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  Keyboard,
  Platform,
  Modal,
} from 'react-native';
import { pantryScreenStyles as styles } from '../styles/pantryScreenStyle';
import AlertDialog from '../components/AlertDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import screenStyles from '../styles/screenStyle';
import { usePantry } from '../context/PantryContext';
import { useResponsive } from '../hooks/useResponsive';
import PantryCard, { PantryItem } from '../components/PantryCard';

const unitOptions = ['pcs', 'g', 'kg', 'ml', 'litre', 'tbsp', 'tsp', 'cup', 'cloves'];

export default function PantryScreen() {
  const { items, addItem, removeItem, resetPantry } = usePantry();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<PantryItem | null>(null);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Refs
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formHeight = useRef(new Animated.Value(0)).current;
  const quantityInputRef = useRef<TextInput>(null);

  // Get responsive info
  const { screenSize, isMobile, isTablet, isDesktop, isWeb } = useResponsive();

  // Filter items based on search query
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const showForm = () => {
    setIsFormVisible(true);
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(formHeight, {
        toValue: 300,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const hideForm = () => {
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(formHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsFormVisible(false);
      clearForm();
    });
  };

  const clearForm = () => {
    setName('');
    setQuantity('');
    setUnit('pcs');
    setIsEditing(false);
    setEditingItem(null);
  };

  const handleSubmit = () => {
    if (name.trim() && quantity.trim()) {
      const finalQuantity = `${quantity} ${unit}`;
      // Generate a unique ID using timestamp and random number
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

      if (isEditing && editingItem) {
        // Update existing item
        if (editingItem.id) {
          removeItem(editingItem.id);
        }
        const newItem = { id, name: name.trim(), quantity: finalQuantity };
        console.log('Adding edited pantry item:', newItem);
        addItem(newItem);
      } else {
        // Add new item
        const newItem = { id, name: name.trim(), quantity: finalQuantity };
        console.log('Adding new pantry item:', newItem);
        addItem(newItem);
      }

      clearForm();
      hideForm();
      Keyboard.dismiss();
    } else {
      setAlertMessage('Please enter both ingredient name and quantity.');
      setShowAlertDialog(true);
    }
  };

  const handleEdit = (item: PantryItem) => {
    // Parse the quantity to extract numeric and unit parts
    const parts = item.quantity.split(' ');
    const itemQuantity = parts[0];
    const itemUnit = parts.length > 1 ? parts[1] : 'pcs';

    setName(item.name);
    setQuantity(itemQuantity);
    if (unitOptions.includes(itemUnit)) {
      setUnit(itemUnit);
    }

    setIsEditing(true);
    setEditingItem(item);
    showForm();
  };

  const handleDelete = (item: PantryItem) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (itemToDelete && itemToDelete.id) {
      removeItem(itemToDelete.id);
    }
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleResetPantry = () => {
    setShowResetConfirm(true);
  };

  // Calculate container style based on screen size
  const getContainerStyle = () => {
    if (isMobile) return screenStyles.containerMobile;
    if (isTablet) return screenStyles.containerTablet;
    if (isDesktop) return screenStyles.containerDesktop;
    return screenStyles.containerLargeDesktop;
  };

  // Calculate item layout based on screen size
  const getItemLayout = () => {
    if (isWeb && !isMobile) {
      return { flexDirection: 'row' as const, flexWrap: 'wrap' as const };
    }
    return {};
  };

  return (
    <View style={[screenStyles.container, getContainerStyle()]}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pantry</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={showForm}
          accessibilityLabel="Add new pantry item"
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.buttonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ingredients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search pantry items"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={20} color="#757575" />
          </TouchableOpacity>
        )}
      </View>

      {/* Animated Form */}
      {isFormVisible && (
        <Animated.View style={[styles.formContainer, { opacity: formOpacity, height: formHeight }]}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {isEditing ? 'Edit Ingredient' : 'Add New Ingredient'}
            </Text>
            <TouchableOpacity onPress={hideForm} accessibilityLabel="Close form">
              <Ionicons name="close" size={24} color="#757575" />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ingredient Name</Text>
            <TextInput
              placeholder="e.g. Tomatoes"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              onSubmitEditing={() => {
                // Focus the quantity input when pressing return/next
                if (quantityInputRef.current) {
                  quantityInputRef.current.focus();
                }
              }}
              style={styles.input}
              accessibilityLabel="Ingredient name input"
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.quantityContainer}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                ref={quantityInputRef}
                placeholder="e.g. 0.5, 1"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                style={styles.input}
                accessibilityLabel="Quantity input"
              />
            </View>

            <View style={styles.unitContainer}>
              <Text style={styles.label}>Unit</Text>
              {Platform.OS === 'ios' ? (
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowUnitPicker(true)}
                >
                  <Text>{unit}</Text>
                  <Ionicons name="chevron-down" size={16} color="#757575" />
                </TouchableOpacity>
              ) : (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={unit}
                    onValueChange={(val) => setUnit(val)}
                    style={styles.picker}
                    accessibilityLabel="Unit selector"
                  >
                    {unitOptions.map((u) => (
                      <Picker.Item label={u} value={u} key={u} />
                    ))}
                  </Picker>
                </View>
              )}
            </View>
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={hideForm}
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              accessibilityLabel={isEditing ? 'Update item' : 'Add item'}
            >
              <Text style={styles.submitButtonText}>{isEditing ? 'Update' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Empty state */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="basket-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyStateText}>
            {searchQuery.length > 0
              ? 'No matching ingredients found.'
              : 'Your pantry is empty. Add your first ingredient!'}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.listWrapper}>
            <FlatList
              data={filteredItems}
              keyExtractor={(item, index) => item.id || `item-${index}`}
              renderItem={({ item }) => (
                <View style={styles.itemContainer}>
                  <PantryCard
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isMobile={isMobile}
                  />
                </View>
              )}
              contentContainerStyle={styles.listContainer}
              numColumns={1}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={<View style={{ height: 80 }} />}
            />
          </View>

          {filteredItems.length > 0 && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPantry}
              accessibilityLabel="Reset pantry"
            >
              <Ionicons name="trash-bin" size={18} color="white" />
              <Text style={styles.resetButtonText}>Reset Pantry</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Dialogs */}
      <AlertDialog
        visible={showAlertDialog}
        title="Missing Information"
        message={alertMessage}
        onClose={() => setShowAlertDialog(false)}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Item"
        message={
          itemToDelete
            ? `Are you sure you want to remove ${itemToDelete.name} from your pantry?`
            : ''
        }
        confirmText="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDialog
        visible={showResetConfirm}
        title="Reset Pantry"
        message="Are you sure you want to clear all items from your pantry?"
        confirmText="Reset"
        onConfirm={() => {
          resetPantry();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* iOS Unit Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={showUnitPicker} transparent animationType="slide">
          <TouchableOpacity
            style={styles.pickerModalOverlay}
            activeOpacity={1}
            onPress={() => setShowUnitPicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.pickerModalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.pickerModalHeader}>
                <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                  <Text style={styles.pickerModalCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
                  <Text style={styles.pickerModalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <Picker
                selectedValue={unit}
                onValueChange={(val) => setUnit(val)}
                style={styles.iosPicker}
                itemStyle={styles.iosPickerItem}
              >
                {unitOptions.map((u) => (
                  <Picker.Item label={u} value={u} key={u} />
                ))}
              </Picker>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}
