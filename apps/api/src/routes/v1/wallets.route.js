import { Router } from 'express';

import {
  linkWalletController,
  listWalletsController,
  unlinkWalletController
} from '../../controllers/wallets.controller.js';

export function createWalletsRouter() {
  const router = Router();
  router.get('/', listWalletsController);
  router.post('/link', linkWalletController);
  router.delete('/:address', unlinkWalletController);
  return router;
}
