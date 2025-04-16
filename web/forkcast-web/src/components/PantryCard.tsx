// src/components/PantryCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface PantryItem {
  name: string;
  quantity: string;
  id?: string;
}

interface PantryCardProps {
  item: PantryItem;
  onEdit: (item: PantryItem) => void;
  onDelete: (item: PantryItem) => void;
  isMobile?: boolean;
}

const PantryCard: React.FC<PantryCardProps> = ({ item, onEdit, onDelete, isMobile = false }) => {
  return (
    <View style={[styles.container, isMobile ? styles.containerMobile : {}]}>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
        <Text style={styles.quantity}>{item.quantity}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onEdit(item)}
          style={styles.iconButton}
          accessibilityLabel={`Edit ${item.name}`}
        >
          <Ionicons name="pencil" size={20} color="#4285F4" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onDelete(item)}
          style={styles.iconButton}
          accessibilityLabel={`Delete ${item.name}`}
        >
          <Ionicons name="trash" size={20} color="#EA4335" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 4,
    flex: 1,
  },
  containerMobile: {
    marginHorizontal: 0,
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  quantity: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
});

export default PantryCard;
