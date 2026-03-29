import { env } from '@saintrocky/api/config/env';
import { roleAtLeast } from '@saintrocky/api/auth/roles';
import { ADMIN_ROLE_THRESHOLD, EDITOR_ROLE_THRESHOLD, OWNER_ROLE } from '@saintrocky/shared';
import { authenticateSessionToken } from '../services/auth-session.service.js';

export function getAuthTokenFromRequest(req) {
  const rawHeader = req.headers?.authorization || req.headers?.Authorization || '';
  if (rawHeader && rawHeader.startsWith('Bearer ')) {
    const token = rawHeader.slice('Bearer '.length).trim();
    if (token) return token;
  }
  return req.cookies?.[env.authCookieName] || null;
}

export function buildAuthError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  err.payload = { code, message };
  return err;
}

export async function requireRole(req, minRole, message) {
  const token = getAuthTokenFromRequest(req);
  const payload = await authenticateSessionToken(token);

  if (minRole && !roleAtLeast(payload?.role, minRole)) {
    throw buildAuthError(403, message, 'FORBIDDEN');
  }

  return payload;
}

export function requireUser(req) {
  return requireRole(req, null, 'Not authenticated');
}

export function requireEditor(req) {
  return requireRole(req, EDITOR_ROLE_THRESHOLD, 'Editor access required');
}

export function requireAdmin(req) {
  return requireRole(req, ADMIN_ROLE_THRESHOLD, 'Admin access required');
}

export function requireOwner(req) {
  return requireRole(req, OWNER_ROLE, 'Owner access required');
}
