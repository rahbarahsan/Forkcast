import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const storage = {
  async getItem(key: string) {
    return Platform.OS === 'web' ? localStorage.getItem(key) : AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await AsyncStorage.setItem(key, value);
  },
};
