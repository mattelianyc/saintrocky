import { Router } from 'express';

import {
  heliusWebhookController,
  listRecentTradesController
} from '../../controllers/chain.controller.js';

export function createChainRouter() {
  const router = Router();
  router.post('/webhook/helius', heliusWebhookController);
  router.get('/trades', listRecentTradesController);
  return router;
}
