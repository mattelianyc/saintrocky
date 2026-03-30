import { Router } from 'express';

import {
  listDirectMessagesController,
  listDirectMessageThreadsController,
  markDirectMessagesReadController,
  sendDirectMessageController
} from '../../controllers/messages.controller.js';

export function createMessagesRouter() {
  const router = Router();

  router.get('/threads', listDirectMessageThreadsController);
  router.get('/threads/:userId', listDirectMessagesController);
  router.post('/', sendDirectMessageController);
  router.post('/threads/:userId/read', markDirectMessagesReadController);

  return router;
}
