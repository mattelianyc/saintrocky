import {
  listFriendships,
  requestFriendship,
  respondToFriendship
} from '../services/friendships.service.js';
import { requireUser } from '../utils/auth.js';

function respondWithError(res, error) {
  return res.status(error.status || 500).json(
    error.payload || { ok: false, code: 'FRIENDSHIPS_ERROR', message: error?.message || 'Friendships request failed.' }
  );
}

export async function listFriendshipsController(req, res) {
  try {
    return res.json(await listFriendships({ actor: await requireUser(req) }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function requestFriendshipController(req, res) {
  try {
    return res.status(201).json(await requestFriendship({ ...req.body, actor: await requireUser(req) }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function respondToFriendshipController(req, res) {
  try {
    return res.json(
      await respondToFriendship({
        friendshipId: req.params.id,
        action: req.body?.action,
        actor: await requireUser(req)
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}
