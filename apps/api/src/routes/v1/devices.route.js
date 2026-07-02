import { Router } from "express";
import { listDevices } from "../../controllers/devices.controller.js";

export function createDevicesRouter() {
  const router = Router();
  router.get("/", listDevices);
  return router;
}
