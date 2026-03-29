import path from 'node:path';
import dotenv from 'dotenv';

import { defineSchema, loadApiRuntimeConfig, loadConfig, rules } from '@saintrocky/config';

// Load shared root .env (no per-app env files allowed)
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const schema = defineSchema({
  NODE_ENV: rules.optionalString('development'),
  PORT: rules.optionalNumber(),
  API_PORT: rules.optionalNumber(4000),
  LOG_LEVEL: rules.optionalString('info'),

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
  SOLANA_RPC_URL: rules.optionalString('https://api.mainnet-beta.solana.com')
});

const runtimeConfig = loadApiRuntimeConfig(process.env);
const cfg = loadConfig(process.env, schema);

export const env = {
  nodeEnv: cfg.NODE_ENV,
  port: cfg.PORT || runtimeConfig.API_PORT || cfg.API_PORT,
  logLevel: cfg.LOG_LEVEL,

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

  authCookieName: 'saintrocky.auth'
};

export function assertRequiredEnv(keys) {
  const required = (keys && keys.length ? keys : []).map((key) => [key, env[key]]);
  const missing = required.filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}
