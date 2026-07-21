// src/navigation/index.tsx (updated)

import React from 'react';
import { Platform, View, StyleSheet, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import WebHamburgerNavigator from './WebHamburgerNavigator';
import { PlannerScreen } from '../screens/PlannerScreen';
import PantryScreen from '../screens/PantryScreen';
import GroceryListScreen from '../screens/GroceryListScreen';
import HistoryScreen from '../screens/HistoryScreen';
import DiscoverRecipesScreen from '../screens/DiscoverRecipesScreen';
import SignInScreen from '../screens/SignInScreen.web';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';

// Define the root tab param list
export type RootTabParamList = {
  Home: undefined;
  Discover: undefined;
  Planner: undefined;
  // Add other screens here as needed for the hamburger menu
  Pantry: undefined;
  Groceries: undefined;
  History: undefined;
  SignIn: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabNavigator() {
  const isWeb = Platform.OS === 'web';
  const { isSmallWeb } = useResponsive();
  const { user } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      {isWeb && isSmallWeb && <WebHamburgerNavigator />}
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Discover') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Planner') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Pantry') {
              iconName = focused ? 'archive' : 'archive-outline';
            } else if (route.name === 'Groceries') {
              iconName = focused ? 'cart' : 'cart-outline';
            } else if (route.name === 'History') {
              iconName = focused ? 'time' : 'time-outline';
            }

            // Only hide icons on web, not on mobile
            return isWeb ? null : <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: isWeb
            ? {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 48,
                borderBottomWidth: 1,
                borderBottomColor: '#f0f0f0',
                backgroundColor: '#f0f0f0',
                // Only hide the tab bar on small web screens
                display: isSmallWeb ? 'none' : 'flex',
              }
            : undefined, // Use default style for mobile (bottom tabs)

          tabBarLabelStyle: isWeb
            ? {
                fontSize: 14,
                fontWeight: '600',
                paddingBottom: 0,
              }
            : undefined,
          headerShown: !isWeb, // Show header by default only on mobile
        })}
      >
        <Tab.Screen
          name="Home"
          component={isWeb ? WebScreenWrapper(HomeScreen) : HomeScreen}
          options={{ headerShown: false }} // Always hide header for Home
        />
        <Tab.Screen
          name="Discover"
          component={isWeb ? WebScreenWrapper(DiscoverRecipesScreen) : DiscoverRecipesScreen}
          options={{
            headerShown: false, // Always hide the tab navigator header for Discover
            tabBarLabel: 'Discover', // Keep the tab label as "Discover"
          }}
        />
        <Tab.Screen
          name="Planner"
          component={isWeb ? WebScreenWrapper(PlannerScreen) : PlannerScreen}
        />
        <Tab.Screen
          name="Pantry"
          component={isWeb ? WebScreenWrapper(PantryScreen) : PantryScreen}
        />
        <Tab.Screen
          name="Groceries"
          component={isWeb ? WebScreenWrapper(GroceryListScreen) : GroceryListScreen}
        />
        <Tab.Screen
          name="History"
          component={isWeb ? WebScreenWrapper(HistoryScreen) : HistoryScreen}
        />
        <Tab.Screen
          name="SignIn"
          component={isWeb ? WebScreenWrapper(SignInScreen) : SignInScreen}
          options={{
            tabBarLabel: user ? 'Account' : 'Sign In',
            tabBarIcon: ({ color, size }) =>
              isWeb ? null : (
                <Ionicons name={user ? 'person' : 'person-outline'} size={size} color={color} />
              ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

// A wrapper component to add top padding for web screens
function WebScreenWrapper(ScreenComponent: React.ComponentType<any>) {
  return (props: any) => {
    const { isSmallWeb } = useResponsive();

    return (
      <View
        style={{
          flex: 1,
          paddingTop: isSmallWeb ? 0 : 48, // Remove top padding on small web
          paddingHorizontal: isSmallWeb ? 8 : 0,
        }}
      >
        <ScreenComponent {...props} />
      </View>
    );
  };
}

const styles = StyleSheet.create({
  webScreenContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'web' && Dimensions.get('window').width < 768 ? 0 : 48,
  },
});

// Define interfaces for data models
export interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  image: string | number; // allow both URL and local require
  ingredients: string[]; // Still basic for now. Can enhance later with parsed amounts.
  instructions: string;
  prepTime: string;
  cookTime: string;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: string; // E.g., "2 pcs", "500g"
  unit?: string; // Optional: E.g., "g", "pcs", "ml"
  category?: string; // Optional: For filtering or grouping (e.g., "Dairy", "Spices")
}

export interface Plan {
  id: string;
  recipeIds: string[];
  name?: string; // Optional: User-defined label like "Week 1 Plan"
  startDate?: string; // Optional: ISO date string
  endDate?: string; // Optional: ISO date string
  isActive?: boolean; // Optional: For toggling plan
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
