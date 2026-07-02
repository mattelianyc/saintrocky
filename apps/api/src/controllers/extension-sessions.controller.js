import {
  listExtensionSessions,
  upsertExtensionSession
} from "../services/extension-sessions.service.js";
import { requireUser } from "../utils/auth.js";

function respondWithError(res, error) {
  const status = error?.status || 500;
  const payload =
    error?.payload || { ok: false, code: "EXTENSION_SESSION_ERROR", message: error?.message || "Request failed" };

  return res.status(status).json(payload);
}

function getActor(req) {
  return requireUser(req);
}

export async function listExtensionSessionsController(req, res) {
  try {
    return res.json(await listExtensionSessions({ actor: await getActor(req), ownerEmail: req.query?.ownerEmail }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function upsertExtensionSessionController(req, res) {
  try {
    return res.status(201).json(await upsertExtensionSession({ ...req.body, actor: await getActor(req) }));
  } catch (error) {
    return respondWithError(res, error);
  }
}
