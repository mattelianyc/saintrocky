import { Router } from "express";
import {
  listExtensionSessionsController,
  upsertExtensionSessionController
} from "../../controllers/extension-sessions.controller.js";

export function createExtensionSessionsRouter() {
  const router = Router();
  router.get("/", listExtensionSessionsController);
  router.post("/", upsertExtensionSessionController);
  return router;
}
