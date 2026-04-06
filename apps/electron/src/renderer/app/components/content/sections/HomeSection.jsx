import { Button, Card } from '@saintrocky/ui';

import { formatMonitorLabel, formatRelativeTime, formatRuleEventHeadline, formatRuleEventMeta, formatSurfaceLabel, formatValue } from '../../../utils/runtime-formatters.js';
import { DesktopBrandLockup } from '../../DesktopBrandLockup.jsx';
import { RuntimeMetric } from '../RuntimeMetric.jsx';

export function HomeSection({
  runtime,
  runtimeHub,
  user,
  refreshing,
  onRuntimeRefresh
}) {
  const dashboard = runtimeHub.dashboard;
  const chainViolations = runtimeHub.chainViolations || [];
  const crossSurfaceActivity = runtimeHub.crossSurfaceActivity || [];
  const enforcementGap = runtimeHub.enforcementGap;
  const extensionCount = runtimeHub.extensionSessions?.filter(
    (session) => session.connectionState === 'connected'
  ).length || 0;
  const chainRuleCount = runtimeHub.assignments?.filter(
    (assignment) => assignment.compiledRule?.chainConstraints?.length > 0
  ).length || 0;

  return (
    <>
      <Card className="desktop-HubHeroCard">
        <div className="desktop-HubHeroHeader">
          <div className="layout-stack-gap-12">
            <DesktopBrandLockup compact detail={user?.email || 'Signed-in member'} />
            <div className="layout-stack-gap-8">
              <p className="desktop-Kicker">Nerve center</p>
              <h1>{runtime.branding?.productName || runtime.appName}</h1>
            </div>
            <p className="Kicker">
              {user?.email || 'Signed-in member'} · {formatMonitorLabel(runtimeHub.monitorStatus)}
            </p>
          </div>
          <div className="desktop-HubHeroActions">
            <Button variant="secondary" onClick={onRuntimeRefresh} loading={refreshing} loadingLabel="Refreshing">
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {dashboard && (
        <div className="desktop-HubMetricGrid">
          <RuntimeMetric label="Discipline score" value={formatValue(dashboard.counts?.disciplineScore, '—')} />
          <RuntimeMetric label="Compliance rate" value={`${dashboard.stats?.complianceRate ?? 100}%`} />
          <RuntimeMetric label="Clean streak" value={formatValue(dashboard.stats?.cleanStreak, '0')} />
          <RuntimeMetric label="Escrow balance" value={`${formatValue(dashboard.counts?.escrowBalanceSol, '0')} SOL`} />
        </div>
      )}

      <div className="desktop-HubMetricGrid">
        <RuntimeMetric label="Monitor status" value={formatMonitorLabel(runtimeHub.monitorStatus)} />
        <RuntimeMetric label="Desktop assignments" value={runtimeHub.assignments.length} />
        <RuntimeMetric label="Browser extensions" value={extensionCount} />
        <RuntimeMetric label="Chain constraints" value={chainRuleCount} />
        <RuntimeMetric label="Recent violations" value={formatValue(dashboard?.counts?.recentViolations, '0')} />
        <RuntimeMetric label="Last sync" value={formatValue(runtimeHub.lastAssignmentSyncAt, 'Not yet synced')} />
      </div>

      {enforcementGap ? (
        <Card className="desktop-HubPanel">
          <div className="desktop-HubPanelHeader">
            <div>
              <p className="desktop-Kicker">Coverage gap</p>
              <h2>Browser enforcement needs attention</h2>
            </div>
          </div>
          <div className="desktop-HubListItem">
            <strong>{enforcementGap.message}</strong>
            <p>{enforcementGap.browsers?.join(', ') || 'A browser is running outside extension coverage.'}</p>
            <span className="desktop-HubMeta">{formatRelativeTime(enforcementGap.detectedAt)}</span>
          </div>
        </Card>
      ) : null}

      {chainViolations.length > 0 && (
        <Card className="desktop-HubPanel">
          <div className="desktop-HubPanelHeader">
            <div>
              <p className="desktop-Kicker">Chain violations</p>
              <h2>Recent on-chain rule hits</h2>
            </div>
          </div>
          <div className="desktop-HubList">
            {chainViolations.slice(0, 5).map((violation) => (
              <div key={violation.eventId} className="desktop-HubListItem">
                <strong>{violation.title}</strong>
                <p>{formatChainViolationSummary(violation.details)}</p>
                <span className="desktop-HubMeta">{formatRelativeTime(violation.occurredAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {crossSurfaceActivity.length > 0 && (
        <Card className="desktop-HubPanel">
          <div className="desktop-HubPanelHeader">
            <div>
              <p className="desktop-Kicker">Live feed</p>
              <h2>Cross-surface activity</h2>
            </div>
          </div>
          <div className="desktop-HubList">
            {crossSurfaceActivity.slice(0, 8).map((entry) => (
              <div key={entry.eventId} className="desktop-HubListItem">
                <span className="desktop-HubMeta desktop-SurfaceTag">{formatSurfaceLabel(entry.surface)}</span>
                <strong>{formatRuleEventHeadline(entry)}</strong>
                <span className="desktop-HubMeta">{formatRuleEventMeta(entry) || formatRelativeTime(entry.occurredAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

function formatChainViolationSummary(details) {
  if (!details) return 'Chain rule violated.';
  const violations = details.violations;
  if (Array.isArray(violations) && violations.length > 0) {
    return violations[0].message || violations[0].constraintType || 'Chain rule violated.';
  }
  const trade = details.trade;
  if (trade) {
    return `${trade.direction || 'Trade'} · ${trade.program || ''} · ${trade.solAmount ?? ''} SOL`.trim();
  }
  return 'Chain rule violated.';
}
