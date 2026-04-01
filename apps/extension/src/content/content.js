import {
  calculateOverrideFee,
  formatFeeSol,
  formatRemainingDuration
} from "@saintrocky/fuckyoupayme";
import {
  BROWSER_EXTENSION_MESSAGE_TYPES,
  isAllowedOrigin
} from "@saintrocky/shared";

const MESSAGE_TYPES = BROWSER_EXTENSION_MESSAGE_TYPES;

const OVERLAY_ID = "saintrocky-extension-overlay";
const OVERLAY_STYLE_ID = "saintrocky-extension-overlay-style";

let countdownTimerId = null;
const allowedOrigins = __SAINTROCKY_EXTENSION_ALLOWED_ORIGINS__;

function getOverlay() {
  return document.getElementById(OVERLAY_ID);
}

function clearOverlay() {
  stopCountdownTimer();
  getOverlay()?.remove();
}

function stopCountdownTimer() {
  if (countdownTimerId) {
    clearInterval(countdownTimerId);
    countdownTimerId = null;
  }
}

function ensureOverlayStyles() {
  if (document.getElementById(OVERLAY_STYLE_ID)) return;

  const styleElement = document.createElement("style");
  styleElement.id = OVERLAY_STYLE_ID;
  styleElement.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: rgba(0, 0, 0, 0.88);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      color: #f0f0f0;
    }
    #${OVERLAY_ID} * {
      box-sizing: border-box;
    }
    .saintrocky-overlay-card {
      position: relative;
      max-width: 560px;
      width: 100%;
      min-height: 620px;
      background-color: #141414;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      display: flex;
      align-items: flex-end;
      gap: 0;
      overflow: hidden;
      text-align: center;
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center center;
    }
    .saintrocky-overlay-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(10, 10, 10, 0.22) 0%,
        rgba(10, 10, 10, 0.38) 30%,
        rgba(10, 10, 10, 0.68) 65%,
        rgba(10, 10, 10, 0.88) 100%
      );
      pointer-events: none;
    }
    .saintrocky-overlay-body {
      position: relative;
      z-index: 1;
      width: 100%;
      padding: 24px 24px 28px;
      display: grid;
      gap: 14px;
    }
    .saintrocky-overlay-eyebrow {
      margin: 0;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #00d084;
      font-weight: 700;
    }
    .saintrocky-overlay-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.2;
      color: #ffffff;
    }
    .saintrocky-overlay-summary {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: rgba(255,255,255,0.65);
    }
    .saintrocky-overlay-fee-display {
      display: grid;
      gap: 4px;
      padding: 14px;
      background: rgba(255,255,255,0.04);
      border-radius: 8px;
    }
    .saintrocky-overlay-fee-amount {
      font-size: 28px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: #00d084;
    }
    .saintrocky-overlay-fee-countdown {
      font-size: 13px;
      color: rgba(255,255,255,0.5);
      font-variant-numeric: tabular-nums;
    }
    .saintrocky-overlay-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .saintrocky-overlay-actions--stacked {
      grid-template-columns: 1fr;
    }
    .saintrocky-overlay-button {
      border: 0;
      border-radius: 6px;
      padding: 12px 16px;
      font-family: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .saintrocky-overlay-button:hover {
      opacity: 0.85;
    }
    .saintrocky-overlay-button--primary {
      background: #00d084;
      color: #08110d;
    }
    .saintrocky-overlay-button--secondary {
      background: rgba(255,255,255,0.1);
      color: #f0f0f0;
    }
  `;
  document.head.appendChild(styleElement);
}

function createButton(label, className, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = `saintrocky-overlay-button ${className}`;
  button.addEventListener("click", handler);
  return button;
}

async function sendRuntimeMessage(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (!response?.ok && response?.message) {
    globalThis.alert(response.message);
  }
  return response;
}

function renderOverlay(payload = {}) {
  clearOverlay();
  ensureOverlayStyles();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;

  const card = document.createElement("div");
  card.className = "saintrocky-overlay-card";

  const body = document.createElement("div");
  body.className = "saintrocky-overlay-body";

  const eyebrow = document.createElement("p");
  eyebrow.textContent = "Saint Rocky";
  eyebrow.className = "saintrocky-overlay-eyebrow";

  const title = document.createElement("h1");
  title.textContent = payload.title || "Rule triggered";
  title.className = "saintrocky-overlay-title";

  const summary = document.createElement("p");
  summary.textContent = payload.summary || "This page is blocked by your active rule.";
  summary.className = "saintrocky-overlay-summary";

  const actions = document.createElement("div");
  actions.className = "saintrocky-overlay-actions";

  actions.appendChild(
    createButton("Stay blocked", "saintrocky-overlay-button--secondary", () => {
      sendRuntimeMessage({ type: MESSAGE_TYPES.resolveViolation, payload: { action: "comply" } });
    })
  );

  actions.appendChild(
    createButton("Start override countdown", "saintrocky-overlay-button--primary", () => {
      sendRuntimeMessage({ type: MESSAGE_TYPES.requestOverride });
    })
  );

  body.append(eyebrow, title, summary, actions);
  card.appendChild(body);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

function renderOverrideCountdown(payload = {}) {
  clearOverlay();
  ensureOverlayStyles();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;

  const card = document.createElement("div");
  card.className = "saintrocky-overlay-card";

  const body = document.createElement("div");
  body.className = "saintrocky-overlay-body";

  const eyebrow = document.createElement("p");
  eyebrow.textContent = "Sleep-on-it override";
  eyebrow.className = "saintrocky-overlay-eyebrow";

  const title = document.createElement("h1");
  title.textContent = payload.title || "Override in progress";
  title.className = "saintrocky-overlay-title";

  const feeDisplay = document.createElement("div");
  feeDisplay.className = "saintrocky-overlay-fee-display";

  const feeAmount = document.createElement("div");
  feeAmount.className = "saintrocky-overlay-fee-amount";

  const feeCountdown = document.createElement("div");
  feeCountdown.className = "saintrocky-overlay-fee-countdown";

  feeDisplay.append(feeAmount, feeCountdown);

  const actions = document.createElement("div");
  actions.className = "saintrocky-overlay-actions";

  const confirmButton = createButton("", "saintrocky-overlay-button--primary", () => {
    sendRuntimeMessage({ type: MESSAGE_TYPES.confirmOverride });
  });

  const cancelButton = createButton("Cancel request", "saintrocky-overlay-button--secondary", () => {
    sendRuntimeMessage({ type: MESSAGE_TYPES.cancelOverride });
  });

  actions.append(confirmButton, cancelButton);
  body.append(eyebrow, title, feeDisplay, actions);
  card.appendChild(body);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function updateFeeDisplay() {
    const now = new Date();
    const quote = calculateOverrideFee({
      problemIndex: payload.problemIndex ?? 50,
      lockedStakeLamports: payload.lockedStakeLamports ?? 0,
      requestedAt: payload.requestedAt ? new Date(payload.requestedAt) : now,
      now
    });

    if (quote.isFree) {
      feeAmount.textContent = "Free";
      feeCountdown.textContent = "The override fee has fully decayed.";
      confirmButton.textContent = "Override for free";
    } else {
      const solLabel = `${formatFeeSol(quote.feeLamports)} SOL`;
      feeAmount.textContent = solLabel;
      feeCountdown.textContent = `Free in ${formatRemainingDuration(quote.freeAt, now)}`;
      confirmButton.textContent = `Override now for ${solLabel}`;
    }
  }

  updateFeeDisplay();
  countdownTimerId = setInterval(updateFeeDisplay, 1000);
}

function publishPageContext() {
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.pageContext,
    payload: {
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
      currentDomain: window.location.hostname.replace(/^www\./, "")
    }
  });
}

function instrumentHistory() {
  const { pushState, replaceState } = window.history;

  window.history.pushState = function pushStateProxy(...args) {
    const result = pushState.apply(this, args);
    publishPageContext();
    return result;
  };

  window.history.replaceState = function replaceStateProxy(...args) {
    const result = replaceState.apply(this, args);
    publishPageContext();
    return result;
  };
}

window.addEventListener("message", (event) => {
  if (
    event.source !== window ||
    event.data?.type !== MESSAGE_TYPES.authHandoff ||
    !isAllowedOrigin(event.origin, allowedOrigins)
  ) {
    return;
  }

  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.authHandoff,
    payload: event.data.payload
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === MESSAGE_TYPES.renderBlock) {
    renderOverlay(message.payload || {});
    return;
  }

  if (message?.type === MESSAGE_TYPES.renderOverrideCountdown) {
    renderOverrideCountdown(message.payload || {});
    return;
  }

  if (message?.type === MESSAGE_TYPES.clearBlock) {
    clearOverlay();
  }
});

publishPageContext();
instrumentHistory();
window.addEventListener("focus", publishPageContext);
window.addEventListener("popstate", publishPageContext);
window.addEventListener("hashchange", publishPageContext);
