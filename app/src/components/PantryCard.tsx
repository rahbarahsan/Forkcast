// src/components/PantryCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Log the item for debugging
  useEffect(() => {
    console.log('PantryCard rendering item:', item);
  }, [item]);

  const toggleExpand = () => {
    // Configure animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Rotate chevron icon
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setExpanded(!expanded);
  };

  // Calculate rotation for the chevron icon
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View
      style={[
        styles.container,
        isMobile ? styles.containerMobile : {},
        expanded && styles.containerExpanded,
      ]}
    >
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={toggleExpand}
        activeOpacity={0.7}
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${item.name} details`}
      >
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={expanded ? 0 : 1} ellipsizeMode="tail">
            {item.name}
          </Text>
          <Text style={styles.quantity}>{item.quantity}</Text>
        </View>

        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={20} color="#757575" />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={styles.actionButton}
              accessibilityLabel={`Edit ${item.name}`}
            >
              <Ionicons name="pencil" size={18} color="#4285F4" />
              <Text style={[styles.actionText, { color: '#4285F4' }]}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDelete(item)}
              style={styles.actionButton}
              accessibilityLabel={`Delete ${item.name}`}
            >
              <Ionicons name="trash" size={18} color="#EA4335" />
              <Text style={[styles.actionText, { color: '#EA4335' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginHorizontal: 4,
    flex: 1,
    overflow: 'hidden',
  },
  containerMobile: {
    marginHorizontal: 0,
  },
  containerExpanded: {
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
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
  expandedContent: {
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 16,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default PantryCard;
