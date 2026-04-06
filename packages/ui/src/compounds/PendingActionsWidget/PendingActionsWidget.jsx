"use client";

import { useEffect, useMemo, useState } from "react";
import { formatFeeSol, formatMeteredViolationRate, formatRemainingDuration } from "@saintrocky/fuckyoupayme";
import { Icon } from "@saintrocky/icons";

import { Button } from "../../primitives/Button/Button.jsx";
import { Card } from "../../primitives/Card/Card.jsx";
import {
  getPendingActionsWidgetAvailableViewModes,
  PENDING_ACTIONS_NARROW_VIEWPORT_MAX_WIDTH,
  resolvePendingActionsWidgetResponsiveViewMode
} from "./usePendingActionsWidgetMode.js";
import {
  buildLivePendingAction,
  canCancelPendingAction,
  canConfirmPendingAction,
  createNowSnapshot,
  formatPendingActionCountdownLabel,
  formatPendingActionFeeLabel,
  formatPendingActionsTotalFee
} from "../PendingActions/shared.js";

const VIEW_MODE_CONFIG = {
  floating: {
    label: "Floating",
    iconName: "floatingPanel",
    heading: "Decay clocks"
  },
  rail: {
    label: "Right rail",
    iconName: "sideRail",
    heading: "Activity rail"
  },
  full: {
    label: "Full page",
    iconName: "fullPage",
    heading: "Command center"
  }
};

function getVisibleActions(liveActions, viewMode) {
  if (viewMode === "floating") return liveActions.slice(0, 3);
  return liveActions;
}

