// src/navigation/index.tsx (updated)

import React from 'react';
import { Platform, View } from 'react-native';
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

// Screen components are built once, at module scope, and never rebuilt.
//
// Passing `component={WebScreenWrapper(Screen)}` inline creates a new component
// identity on every render of TabNavigator. React then treats it as a different
// component, unmounts the current screen and remounts it -- which resets the
// navigator to its initial route. Any re-render of an ancestor (the auth
// provider settling its session, for instance) would silently bounce the user
// back to Home and make every tab look broken.
const isWebPlatform = Platform.OS === 'web';
const wrap = (Screen: React.ComponentType<any>) =>
  isWebPlatform ? WebScreenWrapper(Screen) : Screen;

const Screens = {
  Home: wrap(HomeScreen),
  Discover: wrap(DiscoverRecipesScreen),
  Planner: wrap(PlannerScreen),
  Pantry: wrap(PantryScreen),
  Groceries: wrap(GroceryListScreen),
  History: wrap(HistoryScreen),
  SignIn: wrap(SignInScreen),
};

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
          component={Screens.Home}
          options={{ headerShown: false }} // Always hide header for Home
        />
        <Tab.Screen
          name="Discover"
          component={Screens.Discover}
          options={{
            headerShown: false, // Always hide the tab navigator header for Discover
            tabBarLabel: 'Discover', // Keep the tab label as "Discover"
          }}
        />
        <Tab.Screen name="Planner" component={Screens.Planner} />
        <Tab.Screen name="Pantry" component={Screens.Pantry} />
        <Tab.Screen name="Groceries" component={Screens.Groceries} />
        <Tab.Screen name="History" component={Screens.History} />
        <Tab.Screen
          name="SignIn"
          component={Screens.SignIn}
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


// Data models live in ../types. They used to be duplicated here as well, and
// the copies had drifted: this file's PantryItem carried `unit` and `category`
// fields the canonical one never had.

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
