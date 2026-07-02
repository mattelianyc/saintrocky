import { connectMongo } from "../db/mongo.js";
import { User } from "../models/user.model.js";
import { verifyJwt } from "../auth/jwt.js";
import { env } from "../config/env.js";

function buildAuthError(status, message, code) {
  const error = new Error(message);
  error.status = status;
  error.payload = { ok: false, code, message };
  return error;
}

export async function authenticateSessionToken(token) {
  if (!token) {
    throw buildAuthError(401, "Not authenticated", "UNAUTHORIZED");
  }

  if (!env.jwtSecret) {
    throw buildAuthError(500, "JWT secret is required for session authentication.", "AUTH_CONFIGURATION_INVALID");
  }

  let payload = null;
  try {
    payload = verifyJwt(token, env.jwtSecret);
  } catch {
    throw buildAuthError(401, "Invalid token", "UNAUTHORIZED");
  }

  if (!env.mongodbUri) {
    throw buildAuthError(500, "MongoDB is required for session authentication.", "AUTH_CONFIGURATION_INVALID");
  }

  await connectMongo(env.mongodbUri);
  const user = await User.findById(payload.id).lean();
  if (!user) {
    throw buildAuthError(401, "Session user no longer exists", "UNAUTHORIZED");
  }

  if (user.deletionRequestedAt) {
    throw buildAuthError(401, "Account has been deleted", "UNAUTHORIZED");
  }

  if (Number(payload.authVersion ?? 0) !== Number(user.authVersion ?? 0)) {
    throw buildAuthError(401, "Session has been revoked", "UNAUTHORIZED");
  }

  return {
    id: String(user._id),
    email: user.email,
    displayName: user.name || user.email,
    role: user.role,
    workspaceName: payload.workspaceName,
    authVersion: Number(user.authVersion ?? 0),
    tokenType: payload.tokenType || "session",
    runtimeSurface: payload.runtimeSurface || null
  };
}

export async function incrementUserAuthVersion(userId) {
  if (!env.mongodbUri) {
    throw buildAuthError(500, "MongoDB is required for session authentication.", "AUTH_CONFIGURATION_INVALID");
  }

  await connectMongo(env.mongodbUri);
  const user = await User.findByIdAndUpdate(
    userId,
    { $inc: { authVersion: 1 } },
    { new: true }
  ).lean();

  if (!user) {
    throw buildAuthError(404, "Session user no longer exists", "NOT_FOUND");
  }

  return user;
}