export function PendingActionsWidget({
  pendingActions = [],
  meteredViolation = null,
  submittingActionId = "",
  viewMode = "closed",
  responsiveViewMode: responsiveViewModeProp,
  availableViewModes: availableViewModesProp,
  isNarrowViewport: isNarrowViewportProp,
  expandViewMode = "floating",
  onViewModeChange,
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
  const effectiveTotalFeeLamports = totalFeeLamports + (meteredViolation?.accruedLamports || 0);

  const responsiveViewMode =
    responsiveViewModeProp ||
    resolvePendingActionsWidgetResponsiveViewMode(viewMode, globalThis.window?.innerWidth || 1280);
  const hasPendingActions = liveActions.length > 0;
  const hasMeteredViolation = Boolean(meteredViolation?.violationId);
  const isOpen = responsiveViewMode !== "closed";
  const nextAction = liveActions[0] || null;
  const isNarrowViewport =
    typeof isNarrowViewportProp === "boolean"
      ? isNarrowViewportProp
      : (globalThis.window?.innerWidth || 1280) <= PENDING_ACTIONS_NARROW_VIEWPORT_MAX_WIDTH;
  const availableViewModes =
    availableViewModesProp || getPendingActionsWidgetAvailableViewModes(globalThis.window?.innerWidth || 1280);
  const visibleActions = useMemo(() => getVisibleActions(liveActions, responsiveViewMode), [liveActions, responsiveViewMode]);
  const responsiveExpandViewMode = resolvePendingActionsWidgetResponsiveViewMode(
    expandViewMode === "closed" ? "floating" : expandViewMode,
    globalThis.window?.innerWidth || 1280
  );
  const shouldRenderDetachedToggle = responsiveViewMode === "closed" || responsiveViewMode === "floating";

  function handleToggle() {
    onViewModeChange?.(responsiveViewMode === "closed" ? responsiveExpandViewMode : "closed");
  }

  return (
    <div
      className={`c-PendingActionsWidget ${isOpen ? "is-open" : "is-closed"} is-view-${responsiveViewMode} ${isNarrowViewport ? "is-narrow-viewport" : "is-wide-viewport"}`}
      data-view-mode={responsiveViewMode}
    >
      {shouldRenderDetachedToggle ? (
        <Button
          className="c-PendingActionsWidget__toggle"
          variant="secondary"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Collapse live activity" : "Open live activity"}
        >
          <span className="c-PendingActionsWidget__badge">{liveActions.length}</span>
          <span className="c-PendingActionsWidget__toggleCopy">
            <strong>{hasPendingActions ? `${liveActions.length} pending` : "No pending actions"}</strong>
            <span>
              {hasPendingActions || hasMeteredViolation
                ? `${formatPendingActionsTotalFee(effectiveTotalFeeLamports)} live fee`
                : "Decay timers will appear here"}
            </span>
          </span>
        </Button>
      ) : null}

      {isOpen ? (
        <Card className="c-PendingActionsWidget__panel">
          <div className="c-PendingActionsWidget__panelUtilityBar">
            <div className="c-PendingActionsWidget__panelControls">
              <div className="c-PendingActionsWidget__modeGroup" aria-label="Live activity size">
                {availableViewModes.map((nextViewMode) => (
                  <Button
                    key={nextViewMode}
                    variant={nextViewMode === responsiveViewMode ? "secondary" : "icon"}
                    size="sm"
                    className="c-PendingActionsWidget__modeButton"
                    onClick={() => onViewModeChange?.(nextViewMode)}
                    aria-label={`Switch live activity to ${VIEW_MODE_CONFIG[nextViewMode].label}`}
                    title={VIEW_MODE_CONFIG[nextViewMode].label}
                    aria-pressed={nextViewMode === responsiveViewMode}
                    leadingIcon={
                      <Icon
                        name={VIEW_MODE_CONFIG[nextViewMode].iconName}
                        size={16}
                        title={VIEW_MODE_CONFIG[nextViewMode].label}
                      />
                    }
                  />
                ))}
              </div>
              <Button
                variant="icon"
                size="sm"
                onClick={() => onViewModeChange?.("closed")}
                aria-label="Close live activity"
                title="Close"
                leadingIcon={<Icon name="close" size={16} title="Close" />}
              />
            </div>
          </div>

          <div className="c-PendingActionsWidget__panelHeader">
            <div className="c-PendingActionsWidget__panelTitleBlock">
              <p className="c-PendingActionsWidget__eyebrow">Live activity</p>
              <h3>{VIEW_MODE_CONFIG[responsiveViewMode]?.heading || "Decay clocks"}</h3>
            </div>
            {!shouldRenderDetachedToggle ? (
              <div className="c-PendingActionsWidget__embeddedSummary">
                <span className="c-PendingActionsWidget__badge">{liveActions.length}</span>
                <span className="c-PendingActionsWidget__embeddedSummaryCopy">
                  <strong>{hasPendingActions ? `${liveActions.length} pending` : "No pending actions"}</strong>
                  <span>
                    {hasPendingActions || hasMeteredViolation
                      ? `${formatPendingActionsTotalFee(effectiveTotalFeeLamports)} live fee`
                      : "Decay timers will appear here"}
                  </span>
                </span>
              </div>
            ) : null}
          </div>

          <div className="c-PendingActionsWidget__summaryGrid">
            <div className="c-PendingActionsWidget__summaryCard">
              <span className="c-PendingActionsWidget__summaryLabel">Pending actions</span>
              <strong>{liveActions.length}</strong>
            </div>
            <div className="c-PendingActionsWidget__summaryCard">
              <span className="c-PendingActionsWidget__summaryLabel">Currently payable</span>
              <strong>{formatPendingActionsTotalFee(effectiveTotalFeeLamports)}</strong>
            </div>
            <div className="c-PendingActionsWidget__summaryCard">
              <span className="c-PendingActionsWidget__summaryLabel">Next unlock</span>
              <strong>{nextAction ? nextAction.remainingLabel : "Nothing pending"}</strong>
            </div>
          </div>

          {hasMeteredViolation ? (
            <section className="c-PendingActionsWidget__item c-PendingActionsWidget__item--meteredViolation">
              <div className="c-PendingActionsWidget__itemHeader">
                <div>
                  <p className="c-PendingActionsWidget__itemEyebrow">Metered violation</p>
                  <h4>{meteredViolation.title}</h4>
                </div>
                <strong>{formatFeeSol(meteredViolation.accruedLamports || 0)} SOL</strong>
              </div>

              <p className="c-PendingActionsWidget__itemSummary">{meteredViolation.summary}</p>
              <p className="c-PendingActionsWidget__itemMeta">
                {meteredViolation.status === "grace_period"
                  ? `Grace period: ${formatRemainingDuration(meteredViolation.graceEndsAt, now)} remaining`
                  : `Meter running at ${formatMeteredViolationRate(meteredViolation.ratePerSecondLamports || 0)} · cap ${formatFeeSol(meteredViolation.maxFeeLamports || 0)} SOL`}
              </p>
              <p className="c-PendingActionsWidget__itemMeta">
                Matched targets: {(meteredViolation.matchedTargets || []).join(", ") || "Unknown"}
              </p>
            </section>
          ) : null}

          {hasPendingActions ? (
            <div className="c-PendingActionsWidget__list">
              {visibleActions.map((action) => {
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
          ) : !hasMeteredViolation ? (
            <div className="c-PendingActionsWidget__emptyState">
              <p>No live override or rule-change timers yet.</p>
            </div>
          ) : null}

          {hasPendingActions && visibleActions.length < liveActions.length ? (
            <p className="c-PendingActionsWidget__footnote">
              Showing {visibleActions.length} of {liveActions.length} actions. Switch to the rail or full page to see the full queue.
            </p>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
