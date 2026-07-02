import {
  calculateOverrideFee,
  formatFeeSol,
  formatRemainingDuration
} from "@saintrocky/fuckyoupayme";
import {
  BROWSER_EXTENSION_MESSAGE_TYPES,
  isAllowedOrigin
} from "@saintrocky/shared";
import flowerBackdropImagePath from "../assets/flowerbg.png";
import roccoSmokingPipeVideoPath from "../assets/roccosmokingpipe.mp4";
import overlayThemeCss from "../theme/overlay-theme.css?raw";

const MESSAGE_TYPES = BROWSER_EXTENSION_MESSAGE_TYPES;

const OVERLAY_ID = "saintrocky-extension-overlay";
const OVERLAY_STYLE_ID = "saintrocky-extension-overlay-style";

let countdownTimerId = null;
const allowedOrigins = __SAINTROCKY_EXTENSION_ALLOWED_ORIGINS__;
let extensionRuntimeUnavailable = false;

function resolveExtensionAssetUrl(assetPath) {
  const runtime = getExtensionRuntime();
  const normalizedAssetPath = String(assetPath || "").replace(/^\/+/, "");
  return runtime?.getURL ? runtime.getURL(normalizedAssetPath) : normalizedAssetPath;
}

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

  const flowerBackdropUrl = resolveExtensionAssetUrl(flowerBackdropImagePath);
  const styleElement = document.createElement("style");
  styleElement.id = OVERLAY_STYLE_ID;
  styleElement.textContent = `
    ${overlayThemeCss}
    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2147483647;
      overflow: hidden;
      background:
        linear-gradient(
          180deg,
          rgb(2 8 6 / 0.74) 0%,
          rgb(2 8 6 / 0.86) 40%,
          rgb(2 8 6 / 0.92) 100%
        ),
        url("${flowerBackdropUrl}") center center / cover no-repeat;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: clamp(24px, 4vw, 56px);
      font-family: var(--ui-font);
      color: var(--ui-shell-text);
    }
    #${OVERLAY_ID}::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 18% 20%, color-mix(in srgb, var(--ui-mint) 26%, transparent), transparent 28%),
        radial-gradient(circle at 82% 16%, color-mix(in srgb, var(--ui-mint) 14%, transparent), transparent 24%),
        linear-gradient(180deg, rgb(0 0 0 / 0.12), rgb(0 0 0 / 0.32));
      pointer-events: none;
    }
    #${OVERLAY_ID}.is-banner {
      inset: auto 16px 16px auto;
      width: min(360px, calc(100vw - 32px));
      height: auto;
      padding: 0;
      background: transparent;
      display: block;
      pointer-events: none;
    }
    #${OVERLAY_ID}.is-banner::before {
      display: none;
    }
    #${OVERLAY_ID} * {
      box-sizing: border-box;
    }
    .saintrocky-overlay-card {
      position: relative;
      z-index: 1;
      width: min(88vw, 860px);
      max-width: 860px;
      min-height: 0;
      background:
        linear-gradient(
          180deg,
          color-mix(in srgb, var(--ui-mint) 20%, rgb(4 16 12)) 0%,
          color-mix(in srgb, var(--ui-shell-accent) 72%, rgb(3 9 7)) 100%
        );
      border: 1px solid color-mix(in srgb, var(--ui-mint) 34%, white 4%);
      border-radius: 28px;
      display: flex;
      align-items: flex-end;
      gap: 0;
      overflow: hidden;
      text-align: center;
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center center;
      box-shadow:
        0 30px 90px rgb(0 0 0 / 0.42),
        inset 0 0 0 1px color-mix(in srgb, var(--ui-mint) 10%, transparent);
    }
    .saintrocky-overlay-card--with-media {
      display: grid;
      grid-template-rows: minmax(360px, 56vh) auto;
      align-items: stretch;
    }
    .saintrocky-overlay-media-frame {
      position: relative;
      min-height: 360px;
      background:
        linear-gradient(180deg, rgb(2 8 6 / 0.1), rgb(2 8 6 / 0.28)),
        rgb(3 10 8);
      border-bottom: 1px solid color-mix(in srgb, var(--ui-mint) 18%, transparent);
      overflow: hidden;
    }
    .saintrocky-overlay-media {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center center;
      opacity: 1;
      filter: saturate(1.02) brightness(1) contrast(1.02);
      pointer-events: none;
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
      z-index: 1;
      background: linear-gradient(
        180deg,
        rgb(2 8 6 / 0.1) 0%,
        rgb(2 8 6 / 0.16) 22%,
        rgb(2 8 6 / 0.34) 42%,
        rgb(2 8 6 / 0.76) 74%,
        rgb(2 8 6 / 0.94) 100%
      );
      pointer-events: none;
    }
    .saintrocky-overlay-card--with-media::before {
      display: none;
    }
    .saintrocky-overlay-media-frame::after {
      content: "";
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 50% 18%, rgb(0 0 0 / 0.04), transparent 28%),
        linear-gradient(180deg, rgb(2 8 6 / 0.04), rgb(2 8 6 / 0.24));
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
      z-index: 2;
      width: 100%;
      padding: clamp(28px, 4vw, 42px);
      display: grid;
      gap: 16px;
    }
    #${OVERLAY_ID}.is-banner .saintrocky-overlay-body {
      padding: 16px 18px 18px;
      gap: 10px;
    }
    .saintrocky-overlay-eyebrow {
      margin: 0;
      font-size: 12px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--ui-mint);
      font-weight: 700;
      text-shadow: 0 0 18px color-mix(in srgb, var(--ui-mint) 26%, transparent);
    }
    .saintrocky-overlay-title {
      margin: 0;
      font-size: clamp(26px, 2.8vw, 40px);
      font-weight: 700;
      line-height: 1.06;
      color: var(--ui-shell-text);
      text-wrap: balance;
    }
    .saintrocky-overlay-summary {
      margin: 0;
      font-size: clamp(15px, 1.3vw, 18px);
      line-height: 1.55;
      color: color-mix(in srgb, var(--ui-shell-text) 82%, var(--ui-mint) 18%);
      max-width: 42ch;
      margin-inline: auto;
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
      gap: 14px;
    }
    .saintrocky-overlay-actions--stacked {
      grid-template-columns: 1fr;
    }
    .saintrocky-overlay-button {
      border: 0;
      border-radius: 12px;
      padding: 16px 18px;
      font-family: inherit;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.15s;
    }
    .saintrocky-overlay-button:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .saintrocky-overlay-button--primary {
      background: var(--ui-mint);
      color: #04110c;
      box-shadow: 0 12px 32px color-mix(in srgb, var(--ui-mint) 22%, transparent);
    }
    .saintrocky-overlay-button--secondary {
      background: rgb(4 11 9 / 0.56);
      color: var(--ui-primary-contrast);
      border: 1px solid color-mix(in srgb, var(--ui-mint) 18%, transparent);
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

      console.error("$TANDARD / DEVIANT$ overlay action failed.", error);
    });
  });
  return button;
}

function createOverlayVideoElement() {
  const media = document.createElement("video");
  media.className = "saintrocky-overlay-media";
  media.src = resolveExtensionAssetUrl(roccoSmokingPipeVideoPath);
  media.autoplay = true;
  media.loop = true;
  media.muted = true;
  media.defaultMuted = true;
  media.playsInline = true;
  media.setAttribute("aria-hidden", "true");
  media.setAttribute("disablepictureinpicture", "true");
  media.setAttribute("disableremoteplayback", "true");
  return media;
}

function createOverlayMediaFrame() {
  const mediaFrame = document.createElement("div");
  mediaFrame.className = "saintrocky-overlay-media-frame";
  const media = createOverlayVideoElement();
  mediaFrame.appendChild(media);
  return { mediaFrame, media };
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

        console.error("Failed to send quiet $TANDARD / DEVIANT$ runtime message.", error);
      });
  } catch (error) {
    if (isExtensionContextInvalidatedError(error)) {
      markExtensionRuntimeUnavailable();
      return;
    }

    console.error("Failed to send quiet $TANDARD / DEVIANT$ runtime message.", error);
  }
}

function renderOverlay(payload = {}) {
  clearOverlay();
  ensureOverlayStyles();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;

  const card = document.createElement("div");
  card.className = "saintrocky-overlay-card saintrocky-overlay-card--with-media";
  const { mediaFrame, media } = createOverlayMediaFrame();

  const body = document.createElement("div");
  body.className = "saintrocky-overlay-body";

  const eyebrow = document.createElement("p");
  eyebrow.textContent = "$TANDARD / DEVIANT$";
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
  mediaFrame.appendChild(media);
  card.append(mediaFrame, body);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  media.play().catch(() => {});
}

function renderOverrideCountdown(payload = {}) {
  clearOverlay();
  ensureOverlayStyles();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;

  const card = document.createElement("div");
  card.className = "saintrocky-overlay-card saintrocky-overlay-card--with-media";
  const { mediaFrame, media } = createOverlayMediaFrame();

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
  card.append(mediaFrame, body);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  media.play().catch(() => {});

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

    console.error("Failed to register $TANDARD / DEVIANT$ runtime listener.", error);
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
