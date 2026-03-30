"use client";

import { useEffect, useMemo, useState } from "react";

import {
  calculateOverrideFee,
  formatFeeSol,
  formatRemainingDuration
} from "@saintrocky/fuckyoupayme";

import { Button } from "../../primitives/Button/Button.jsx";

function createNowSnapshot() {
  return new Date();
}

export function RuleChangeRequestCard({
  title,
  pendingRequest = null,
  problemIndex,
  lockedStakeLamports,
  submitting = false,
  onStartRequest,
  onConfirmRequest,
  onCancelRequest
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

  const quote = useMemo(
    () =>
      calculateOverrideFee({
        problemIndex,
        lockedStakeLamports,
        requestedAt: pendingRequest?.requestedAt || now,
        now
      }),
    [lockedStakeLamports, now, pendingRequest?.requestedAt, problemIndex]
  );

  const isPending = Boolean(pendingRequest);
  const feeLabel = `${formatFeeSol(quote.feeLamports)} SOL`;
  const requestedAtLabel = pendingRequest?.requestedAt
    ? new Date(pendingRequest.requestedAt).toLocaleString()
    : null;

  return (
    <section className="c-RulesWorkspaceEditor__requestCard">
      <div className="c-RulesWorkspaceEditor__requestCardHeader">
        <div>
          <p className="c-RulesWorkspacePanel__itemEyebrow">Sleep-on-it flow</p>
          <h4>{title}</h4>
        </div>
        <strong>{quote.isFree ? "Free" : feeLabel}</strong>
      </div>

      <p className="c-RulesWorkspaceEditor__requestCardText">
        {isPending
          ? quote.isFree
            ? "This request has fully decayed. You can confirm it without paying a fee."
            : `Fee is ticking down live. Free in ${formatRemainingDuration(quote.freeAt, now)}.`
          : `Start the cooldown now. If you confirm immediately, it costs ${feeLabel}, and it decays to free over 24 hours.`}
      </p>

      {requestedAtLabel ? (
        <p className="c-RulesWorkspaceEditor__requestCardMeta">Requested {requestedAtLabel}</p>
      ) : null}

      <div className="c-RulesWorkspacePanel__actions">
        {isPending ? (
          <>
            <Button
              onClick={onConfirmRequest}
              loading={submitting}
              loadingLabel="Confirming request"
            >
              {quote.isFree ? `${title} for free` : `${title} now for ${feeLabel}`}
            </Button>
            <Button
              variant="ghost"
              onClick={onCancelRequest}
              disabled={submitting}
            >
              Cancel request
            </Button>
          </>
        ) : (
          <Button
            onClick={onStartRequest}
            loading={submitting}
            loadingLabel="Starting cooldown"
          >
            {`Start ${title.toLowerCase()} countdown`}
          </Button>
        )}
      </div>
    </section>
  );
}
