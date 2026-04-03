import electronUpdater from "electron-updater";

const { autoUpdater } = electronUpdater;

let updaterConfigured = false;
const updaterListeners = new Set();
let updaterState = {
  status: "idle",
  availableVersion: "",
  downloadedVersion: "",
  checkedAt: "",
  errorMessage: ""
};

function updateState(patch = {}) {
  updaterState = {
    ...updaterState,
    ...patch
  };

  updaterListeners.forEach((listener) => {
    try {
      listener(updaterState);
    } catch {}
  });

  return updaterState;
}

export function getUpdaterState() {
  return updaterState;
}

export function onUpdaterStateChange(listener) {
  if (typeof listener !== "function") {
    return () => {};
  }

  updaterListeners.add(listener);
  listener(updaterState);
  return () => {
    updaterListeners.delete(listener);
  };
}

export function configureDesktopUpdater() {
  if (updaterConfigured) {
    return;
  }

  updaterConfigured = true;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    updateState({ status: "checking", checkedAt: new Date().toISOString(), errorMessage: "" });
  });

  autoUpdater.on("update-available", (info) => {
    updateState({
      status: "update-available",
      availableVersion: info?.version || "",
      checkedAt: new Date().toISOString(),
      errorMessage: ""
    });
  });

  autoUpdater.on("update-not-available", () => {
    updateState({
      status: "up-to-date",
      availableVersion: "",
      downloadedVersion: "",
      checkedAt: new Date().toISOString(),
      errorMessage: ""
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    updateState({
      status: "ready-to-install",
      downloadedVersion: info?.version || "",
      checkedAt: new Date().toISOString(),
      errorMessage: ""
    });
  });

  autoUpdater.on("error", (error) => {
    updateState({
      status: "error",
      errorMessage: error?.message || "Desktop update failed.",
      checkedAt: new Date().toISOString()
    });
  });
}

export async function checkForDesktopUpdates() {
  configureDesktopUpdater();
  return autoUpdater.checkForUpdatesAndNotify();
}

export function quitAndInstallDesktopUpdate() {
  autoUpdater.quitAndInstall();
}
