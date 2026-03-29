import { Button, Card } from '@saintrocky/ui';

export function ViolationsSection({ runtimeHub, onViolationAction }) {
  return (
    <Card className="desktop-HubPanel">
      <div className="desktop-HubPanelHeader">
        <div>
          <p className="desktop-Kicker">Violations</p>
          <h2>Live rule hits</h2>
        </div>
      </div>
      {runtimeHub.pendingViolation ? (
        <div className="desktop-ViolationCard">
          <strong>{runtimeHub.pendingViolation.title}</strong>
          <p>{runtimeHub.pendingViolation.summary}</p>
          <span className="desktop-HubMeta">
            Matched targets: {runtimeHub.pendingViolation.matchedTargets.join(', ') || 'Unknown'}
          </span>
          <div className="desktop-HubActions">
            <Button variant="secondary" onClick={() => onViolationAction('comply')}>
              Comply
            </Button>
            <Button onClick={() => onViolationAction('pay_to_bypass')}>Pay to bypass</Button>
          </div>
        </div>
      ) : (
        <p className="desktop-HubEmpty">No pending violations. Arm the runtime to start monitoring desktop signals.</p>
      )}
    </Card>
  );
}
