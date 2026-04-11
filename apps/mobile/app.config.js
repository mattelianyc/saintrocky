const { loadEnvFiles } = require('@saintrocky/config/load-env-files');

loadEnvFiles();

const expoOwner = 'mattelianyc';
const androidPackage = 'com.standarddeviants.saintrocky';

module.exports = ({ config }) => {
  const extra = { ...(config.extra || {}) };

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('EXPO_PUBLIC_') || key === 'EAS_PROJECT_ID') {
      extra[key] = value;
    }
  }

  const projectId = extra.EXPO_PUBLIC_EAS_PROJECT_ID || extra.EAS_PROJECT_ID;
  const plugins = Array.from(new Set([...(config.plugins || []), 'expo-notifications', 'expo-updates']));
  if (projectId) {
    extra.eas = { projectId };
  }

  return {
    ...config,
    owner: expoOwner,
    name: 'Saint Rocky',
    slug: 'saint-rocky',
    version: config.version || '1.0.0',
    runtimeVersion: { policy: 'appVersion' },
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'cover',
      backgroundColor: '#E6F4FE'
    },
    updates: projectId
      ? {
          ...(config.updates || {}),
          url: `https://u.expo.dev/${projectId}`
        }
      : config.updates,
    android: {
      ...(config.android || {}),
      package: androidPackage,
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
    plugins,
    extra
  };
};
