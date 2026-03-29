const MESSAGE_TYPES = {
  authHandoff: "SAINTROCKY_EXTENSION_AUTH_HANDOFF",
  pageContext: "SAINTROCKY_EXTENSION_PAGE_CONTEXT",
  renderBlock: "SAINTROCKY_EXTENSION_RENDER_BLOCK",
  clearBlock: "SAINTROCKY_EXTENSION_CLEAR_BLOCK",
  resolveViolation: "SAINTROCKY_EXTENSION_RESOLVE_VIOLATION"
};

const OVERLAY_ID = "saintrocky-extension-overlay";
const OVERLAY_STYLE_ID = "saintrocky-extension-overlay-style";


function getOverlay() {
  return document.getElementById(OVERLAY_ID);
}

function clearOverlay() {
  getOverlay()?.remove();
}

function ensureOverlayStyles() {
  if (document.getElementById(OVERLAY_STYLE_ID)) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = OVERLAY_STYLE_ID;
  styleElement.textContent = `
    #${OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: rgba(255, 255, 255, 0.96);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    #${OVERLAY_ID} .saintrocky-overlay-panel {
      max-width: 560px;
      width: 100%;
      background: #ffffff;
      color: #111111;
      padding: 24px;
      border-radius: 2px;
      display: grid;
      gap: 16px;
      font-family: Inter, system-ui, sans-serif;
    }
    #${OVERLAY_ID} .saintrocky-overlay-eyebrow {
      margin: 0;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    #${OVERLAY_ID} .saintrocky-overlay-title {
      margin: 0;
      font-size: 28px;
      line-height: 1.1;
    }
    #${OVERLAY_ID} .saintrocky-overlay-summary {
      margin: 0;
      font-size: 16px;
      line-height: 1.5;
    }
    #${OVERLAY_ID} .saintrocky-overlay-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    #${OVERLAY_ID} .saintrocky-overlay-button {
      border: 0;
      border-radius: 2px;
      padding: 12px 16px;
      background: #00d084;
      color: #08110d;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
  `;
  document.head.appendChild(styleElement);
}

function createActionButton(label, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = "saintrocky-overlay-button";
  button.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.resolveViolation,
      payload: { action }
    });
  });
  return button;
}

function renderOverlay(payload = {}) {
  clearOverlay();
  ensureOverlayStyles();

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;

  const panel = document.createElement("div");
  panel.className = "saintrocky-overlay-panel";

  const eyebrow = document.createElement("p");
  eyebrow.textContent = "Saint Rocky";
  eyebrow.className = "saintrocky-overlay-eyebrow";

  const title = document.createElement("h1");
  title.textContent = payload.title || "Rule triggered";
  title.className = "saintrocky-overlay-title";

  const summary = document.createElement("p");
  summary.textContent = payload.summary || "This action is blocked until you comply or pay to bypass.";
  summary.className = "saintrocky-overlay-summary";

  const actions = document.createElement("div");
  actions.className = "saintrocky-overlay-actions";
  actions.appendChild(createActionButton("Stay blocked", "comply"));
  actions.appendChild(createActionButton("Pay to bypass", "pay_to_bypass"));

  panel.append(eyebrow, title, summary, actions);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
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
  if (event.source !== window || event.data?.type !== MESSAGE_TYPES.authHandoff) {
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

  if (message?.type === MESSAGE_TYPES.clearBlock) {
    clearOverlay();
  }
});

publishPageContext();
instrumentHistory();
window.addEventListener("focus", publishPageContext);
window.addEventListener("popstate", publishPageContext);
window.addEventListener("hashchange", publishPageContext);
