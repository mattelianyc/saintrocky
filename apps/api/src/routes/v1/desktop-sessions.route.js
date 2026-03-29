import { Router } from "express";
import {
  listDesktopSessions
} from "../../controllers/desktop-sessions.controller.js";

export function createDesktopSessionsRouter() {
  const router = Router();
  router.get("/", listDesktopSessions);
  return router;
}
