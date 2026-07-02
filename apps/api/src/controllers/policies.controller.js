import { listPolicies as getPolicies } from "../services/control-plane.service.js";

export function listPolicies(req, res) {
  return res.json(getPolicies());
}
