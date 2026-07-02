import { getBilling } from "../services/control-plane.service.js";

export function getBillingSummary(req, res) {
  return res.json(getBilling());
}
