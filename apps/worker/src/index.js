import { loadApiRuntimeConfig } from '@saintrocky/config';
import { logger } from '@saintrocky/api/logger';
import { workerJobs } from './jobs.js';
import { startEmailWorker } from './email.worker.js';

const runtimeConfig = loadApiRuntimeConfig(process.env);

async function main() {
  logger.info('[worker] booting Saint Rocky jobs');
  workerJobs.forEach((job) => {
    logger.info(`[worker] ${job.title}: ${job.summary}`);
  });

  if (runtimeConfig.RABBITMQ_URL && runtimeConfig.SMTP_HOST) {
    await startEmailWorker();
    logger.info('[worker] email worker ready');
  } else {
    logger.info('[worker] email worker skipped because queue or SMTP env is missing');
  }

  async function shutdown(signal) {
    logger.info(`[worker] shutting down (${signal})`);
    process.exit(0);
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Worker failed to start', err);
  process.exit(1);
});



