import bcrypt from "bcryptjs";

import { saintRockyBranding } from "@saintrocky/branding";
import { registerSchema, validateAuthLogin } from "@saintrocky/validation";
import { MEMBER_ROLE } from "@saintrocky/shared";

import { signJwt } from "../auth/jwt.js";
import { env } from "../config/env.js";
import { connectMongo } from "../db/mongo.js";
import { User } from "../models/user.model.js";
import { incrementUserAuthVersion } from "../services/auth-session.service.js";
import { publishAuthRevoked } from "../services/realtime.service.js";
import { getAuthTokenFromRequest, requireUser } from "../utils/auth.js";

const LEGACY_SESSION_COOKIE_NAME = "saintrocky_session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getCookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    secure: env.nodeEnv === "production",
    maxAge,
    path: "/"
  };
}

function buildSessionUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    displayName: user.name || user.email,
    role: user.role,
    workspaceName: saintRockyBranding.productName
  };
}

function clearSessionCookies(res) {
  res.cookie(env.authCookieName, "", getCookieOptions(0));
  res.cookie(LEGACY_SESSION_COOKIE_NAME, "", getCookieOptions(0));
}

function issueSession(res, user) {
  const sessionUser = buildSessionUser(user);
  const token = signJwt(
    {
      ...sessionUser,
      authVersion: Number(user.authVersion ?? 0),
      tokenType: "session"
    },
    env.jwtSecret
  );

  res.cookie(env.authCookieName, token, getCookieOptions(SESSION_MAX_AGE_MS));
  res.cookie(LEGACY_SESSION_COOKIE_NAME, "", getCookieOptions(0));

  return { sessionUser, token };
}

async function validateRegisterPayload(payload) {
  try {
    const value = await registerSchema.validate(payload || {}, {
      abortEarly: false,
      stripUnknown: true
    });

    return { ok: true, value };
  } catch (error) {
    if (error?.name !== "ValidationError") {
      throw error;
    }

    const errors = (error.inner?.length ? error.inner : [error]).map((entry) => ({
      field: entry.path || "form",
      message: entry.message
    }));

    return { ok: false, errors };
  }
}

function assertAuthConfiguration() {
  if (!env.mongodbUri) {
    const error = new Error("MongoDB is required for email/password authentication.");
    error.status = 500;
    error.payload = {
      code: "AUTH_CONFIGURATION_INVALID",
      message: "MongoDB is required for email/password authentication."
    };
    throw error;
  }

  if (!env.jwtSecret) {
    const error = new Error("JWT secret is required for session authentication.");
    error.status = 500;
    error.payload = {
      code: "AUTH_CONFIGURATION_INVALID",
      message: "JWT secret is required for session authentication."
    };
    throw error;
  }
}

async function authenticateUser(email, password) {
  await connectMongo(env.mongodbUri);

  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() });
  if (!user) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return null;
  }

  return user;
}

export async function login(req, res, next) {
  const validation = validateAuthLogin(req.body || {});
  if (!validation.ok) {
    return res.status(400).json({
      ok: false,
      code: "BAD_REQUEST",
      errors: validation.errors
    });
  }

  try {
    assertAuthConfiguration();

    const user = await authenticateUser(req.body.email, req.body.password);
    if (!user) {
      clearSessionCookies(res);
      return res.status(401).json({
        ok: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password."
      });
    }

    const { sessionUser, token } = issueSession(res, user);

    return res.json({
      ok: true,
      user: sessionUser,
      token
    });
  } catch (error) {
    return next(error);
  }
}

export async function register(req, res, next) {
  const validation = await validateRegisterPayload(req.body || {});
  if (!validation.ok) {
    return res.status(400).json({
      ok: false,
      code: "BAD_REQUEST",
      errors: validation.errors
    });
  }

  try {
    assertAuthConfiguration();
    await connectMongo(env.mongodbUri);

    const normalizedEmail = validation.value.email.trim().toLowerCase();
    const normalizedName = validation.value.name.trim();
    const existingUser = await User.exists({ email: normalizedEmail });

    if (existingUser) {
      clearSessionCookies(res);
      return res.status(409).json({
        ok: false,
        code: "EMAIL_ALREADY_IN_USE",
        message: "An account with that email already exists.",
        errors: [{ field: "email", message: "An account with that email already exists." }]
      });
    }

    const passwordHash = await bcrypt.hash(validation.value.password, 12);
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      authVersion: 0,
      role: MEMBER_ROLE
    });

    const { sessionUser, token } = issueSession(res, user);

    return res.status(201).json({
      ok: true,
      user: sessionUser,
      token
    });
  } catch (error) {
    if (error?.code === 11000) {
      clearSessionCookies(res);
      return res.status(409).json({
        ok: false,
        code: "EMAIL_ALREADY_IN_USE",
        message: "An account with that email already exists.",
        errors: [{ field: "email", message: "An account with that email already exists." }]
      });
    }

    return next(error);
  }
}

export async function logout(req, res) {
  try {
    const token = getAuthTokenFromRequest(req);
    if (token) {
      try {
        const actor = await requireUser(req);
        const user = await incrementUserAuthVersion(actor.id);
        publishAuthRevoked({
          userId: String(user._id),
          email: user.email,
          reason: "signed_out"
        });
      } catch (error) {
        if (error?.status && error.status !== 401) {
          throw error;
        }
      }
    }
  } finally {
    clearSessionCookies(res);
  }

  return res.json({ ok: true });
}

export async function me(req, res) {
  try {
    const actor = await requireUser(req);
    return res.json({
      ok: true,
      user: {
        id: actor.id,
        email: actor.email,
        displayName: actor.displayName,
        role: actor.role,
        workspaceName: actor.workspaceName
      }
    });
  } catch {
    clearSessionCookies(res);
    return res.json({ ok: true, user: null });
  }
}

export async function createRuntimeToken(req, res) {
  try {
    const actor = await requireUser(req);
    const token = signJwt(
      {
        id: actor.id,
        email: actor.email,
        displayName: actor.displayName,
        role: actor.role,
        workspaceName: actor.workspaceName,
        authVersion: actor.authVersion,
        tokenType: "runtime",
        runtimeSurface: String(req.body?.runtimeSurface || req.query?.runtimeSurface || "web")
      },
      env.jwtSecret
    );

    return res.json({
      ok: true,
      user: {
        id: actor.id,
        email: actor.email,
        displayName: actor.displayName,
        role: actor.role,
        workspaceName: actor.workspaceName
      },
      token,
      realtimePath: "/realtime"
    });
  } catch (error) {
    const status = error?.status || 500;
    const payload = error?.payload || { ok: false, code: "AUTH_RUNTIME_TOKEN_ERROR", message: error?.message };
    return res.status(status).json(payload);
  }
}
