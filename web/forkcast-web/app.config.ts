import 'dotenv/config';

export default {
  expo: {
    name: 'Forkcast',
    slug: 'forkcast',
    version: '1.0.0',
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL, // 👈 this line is what makes BASE_URL work
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
