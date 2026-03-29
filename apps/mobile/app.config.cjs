const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

module.exports = ({ config }) => ({
  ...config,
  name: config.name || 'Saint Rocky',
  slug: config.slug || 'saint-rocky',
  version: config.version || '0.1.0',
  extra: {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'Saint Rocky',
    EXPO_PUBLIC_PRODUCT_NAME: process.env.EXPO_PUBLIC_PRODUCT_NAME || 'Standard Deviants'
  }
});


