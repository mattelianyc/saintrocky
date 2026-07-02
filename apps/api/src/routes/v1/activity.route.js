import { Router } from "express";
import { listActivity } from "../../controllers/activity.controller.js";

export function createActivityRouter() {
  const router = Router();
  router.get("/", listActivity);
  return router;
}
