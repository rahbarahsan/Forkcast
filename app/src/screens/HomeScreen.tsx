import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import AlertDialog from '../components/AlertDialog';
import FeatureCard from '../components/FeatureCard';

// Define navigation param list type
export type RootTabParamList = {
  Home: undefined;
  Discover: undefined;
  Planner: undefined;
  Pantry: undefined;
  Groceries: undefined;
  History: undefined;
};

const features = [
  {
    title: 'Discover Recipes',
    description: 'Find trending and diverse recipes',
    emoji: '🔍',
    screen: 'Discover',
  },
  {
    title: 'Add Recipe',
    description: 'Create your own meals easily',
    emoji: '➕',
    screen: 'AddRecipe',
    comingSoon: true,
  },
  {
    title: 'Weekly Planner',
    description: 'Schedule meals for the week',
    emoji: '🕰️',
    screen: 'Planner',
  },
  {
    title: 'Pantry Tracker',
    description: 'Track ingredients you already have',
    emoji: '📦',
    screen: 'Pantry',
  },
  {
    title: 'Smart Grocery Aggregation',
    description: 'Combine all recipe ingredients into one list',
    emoji: '🛒',
    screen: 'Groceries',
  },
  {
    title: 'Recipe Scout',
    description: 'Extract recipes from YouTube using AI',
    emoji: '📺',
    screen: 'RecipeScout',
    isPremium: true,
    comingSoon: true,
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const [showAlert, setShowAlert] = useState(false);

  const handlePress = (feature: any) => {
    if (feature.comingSoon) {
      setShowAlert(true);
    } else {
      navigation.navigate(feature.screen as any);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>🍴 Forkcast</Text>
      <Text style={styles.tagline}>Your AI-powered kitchen assistant</Text>

      <View style={styles.featuresContainer}>
        {features.map((feature, idx) => (
          <FeatureCard
            key={idx}
            title={feature.title}
            description={feature.description}
            emoji={feature.emoji}
            isPremium={feature.isPremium}
            comingSoon={feature.comingSoon}
            onPress={() => handlePress(feature)}
            style={{ width: '48%' }}
          />
        ))}
      </View>

      <View style={styles.comingSoonSection}>
        <Text style={styles.comingSoonTitle}>💎 Premium Features (Coming Soon)</Text>
        <Text style={styles.comingSoonItem}>• Flyer-Based Grocery Optimization</Text>
        <Text style={styles.comingSoonItem}>• Pantry-Aware Suggestions</Text>
        <Text style={styles.comingSoonItem}>• Pantry Scan</Text>
        <Text style={styles.comingSoonItem}>• Ingredient Insights</Text>
        <Text style={styles.comingSoonItem}>• Categorized Grocery List</Text>
        <Text style={styles.comingSoonItem}>• Export Grocery List</Text>
        <Text style={styles.comingSoonItem}>• Share Cooking Plan</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Forkcast - Simplify your cooking life</Text>
      </View>

      <AlertDialog
        visible={showAlert}
        title="Coming Soon"
        message="This feature is not yet available. Stay tuned for our premium launch!"
        onClose={() => setShowAlert(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#FFF8F0',
    flexGrow: 1,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 10,
    color: '#333',
  },
  tagline: {
    fontSize: 16,
    color: '#777',
    marginBottom: 30,
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  comingSoonSection: {
    marginTop: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  comingSoonTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 10,
  },
  comingSoonItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
