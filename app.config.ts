import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'CalmScreen',
  slug: 'calmscreen',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    backgroundColor: '#FDF6EE',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.calmscreen.app',
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
      },
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#FDF6EE',
    },
    package: 'com.calmscreen.app',
  },
  plugins: [
    'expo-router',
    [
      'expo-build-properties',
      {
        ios: { newArchEnabled: true },
        android: { newArchEnabled: true },
      },
    ],
  ],
  scheme: 'calmscreen',
  experiments: {
    typedRoutes: true,
  },
});
