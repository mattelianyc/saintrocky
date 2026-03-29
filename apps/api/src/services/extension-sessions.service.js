import { env } from "@saintrocky/api/config/env";
import { connectMongo } from "@saintrocky/api/db/mongo";
import { ExtensionSession } from "../models/extension-session.model.js";
import { buildExtensionSessionsChannel } from "@saintrocky/realtime";

import {
  assertRuleRecordAccess,
  canManageMemberRules,
  listManageableRuleOwners,
  resolveRequestedRuleOwner,
  resolveRuleActor
} from "./rules-access.service.js";
import { publishSnapshot } from "./realtime.service.js";

async function ensureMongo() {
  if (!env.mongodbUri) {
    const error = new Error("MongoDB is required for extension sessions.");
    error.status = 500;
    error.payload = {
      ok: false,
      code: "EXTENSION_SESSIONS_CONFIGURATION_INVALID",
      message: "MongoDB is required for extension sessions."
    };
    throw error;
  }

  await connectMongo(env.mongodbUri);
}

function toIsoNow() {
  return new Date().toISOString();
}

function normalizeSessionRecord(actor, payload = {}, existingRecord = null) {
  const timestamp = toIsoNow();
  const connectionState = payload.connectionState || existingRecord?.connectionState || "connected";

  return {
    sessionId: String(payload.sessionId || existingRecord?.sessionId || ""),
    ownerUserId: actor.id,
    ownerEmail: actor.email,
    ownerDisplayName: actor.displayName,
    runtimeSurface: "browser_extension",
    browserName: String(payload.browserName || existingRecord?.browserName || ""),
    browserVersion: String(payload.browserVersion || existingRecord?.browserVersion || ""),
    extensionVersion: String(payload.extensionVersion || existingRecord?.extensionVersion || ""),
    platform: String(payload.platform || existingRecord?.platform || ""),
    connectionState,
    lastSeenAt: timestamp,
    connectedAt:
      connectionState === "connected"
        ? existingRecord?.connectedAt || timestamp
        : existingRecord?.connectedAt || "",
    disconnectedAt: connectionState === "disconnected" ? timestamp : "",
    metadata: {
      ...(existingRecord?.metadata || {}),
      ...(payload.metadata || {})
    },
    runtimeState: {
      ...(existingRecord?.runtimeState || {}),
      ...(payload.runtimeState || {})
    }
  };
}

export async function listExtensionSessions(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);
  const owner = await resolveRequestedRuleOwner(actor, payload.ownerEmail);
  const owners = await listManageableRuleOwners(actor);
  const sessions = await ExtensionSession.find({ ownerUserId: owner.id }).sort({ updatedAt: -1 }).lean();

  return {
    ok: true,
    owner,
    owners,
    canManageMembers: canManageMemberRules(actor),
    sessions
  };
}

export async function upsertExtensionSession(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);

  if (!payload.sessionId) {
    const error = new Error("Session id is required.");
    error.status = 400;
    error.payload = {
      ok: false,
      code: "BAD_REQUEST",
      message: "Session id is required."
    };
    throw error;
  }

  const existingRecord = await ExtensionSession.findOne({ sessionId: payload.sessionId }).lean();
  if (existingRecord) {
    assertRuleRecordAccess(actor, existingRecord.ownerEmail);
  }

  const sessionRecord = normalizeSessionRecord(actor, payload, existingRecord);
  const session = await ExtensionSession.findOneAndUpdate(
    { sessionId: sessionRecord.sessionId },
    sessionRecord,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  publishSnapshot(buildExtensionSessionsChannel(actor.email), {
    eventType: "extension_session_upserted",
    sessions: [session]
  });

  return {
    ok: true,
    session
  };
}

export async function markExtensionSessionDisconnected(payload = {}) {
  await ensureMongo();
  const actor = await resolveRuleActor(payload.actor);
  const existingRecord = await ExtensionSession.findOne({ sessionId: payload.sessionId }).lean();

  if (!existingRecord) {
    return { ok: true, session: null };
  }

  assertRuleRecordAccess(actor, existingRecord.ownerEmail);

  const session = await ExtensionSession.findOneAndUpdate(
    { sessionId: payload.sessionId },
    {
      connectionState: "disconnected",
      disconnectedAt: toIsoNow(),
      lastSeenAt: toIsoNow()
    },
    { new: true }
  ).lean();

  publishSnapshot(buildExtensionSessionsChannel(actor.email), {
    eventType: "extension_session_disconnected",
    sessions: session ? [session] : []
  });

  return {
    ok: true,
    session
  };
}
