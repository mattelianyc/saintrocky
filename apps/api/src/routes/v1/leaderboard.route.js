import { Router } from 'express';

import {
  getLeaderboardController,
  getMyDisciplineScoreController
} from '../../controllers/leaderboard.controller.js';

export function createLeaderboardRouter() {
  const router = Router();
  router.get('/', getLeaderboardController);
  router.get('/me', getMyDisciplineScoreController);
  return router;
}
