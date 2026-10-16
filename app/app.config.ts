import 'dotenv/config';
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Forkcast',
  slug: config.slug ?? 'forkcast',
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-image-picker',
      {
        photosPermission: 'Choose a pantry or flyer image to review.',
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
  ],
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  },
});
