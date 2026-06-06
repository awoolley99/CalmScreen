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
  updates: {
    url: 'https://u.expo.dev/43b298de-4d8e-4f65-9af1-fa0e667c3af9',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    eas: {
      projectId: '43b298de-4d8e-4f65-9af1-fa0e667c3af9',
    },
  },
  experiments: {
    typedRoutes: true,
  },
});
