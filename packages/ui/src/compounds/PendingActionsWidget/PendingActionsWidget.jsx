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

export function PendingActionsWidget({
  pendingActions = [],
  submittingActionId = "",
  onConfirmAction,
  onCancelAction
}) {
  const [open, setOpen] = useState(false);
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
  const hasPendingActions = liveActions.length > 0;

  return (
    <div className={`c-PendingActionsWidget ${open ? "is-open" : ""}`}>
      <Button
        className="c-PendingActionsWidget__toggle"
        variant="secondary"
        onClick={() => setOpen((previousValue) => !previousValue)}
        aria-expanded={open}
        aria-label={open ? "Collapse pending actions" : "Open pending actions"}
      >
        <span className="c-PendingActionsWidget__badge">{liveActions.length}</span>
        <span className="c-PendingActionsWidget__toggleCopy">
          <strong>{hasPendingActions ? `${liveActions.length} pending` : "No pending actions"}</strong>
          <span>
            {hasPendingActions
              ? `${formatPendingActionsTotalFee(totalFeeLamports)} live fee`
              : "Decay timers will appear here"}
          </span>
        </span>
      </Button>

      {open ? (
        <Card className="c-PendingActionsWidget__panel">
          <div className="c-PendingActionsWidget__panelHeader">
            <div>
              <p className="c-PendingActionsWidget__eyebrow">Pending actions</p>
              <h3>Decay clocks</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>

          <div className="c-PendingActionsWidget__summary">
            <strong>{hasPendingActions ? `${liveActions.length} active timers` : "Nothing is decaying yet"}</strong>
            <span>
              {hasPendingActions
                ? `${formatPendingActionsTotalFee(totalFeeLamports)} currently payable`
                : "Start an override or rule change and it will show up here instantly."}
            </span>
          </div>

          {hasPendingActions ? (
            <div className="c-PendingActionsWidget__list">
              {liveActions.map((action) => {
                const isSubmitting = submittingActionId === action.actionId;
                return (
                  <section key={action.actionId} className="c-PendingActionsWidget__item">
                    <div className="c-PendingActionsWidget__itemHeader">
                      <div>
                        <p className="c-PendingActionsWidget__itemEyebrow">{action.actionLabel}</p>
                        <h4>{action.ruleTitle}</h4>
                      </div>
                      <strong>{formatPendingActionFeeLabel(action)}</strong>
                    </div>

                    <p className="c-PendingActionsWidget__itemSummary">{action.ruleSummary}</p>
                    <p className="c-PendingActionsWidget__itemMeta">{formatPendingActionCountdownLabel(action)}</p>

                    <div className="c-PendingActionsWidget__actions">
                      {canConfirmPendingAction(action) ? (
                        <Button
                          size="sm"
                          onClick={() => onConfirmAction?.(action)}
                          loading={isSubmitting}
                          loadingLabel="Confirming action"
                        >
                          {action.isFree ? "Confirm free" : `Confirm now for ${formatPendingActionFeeLabel(action)}`}
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
                      ) : null}

                      {!canConfirmPendingAction(action) && !canCancelPendingAction(action) ? (
                        <span className="c-PendingActionsWidget__scheduledHint">
                          This edit will apply automatically.
                        </span>
                      ) : null}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="c-PendingActionsWidget__emptyState">
              <p>No live override or rule-change timers yet.</p>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}
