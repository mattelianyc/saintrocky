import { Router } from "express";
import { listWorkflows } from "../../controllers/workflows.controller.js";

export function createWorkflowsRouter() {
  const router = Router();
  router.get("/", listWorkflows);
  return router;
}
