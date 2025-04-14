// src/navigation/index.tsx (updated)

import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import PlannerScreen from '../screens/PlannerScreen';
import PantryScreen from '../screens/PantryScreen';
import GroceryListScreen from '../screens/GroceryListScreen';
import HistoryScreen from '../screens/HistoryScreen';
import DiscoverRecipesScreen from '../screens/DiscoverRecipesScreen';

// Define the root tab param list
export type RootTabParamList = {
  Home: undefined;
  Discover: undefined;
  Planner: undefined;
  Pantry: undefined;
  Groceries: undefined;
  History: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function TabNavigator() {
  const isWeb = Platform.OS === 'web';

  return (
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
              backgroundColor: '#fff',
              elevation: 0,
              shadowOpacity: 0,
            }
          : undefined,
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
      <Tab.Screen name="Pantry" component={isWeb ? WebScreenWrapper(PantryScreen) : PantryScreen} />
      <Tab.Screen
        name="Groceries"
        component={isWeb ? WebScreenWrapper(GroceryListScreen) : GroceryListScreen}
      />
      <Tab.Screen
        name="History"
        component={isWeb ? WebScreenWrapper(HistoryScreen) : HistoryScreen}
      />
    </Tab.Navigator>
  );
}

// A wrapper component to add top padding for web screens
function WebScreenWrapper(ScreenComponent: React.ComponentType<any>) {
  return (props: any) => (
    <View style={styles.webScreenContainer}>
      <ScreenComponent {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  webScreenContainer: {
    flex: 1,
    paddingTop: 48, // Match the height of our tab bar
  },
});

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
