import { defineSchema, loadConfig, rules } from '@saintrocky/config';

const schema = defineSchema({
  AWS_ACCESS_KEY_ID: rules.optionalString(),
  AWS_SECRET_ACCESS_KEY: rules.optionalString(),
  AWS_S3_BUCKET: rules.optionalString(),
  AWS_REGION: rules.optionalString()
});

const cfg = loadConfig(process.env, schema);

export const assetsEnv = {
  awsAccessKeyId: cfg.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: cfg.AWS_SECRET_ACCESS_KEY,
  awsS3Bucket: cfg.AWS_S3_BUCKET,
  awsRegion: cfg.AWS_REGION
};

export function assertAssetsEnv(keys) {
  const required = (keys && keys.length ? keys : []).map((k) => [k, assetsEnv[k]]);
  const missing = required.filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
}
