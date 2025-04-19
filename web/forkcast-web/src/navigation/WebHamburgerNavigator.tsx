import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';
import { RootTabParamList } from './index';

const WebHamburgerNavigator: React.FC = () => {
  const { isSmallWeb } = useResponsive();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigation = useNavigation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navigateToScreen = (screenName: keyof RootTabParamList) => {
    // @ts-ignore
    navigation.navigate(screenName);
    setIsMenuOpen(false); // Close menu after navigation
  };

  // Define the navigation links
  const navLinks: { name: keyof RootTabParamList; label: string }[] = [
    { name: 'Home', label: 'Home' },
    { name: 'Discover', label: 'Discover' },
    { name: 'Planner', label: 'Planner' },
    { name: 'Pantry', label: 'Pantry' },
    { name: 'Groceries', label: 'Groceries' },
    { name: 'History', label: 'History' },
    { name: 'SignIn', label: 'Sign In' },
  ];

  if (!isSmallWeb) {
    return null; // Don't render on larger screens
  }

  return (
    <View style={styles.container}>
      {/* Hamburger Icon */}
      <TouchableOpacity onPress={toggleMenu} style={styles.hamburgerIcon}>
        <Ionicons name={isMenuOpen ? 'close' : 'menu'} size={32} color="#000" />
      </TouchableOpacity>

      {/* Menu (Drawer/Modal) */}
      {isMenuOpen && (
        <View style={styles.menu}>
          {navLinks.map((link) => (
            <TouchableOpacity
              key={link.name}
              style={styles.menuItem}
              onPress={() => navigateToScreen(link.name)}
            >
              <Text style={styles.menuItemText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50, // Height of the header bar
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0', // Match the original tab bar background
    zIndex: 10, // Ensure it's above other content
  },
  hamburgerIcon: {
    padding: 5,
  },
  menu: {
    position: 'absolute',
    top: 50, // Position below the header bar
    left: 0,
    width: 200, // Adjust width as needed
    height: Dimensions.get('window').height - 50, // Take remaining height
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
    paddingVertical: 10,
    zIndex: 9, // Below the header but above screen content
  },
  menuItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 18,
  },
});

export default WebHamburgerNavigator;
