import path from 'node:path';
import { existsSync } from 'node:fs';
import dotenv from 'dotenv';

let loaded = false;

export function loadDesktopEnvironment() {
  if (loaded) return;

  const appEnvPath = path.resolve(process.cwd(), '.env');
  const workspaceEnvPath = path.resolve(process.cwd(), '../../.env');
  const envPath = existsSync(appEnvPath) ? appEnvPath : workspaceEnvPath;

  dotenv.config({ path: envPath });
  loaded = true;
}
