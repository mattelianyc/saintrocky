import path from 'node:path';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import dotenv from 'dotenv';

import { disconnectMongo } from '@saintrocky/api/db/mongo';

let loadedEnvPath = null;

export function loadSeedEnvironment() {
  if (loadedEnvPath) return loadedEnvPath;

  const rootEnvPath = path.resolve(process.cwd(), '.env');
  const workspaceEnvPath = path.resolve(process.cwd(), '../../.env');
  const envPath = existsSync(rootEnvPath) ? rootEnvPath : workspaceEnvPath;

  dotenv.config({ path: envPath });
  loadedEnvPath = envPath;
  return loadedEnvPath;
}

export function requireMongoUri() {
  loadSeedEnvironment();
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing MONGODB_URI');
  }
  return process.env.MONGODB_URI;
}

export function isDirectExecution(importMetaUrl) {
  const entryFilePath = process.argv[1];
  if (!entryFilePath) return false;
  return importMetaUrl === pathToFileURL(path.resolve(entryFilePath)).href;
}

export async function runSeedScript(importMetaUrl, runSeed) {
  if (!isDirectExecution(importMetaUrl)) return;

  try {
    loadSeedEnvironment();
    await runSeed();
  } catch (err) {
    console.error(err);
    try {
      await disconnectMongo();
    } catch {}
    process.exit(1);
  }
}

export function parseOmitNames(argv = process.argv.slice(2)) {
  const omittedNames = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token) continue;

    if (token === '--omit') {
      const nextValue = argv[index + 1] || '';
      nextValue
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => omittedNames.add(value));
      index += 1;
      continue;
    }

    if (token.startsWith('--omit=')) {
      token
        .slice('--omit='.length)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach((value) => omittedNames.add(value));
    }
  }

  return omittedNames;
}
