import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, Menu, Notification, Tray, ipcMain, nativeImage, nativeTheme, screen, shell } from 'electron';

import { clearStoredDesktopAuthState, loadStoredDesktopAuthState, saveStoredDesktopAuthState } from './auth-store.js';
import { desktopRuntimeModels } from './runtime-models.js';
import { getDesktopRuntimeConfig } from './runtime-config.js';
import { loadDesktopEnvironment } from './load-environment.js';
import {
  checkForDesktopUpdates,
  configureDesktopUpdater,
  getUpdaterState,
  onUpdaterStateChange,
  quitAndInstallDesktopUpdate
} from './updater.js';

loadDesktopEnvironment();

const runtimeConfig = getDesktopRuntimeConfig();
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const desktopPartition = 'persist:saintrocky-desktop';
const rendererDevelopmentUrl = process.env.ELECTRON_RENDERER_URL || '';
const trayTooltipBase = 'Saint Rocky Desktop Runtime';
let tray = null;
let isQuitting = false;
let dockBounceId = 0;
let alwaysOnTopResetTimer = null;
let meterOverlayWindow = null;
let latestMeterOverlayState = null;
let nativeRuntimeState = {
  monitorStatus: 'idle',
  pendingViolationCount: 0,
  chainViolationCount: 0,
  hideToTrayOnClose: true
};
let desktopAuthState = loadStoredDesktopAuthState();

function buildWindowTitle() {
  const companyName = desktopRuntimeModels.branding.companyName;
  const productName = runtimeConfig.ELECTRON_APP_NAME || desktopRuntimeModels.branding.productName;
  return `${companyName} - ${productName}`;
}

function getPreloadPath() {
  return path.join(currentDirectoryPath, 'preload.js');
}

function getRendererBuildHtmlPath() {
  return path.join(currentDirectoryPath, '..', 'dist-renderer', 'index.html');
}

function getMeterOverlayHtmlPath() {
  return path.join(currentDirectoryPath, 'renderer', 'meter-overlay', 'index.html');
}

function getTrayIconPath() {
  return path.join(currentDirectoryPath, '..', 'resources', 'tray-icon.png');
}

function getWindowIconPath() {
  return path.join(currentDirectoryPath, '..', 'resources', 'icon.png');
}

function isRendererDevelopmentMode() {
  return Boolean(rendererDevelopmentUrl);
}

function buildDesktopThemeState() {
  return {
    theme: nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  };
}

function broadcastToRenderer(channel, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send(channel, payload);
}

function showMainWindow() {
  if (!mainWindow) {
    mainWindow = createMainWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  mainWindow.focus();
}

function buildMeterOverlayBounds() {
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { workArea } = display;
  const width = 360;
  const height = 200;
  const horizontalMargin = 24;
  const verticalMargin = 48;

  return {
    width,
    height,
    x: Math.max(workArea.x, Math.round(workArea.x + workArea.width - width - horizontalMargin)),
    y: Math.max(workArea.y, Math.round(workArea.y + verticalMargin))
  };
}

function sendMeterOverlayState(payload = null) {
  if (!meterOverlayWindow || meterOverlayWindow.isDestroyed()) {
    return;
  }

  meterOverlayWindow.webContents.send('desktop-runtime:meter-overlay-state', payload);
}

function closeMeterOverlayWindow() {
  latestMeterOverlayState = null;
  if (!meterOverlayWindow || meterOverlayWindow.isDestroyed()) {
    meterOverlayWindow = null;
    return;
  }

  meterOverlayWindow.destroy();
  meterOverlayWindow = null;
}

function showMeterOverlayWindow(overlayWindow) {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    return;
  }

  overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.show();
  overlayWindow.moveTop();
}

function ensureMeterOverlayWindow() {
  if (meterOverlayWindow && !meterOverlayWindow.isDestroyed()) {
    return meterOverlayWindow;
  }

  const bounds = buildMeterOverlayBounds();
  meterOverlayWindow = new BrowserWindow({
    ...bounds,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    hasShadow: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      partition: desktopPartition
    }
  });

  meterOverlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  meterOverlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  meterOverlayWindow.setIgnoreMouseEvents(true);

  meterOverlayWindow.once('ready-to-show', () => {
    if (meterOverlayWindow && !meterOverlayWindow.isDestroyed()) {
      showMeterOverlayWindow(meterOverlayWindow);
      sendMeterOverlayState(latestMeterOverlayState);
    }
  });

  meterOverlayWindow.on('closed', () => {
    meterOverlayWindow = null;
  });

  meterOverlayWindow.loadFile(getMeterOverlayHtmlPath());
  return meterOverlayWindow;
}

