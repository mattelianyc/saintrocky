import { getDashboardSummary } from "../services/control-plane.service.js";

export function getDashboard(req, res) {
  return res.json(getDashboardSummary());
}
