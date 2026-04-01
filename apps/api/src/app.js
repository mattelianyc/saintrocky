import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from '@saintrocky/api/config/env';
import { logger } from '@saintrocky/api/logger';

import { createV1Router } from '@saintrocky/api/routes/v1/index';
import { createHealthRouter } from '@saintrocky/api/routes/health';

function buildAllowedOrigins() {
  const allowedOrigins = new Set(env.corsAllowedOrigins);

  if (env.nodeEnv !== 'production') {
    allowedOrigins.add('http://localhost:4000');
    allowedOrigins.add('http://localhost:5173');
    allowedOrigins.add('http://127.0.0.1:5173');
    allowedOrigins.add('http://localhost:5174');
    allowedOrigins.add('http://127.0.0.1:5174');
  }

  return allowedOrigins;
}

function isAllowedExtensionOrigin(origin) {
  return String(origin || '').startsWith('chrome-extension://');
}

function createCorsOptions() {
  const allowedOrigins = buildAllowedOrigins();

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      if (env.nodeEnv !== 'production' && isAllowedExtensionOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    }
  };
}

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many authentication attempts. Please try again later.'
  }
});

export function createApiApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors(createCorsOptions()));
  app.use(cookieParser());
  app.use('/api/v1/auth/login', authRateLimiter);
  app.use('/api/v1/auth/register', authRateLimiter);

  const jsonParser = express.json({ limit: '10mb' });
  app.use((req, res, next) => {
    if (req.path === '/api/v1/payments/webhook') return next();
    return jsonParser(req, res, next);
  });
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/health', createHealthRouter());
  app.use('/api/v1', createV1Router());

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    logger.error('API request failed', err);
    const status = err?.status || 500;
    const payload = err?.payload || { code: 'INTERNAL', message: 'Internal error' };
    return res.status(status).json(payload);
  });

  return app;
}
