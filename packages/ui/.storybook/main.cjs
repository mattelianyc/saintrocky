/** @type {import('storybook').StorybookConfig} */
module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  async viteFinal(config) {
    // Ensure JSX uses the automatic runtime so stories don't need `import React`.
    // Without this, some environments compile JSX to React.createElement and require a React global.
    const react = require('@vitejs/plugin-react');
    config.plugins = config.plugins || [];
    config.plugins.push(react());

    config.esbuild = {
      ...(config.esbuild || {}),
      jsx: 'automatic'
    };

    return config;
  }
};


