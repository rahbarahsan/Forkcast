import React from 'react';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, useIsFocused } from '@react-navigation/native';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverRecipesScreen';
import { PlannerScreen } from '../screens/PlannerScreen';
import PantryScreen from '../screens/PantryScreen';
import GroceryScreen from '../screens/GroceryListScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ToolsScreen from '../screens/ToolsScreen';
import AssistantScreen from '../screens/AssistantScreen';
import { colors, serif } from '../components/ui';

export type RootTabParamList = {
  Home: undefined;
  Discover: undefined;
  Planner: undefined;
  Pantry: undefined;
  Groceries: undefined;
  History: undefined;
  Tools: undefined;
  Assistant: undefined;
};
const Tab = createBottomTabNavigator<RootTabParamList>();
function focusVisibility(Screen: React.ComponentType) {
  return function FocusedScreen() {
    const focused = useIsFocused();
    return (
      <View
        style={{ flex: 1, display: focused ? 'flex' : 'none' }}
        accessibilityElementsHidden={!focused}
        importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}
      >
        <Screen />
      </View>
    );
  };
}
const screens = {
  Home: focusVisibility(HomeScreen),
  Discover: focusVisibility(DiscoverScreen),
  Planner: focusVisibility(PlannerScreen),
  Pantry: focusVisibility(PantryScreen),
  Groceries: focusVisibility(GroceryScreen),
  Tools: focusVisibility(ToolsScreen),
  History: focusVisibility(HistoryScreen),
  Assistant: focusVisibility(AssistantScreen),
};
const icons: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'leaf-outline',
  Discover: 'restaurant-outline',
  Planner: 'calendar-outline',
  Pantry: 'file-tray-stacked-outline',
  Groceries: 'basket-outline',
  History: 'time-outline',
  Tools: 'options-outline',
  Assistant: 'chatbubble-ellipses-outline',
};
const labels: Record<string, string> = {
  Home: 'Overview',
  Discover: 'Recipes',
  Planner: 'Meal planner',
  Pantry: 'My pantry',
  Groceries: 'Shopping list',
  Tools: 'Kitchen tools',
  History: 'History',
  Assistant: 'Kitchen assistant',
};
function KitchenNavigation({ state, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1050;
  return (
    <View
      style={
        desktop
          ? { width: 224, backgroundColor: '#193a2d', padding: 20, gap: 10 }
          : {
              backgroundColor: '#fffef9',
              borderTopWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              paddingBottom: 12,
              paddingTop: 8,
            }
      }
    >
      {desktop && (
        <View style={{ paddingVertical: 22, paddingHorizontal: 12, marginBottom: 34, gap: 12 }}>
          <Text style={{ fontFamily: serif, fontSize: 37, color: '#f8f6ec', letterSpacing: -2 }}>
            forkcast.
          </Text>
          <Text style={{ fontSize: 8, color: '#c2d0b6', letterSpacing: 2 }}>
            THE EVERYDAY KITCHEN
          </Text>
        </View>
      )}
      {state.routes.map((route, index) => {
        const active = state.index === index;
        const name = route.name as keyof RootTabParamList;
        const color = desktop
          ? active
            ? '#203e2e'
            : '#e0e5d8'
          : active
            ? colors.green
            : '#626d63';
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={route.name}
            accessibilityState={{ selected: active }}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={({ pressed }) =>
              desktop
                ? {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    gap: 13,
                    backgroundColor: active ? '#ddecaa' : pressed ? '#2d4b3c' : 'transparent',
                    borderRadius: 12,
                  }
                : {
                    flex: 1,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    opacity: pressed ? 0.6 : 1,
                  }
            }
          >
            <Ionicons name={icons[name]} color={color} size={desktop ? 19 : 20} />
            <Text
              numberOfLines={1}
              style={{ fontSize: desktop ? 12 : 9, color, fontWeight: active ? '600' : '400' }}
            >
              {desktop
                ? labels[name]
                : (
                    {
                      Discover: 'Recipes',
                      Groceries: 'Shop',
                      Assistant: 'Chat',
                      Home: 'Home',
                    } as Record<string, string>
                  )[name] || name}
            </Text>
          </Pressable>
        );
      })}
      {desktop && (
        <View
          style={{
            marginTop: 'auto',
            gap: 12,
            padding: 12,
            borderTopWidth: 1,
            borderColor: '#49604c',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 4, backgroundColor: '#ddecaa' }} />
            <Text style={{ color: '#d8e1cb', fontSize: 11 }}>Your own little kitchen</Text>
          </View>
          <Text style={{ color: '#b5c4aa', fontSize: 10, lineHeight: 16 }}>
            Good food. A little less waste.
          </Text>
        </View>
      )}
    </View>
  );
}
export default function AppNavigator() {
  const { width } = useWindowDimensions();
  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
        {width < 1050 && (
          <View
            style={{
              paddingHorizontal: 22,
              paddingVertical: 15,
              backgroundColor: colors.paper,
              borderBottomWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{ fontFamily: serif, fontSize: 27, color: colors.green, letterSpacing: -1 }}
            >
              forkcast.
            </Text>
            <Text style={{ color: colors.muted, fontSize: 9, letterSpacing: 1.4 }}>
              YOUR EVERYDAY KITCHEN
            </Text>
          </View>
        )}
        <Tab.Navigator
          tabBar={(props) => <KitchenNavigation {...props} />}
          screenOptions={({ route }) => ({
            tabBarPosition: width >= 1050 ? 'left' : 'bottom',
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
          <Tab.Screen name="Groceries" component={screens.Groceries} options={{ title: 'Shop' }} />
          <Tab.Screen name="Tools" component={screens.Tools} />
          <Tab.Screen name="Assistant" component={screens.Assistant} options={{ title: 'Chat' }} />
          <Tab.Screen name="History" component={screens.History} />
        </Tab.Navigator>
      </View>
    </NavigationContainer>
  );
}
