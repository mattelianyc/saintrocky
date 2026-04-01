const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

module.exports = ({ config }) => {
  const extra = { ...(config.extra || {}) };

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('EXPO_PUBLIC_') || key === 'EAS_PROJECT_ID') {
      extra[key] = value;
    }
  }

  const projectId = extra.EXPO_PUBLIC_EAS_PROJECT_ID || extra.EAS_PROJECT_ID;
  if (projectId) {
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
        monochromeImage: './assets/android-icon-monochrome.png'
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
