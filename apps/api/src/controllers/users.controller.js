import { buildSessionUser } from "@saintrocky/auth";
import { profileSchema } from "@saintrocky/validation";

import { env } from '../config/env.js';
import { connectMongo } from '../db/mongo.js';
import { User } from '../models/user.model.js';
import { publishAuthRevoked } from '../services/realtime.service.js';
import { listUsers as getUsers } from "../services/control-plane.service.js";
import { requireUser } from '../utils/auth.js';

const LEGACY_SESSION_COOKIE_NAME = 'saintrocky_session';

function buildPersistedSessionUser(user, workspaceName) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name || '',
    displayName: user.name || user.email,
    avatarUrl: user.avatarUrl || '',
    role: user.role,
    workspaceName: workspaceName || '$TANDARD / DEVIANT$'
  };
}

function buildConfigurationError(message) {
  const error = new Error(message);
  error.status = 500;
  error.payload = {
    ok: false,
    code: 'AUTH_CONFIGURATION_INVALID',
    message
  };
  return error;
}

async function loadPersistedActor(req) {
  const actor = await requireUser(req);

  if (!env.mongodbUri) {
    throw buildConfigurationError('MongoDB is required for profile management.');
  }

  await connectMongo(env.mongodbUri);

  const user = await User.findById(actor.id);
  if (!user || user.deletionRequestedAt) {
    const error = new Error('User account not found.');
    error.status = 404;
    error.payload = {
      ok: false,
      code: 'NOT_FOUND',
      message: 'User account not found.'
    };
    throw error;
  }

  return { actor, user };
}

function getCookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    secure: env.nodeEnv === 'production',
    maxAge,
    path: '/'
  };
}

function clearSessionCookies(res) {
  res.cookie(env.authCookieName, '', getCookieOptions(0));
  res.cookie(LEGACY_SESSION_COOKIE_NAME, '', getCookieOptions(0));
}

export function listUsers(req, res) {
  return res.json(getUsers());
}

export function createUser(req, res) {
  return res.status(201).json({
    ok: true,
    user: buildSessionUser(req.body?.email || "new.user@thestandard.dev")
  });
}

export async function getMe(req, res, next) {
  try {
    const { actor, user } = await loadPersistedActor(req);

    return res.json({
      ok: true,
      user: buildPersistedSessionUser(user, actor.workspaceName)
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const { actor, user } = await loadPersistedActor(req);
    const value = await profileSchema.validate(
      {
        name: req.body?.name ?? user.name ?? '',
        email: req.body?.email ?? user.email,
        avatarUrl: req.body?.avatarUrl ?? user.avatarUrl ?? null
      },
      {
        abortEarly: false,
        stripUnknown: true
      }
    );

    user.name = value.name || '';
    user.email = value.email;
    user.avatarUrl = value.avatarUrl || '';
    await user.save();

    return res.json({
      ok: true,
      user: buildPersistedSessionUser(user, actor.workspaceName)
    });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        ok: false,
        code: 'VALIDATION_ERROR',
        message: 'Please fix the highlighted fields.',
        errors: (error.inner?.length ? error.inner : [error]).map((entry) => ({
          field: entry.path || 'form',
          message: entry.message
        }))
      });
    }

    if (error?.code === 11000 && error?.keyPattern?.email) {
      return res.status(409).json({
        ok: false,
        code: 'EMAIL_ALREADY_IN_USE',
        message: 'That email address is already in use.'
      });
    }

    return next(error);
  }
}

export function getUser(req, res) {
  return res.json({
    ok: true,
    user: buildSessionUser(`${req.params.id}@thestandard.dev`)
  });
}

export function updateUser(req, res) {
  return res.json({
    ok: true,
    user: buildSessionUser(req.body?.email || `${req.params.id}@thestandard.dev`)
  });
}

export function deleteUser(req, res) {
  return res.json({
    ok: true,
    deletedUserId: req.params.id
  });
}

export async function requestAccountDeletion(req, res, next) {
  try {
    const actor = await requireUser(req);

    if (!env.mongodbUri) {
      const error = new Error('MongoDB is required for account deletion.');
      error.status = 500;
      error.payload = {
        ok: false,
        code: 'AUTH_CONFIGURATION_INVALID',
        message: 'MongoDB is required for account deletion.'
      };
      throw error;
    }

    await connectMongo(env.mongodbUri);

    const deletedAt = new Date();
    const user = await User.findByIdAndUpdate(
      actor.id,
      {
        $set: { deletionRequestedAt: deletedAt },
        $inc: { authVersion: 1 }
      },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({
        ok: false,
        code: 'NOT_FOUND',
        message: 'User account not found.'
      });
    }

    clearSessionCookies(res);
    publishAuthRevoked({
      userId: String(user._id),
      email: user.email,
      reason: 'account_deleted'
    });

    return res.json({
      ok: true,
      deletionRequestedAt: deletedAt.toISOString()
    });
  } catch (error) {
    return next(error);
  }
}
