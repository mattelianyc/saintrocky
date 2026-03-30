import {
  listDirectMessages,
  listDirectMessageThreads,
  markDirectMessagesRead,
  sendDirectMessage
} from '../services/direct-messages.service.js';
import { requireUser } from '../utils/auth.js';

function respondWithError(res, error) {
  return res.status(error.status || 500).json(
    error.payload || { ok: false, code: 'DIRECT_MESSAGES_ERROR', message: error?.message || 'Direct messages request failed.' }
  );
}

export async function listDirectMessageThreadsController(req, res) {
  try {
    return res.json(await listDirectMessageThreads({ actor: await requireUser(req) }));
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function listDirectMessagesController(req, res) {
  try {
    return res.json(
      await listDirectMessages({
        counterpartyUserId: req.params.userId,
        actor: await requireUser(req)
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function sendDirectMessageController(req, res) {
  try {
    return res.status(201).json(
      await sendDirectMessage({
        recipientUserId: req.body?.recipientUserId,
        body: req.body?.body,
        actor: await requireUser(req)
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}

export async function markDirectMessagesReadController(req, res) {
  try {
    return res.json(
      await markDirectMessagesRead({
        counterpartyUserId: req.params.userId,
        actor: await requireUser(req)
      })
    );
  } catch (error) {
    return respondWithError(res, error);
  }
}
