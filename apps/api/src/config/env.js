import { defineSchema, loadApiRuntimeConfig, loadConfig, rules } from '@saintrocky/config';
import { parseAllowedOrigins } from '@saintrocky/shared';
import { loadEnvFiles } from '@saintrocky/config/load-env-files';

loadEnvFiles();

const schema = defineSchema({
  NODE_ENV: rules.optionalString('development'),
  PORT: rules.optionalNumber(),
  API_PORT: rules.optionalNumber(4000),
  LOG_LEVEL: rules.optionalString('info'),
  CORS_ALLOWED_ORIGINS: rules.optionalString(''),

  MONGODB_URI: rules.optionalString(),
  JWT_SECRET: rules.optionalString(),

  REDIS_URL: rules.optionalString(),
  RABBITMQ_URL: rules.optionalString(),

  AWS_ACCESS_KEY_ID: rules.optionalString(),
  AWS_SECRET_ACCESS_KEY: rules.optionalString(),
  AWS_S3_BUCKET: rules.optionalString(),
  AWS_REGION: rules.optionalString(),

  SMTP_HOST: rules.optionalString(),
  SMTP_PORT: rules.optionalNumber(0),
  SMTP_USER: rules.optionalString(),
  SMTP_PASS: rules.optionalString(),

  STRIPE_SECRET_KEY: rules.optionalString(),
  STRIPE_WEBHOOK_SECRET: rules.optionalString(),
  STRIPE_PUBLISHABLE_KEY: rules.optionalString(),

  OPENAI_API_KEY: rules.optionalString(),
  OPENAI_ORG_ID: rules.optionalString(),
  OPENAI_PROJECT_ID: rules.optionalString(),

  HUGGINGFACE_API_KEY: rules.optionalString(),
  HUGGINGFACE_CHAT_MODEL: rules.optionalString(),

  HELIUS_API_KEY: rules.optionalString(),
  HELIUS_WEBHOOK_SECRET: rules.optionalString(),
  PUBLIC_API_URL: rules.optionalString('http://localhost:4000'),
  SOLANA_RPC_URL: rules.optionalString('https://api.mainnet-beta.solana.com'),
  SOLANA_PLATFORM_KEYPAIR: rules.optionalString('')
});

const runtimeConfig = loadApiRuntimeConfig(process.env);
const cfg = loadConfig(process.env, schema);

function isWeakJwtSecret(secret) {
  const normalizedSecret = String(secret || '').trim().toLowerCase();
  return !normalizedSecret || ['change_me', 'changeme', 'secret', 'jwt_secret'].includes(normalizedSecret);
}

function isPlaceholderPublicUrl(value) {
  const normalizedValue = String(value || '').trim().toLowerCase();
  return !normalizedValue || normalizedValue.includes('your-app.herokuapp.com') || normalizedValue.includes('localhost');
}

if (cfg.NODE_ENV === 'production') {
  const missingKeys = [];

  if (!cfg.MONGODB_URI) {
    missingKeys.push('MONGODB_URI');
  }

  if (!cfg.JWT_SECRET) {
    missingKeys.push('JWT_SECRET');
  }

  if (!cfg.PUBLIC_API_URL) {
    missingKeys.push('PUBLIC_API_URL');
  }

  if (missingKeys.length) {
    throw new Error(`Missing required production env vars: ${missingKeys.join(', ')}`);
  }

  if (isWeakJwtSecret(cfg.JWT_SECRET)) {
    throw new Error('JWT_SECRET must be set to a non-placeholder value in production.');
  }

  if (isPlaceholderPublicUrl(cfg.PUBLIC_API_URL)) {
    throw new Error('PUBLIC_API_URL must be set to a non-placeholder production URL.');
  }
}

export const env = {
  nodeEnv: cfg.NODE_ENV,
  port: cfg.PORT || runtimeConfig.API_PORT || cfg.API_PORT,
  logLevel: cfg.LOG_LEVEL,
  corsAllowedOrigins: parseAllowedOrigins(cfg.CORS_ALLOWED_ORIGINS),

  mongodbUri: cfg.MONGODB_URI,
  jwtSecret: cfg.JWT_SECRET,

  redisUrl: cfg.REDIS_URL,
  rabbitmqUrl: cfg.RABBITMQ_URL,

  awsAccessKeyId: cfg.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: cfg.AWS_SECRET_ACCESS_KEY,
  awsS3Bucket: cfg.AWS_S3_BUCKET,
  awsRegion: cfg.AWS_REGION,

  smtpHost: cfg.SMTP_HOST,
  smtpPort: cfg.SMTP_PORT,
  smtpUser: cfg.SMTP_USER,
  smtpPass: cfg.SMTP_PASS,

  stripeSecretKey: cfg.STRIPE_SECRET_KEY,
  stripeWebhookSecret: cfg.STRIPE_WEBHOOK_SECRET,
  stripePublishableKey: cfg.STRIPE_PUBLISHABLE_KEY,

  openAiApiKey: cfg.OPENAI_API_KEY,
  openAiOrgId: cfg.OPENAI_ORG_ID,
  openAiProjectId: cfg.OPENAI_PROJECT_ID,

  huggingFaceApiKey: cfg.HUGGINGFACE_API_KEY,
  huggingFaceChatModel: cfg.HUGGINGFACE_CHAT_MODEL,

  heliusApiKey: cfg.HELIUS_API_KEY,
  heliusWebhookSecret: cfg.HELIUS_WEBHOOK_SECRET,
  publicApiUrl: cfg.PUBLIC_API_URL,
  solanaRpcUrl: cfg.SOLANA_RPC_URL,
  solanaPlatformKeypair: cfg.SOLANA_PLATFORM_KEYPAIR,

  authCookieName: 'saintrocky.auth'
};

export function assertRequiredEnv(keys) {
  const required = (keys && keys.length ? keys : []).map((key) => [key, env[key]]);
  const missing = required.filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}
