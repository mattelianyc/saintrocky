import { Router } from 'express';

import { createRuntimeToken, login, logout, me, register } from '@saintrocky/api/controllers/auth';

export function createAuthRouter() {
  const router = Router();

  router.post('/register', register);
  router.post('/login', login);
  router.post('/logout', logout);
  router.post('/runtime-token', createRuntimeToken);
  router.get('/me', me);

  return router;
}
