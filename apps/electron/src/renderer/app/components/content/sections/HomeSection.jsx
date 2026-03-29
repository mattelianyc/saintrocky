import { Button, Card } from '@saintrocky/ui';

import { formatMonitorLabel, formatValue } from '../../../utils/runtime-formatters.js';
import { RuntimeMetric } from '../RuntimeMetric.jsx';

export function HomeSection({ runtime, runtimeHub, user, refreshing, onRuntimeRefresh, onArmToggle }) {
  return (
    <>
      <Card className="desktop-HubHeroCard">
        <div className="desktop-HubHeroHeader">
          <div className="layout-stack-gap-8">
            <p className="desktop-Kicker">Desktop enforcement hub</p>
            <h1>{runtime.branding?.productName || runtime.appName}</h1>
            <p className="Kicker">
              {user?.email || 'Signed-in member'} · {formatMonitorLabel(runtimeHub.monitorStatus)}
            </p>
          </div>
          <div className="desktop-HubHeroActions">
            <Button variant="secondary" onClick={onRuntimeRefresh} loading={refreshing} loadingLabel="Refreshing">
              Refresh runtime
            </Button>
            <Button onClick={onArmToggle}>{runtimeHub.isArmed ? 'Disarm runtime' : 'Arm runtime'}</Button>
          </div>
        </div>
      </Card>

      <div className="desktop-HubMetricGrid">
        <RuntimeMetric label="Monitor state" value={formatMonitorLabel(runtimeHub.monitorStatus)} />
        <RuntimeMetric label="Assigned rules" value={runtimeHub.assignments.length} />
        <RuntimeMetric label="Pending violations" value={runtimeHub.pendingViolation ? 1 : 0} />
        <RuntimeMetric
          label="Browser runtimes"
          value={runtimeHub.extensionSessions?.filter((session) => session.connectionState === 'connected').length || 0}
        />
        <RuntimeMetric label="Last sync" value={formatValue(runtimeHub.lastAssignmentSyncAt, 'Not yet synced')} />
      </div>
    </>
  );
}
