import cron from 'node-cron';

import { logger } from '@saintrocky/api/logger';
import { buildLeaderboardChannel } from '@saintrocky/realtime';

import { getLeaderboard } from '../services/leaderboard.service.js';
import { publishSnapshot } from '../services/realtime.service.js';

const tasks = [];

async function publishLeaderboardSnapshot() {
  try {
    const leaderboard = await getLeaderboard(10);
    publishSnapshot(buildLeaderboardChannel(), { leaderboard });
  } catch (error) {
    logger.error('[cron] leaderboard publish failed', error?.message);
  }
}

export function startCron() {
  tasks.push(
    cron.schedule('*/5 * * * *', () => {
      logger.info('[cron] heartbeat');
    })
  );

  tasks.push(
    cron.schedule('*/30 * * * * *', () => {
      publishLeaderboardSnapshot();
    })
  );
}

export function stopCron() {
  for (const t of tasks) t.stop();
  tasks.length = 0;
}
