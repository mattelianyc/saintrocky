export const REALTIME_CLIENT_TYPES = ["web", "electron", "extension"];

export const REALTIME_CHANNEL_TYPES = ["rules", "runtime", "extension_sessions"];

export const REALTIME_INBOUND_MESSAGE_TYPES = {
  authenticate: "auth.authenticate",
  subscribe: "channel.subscribe",
  unsubscribe: "channel.unsubscribe",
  extensionSessionUpsert: "extension.session.upsert"
};

export const REALTIME_OUTBOUND_MESSAGE_TYPES = {
  ready: "realtime.ready",
  authConfirmed: "auth.confirmed",
  authRevoked: "auth.revoked",
  snapshot: "channel.snapshot",
  event: "channel.event",
  error: "realtime.error"
};

const RECONNECT_DELAYS_MS = [1000, 2000, 5000, 10000];

export function buildRulesChannel(ownerEmail) {
  return `rules:${String(ownerEmail || "").trim().toLowerCase()}`;
}

export function buildRuntimeChannel(ownerEmail, runtimeSurface) {
  return `runtime:${String(ownerEmail || "").trim().toLowerCase()}:${String(runtimeSurface || "").trim()}`;
}

export function buildExtensionSessionsChannel(ownerEmail) {
  return `extension-sessions:${String(ownerEmail || "").trim().toLowerCase()}`;
}

export function parseRealtimeChannel(channel) {
  const [channelType, ownerEmail = "", runtimeSurface = ""] = String(channel || "").split(":");

  if (channelType === "rules" && ownerEmail) {
    return { type: "rules", ownerEmail };
  }

  if (channelType === "runtime" && ownerEmail && runtimeSurface) {
    return { type: "runtime", ownerEmail, runtimeSurface };
  }

  if (channelType === "extension-sessions" && ownerEmail) {
    return { type: "extension_sessions", ownerEmail };
  }

  return null;
}

export function isKnownRealtimeChannel(channel) {
  return Boolean(parseRealtimeChannel(channel));
}

export function joinUrl(baseUrl, pathName = "") {
  const normalizedBaseUrl = String(baseUrl || "").replace(/\/+$/, "");
  const normalizedPath = String(pathName || "").replace(/^\/+/, "");

  if (!normalizedBaseUrl) {
    return normalizedPath ? `/${normalizedPath}` : "/";
  }

  return normalizedPath ? `${normalizedBaseUrl}/${normalizedPath}` : normalizedBaseUrl;
}

export function resolveRealtimeUrl(overrides = {}) {
  const baseUrl =
    overrides.baseUrl ||
    overrides.apiBaseUrl ||
    globalThis?.window?.__SAINTROCKY_API_BASE_URL__ ||
    globalThis?.window?.__NEXT_PUBLIC_API_BASE_URL__ ||
    globalThis?.process?.env?.ELECTRON_API_BASE_URL ||
    globalThis?.process?.env?.EXTENSION_API_BASE_URL ||
    globalThis?.process?.env?.NEXT_PUBLIC_API_BASE_URL ||
    globalThis?.process?.env?.API_BASE_URL ||
    "http://localhost:4000";

  return joinUrl(
    String(baseUrl).replace(/^http:/, "ws:").replace(/^https:/, "wss:"),
    String(overrides.realtimePath || "realtime").replace(/^\/+/, "")
  );
}

