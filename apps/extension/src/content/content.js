import {
  calculateOverrideFee,
  formatFeeSol,
  formatRemainingDuration
} from "@saintrocky/fuckyoupayme";
import {
  BROWSER_EXTENSION_MESSAGE_TYPES,
  isAllowedOrigin
} from "@saintrocky/shared";
import overlayThemeCss from "../theme/overlay-theme.css?raw";

const MESSAGE_TYPES = BROWSER_EXTENSION_MESSAGE_TYPES;

const OVERLAY_ID = "saintrocky-extension-overlay";
const OVERLAY_STYLE_ID = "saintrocky-extension-overlay-style";

let countdownTimerId = null;
const allowedOrigins = __SAINTROCKY_EXTENSION_ALLOWED_ORIGINS__;
let extensionRuntimeUnavailable = false;

function getExtensionRuntime() {
  const runtime = globalThis.chrome?.runtime;
  return runtime?.id ? runtime : null;
}

function formatAbsoluteTimestamp(value) {
  const timestamp = new Date(value || "");
  if (Number.isNaN(timestamp.getTime())) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(timestamp);
  } catch {
    return timestamp.toLocaleString();
  }
}

function getOverlay() {
  return document.getElementById(OVERLAY_ID);
}

function clearOverlay() {
  stopCountdownTimer();
  getOverlay()?.remove();
}

