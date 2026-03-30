"use client";

import { Icon } from "@saintrocky/icons";

import { calculateLockedStake } from "@saintrocky/fuckyoupayme";

import { Dialog } from "../../primitives/Dialog/Dialog.jsx";
import { RuleChangeRequestCard } from "../RulesWorkspace/RuleChangeRequestCard.jsx";

export function RuleDeactivateDialog({
  open,
  onOpenChange,
  rule,
  submitting,
  onRequestDeactivation,
  onConfirmDeactivation,
  onCancelDeactivation
}) {
  if (!rule) return null;

  const effectiveProblemIndex = rule.problemIndex ?? 50;
  const effectiveLockedStakeLamports = rule.lockedStakeLamports ?? calculateLockedStake(effectiveProblemIndex);
  const pendingDeactivationRequest = rule.pendingRuleChangeRequests?.deactivation || null;
  const pendingTargetStatus = pendingDeactivationRequest?.metadata?.targetStatus || "paused";
  const pendingActionTitle = pendingTargetStatus === "archived" ? "Archive rule" : "Pause rule";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="c-DialogBackdrop" />
        <Dialog.Popup className="c-DialogPanel">
          <div className="c-TacticsTableDialog">
            <div className="c-TacticsTableDialog__header">
              <div>
                <Dialog.Title>Deactivate: {rule.title}</Dialog.Title>
                <Dialog.Description>
                  Use the sleep-on-it flow to pause or archive this rule.
                </Dialog.Description>
              </div>
              <Dialog.Close>
                <button type="button" className="c-TacticsTableDialog__close" aria-label="Close">
                  <Icon name="close" size={18} />
                </button>
              </Dialog.Close>
            </div>

            {pendingDeactivationRequest ? (
              <RuleChangeRequestCard
                title={pendingActionTitle}
                pendingRequest={pendingDeactivationRequest}
                problemIndex={effectiveProblemIndex}
                lockedStakeLamports={effectiveLockedStakeLamports}
                submitting={submitting}
                onConfirmRequest={() => onConfirmDeactivation?.(rule.ruleId, pendingDeactivationRequest.requestId)}
                onCancelRequest={() => onCancelDeactivation?.(rule.ruleId, pendingDeactivationRequest.requestId)}
              />
            ) : (
              <>
                <RuleChangeRequestCard
                  title="Pause rule"
                  problemIndex={effectiveProblemIndex}
                  lockedStakeLamports={effectiveLockedStakeLamports}
                  submitting={submitting}
                  onStartRequest={() => onRequestDeactivation?.(rule.ruleId, "paused")}
                />
                <RuleChangeRequestCard
                  title="Archive rule"
                  problemIndex={effectiveProblemIndex}
                  lockedStakeLamports={effectiveLockedStakeLamports}
                  submitting={submitting}
                  onStartRequest={() => onRequestDeactivation?.(rule.ruleId, "archived")}
                />
              </>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
