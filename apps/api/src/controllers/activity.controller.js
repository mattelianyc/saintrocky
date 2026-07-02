import { listActivity as getActivity } from "../services/control-plane.service.js";

export function listActivity(req, res) {
  return res.json(getActivity());
}