function syncMeterOverlayWindow(payload = null) {
  latestMeterOverlayState = payload || null;

  if (!payload) {
    closeMeterOverlayWindow();
    return;
  }

  const overlayWindow = ensureMeterOverlayWindow();
  const bounds = buildMeterOverlayBounds();
  overlayWindow.setBounds(bounds);
  showMeterOverlayWindow(overlayWindow);
  sendMeterOverlayState(payload);
}

function clearAttentionSignals() {
  if (alwaysOnTopResetTimer) {
    clearTimeout(alwaysOnTopResetTimer);
    alwaysOnTopResetTimer = null;
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.flashFrame(false);
    if (mainWindow.isAlwaysOnTop()) {
      mainWindow.setAlwaysOnTop(false);
    }
  }

  if (process.platform === 'darwin' && app.dock && dockBounceId) {
    app.dock.cancelBounce(dockBounceId);
    dockBounceId = 0;
  }
}

function updateTrayMenu() {
  if (!tray) {
    return;
  }

  const totalAlerts = nativeRuntimeState.pendingViolationCount + nativeRuntimeState.chainViolationCount;
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Saint Rocky',
      click: () => showMainWindow()
    },
    {
      label: `Status: ${nativeRuntimeState.monitorStatus}`,
      enabled: false
    },
    {
      label: totalAlerts > 0
        ? `Active alerts: ${totalAlerts}`
        : 'No active alerts',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(
    `${trayTooltipBase} · ${nativeRuntimeState.monitorStatus}${
      nativeRuntimeState.pendingViolationCount ? ` · ${nativeRuntimeState.pendingViolationCount} pending` : ''
    }`
  );
}

