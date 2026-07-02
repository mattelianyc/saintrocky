import { Router } from 'express';

import { getPublicSettings, getSettings, updateSettings } from '@saintrocky/api/controllers/seo';

export function createSeoRouter() {
  const router = Router();

  router.get('/public', getPublicSettings);
  router.get('/', getSettings);
  router.put('/', updateSettings);

  return router;
}
