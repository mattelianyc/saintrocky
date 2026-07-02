import { Router } from "express";
import { listAlerts } from "../../controllers/alerts.controller.js";

export function createAlertsRouter() {
  const router = Router();
  router.get("/", listAlerts);
  return router;
}
