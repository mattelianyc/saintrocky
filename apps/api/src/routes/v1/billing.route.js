import { Router } from "express";
import { getBillingSummary } from "../../controllers/billing.controller.js";

export function createBillingRouter() {
  const router = Router();
  router.get("/", getBillingSummary);
  return router;
}
