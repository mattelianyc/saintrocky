const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

function readStringEnv(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

module.exports = ({ config }) => {
  const projectId = readStringEnv(process.env.EXPO_PUBLIC_EAS_PROJECT_ID) || readStringEnv(process.env.EAS_PROJECT_ID);
  const extra = {
    ...(config.extra || {}),
    EXPO_PUBLIC_APP_ENV: readStringEnv(process.env.EXPO_PUBLIC_APP_ENV) || 'development'
  };

  const apiUrl = readStringEnv(process.env.EXPO_PUBLIC_API_URL);
  const analyticsKey = readStringEnv(process.env.EXPO_PUBLIC_ANALYTICS_KEY);

  if (apiUrl) extra.EXPO_PUBLIC_API_URL = apiUrl;
  if (analyticsKey) extra.EXPO_PUBLIC_ANALYTICS_KEY = analyticsKey;
  if (projectId) {
    extra.EXPO_PUBLIC_EAS_PROJECT_ID = projectId;
    extra.eas = { projectId };
  }

  return {
    ...config,
    name: 'Saint Rocky',
    slug: 'saint-rocky',
    version: config.version || '0.1.0',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#000000'
    },
    android: {
      ...(config.android || {}),
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      }
    },
    web: {
      ...(config.web || {}),
      favicon: './assets/favicon.png'
    },
    plugins: [...(config.plugins || []), 'expo-notifications'],
    extra
  };
};