function ensureTray() {
  if (tray) {
    updateTrayMenu();
    return tray;
  }

  const trayImage = nativeImage.createFromPath(getTrayIconPath()).resize({ width: 18, height: 18 });
  tray = new Tray(trayImage);
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
      return;
    }

    showMainWindow();
  });
  updateTrayMenu();
  return tray;
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    show: false,
    autoHideMenuBar: true,
    title: buildWindowTitle(),
    backgroundColor: '#081018',
    icon: getWindowIconPath(),
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      partition: desktopPartition
    }
  });

  window.once('ready-to-show', () => {
    window.show();
    broadcastToRenderer('desktop-theme:state', buildDesktopThemeState());
    broadcastToRenderer('desktop-updater:state', getUpdaterState());
  });

  window.on('focus', () => {
    clearAttentionSignals();
  });

  window.on('close', (event) => {
    if (isQuitting) {
      return;
    }

    if (nativeRuntimeState.hideToTrayOnClose) {
      event.preventDefault();
      window.hide();
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  if (isRendererDevelopmentMode()) {
    window.loadURL(rendererDevelopmentUrl);
  } else {
    const rendererBuildPath = getRendererBuildHtmlPath();
    if (!existsSync(rendererBuildPath)) {
      throw new Error(`Renderer build not found at ${rendererBuildPath}. Run "yarn workspace @saintrocky/electron build" first.`);
    }
    window.loadFile(rendererBuildPath);
  }
  return window;
}

let mainWindow = null;

app.whenReady().then(() => {
  app.setName(runtimeConfig.ELECTRON_APP_NAME || desktopRuntimeModels.branding.productName);
  ensureTray();
  mainWindow = createMainWindow();
  configureDesktopUpdater();
  onUpdaterStateChange((updater) => {
    broadcastToRenderer('desktop-updater:state', updater);
  });

  if (!isRendererDevelopmentMode()) {
    checkForDesktopUpdates().catch(() => {});
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

nativeTheme.on('updated', () => {
  broadcastToRenderer('desktop-theme:state', buildDesktopThemeState());
});

ipcMain.on('desktop-runtime:update-state', (_event, payload = {}) => {
  nativeRuntimeState = {
    monitorStatus: payload.monitorStatus || nativeRuntimeState.monitorStatus,
    pendingViolationCount:
      typeof payload.pendingViolationCount === 'number'
        ? payload.pendingViolationCount
        : nativeRuntimeState.pendingViolationCount,
    chainViolationCount:
      typeof payload.chainViolationCount === 'number'
        ? payload.chainViolationCount
        : nativeRuntimeState.chainViolationCount,
    hideToTrayOnClose:
      typeof payload.hideToTrayOnClose === 'boolean'
        ? payload.hideToTrayOnClose
        : nativeRuntimeState.hideToTrayOnClose
  };
  updateTrayMenu();

  const badgeCount = nativeRuntimeState.pendingViolationCount + nativeRuntimeState.chainViolationCount;
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setBadge(badgeCount > 0 ? String(badgeCount) : '');
  }
});

ipcMain.handle('desktop-runtime:show-notification', async (_event, payload = {}) => {
  if (!Notification.isSupported()) {
    return { ok: false };
  }

  const notification = new Notification({
    title: payload.title || 'Saint Rocky',
    body: payload.body || '',
    silent: Boolean(payload.silent)
  });
  notification.on('click', () => {
    showMainWindow();
    if (payload.navigateTo && mainWindow) {
      mainWindow.webContents.send('desktop-runtime:navigate', payload.navigateTo);
    }
  });
  notification.show();
  return { ok: true };
});

ipcMain.handle('desktop-runtime:request-attention', async (_event, payload = {}) => {
  showMainWindow();

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.flashFrame(true);

    if (payload.pinOnTop) {
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
      if (alwaysOnTopResetTimer) {
        clearTimeout(alwaysOnTopResetTimer);
      }
      alwaysOnTopResetTimer = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setAlwaysOnTop(false);
        }
        alwaysOnTopResetTimer = null;
      }, 15_000);
    }
  }

  if (process.platform === 'darwin' && app.dock) {
    if (dockBounceId) {
      app.dock.cancelBounce(dockBounceId);
    }
    dockBounceId = app.dock.bounce(payload.bounceType || 'critical');
  }

  return { ok: true };
});

ipcMain.handle('desktop-runtime:sync-meter-overlay', async (_event, payload = null) => {
  syncMeterOverlayWindow(payload);
  return { ok: true };
});

ipcMain.handle('desktop-auth:get-state', async () => {
  desktopAuthState = loadStoredDesktopAuthState();
  return desktopAuthState;
});

ipcMain.handle('desktop-auth:set-state', async (_event, payload = {}) => {
  desktopAuthState = saveStoredDesktopAuthState(payload);
  return { ok: true };
});

ipcMain.handle('desktop-auth:clear-state', async () => {
  desktopAuthState = clearStoredDesktopAuthState();
  return { ok: true };
});

ipcMain.handle('desktop-theme:get-state', async () => {
  return { ok: true, ...buildDesktopThemeState() };
});

ipcMain.handle('desktop-runtime:get-open-at-login', async () => {
  const settings = app.getLoginItemSettings();
  return { ok: true, openAtLogin: settings.openAtLogin };
});

ipcMain.handle('desktop-runtime:set-open-at-login', async (_event, enabled) => {
  app.setLoginItemSettings({ openAtLogin: Boolean(enabled) });
  return { ok: true, openAtLogin: Boolean(enabled) };
});

ipcMain.handle('desktop-updater:get-state', async () => {
  return { ok: true, updater: getUpdaterState() };
});

ipcMain.handle('desktop-updater:check', async () => {
  try {
    await checkForDesktopUpdates();
    const updater = getUpdaterState();
    broadcastToRenderer('desktop-updater:state', updater);
    return { ok: true, updater };
  } catch (error) {
    const updater = getUpdaterState();
    broadcastToRenderer('desktop-updater:state', updater);
    return { ok: false, message: error?.message || 'Failed to check for desktop updates.', updater };
  }
});

ipcMain.handle('desktop-updater:install', async () => {
  quitAndInstallDesktopUpdate();
  return { ok: true };
});

app.on('before-quit', () => {
  isQuitting = true;
  closeMeterOverlayWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
