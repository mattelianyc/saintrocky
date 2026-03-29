import { listDevices as getDevices } from "../services/control-plane.service.js";

export function listDevices(req, res) {
  return res.json(getDevices());
}