function markExtensionRuntimeUnavailable() {
  extensionRuntimeUnavailable = true;
  clearOverlay();
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
    ${overlayThemeCss}
    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: color-mix(in srgb, var(--ui-shell-background-strong) 88%, rgb(0 0 0));
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      font-family: var(--ui-font);
      color: var(--ui-shell-text);
    }
    #${OVERLAY_ID}.is-banner {
      inset: auto 16px 16px auto;
      width: min(360px, calc(100vw - 32px));
      padding: 0;
      background: transparent;
      display: block;
      pointer-events: none;
    }
    #${OVERLAY_ID} * {
      box-sizing: border-box;
    }
    .saintrocky-overlay-card {
      position: relative;
      max-width: 560px;
      width: 100%;
      min-height: 620px;
      background-color: var(--ui-shell-panel-strong);
      border: 1px solid var(--ui-shell-border);
      border-radius: 12px;
      display: flex;
      align-items: flex-end;
      gap: 0;
      overflow: hidden;
      text-align: center;
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center center;
      box-shadow: var(--ui-shell-shadow);
    }
    #${OVERLAY_ID}.is-banner .saintrocky-overlay-card {
      min-height: 0;
      border-radius: 18px;
      background-color: color-mix(in srgb, var(--ui-shell-panel-strong) 96%, rgb(0 0 0));
      box-shadow: 0 20px 36px rgb(0 0 0 / 0.28);
      backdrop-filter: blur(16px);
    }
    .saintrocky-overlay-card::before {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--ui-shell-background-strong) 20%, transparent) 0%,
        color-mix(in srgb, var(--ui-shell-background-strong) 38%, transparent) 30%,
        color-mix(in srgb, var(--ui-shell-background-strong) 68%, transparent) 65%,
        color-mix(in srgb, var(--ui-shell-background-strong) 88%, transparent) 100%
      );
      pointer-events: none;
    }
    #${OVERLAY_ID}.is-banner .saintrocky-overlay-card::before {
      background: linear-gradient(
        180deg,
        color-mix(in srgb, var(--ui-shell-accent) 16%, transparent) 0%,
        color-mix(in srgb, var(--ui-shell-background-strong) 92%, transparent) 100%
      );
    }
    .saintrocky-overlay-body {
      position: relative;
      z-index: 1;
      width: 100%;
      padding: 24px 24px 28px;
      display: grid;
      gap: 14px;
    }
    #${OVERLAY_ID}.is-banner .saintrocky-overlay-body {
      padding: 16px 18px 18px;
      gap: 10px;
    }
    .saintrocky-overlay-eyebrow {
      margin: 0;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ui-shell-accent);
      font-weight: 700;
    }
    .saintrocky-overlay-title {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.2;
      color: var(--ui-shell-text);
    }
    .saintrocky-overlay-summary {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: var(--ui-shell-text-muted);
    }
    .saintrocky-overlay-fee-display {
      display: grid;
      gap: 4px;
      padding: 14px;
      background: color-mix(in srgb, var(--ui-shell-accent) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--ui-shell-accent) 24%, transparent);
      border-radius: 8px;
    }
    .saintrocky-overlay-fee-amount {
      font-size: 28px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--ui-shell-accent);
    }
    .saintrocky-overlay-fee-countdown {
      font-size: 13px;
      color: var(--ui-shell-text-muted);
      font-variant-numeric: tabular-nums;
    }
    .saintrocky-overlay-runtime {
      font-size: 13px;
      color: var(--ui-shell-text-muted);
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
      background: var(--ui-shell-accent);
      color: var(--ui-primary-contrast);
    }
    .saintrocky-overlay-button--secondary {
      background: color-mix(in srgb, var(--ui-shell-text) 12%, transparent);
      color: var(--ui-shell-text);
    }
  `;
  document.head.appendChild(styleElement);
}

function createButton(label, className, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = `saintrocky-overlay-button ${className}`;
  button.addEventListener("click", () => {
    Promise.resolve(handler()).catch((error) => {
      if (isExtensionContextInvalidatedError(error)) {
        markExtensionRuntimeUnavailable();
        return;
      }

      console.error("Saint Rocky overlay action failed.", error);
    });
  });
  return button;
}

async function sendRuntimeMessage(message) {
  if (extensionRuntimeUnavailable) {
    return { ok: false, message: "Extension runtime unavailable." };
  }

  try {
    const runtime = getExtensionRuntime();
    if (!runtime?.sendMessage) {
      markExtensionRuntimeUnavailable();
      return { ok: false, message: "Extension runtime unavailable." };
    }

    const response = await runtime.sendMessage(message);
    if (!response?.ok && response?.message) {
      globalThis.alert(response.message);
    }
    return response;
  } catch (error) {
    if (isExtensionContextInvalidatedError(error)) {
      markExtensionRuntimeUnavailable();
      return { ok: false, message: "Extension context invalidated." };
    }
    throw error;
  }
}

function sendRuntimeMessageQuietly(message, onSuccess) {
  if (extensionRuntimeUnavailable) {
    return;
  }

  try {
    const runtime = getExtensionRuntime();
    if (!runtime?.sendMessage) {
      markExtensionRuntimeUnavailable();
      return;
    }

    const responsePromise = runtime.sendMessage(message);
    Promise.resolve(responsePromise)
      .then((response) => {
        if (typeof onSuccess === "function") {
          onSuccess(response);
        }
      })
      .catch((error) => {
        if (isExtensionContextInvalidatedError(error)) {
          markExtensionRuntimeUnavailable();
          return;
        }

        console.error("Failed to send quiet Saint Rocky runtime message.", error);
      });
  } catch (error) {
    if (isExtensionContextInvalidatedError(error)) {
      markExtensionRuntimeUnavailable();
      return;
    }

    console.error("Failed to send quiet Saint Rocky runtime message.", error);
  }
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

  const overrideRuntime = document.createElement("div");
  overrideRuntime.className = "saintrocky-overlay-runtime";

  feeDisplay.append(feeAmount, feeCountdown, overrideRuntime);

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

    if (payload.overrideExpiresAt) {
      overrideRuntime.textContent = `This override lasts until ${formatAbsoluteTimestamp(payload.overrideExpiresAt)} (${formatRemainingDuration(payload.overrideExpiresAt, now)} from now).`;
    } else {
      overrideRuntime.textContent = "This override stays active until the current schedule window ends.";
    }
  }

  updateFeeDisplay();
  countdownTimerId = setInterval(updateFeeDisplay, 1000);
}

function renderActiveOverride(payload = {}) {
  clearOverlay();
  ensureOverlayStyles();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "is-banner";

  const card = document.createElement("div");
  card.className = "saintrocky-overlay-card";

  const body = document.createElement("div");
  body.className = "saintrocky-overlay-body";

  const eyebrow = document.createElement("p");
  eyebrow.textContent = "Override active";
  eyebrow.className = "saintrocky-overlay-eyebrow";

  const title = document.createElement("h2");
  title.textContent = payload.title || "You can keep using this site";
  title.className = "saintrocky-overlay-title";

  const summary = document.createElement("p");
  summary.textContent = payload.summary || "This override stays active until the current schedule window ends.";
  summary.className = "saintrocky-overlay-summary";

  const runtime = document.createElement("div");
  runtime.className = "saintrocky-overlay-runtime";

  body.append(eyebrow, title, summary, runtime);
  card.appendChild(body);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  function updateRuntimeCopy() {
    const now = new Date();
    const overrideExpiresAt = payload.overrideExpiresAt ? new Date(payload.overrideExpiresAt) : null;

    if (!overrideExpiresAt || Number.isNaN(overrideExpiresAt.getTime()) || overrideExpiresAt.getTime() <= now.getTime()) {
      clearOverlay();
      return;
    }

    runtime.textContent = `Active for ${formatRemainingDuration(overrideExpiresAt, now)} more, until ${formatAbsoluteTimestamp(overrideExpiresAt)}.`;
  }

  updateRuntimeCopy();
  countdownTimerId = setInterval(updateRuntimeCopy, 1000);
}

function publishPageContext() {
  sendRuntimeMessageQuietly({
    type: MESSAGE_TYPES.pageContext,
    payload: {
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
      currentDomain: window.location.hostname.replace(/^www\./, ""),
      apiBaseUrl: window.__SAINTROCKY_API_BASE_URL__ || ""
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

  sendRuntimeMessageQuietly({
    type: MESSAGE_TYPES.authHandoff,
    payload: {
      ...event.data.payload,
      apiBaseUrl: window.__SAINTROCKY_API_BASE_URL__ || event.data.payload?.apiBaseUrl || ""
    }
  });
});

function registerRuntimeMessageListener() {
  try {
    const runtime = getExtensionRuntime();
    if (!runtime?.onMessage?.addListener) {
      markExtensionRuntimeUnavailable();
      return;
    }

    runtime.onMessage.addListener((message) => {
      if (message?.type === MESSAGE_TYPES.renderBlock) {
        renderOverlay(message.payload || {});
        return;
      }

      if (message?.type === MESSAGE_TYPES.renderOverrideCountdown) {
        renderOverrideCountdown(message.payload || {});
        return;
      }

      if (message?.type === MESSAGE_TYPES.renderOverrideActive) {
        renderActiveOverride(message.payload || {});
        return;
      }

      if (message?.type === MESSAGE_TYPES.clearBlock) {
        clearOverlay();
      }
    });
  } catch (error) {
    if (isExtensionContextInvalidatedError(error)) {
      markExtensionRuntimeUnavailable();
      return;
    }

    console.error("Failed to register Saint Rocky runtime listener.", error);
  }
}

function isExtensionContextInvalidatedError(error) {
  const message = error?.message || "";
  return (
    message.includes("Extension context invalidated") ||
    message.includes("Cannot read properties of undefined (reading 'sendMessage')") ||
    message.includes("Cannot read properties of undefined (reading 'onMessage')")
  );
}

registerRuntimeMessageListener();
publishPageContext();
instrumentHistory();
window.addEventListener("focus", publishPageContext);
window.addEventListener("popstate", publishPageContext);
window.addEventListener("hashchange", publishPageContext);
