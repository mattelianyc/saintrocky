import { defineSchema, loadConfig, rules } from './schema.js';

const baseRuntimeSchema = defineSchema({
  APP_ENV: rules.optionalString("development"),
  API_BASE_URL: rules.optionalString("http://localhost:4000"),
  PUBLIC_SITE_URL: rules.optionalString(""),
  PUBLIC_APP_NAME: rules.optionalString("Saint Rocky"),
  PUBLIC_PRODUCT_NAME: rules.optionalString("Standard Deviants")
});

const apiRuntimeSchema = defineSchema({
  API_PORT: rules.optionalNumber(4000),
  MONGODB_URI: rules.optionalString(""),
  REDIS_URL: rules.optionalString(""),
  RABBITMQ_URL: rules.optionalString(""),
  SMTP_HOST: rules.optionalString(""),
  SMTP_PORT: rules.optionalNumber(587),
  SMTP_USER: rules.optionalString(""),
  SMTP_PASS: rules.optionalString("")
});

const webRuntimeSchema = defineSchema({
  NEXT_PUBLIC_API_BASE_URL: rules.optionalString("http://localhost:4000"),
  NEXT_PUBLIC_SITE_URL: rules.optionalString(""),
  NEXT_PUBLIC_APP_NAME: rules.optionalString("Saint Rocky"),
  NEXT_PUBLIC_PRODUCT_NAME: rules.optionalString("Standard Deviants")
});

const mobileRuntimeSchema = defineSchema({
  EXPO_PUBLIC_API_URL: rules.optionalString("http://localhost:4000"),
  EXPO_PUBLIC_WEB_URL: rules.optionalString("https://saintrocky.com"),
  EXPO_PUBLIC_APP_NAME: rules.optionalString("Saint Rocky"),
  EXPO_PUBLIC_PRODUCT_NAME: rules.optionalString("Standard Deviants"),
  EXPO_PUBLIC_ANALYTICS_KEY: rules.optionalString("")
});

const extensionRuntimeSchema = defineSchema({
  EXTENSION_API_BASE_URL: rules.optionalString("http://localhost:4000"),
  EXTENSION_APP_NAME: rules.optionalString("Saint Rocky")
});

const electronRuntimeSchema = defineSchema({
  ELECTRON_API_BASE_URL: rules.optionalString("http://localhost:4000"),
  ELECTRON_APP_NAME: rules.optionalString("Saint Rocky")
});

function loadRuntime(env, schema) {
  return loadConfig(env, {
    ...baseRuntimeSchema,
    ...schema
  });
}

export function loadApiRuntimeConfig(env = process.env) {
  return loadRuntime(env, apiRuntimeSchema);
}

export function loadWebRuntimeConfig(env = process.env) {
  return loadRuntime(env, webRuntimeSchema);
}

export function loadMobileRuntimeConfig(env = process.env) {
  return loadRuntime(env, mobileRuntimeSchema);
}

export function loadExtensionRuntimeConfig(env = process.env) {
  return loadRuntime(env, extensionRuntimeSchema);
}

export function loadElectronRuntimeConfig(env = process.env) {
  return loadRuntime(env, electronRuntimeSchema);
}
