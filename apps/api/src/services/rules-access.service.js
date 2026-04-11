import { roleAtLeast } from '@saintrocky/api/auth/roles';
import { env } from '@saintrocky/api/config/env';
import { connectMongo } from '@saintrocky/api/db/mongo';
import { User } from '@saintrocky/api/models/user';
import { MEMBER_ROLE } from '@saintrocky/shared';

const RULES_MANAGER_ROLE_THRESHOLD = 'operator';

function buildAccessError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.payload = { ok: false, code, message };
  return error;
}

function normalizeUser(user) {
  return {
    id: String(user._id || user.id),
    email: user.email,
    displayName: user.name || user.displayName || user.email,
    role: user.role
  };
}

async function ensureRulesMongo() {
  if (!env.mongodbUri) {
    throw buildAccessError(500, 'RULES_CONFIGURATION_INVALID', 'MongoDB is required for persisted rules data.');
  }

  await connectMongo(env.mongodbUri);
}

async function findUserByEmail(email) {
  await ensureRulesMongo();
  const user = await User.findOne({
    email: String(email || '').trim().toLowerCase(),
    deletionRequestedAt: null
  }).lean();
  return user ? normalizeUser(user) : null;
}

export function canManageMemberRules(actor) {
  return roleAtLeast(actor?.role, RULES_MANAGER_ROLE_THRESHOLD);
}

export async function resolveRuleActor(actor) {
  if (!actor?.email) {
    throw buildAccessError(401, 'UNAUTHORIZED', 'Not authenticated');
  }

  const user = await findUserByEmail(actor.email);
  if (!user) {
    throw buildAccessError(401, 'UNAUTHORIZED', 'Authenticated user no longer exists');
  }

  return user;
}

export async function listManageableRuleOwners(actor) {
  await ensureRulesMongo();

  if (!canManageMemberRules(actor)) {
    return [actor];
  }

  const users = await User.find({ role: MEMBER_ROLE, deletionRequestedAt: null }).sort({ name: 1, email: 1 }).lean();
  return users.map(normalizeUser);
}

export async function resolveRequestedRuleOwner(actor, requestedOwnerEmail) {
  if (!requestedOwnerEmail && !canManageMemberRules(actor)) {
    return actor;
  }

  const manageableOwners = await listManageableRuleOwners(actor);
  const fallbackOwner = manageableOwners[0] || actor;
  const resolvedOwnerEmail = requestedOwnerEmail || fallbackOwner.email;

  if (!canManageMemberRules(actor) && resolvedOwnerEmail !== actor.email) {
    throw buildAccessError(403, 'FORBIDDEN', 'Members may only manage their own rules');
  }

  const owner = manageableOwners.find((entry) => entry.email === resolvedOwnerEmail);
  if (!owner) {
    throw buildAccessError(404, 'NOT_FOUND', 'Requested rule owner was not found');
  }

  return owner;
}

export function assertRuleRecordAccess(actor, ownerEmail) {
  if (ownerEmail === actor.email) {
    return;
  }

  if (!canManageMemberRules(actor)) {
    throw buildAccessError(403, 'FORBIDDEN', 'Members may only access their own rules');
  }
}
