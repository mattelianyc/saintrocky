import { Card } from '@saintrocky/ui';

import { formatValue } from '../../../utils/runtime-formatters.js';

export function SettingsSection({ runtimeHub, onPreferenceToggle }) {
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
