import { Card } from '@saintrocky/ui';
import { formatFeeSol, formatMeteredViolationRate } from '@saintrocky/fuckyoupayme';

export function ViolationsSection({ runtimeHub }) {
  const meteredViolation = runtimeHub?.meteredViolation;

  return (
    <Card className="desktop-HubPanel">
      <div className="desktop-HubPanelHeader">
        <div>
          <p className="desktop-Kicker">Violations</p>
          <h2>Live rule hits</h2>
        </div>
      </div>
      {meteredViolation ? (
        <div className="desktop-ViolationCard">
          <strong>{meteredViolation.title}</strong>
          <p>{meteredViolation.summary}</p>
          <span className="desktop-HubMeta">
            Matched targets: {meteredViolation.matchedTargets.join(', ') || 'Unknown'}
          </span>
          <span className="desktop-HubMeta">
            Status: {meteredViolation.status === 'grace_period' ? 'Grace period' : 'Meter running'}
          </span>
          <span className="desktop-HubMeta">
            Running total: {formatFeeSol(meteredViolation.accruedLamports || 0)}
          </span>
          <span className="desktop-HubMeta">
            Rate: {formatMeteredViolationRate(meteredViolation.ratePerSecondLamports || 0)}
          </span>
        </div>
      ) : (
        <p className="desktop-HubEmpty">No active metered violations. The runtime is monitoring desktop and chain signals.</p>
      )}
    </Card>
  );
}
