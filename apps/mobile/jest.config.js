export default {
  displayName: 'saintrocky-mobile',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.js'],
  transform: {},
  moduleNameMapper: {
    '^expo-constants$': '<rootDir>/src/__mocks__/expo-constants.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
