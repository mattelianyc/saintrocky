import { WebSocketServer } from "ws";

import {
  REALTIME_INBOUND_MESSAGE_TYPES,
  REALTIME_OUTBOUND_MESSAGE_TYPES,
  isKnownRealtimeChannel,
  parseRealtimeChannel,
  buildExtensionSessionsChannel
} from "@saintrocky/realtime";

import {
  markExtensionSessionDisconnected,
  upsertExtensionSession
} from "./extension-sessions.service.js";
import { canManageMemberRules } from "./rules-access.service.js";
import { authenticateSessionToken } from "./auth-session.service.js";

let realtimeServer = null;
const channelSubscriptions = new Map();
const userSockets = new Map();

function send(socket, payload) {
  if (socket.readyState !== 1) {
    return;
  }

  socket.send(JSON.stringify(payload));
}

function subscribeSocket(socket, channel) {
  const sockets = channelSubscriptions.get(channel) || new Set();
  sockets.add(socket);
  channelSubscriptions.set(channel, sockets);
  socket.subscribedChannels.add(channel);
}

function unsubscribeSocket(socket, channel) {
  const sockets = channelSubscriptions.get(channel);
  if (!sockets) {
    return;
  }

  sockets.delete(socket);
  if (sockets.size === 0) {
    channelSubscriptions.delete(channel);
  }
  socket.subscribedChannels.delete(channel);
}

function unsubscribeSocketFromAll(socket) {
  [...socket.subscribedChannels].forEach((channel) => unsubscribeSocket(socket, channel));
}

function registerSocketForUser(socket) {
  const userKey = String(socket.sessionUser?.email || "").trim().toLowerCase();
  if (!userKey) {
    return;
  }

  const sockets = userSockets.get(userKey) || new Set();
  sockets.add(socket);
  userSockets.set(userKey, sockets);
}

function unregisterSocketForUser(socket) {
  const userKey = String(socket.sessionUser?.email || "").trim().toLowerCase();
  if (!userKey) {
    return;
  }

  const sockets = userSockets.get(userKey);
  if (!sockets) {
    return;
  }

  sockets.delete(socket);
  if (!sockets.size) {
    userSockets.delete(userKey);
  }
}

function canAccessChannel(socket, channel) {
  const parsedChannel = parseRealtimeChannel(channel);
  if (!parsedChannel || !socket.sessionUser?.email) {
    return false;
  }

  if (parsedChannel.ownerEmail === String(socket.sessionUser.email || "").trim().toLowerCase()) {
    return true;
  }

  return canManageMemberRules(socket.sessionUser);
}

async function handleExtensionSessionUpsert(socket, payload = {}) {
  if (!socket.sessionUser) {
    send(socket, {
      type: REALTIME_OUTBOUND_MESSAGE_TYPES.error,
      message: "Authenticate before publishing session state."
    });
    return;
  }

  const response = await upsertExtensionSession({
    actor: socket.sessionUser,
    ...payload
  });

  socket.extensionSessionId = response.session?.sessionId || "";

  publishSnapshot(buildExtensionSessionsChannel(socket.sessionUser.email), {
    sessions: [response.session],
    eventType: "extension_session_upserted"
  });
}

async function handleMessage(socket, rawValue) {
  let message = null;
  try {
    message = JSON.parse(rawValue);
  } catch {
    send(socket, {
      type: REALTIME_OUTBOUND_MESSAGE_TYPES.error,
      message: "Invalid realtime payload."
    });
    return;
  }

  if (message?.type === REALTIME_INBOUND_MESSAGE_TYPES.authenticate) {
    try {
      unregisterSocketForUser(socket);
      socket.sessionUser = await authenticateSessionToken(message.token);
      socket.clientType = message.clientType || "web";
      registerSocketForUser(socket);
      send(socket, {
        type: REALTIME_OUTBOUND_MESSAGE_TYPES.authConfirmed,
        user: socket.sessionUser
      });
    } catch (error) {
      if (error?.status === 401) {
        send(socket, {
          type: REALTIME_OUTBOUND_MESSAGE_TYPES.authRevoked,
          reason: error?.payload?.code === "UNAUTHORIZED" ? "session_revoked" : "authentication_failed"
        });
        socket.close();
        return;
      }

      send(socket, {
        type: REALTIME_OUTBOUND_MESSAGE_TYPES.error,
        message: "Invalid realtime token."
      });
    }
    return;
  }

  if (message?.type === REALTIME_INBOUND_MESSAGE_TYPES.subscribe) {
    if (!isKnownRealtimeChannel(message.channel) || !canAccessChannel(socket, message.channel)) {
      send(socket, {
        type: REALTIME_OUTBOUND_MESSAGE_TYPES.error,
        message: "Not allowed to subscribe to that channel."
      });
      return;
    }

    subscribeSocket(socket, message.channel);
    return;
  }

  if (message?.type === REALTIME_INBOUND_MESSAGE_TYPES.unsubscribe) {
    unsubscribeSocket(socket, message.channel);
    return;
  }

  if (message?.type === REALTIME_INBOUND_MESSAGE_TYPES.extensionSessionUpsert) {
    await handleExtensionSessionUpsert(socket, message.payload);
  }
}

export function attachRealtimeServer(httpServer) {
  if (realtimeServer) {
    return realtimeServer;
  }

  realtimeServer = new WebSocketServer({ server: httpServer, path: "/realtime" });

  realtimeServer.on("connection", (socket) => {
    socket.sessionUser = null;
    socket.clientType = "web";
    socket.extensionSessionId = "";
    socket.subscribedChannels = new Set();

    send(socket, { type: REALTIME_OUTBOUND_MESSAGE_TYPES.ready });

    socket.on("message", (rawValue) => {
      handleMessage(socket, String(rawValue || "")).catch(() => {
        send(socket, {
          type: REALTIME_OUTBOUND_MESSAGE_TYPES.error,
          message: "Realtime message handling failed."
        });
      });
    });

    socket.on("close", () => {
      unsubscribeSocketFromAll(socket);
      unregisterSocketForUser(socket);

      if (socket.extensionSessionId && socket.sessionUser?.email) {
        markExtensionSessionDisconnected({
          actor: socket.sessionUser,
          sessionId: socket.extensionSessionId
        })
          .then((response) => {
            publishSnapshot(buildExtensionSessionsChannel(socket.sessionUser.email), {
              sessions: response.session ? [response.session] : [],
              eventType: "extension_session_disconnected"
            });
          })
          .catch(() => {});
      }
    });
  });

  return realtimeServer;
}

export function publishSnapshot(channel, payload) {
  const sockets = channelSubscriptions.get(channel);
  if (!sockets?.size) {
    return;
  }

  sockets.forEach((socket) => {
    send(socket, {
      type: REALTIME_OUTBOUND_MESSAGE_TYPES.snapshot,
      channel,
      payload
    });
  });
}

export function publishEvent(channel, event, payload = {}) {
  const sockets = channelSubscriptions.get(channel);
  if (!sockets?.size) {
    return;
  }

  sockets.forEach((socket) => {
    send(socket, {
      type: REALTIME_OUTBOUND_MESSAGE_TYPES.event,
      channel,
      event,
      payload
    });
  });
}

export function publishAuthRevoked({ email, reason = "session_revoked" } = {}) {
  const sockets = userSockets.get(String(email || "").trim().toLowerCase());
  if (!sockets?.size) {
    return;
  }

  sockets.forEach((socket) => {
    send(socket, {
      type: REALTIME_OUTBOUND_MESSAGE_TYPES.authRevoked,
      reason
    });
    socket.close();
  });
}
