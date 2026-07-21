import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Cross-platform storage utility that works on both web and mobile
 * Uses localStorage for web and AsyncStorage for mobile
 */
export const storage = {
  /**
   * Get an item from storage
   * @param key The key to get
   * @returns A promise that resolves to the value or null if not found
   */
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Web implementation
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error getting item from localStorage:', error);
        return null;
      }
    } else {
      // Mobile implementation
      try {
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.error('Error getting item from AsyncStorage:', error);
        return null;
      }
    }
  },

  /**
   * Set an item in storage
   * @param key The key to set
   * @param value The value to set
   * @returns A promise that resolves when the operation is complete
   */
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Web implementation
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error setting item in localStorage:', error);
      }
    } else {
      // Mobile implementation
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.error('Error setting item in AsyncStorage:', error);
      }
    }
  },

  /**
   * Remove an item from storage
   * @param key The key to remove
   * @returns A promise that resolves when the operation is complete
   */
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Web implementation
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing item from localStorage:', error);
      }
    } else {
      // Mobile implementation
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.error('Error removing item from AsyncStorage:', error);
      }
    }
  },

  /**
   * Clear all items from storage
   * @returns A promise that resolves when the operation is complete
   */
  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      // Web implementation
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    } else {
      // Mobile implementation
      try {
        await AsyncStorage.clear();
      } catch (error) {
        console.error('Error clearing AsyncStorage:', error);
      }
    }
  },
};
