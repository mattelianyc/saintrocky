import { Button, Card, RuleChangeRequestCard } from '@saintrocky/ui';

export function ViolationsSection({ runtimeHub, onViolationAction, onConfirmOverride, onCancelOverride }) {
  const { pendingViolation, pendingOverrideRequest } = runtimeHub;

  return (
    <Card className="desktop-HubPanel">
      <div className="desktop-HubPanelHeader">
        <div>
          <p className="desktop-Kicker">Violations</p>
          <h2>Live rule hits</h2>
        </div>
      </div>
      {pendingViolation ? (
        <div className="desktop-ViolationCard">
          <strong>{pendingViolation.title}</strong>
          <p>{pendingViolation.summary}</p>
          <span className="desktop-HubMeta">
            Matched targets: {pendingViolation.matchedTargets.join(', ') || 'Unknown'}
          </span>
          {pendingOverrideRequest ? (
            <RuleChangeRequestCard
              title="Override rule"
              pendingRequest={pendingOverrideRequest}
              problemIndex={pendingOverrideRequest.problemIndex ?? 50}
              lockedStakeLamports={pendingOverrideRequest.lockedStakeLamports ?? 0}
              onConfirmRequest={onConfirmOverride}
              onCancelRequest={onCancelOverride}
            />
          ) : (
            <div className="desktop-HubActions">
              <Button variant="secondary" onClick={() => onViolationAction('comply')}>
                Stay blocked
              </Button>
              <Button onClick={() => onViolationAction('pay_to_bypass')}>
                Start override countdown
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="desktop-HubEmpty">No pending violations. The runtime is monitoring desktop and chain signals.</p>
      )}
    </Card>
  );
}
