import { Router } from "express";
import { getDashboard } from "../../controllers/dashboard.controller.js";

export function createDashboardRouter() {
  const router = Router();
  router.get("/", getDashboard);
  return router;
}
