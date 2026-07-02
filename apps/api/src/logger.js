import { createLogger } from '@saintrocky/logger';
import { env } from '@saintrocky/api/config/env';

export const logger = createLogger({ level: env.logLevel });
