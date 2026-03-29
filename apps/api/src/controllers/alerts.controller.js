import { listAlerts as getAlerts } from "../services/control-plane.service.js";

export function listAlerts(req, res) {
  return res.json(getAlerts());
}