function parseMessage(rawValue) {
  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

export function createRealtimeClient(options = {}) {
  const channelHandlers = new Map();
  const connectionListeners = new Set();
  const SocketImplementation = options.WebSocket || globalThis.WebSocket;

  let socket = null;
  let reconnectTimer = null;
  let reconnectAttempt = 0;
  let shouldReconnect = true;
  let isAuthenticated = false;
  let isRevoked = false;
  let connectionState = "idle";

  function emitConnectionState(extra = {}) {
    connectionState = extra.state || connectionState;
    const payload = { state: connectionState, authenticated: isAuthenticated, ...extra };
    connectionListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch {}
    });
  }

  function send(message) {
    if (!socket || socket.readyState !== SocketImplementation.OPEN) {
      return false;
    }

    socket.send(JSON.stringify(message));
    return true;
  }

  function authenticate() {
    const token =
      typeof options.getAuthToken === "function" ? options.getAuthToken() : options.authToken || "";

    if (!token) {
      emitConnectionState({ state: "unauthenticated" });
      return;
    }

    send({
      type: REALTIME_INBOUND_MESSAGE_TYPES.authenticate,
      token,
      clientType: options.clientType || "web"
    });
  }

  function subscribeAll() {
    channelHandlers.forEach((_handlers, channel) => {
      send({
        type: REALTIME_INBOUND_MESSAGE_TYPES.subscribe,
        channel
      });
    });
  }

  function scheduleReconnect() {
    if (!shouldReconnect || reconnectTimer) {
      return;
    }

    const delay = RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)];
    reconnectAttempt += 1;
    reconnectTimer = globalThis.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delay);
  }

  function handleChannelMessage(message) {
    const handlers = channelHandlers.get(message.channel);
    if (!handlers?.size) {
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(message);
      } catch {}
    });
  }

  function connect() {
    if (!SocketImplementation) {
      throw new Error("WebSocket is not available in this runtime.");
    }

    shouldReconnect = true;

    if (socket && (socket.readyState === SocketImplementation.OPEN || socket.readyState === SocketImplementation.CONNECTING)) {
      return;
    }

    socket = new SocketImplementation(resolveRealtimeUrl(options));
    emitConnectionState({ state: "connecting" });

    socket.addEventListener("open", () => {
      reconnectAttempt = 0;
      emitConnectionState({ state: "connected" });
    });

    socket.addEventListener("message", (event) => {
      const message = parseMessage(event.data);
      if (!message?.type) {
        return;
      }

      if (message.type === REALTIME_OUTBOUND_MESSAGE_TYPES.ready) {
        authenticate();
        return;
      }

      if (message.type === REALTIME_OUTBOUND_MESSAGE_TYPES.authConfirmed) {
        isRevoked = false;
        isAuthenticated = true;
        emitConnectionState({ state: "authenticated" });
        subscribeAll();
        return;
      }

      if (message.type === REALTIME_OUTBOUND_MESSAGE_TYPES.authRevoked) {
        shouldReconnect = false;
        isRevoked = true;
        isAuthenticated = false;
        emitConnectionState({ state: "revoked", reason: message.reason || "session_revoked" });
        if (typeof options.onAuthRevoked === "function") {
          options.onAuthRevoked({
            reason: message.reason || "session_revoked"
          });
        }
        if (socket) {
          socket.close();
        }
        return;
      }

      if (
        message.type === REALTIME_OUTBOUND_MESSAGE_TYPES.snapshot ||
        message.type === REALTIME_OUTBOUND_MESSAGE_TYPES.event
      ) {
        handleChannelMessage(message);
        return;
      }

      if (message.type === REALTIME_OUTBOUND_MESSAGE_TYPES.error) {
        emitConnectionState({ state: "error", error: message.message || "Realtime error" });
      }
    });

    socket.addEventListener("close", () => {
      isAuthenticated = false;
      if (!isRevoked) {
        emitConnectionState({ state: "disconnected" });
      }
      scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      emitConnectionState({ state: "error", error: "Realtime transport error" });
    });
  }

  return {
    connect,
    disconnect() {
      shouldReconnect = false;
      if (reconnectTimer) {
        globalThis.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (socket) {
        socket.close();
        socket = null;
      }
      isRevoked = false;
      isAuthenticated = false;
      emitConnectionState({ state: "idle" });
    },
    publishExtensionSession(payload) {
      return send({
        type: REALTIME_INBOUND_MESSAGE_TYPES.extensionSessionUpsert,
        payload
      });
    },
    subscribe(channel, handler) {
      const handlers = channelHandlers.get(channel) || new Set();
      handlers.add(handler);
      channelHandlers.set(channel, handlers);

      if (isAuthenticated) {
        send({
          type: REALTIME_INBOUND_MESSAGE_TYPES.subscribe,
          channel
        });
      }

      return () => {
        const currentHandlers = channelHandlers.get(channel);
        if (!currentHandlers) {
          return;
        }

        currentHandlers.delete(handler);
        if (currentHandlers.size === 0) {
          channelHandlers.delete(channel);
          if (isAuthenticated) {
            send({
              type: REALTIME_INBOUND_MESSAGE_TYPES.unsubscribe,
              channel
            });
          }
        }
      };
    },
    onConnectionStateChange(listener) {
      connectionListeners.add(listener);
      listener({ state: connectionState, authenticated: isAuthenticated });
      return () => connectionListeners.delete(listener);
    }
  };
}
