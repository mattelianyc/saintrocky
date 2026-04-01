import {
  calculateOverrideFee,
  formatFeeSol,
  formatRemainingDuration
} from "@saintrocky/fuckyoupayme";
import { BROWSER_EXTENSION_MESSAGE_TYPES } from "@saintrocky/shared";

const STORAGE_KEY = "saintRockyExtensionRuntime";
const MESSAGE_TYPES = BROWSER_EXTENSION_MESSAGE_TYPES;

const connectionSummaryElement = document.getElementById("connection-summary");
const monitorStatusElement = document.getElementById("monitor-status");
const assignmentCountElement = document.getElementById("assignment-count");
const tradingViewStatusElement = document.getElementById("tradingview-status");
const assignmentListElement = document.getElementById("assignment-list");
const signOutButtonElement = document.getElementById("sign-out-button");
const violationEmptyElement = document.getElementById("violation-empty");
const violationCardElement = document.getElementById("violation-card");
const violationTitleElement = document.getElementById("violation-title");
const violationSummaryElement = document.getElementById("violation-summary");
const complyButtonElement = document.getElementById("comply-button");
const bypassButtonElement = document.getElementById("bypass-button");
const violationActionsDefaultElement = document.getElementById("violation-actions-default");
const violationOverrideElement = document.getElementById("violation-override");
const overrideFeeLabelElement = document.getElementById("override-fee-label");
const overrideCountdownLabelElement = document.getElementById("override-countdown-label");
const confirmOverrideButtonElement = document.getElementById("confirm-override-button");
const cancelOverrideButtonElement = document.getElementById("cancel-override-button");

let feeTickerTimerId = null;
let cachedOverrideRequest = null;

function handleExtensionResponse(response) {
  renderState(response?.state || {});
  if (!response?.ok && response?.message) {
    globalThis.alert(response.message);
  }
}

function renderAssignments(assignments = []) {
  assignmentListElement.innerHTML = "";

  if (!assignments.length) {
    const item = document.createElement("li");
    item.textContent = "No active browser rules yet.";
    assignmentListElement.appendChild(item);
    return;
  }

  assignments.forEach((assignment) => {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = assignment.compiledRule?.summary || assignment.ruleId;
    const meta = document.createElement("p");
    meta.textContent = assignment.compiledRule?.telemetry?.templateKey || "browser rule";
    item.append(title, meta);
    assignmentListElement.appendChild(item);
  });
}

function stopFeeTicker() {
  if (feeTickerTimerId) {
    clearInterval(feeTickerTimerId);
    feeTickerTimerId = null;
  }
}

function updateOverrideFeeDisplay() {
  if (!cachedOverrideRequest) return;

  const now = new Date();
  const quote = calculateOverrideFee({
    problemIndex: cachedOverrideRequest.problemIndex ?? 50,
    lockedStakeLamports: cachedOverrideRequest.lockedStakeLamports ?? 0,
    requestedAt: cachedOverrideRequest.requestedAt
      ? new Date(cachedOverrideRequest.requestedAt)
      : now,
    now
  });

  if (quote.isFree) {
    overrideFeeLabelElement.textContent = "Free";
    overrideCountdownLabelElement.textContent = "Fee fully decayed";
    confirmOverrideButtonElement.textContent = "Override for free";
  } else {
    const solLabel = `${formatFeeSol(quote.feeLamports)} SOL`;
    overrideFeeLabelElement.textContent = solLabel;
    overrideCountdownLabelElement.textContent = `Free in ${formatRemainingDuration(quote.freeAt, now)}`;
    confirmOverrideButtonElement.textContent = `Override for ${solLabel}`;
  }
}

function renderViolation(violation, pendingOverrideRequest) {
  stopFeeTicker();
  cachedOverrideRequest = null;

  if (!violation) {
    violationEmptyElement.classList.remove("hidden");
    violationCardElement.classList.add("hidden");
    return;
  }

  violationEmptyElement.classList.add("hidden");
  violationCardElement.classList.remove("hidden");
  violationTitleElement.textContent = violation.title;
  violationSummaryElement.textContent = violation.summary;

  if (pendingOverrideRequest) {
    violationActionsDefaultElement.classList.add("hidden");
    violationOverrideElement.classList.remove("hidden");
    cachedOverrideRequest = pendingOverrideRequest;
    updateOverrideFeeDisplay();
    feeTickerTimerId = setInterval(updateOverrideFeeDisplay, 1000);
  } else {
    violationActionsDefaultElement.classList.remove("hidden");
    violationOverrideElement.classList.add("hidden");
  }
}

function renderState(runtimeState = {}) {
  connectionSummaryElement.textContent = runtimeState.sessionUser?.email
    ? `Connected as ${runtimeState.sessionUser.email}.`
    : "Open the web dashboard with the extension installed to complete auth handoff.";
  monitorStatusElement.textContent = runtimeState.connectionState || "idle";
  assignmentCountElement.textContent = String(runtimeState.assignments?.length || 0);
  tradingViewStatusElement.textContent = runtimeState.assignments?.length > 0 ? "monitoring" : "idle";
  renderAssignments(runtimeState.assignments || []);
  renderViolation(
    runtimeState.pendingViolation || null,
    runtimeState.pendingOverrideRequest || null
  );
}

async function loadInitialState() {
  const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.getState });
  renderState(response.state || {});
}

signOutButtonElement.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.signOut
  });
  handleExtensionResponse(response);
});

complyButtonElement.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.resolveViolation,
    payload: { action: "comply" }
  });
  handleExtensionResponse(response);
});

bypassButtonElement.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.requestOverride
  });
  handleExtensionResponse(response);
});

confirmOverrideButtonElement.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.confirmOverride
  });
  handleExtensionResponse(response);
});

cancelOverrideButtonElement.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.cancelOverride
  });
  handleExtensionResponse(response);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[STORAGE_KEY]?.newValue) {
    return;
  }

  renderState(changes[STORAGE_KEY].newValue);
});

loadInitialState();
