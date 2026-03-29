import {
  listDesktopSessions as getDesktopSessions
} from "../services/control-plane.service.js";

export function listDesktopSessions(req, res) {
  return res.json(getDesktopSessions());
}
