import { useEffect, useState } from 'react';
import { Card } from '@saintrocky/ui';

import { getOpenAtLogin, setOpenAtLogin } from '../../../../bridge.js';
import { formatValue } from '../../../utils/runtime-formatters.js';

export function SettingsSection({ runtimeHub, onPreferenceToggle, onArmToggle }) {
  const [openAtLogin, setOpenAtLoginState] = useState(false);
  const [loadingLoginItem, setLoadingLoginItem] = useState(false);

  useEffect(() => {
    getOpenAtLogin()
      .then((result) => {
        if (result?.ok) setOpenAtLoginState(result.openAtLogin);
      })
      .catch(() => {});
  }, []);

  async function handleOpenAtLoginToggle() {
    setLoadingLoginItem(true);
    try {
      const result = await setOpenAtLogin(!openAtLogin);
      if (result?.ok) setOpenAtLoginState(result.openAtLogin);
    } catch {}
    setLoadingLoginItem(false);
  }

  const realtimeState = runtimeHub.realtimeConnectionState || 'idle';

  return (
    <Card className="desktop-HubPanel">
      <div className="desktop-HubPanelHeader">
        <div>
          <p className="desktop-Kicker">Settings</p>
          <h2>Runtime preferences</h2>
        </div>
      </div>
      <div className="desktop-PreferenceList">
        <button
          type="button"
          className="desktop-PreferenceRow"
          onClick={onArmToggle}
        >
          <span>Runtime enforcement</span>
          <strong>{runtimeHub.isArmed ? 'Armed' : 'Disarmed'}</strong>
        </button>
        <button
          type="button"
          className="desktop-PreferenceRow"
          onClick={() => onPreferenceToggle('notificationsEnabled')}
        >
          <span>Native notifications</span>
          <strong>{runtimeHub.preferences?.notificationsEnabled ? 'On' : 'Off'}</strong>
        </button>
        <button
          type="button"
          className="desktop-PreferenceRow"
          onClick={() => onPreferenceToggle('hideToTrayOnClose')}
        >
          <span>Hide to tray on close</span>
          <strong>{runtimeHub.preferences?.hideToTrayOnClose ? 'On' : 'Off'}</strong>
        </button>
        <button
          type="button"
          className="desktop-PreferenceRow"
          onClick={handleOpenAtLoginToggle}
          disabled={loadingLoginItem}
        >
          <span>Launch at login</span>
          <strong>{openAtLogin ? 'On' : 'Off'}</strong>
        </button>
        <div className="desktop-HubListItem">
          <strong>Realtime connection</strong>
          <p className={`desktop-ConnectionState desktop-ConnectionState--${realtimeState}`}>
            {formatConnectionLabel(realtimeState)}
          </p>
        </div>
        <div className="desktop-HubListItem">
          <strong>Focused application</strong>
          <p>{formatValue(runtimeHub.focusedApplicationName, 'Focus signal unavailable')}</p>
        </div>
        <div className="desktop-HubListItem">
          <strong>Visible processes</strong>
          <p>{runtimeHub.visibleProcesses.slice(0, 10).join(', ') || 'No process snapshot yet.'}</p>
          <span className="desktop-HubMeta">
            Last process scan: {formatValue(runtimeHub.lastProcessScanAt, 'Not yet scanned')}
          </span>
        </div>
        <div className="desktop-HubListItem">
          <strong>Connected browser runtimes</strong>
          <p>
            {runtimeHub.extensionSessions?.length
              ? runtimeHub.extensionSessions
                  .map((session) => `${session.browserName || 'Browser'} (${session.connectionState})`)
                  .join(', ')
              : 'No extension session connected yet.'}
          </p>
        </div>
      </div>
    </Card>
  );
}

function formatConnectionLabel(state) {
  const labels = {
    idle: 'Idle',
    connecting: 'Connecting...',
    connected: 'Connected',
    authenticated: 'Connected & authenticated',
    disconnected: 'Disconnected',
    error: 'Error',
    revoked: 'Session revoked',
    unauthenticated: 'Not authenticated'
  };
  return labels[state] || state;
}
