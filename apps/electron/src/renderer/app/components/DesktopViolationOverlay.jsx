import { useEffect, useState } from 'react';

import { formatFeeSol, formatMeteredViolationRate, formatRemainingDuration } from '@saintrocky/fuckyoupayme';
import { Button, Card, RuleChangeRequestCard } from '@saintrocky/ui';

import { formatRelativeTime } from '../utils/runtime-formatters.js';
import { RuntimeMetric } from './content/RuntimeMetric.jsx';

export function DesktopViolationOverlay({
  meteredViolation,
  pendingOverrideRequest,
  onViolationAction,
  onConfirmOverride,
  onCancelOverride
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!meteredViolation) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [meteredViolation?.violationId]);

  if (!meteredViolation) {
    return null;
  }

  const isGracePeriod = meteredViolation.status === 'grace_period';
  const statusLabel = pendingOverrideRequest
    ? 'Override pending'
    : isGracePeriod
      ? 'Grace period'
      : 'Meter running';
  const runningTotalLabel = `${formatFeeSol(meteredViolation.accruedLamports || 0)} SOL`;
  const countdownLabel = formatRemainingDuration(meteredViolation.graceEndsAt, new Date(now));
  const matchedTargets = meteredViolation.matchedTargets || [];

  return (
    <div className="desktop-ViolationOverlay" role="alertdialog" aria-modal="true" aria-labelledby="desktop-violation-overlay-title">
      <div className="desktop-ViolationOverlay__backdrop" />
      <Card className="desktop-ViolationOverlay__card">
        <div className="desktop-ViolationOverlay__header">
          <div>
            <p className="desktop-Kicker">Desktop enforcement</p>
            <h2 id="desktop-violation-overlay-title">{meteredViolation.title}</h2>
          </div>
          <span className="desktop-ViolationOverlay__status">{statusLabel}</span>
        </div>

        <p className="desktop-ViolationOverlay__summary">{meteredViolation.summary}</p>

        <div className="desktop-HubMetricGrid">
          <RuntimeMetric
            label={isGracePeriod ? 'Grace remaining' : 'Running total'}
            value={isGracePeriod ? countdownLabel : runningTotalLabel}
          />
          <RuntimeMetric
            label="Meter rate"
            value={formatMeteredViolationRate(meteredViolation.ratePerSecondLamports || 0)}
          />
          <RuntimeMetric
            label="Meter cap"
            value={`${formatFeeSol(meteredViolation.maxFeeLamports || 0)} SOL`}
          />
        </div>

        <div className="desktop-ViolationOverlay__meta">
          <span className="desktop-HubMeta">
            Detected {formatRelativeTime(meteredViolation.detectedAt)}
          </span>
          <span className="desktop-HubMeta">
            {isGracePeriod
              ? 'Close the blocked app before the countdown ends to avoid charges.'
              : `The live meter is charging at ${formatMeteredViolationRate(meteredViolation.ratePerSecondLamports || 0)}.`}
          </span>
          <div className="desktop-ViolationOverlay__targetList">
            {matchedTargets.map((target) => (
              <span key={target} className="desktop-SurfaceTag">
                {target}
              </span>
            ))}
          </div>
        </div>

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
          <div className="desktop-ViolationOverlay__actions">
            <Button variant="secondary" onClick={() => onViolationAction('comply')}>
              Stay blocked
            </Button>
            <Button onClick={() => onViolationAction('pay_to_bypass')}>
              Start override countdown
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
