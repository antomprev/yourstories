export default {
  name: 'StoryTime',
  slug: 'storytime',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'storytime',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/icon.png',
      backgroundColor: '#ffffff'
    }
  },
  web: {
    favicon: './assets/images/favicon.png',
    bundler: 'metro',
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
      userScalable: false
    }
  },
  plugins: [
    'expo-router'
  ],
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true
  }
}