import { Router } from "express";
import { listPolicies } from "../../controllers/policies.controller.js";

export function createPoliciesRouter() {
  const router = Router();
  router.get("/", listPolicies);
  return router;
}
