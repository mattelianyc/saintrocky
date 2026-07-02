import {
  listWorkflows as getWorkflows
} from "../services/control-plane.service.js";

export function listWorkflows(req, res) {
  return res.json(getWorkflows());
}
