import { Router } from 'express';

import {
  createCampaignController,
  listCampaignsController,
  respondToCampaignInviteController
} from '../../controllers/campaigns.controller.js';

export function createCampaignsRouter() {
  const router = Router();

  router.get('/', listCampaignsController);
  router.post('/', createCampaignController);
  router.post('/:id/respond', respondToCampaignInviteController);

  return router;
}
