import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string | undefined;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined;

// Fail loudly at startup rather than with a confusing network error later on.
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase is not configured. Copy .env.example to .env and set ' +
      'EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Sign-in will be unavailable; the app still works in guest mode.',
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl ?? 'http://localhost', supabaseAnonKey ?? 'anon', {
  auth: {
    // On web the session lives in localStorage (supabase-js default); on native
    // it needs AsyncStorage explicitly or the session is lost on app restart.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // detectSessionInUrl only makes sense for OAuth redirects in a browser.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
