import Store from "electron-store";

const desktopAuthStore = new Store({
  name: "saintrocky-desktop-auth",
  clearInvalidConfig: true,
  encryptionKey: "saintrocky-desktop-auth-state",
  defaults: {
    sessionUser: null,
    sessionToken: ""
  }
});

export function loadStoredDesktopAuthState() {
  return {
    sessionUser: desktopAuthStore.get("sessionUser") || null,
    sessionToken: desktopAuthStore.get("sessionToken") || ""
  };
}

export function saveStoredDesktopAuthState(payload = {}) {
  const nextState = {
    sessionUser: payload.sessionUser || null,
    sessionToken: payload.sessionToken || ""
  };

  desktopAuthStore.set(nextState);
  return nextState;
}

export function clearStoredDesktopAuthState() {
  desktopAuthStore.clear();
  return {
    sessionUser: null,
    sessionToken: ""
  };
}
