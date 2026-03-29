import cron from 'node-cron';

import { logger } from '@saintrocky/api/logger';

const tasks = [];

export function startCron() {
  tasks.push(
    cron.schedule('*/5 * * * *', () => {
      logger.info('[cron] heartbeat');
    })
  );
}

export function stopCron() {
  for (const t of tasks) t.stop();
  tasks.length = 0;
}
