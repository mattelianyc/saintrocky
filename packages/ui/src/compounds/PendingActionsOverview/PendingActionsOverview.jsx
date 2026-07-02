"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "../../primitives/Button/Button.jsx";
import { Card } from "../../primitives/Card/Card.jsx";
import {
  buildLivePendingAction,
  canCancelPendingAction,
  canConfirmPendingAction,
  createNowSnapshot,
  formatPendingActionCountdownLabel,
  formatPendingActionFeeLabel,
  formatPendingActionsTotalFee
} from "../PendingActions/shared.js";

export function PendingActionsOverview({
  pendingActions = [],
  submittingActionId = "",
  onConfirmAction,
  onCancelAction
}) {
  const [now, setNow] = useState(createNowSnapshot);

  useEffect(() => {
    const timerId = globalThis.window?.setInterval(() => {
      setNow(createNowSnapshot());
    }, 1000);

    return () => {
      if (timerId) {
        globalThis.window?.clearInterval(timerId);
      }
    };
  }, []);

  const liveActions = useMemo(
    () => pendingActions.map((action) => buildLivePendingAction(action, now)),
    [now, pendingActions]
  );

  const totalFeeLamports = useMemo(
    () => liveActions.reduce((sum, action) => sum + (action.currentFeeLamports || 0), 0),
    [liveActions]
  );

  const nextAction = liveActions[0] || null;

  return (
    <Card className="c-PendingActionsOverview">
      <div className="c-PendingActionsOverview__header">
        <div>
          <p className="c-PendingActionsOverview__eyebrow">Priority queue</p>
          <h2>Live decay timers</h2>
          <p className="c-PendingActionsOverview__summary">
            Overrides and rule cooldowns should be the first thing the member sees because that is the only clock costing them money.
          </p>
        </div>
      </div>

      <div className="c-PendingActionsOverview__metricGrid">
        <div className="c-PendingActionsOverview__metric">
          <span>Pending actions</span>
          <strong>{liveActions.length}</strong>
        </div>
        <div className="c-PendingActionsOverview__metric">
          <span>Currently payable</span>
          <strong>{formatPendingActionsTotalFee(totalFeeLamports)}</strong>
        </div>
        <div className="c-PendingActionsOverview__metric">
          <span>Next unlock</span>
          <strong>{nextAction ? nextAction.remainingLabel : "Nothing pending"}</strong>
        </div>
      </div>

      {liveActions.length > 0 ? (
        <div className="c-PendingActionsOverview__list">
          {liveActions.slice(0, 4).map((action) => {
            const isSubmitting = submittingActionId === action.actionId;
            return (
              <section key={action.actionId} className="c-PendingActionsOverview__item">
                <div className="c-PendingActionsOverview__itemHeader">
                  <div>
                    <p className="c-PendingActionsOverview__itemEyebrow">{action.actionLabel}</p>
                    <h3>{action.ruleTitle}</h3>
                  </div>
                  <strong>{formatPendingActionFeeLabel(action)}</strong>
                </div>

                <p className="c-PendingActionsOverview__itemSummary">{action.ruleSummary}</p>
                <p className="c-PendingActionsOverview__itemMeta">{formatPendingActionCountdownLabel(action)}</p>

                <div className="c-PendingActionsOverview__actions">
                  {canConfirmPendingAction(action) ? (
                    <Button
                      size="sm"
                      onClick={() => onConfirmAction?.(action)}
                      loading={isSubmitting}
                      loadingLabel="Confirming action"
                    >
                      {action.isFree ? "Confirm free" : `Confirm for ${formatPendingActionFeeLabel(action)}`}
                    </Button>
                  ) : null}

                  {canCancelPendingAction(action) ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCancelAction?.(action)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <span className="c-PendingActionsOverview__scheduledHint">
                      Scheduled edits apply automatically.
                    </span>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="c-PendingActionsOverview__emptyState">
          <p>No overrides or rule changes are decaying right now.</p>
        </div>
      )}
    </Card>
  );
}
