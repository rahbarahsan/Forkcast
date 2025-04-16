import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface FeatureCardProps {
  title: string;
  description: string;
  emoji?: string;
  isPremium?: boolean;
  comingSoon?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export default function FeatureCard({
  title,
  description,
  emoji,
  isPremium = false,
  comingSoon = false,
  onPress,
  style = {},
}: FeatureCardProps) {
  return (
    <TouchableOpacity
      style={[styles.card, comingSoon && styles.disabled, style]}
      onPress={onPress}
      disabled={comingSoon}
    >
      {isPremium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>Premium</Text>
        </View>
      )}
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {comingSoon && <Text style={styles.comingSoon}>Coming Soon</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
    width: '48%',
    position: 'relative',
  },
  disabled: {
    opacity: 0.7,
  },
  emoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#222',
  },
  comingSoon: {
    marginTop: 8,
    fontSize: 12,
    color: '#cc0000',
    fontWeight: '500',
  },
});
