import http from "node:http";

import { env } from '@saintrocky/api/config/env';
import { logger } from '@saintrocky/api/logger';
import { createApiApp } from '@saintrocky/api/app';
import { attachRealtimeServer } from "./services/realtime.service.js";
import { startApiAncillaryServices } from "./bootstrap.js";

const app = createApiApp();
const port = env.port || 4000;
const httpServer = http.createServer(app);

attachRealtimeServer(httpServer);

httpServer.listen(port, () => {
  logger.info(`API listening on :${port}`);
  startApiAncillaryServices();
});
