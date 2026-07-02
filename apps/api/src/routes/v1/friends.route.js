import { Router } from 'express';

import {
  listFriendshipsController,
  requestFriendshipController,
  respondToFriendshipController
} from '../../controllers/friends.controller.js';

export function createFriendsRouter() {
  const router = Router();

  router.get('/', listFriendshipsController);
  router.post('/', requestFriendshipController);
  router.post('/:id/respond', respondToFriendshipController);

  return router;
}
