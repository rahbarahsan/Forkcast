import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useIsFocused } from '@react-navigation/native';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverRecipesScreen';
import { PlannerScreen } from '../screens/PlannerScreen';
import PantryScreen from '../screens/PantryScreen';
import GroceryScreen from '../screens/GroceryListScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ToolsScreen from '../screens/ToolsScreen';

export type RootTabParamList = {
  Home: undefined;
  Discover: undefined;
  Planner: undefined;
  Pantry: undefined;
  Groceries: undefined;
  History: undefined;
  Tools: undefined;
};
const Tab = createBottomTabNavigator<RootTabParamList>();
function focusVisibility(Screen: React.ComponentType) {
  return function FocusedScreen() {
    const focused=useIsFocused();
    return <View style={{flex:1,display:focused?'flex':'none'}} accessibilityElementsHidden={!focused} importantForAccessibility={focused?'auto':'no-hide-descendants'}><Screen /></View>;
  };
}
const screens={Home:focusVisibility(HomeScreen),Discover:focusVisibility(DiscoverScreen),Planner:focusVisibility(PlannerScreen),Pantry:focusVisibility(PantryScreen),Groceries:focusVisibility(GroceryScreen),Tools:focusVisibility(ToolsScreen),History:focusVisibility(HistoryScreen)};
const icons: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'leaf-outline',
  Discover: 'restaurant-outline',
  Planner: 'calendar-outline',
  Pantry: 'file-tray-stacked-outline',
  Groceries: 'basket-outline',
  History: 'time-outline',
  Tools: 'options-outline',
};
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
        tabBarAccessibilityLabel: route.name,
          tabBarActiveTintColor: '#245544',
          tabBarInactiveTintColor: '#53665b',
          tabBarLabelStyle: { fontSize: 11 },
          tabBarStyle: { height: 68, paddingBottom: 10, paddingTop: 6 },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={icons[route.name]} color={color} size={size} />
          ),
        })}
      >
      <Tab.Screen name="Home" component={screens.Home} />
      <Tab.Screen name="Discover" component={screens.Discover} options={{ title: 'Recipes' }} />
      <Tab.Screen name="Planner" component={screens.Planner} />
      <Tab.Screen name="Pantry" component={screens.Pantry} />
      <Tab.Screen name="Groceries" component={screens.Groceries} />
      <Tab.Screen name="Tools" component={screens.Tools} />
      <Tab.Screen name="History" component={screens.History} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
