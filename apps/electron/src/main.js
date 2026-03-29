import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, Menu, Notification, Tray, ipcMain, nativeImage, shell } from 'electron';

import { desktopRuntimeModels } from './runtime-models.js';
import { getDesktopRuntimeConfig } from './runtime-config.js';
import { loadDesktopEnvironment } from './load-environment.js';

loadDesktopEnvironment();

const runtimeConfig = getDesktopRuntimeConfig();
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const desktopPartition = 'persist:saintrocky-desktop';
const rendererDevelopmentUrl = process.env.ELECTRON_RENDERER_URL || '';
const trayTooltipBase = 'Saint Rocky Desktop Runtime';
let tray = null;
let isQuitting = false;
let nativeRuntimeState = {
  monitorStatus: 'idle',
  pendingViolationCount: 0
};
let desktopAuthState = {
  sessionUser: null,
  sessionToken: ''
};

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

function getTrayIconPath() {
  return path.join(currentDirectoryPath, '..', '..', 'web', 'public', 'images', 'logonav.png');
}

function isRendererDevelopmentMode() {
  return Boolean(rendererDevelopmentUrl);
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

function updateTrayMenu() {
  if (!tray) {
    return;
  }

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
      label: nativeRuntimeState.pendingViolationCount
        ? `Pending violations: ${nativeRuntimeState.pendingViolationCount}`
        : 'No pending violations',
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
  });

  window.on('close', (event) => {
    if (isQuitting) {
      return;
    }

    event.preventDefault();
    window.hide();
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

ipcMain.on('desktop-runtime:update-state', (_event, payload = {}) => {
  nativeRuntimeState = {
    monitorStatus: payload.monitorStatus || nativeRuntimeState.monitorStatus,
    pendingViolationCount:
      typeof payload.pendingViolationCount === 'number'
        ? payload.pendingViolationCount
        : nativeRuntimeState.pendingViolationCount
  };
  updateTrayMenu();
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
  notification.show();
  return { ok: true };
});

ipcMain.handle('desktop-auth:get-state', async () => {
  return desktopAuthState;
});

ipcMain.handle('desktop-auth:set-state', async (_event, payload = {}) => {
  desktopAuthState = {
    sessionUser: payload.sessionUser || null,
    sessionToken: payload.sessionToken || ''
  };
  return { ok: true };
});

ipcMain.handle('desktop-auth:clear-state', async () => {
  desktopAuthState = {
    sessionUser: null,
    sessionToken: ''
  };
  return { ok: true };
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
