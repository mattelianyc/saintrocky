import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import next from "next";

import { loadEnvFiles } from "@saintrocky/config/load-env-files";
import { createApiApp } from "@saintrocky/api/app";
import { attachRealtimeServer, startApiAncillaryServices } from "@saintrocky/api/bootstrap";
import { env } from "@saintrocky/api/config/env";
import { logger } from "@saintrocky/api/logger";

loadEnvFiles();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const webDirectory = path.join(currentDirectory, "apps", "web");
const isDevelopment = env.nodeEnv !== "production";
const port = Number(process.env.PORT || env.port || 4000);

const nextApplication = next({
  dev: isDevelopment,
  dir: webDirectory
});

async function startUnifiedServer() {
  await nextApplication.prepare();

  const apiApplication = createApiApp();
  const application = express();
  const nextRequestHandler = nextApplication.getRequestHandler();

  application.use(apiApplication);
  application.use((req, res) => nextRequestHandler(req, res));

  const httpServer = http.createServer(application);
  attachRealtimeServer(httpServer);

  httpServer.listen(port, () => {
    logger.info(`Unified server listening on :${port}`);
    startApiAncillaryServices();
  });
}

startUnifiedServer().catch((error) => {
  logger.error("Failed to start unified server", error);
  process.exit(1);
});
