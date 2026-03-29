const STORAGE_KEY = "saintRockyExtensionRuntime";
const MESSAGE_TYPES = {
  getState: "SAINTROCKY_EXTENSION_GET_STATE",
  setArmed: "SAINTROCKY_EXTENSION_SET_ARMED",
  resolveViolation: "SAINTROCKY_EXTENSION_RESOLVE_VIOLATION",
  signOut: "SAINTROCKY_EXTENSION_SIGN_OUT"
};

const connectionSummaryElement = document.getElementById("connection-summary");
const monitorStatusElement = document.getElementById("monitor-status");
const assignmentCountElement = document.getElementById("assignment-count");
const tradingViewStatusElement = document.getElementById("tradingview-status");
const assignmentListElement = document.getElementById("assignment-list");
const armToggleElement = document.getElementById("arm-toggle");
const signOutButtonElement = document.getElementById("sign-out-button");
const violationEmptyElement = document.getElementById("violation-empty");
const violationCardElement = document.getElementById("violation-card");
const violationTitleElement = document.getElementById("violation-title");
const violationSummaryElement = document.getElementById("violation-summary");
const complyButtonElement = document.getElementById("comply-button");
const bypassButtonElement = document.getElementById("bypass-button");

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

function renderViolation(violation) {
  if (!violation) {
    violationEmptyElement.classList.remove("hidden");
    violationCardElement.classList.add("hidden");
    return;
  }

  violationEmptyElement.classList.add("hidden");
  violationCardElement.classList.remove("hidden");
  violationTitleElement.textContent = violation.title;
  violationSummaryElement.textContent = violation.summary;
}

function renderState(runtimeState = {}) {
  connectionSummaryElement.textContent = runtimeState.sessionUser?.email
    ? `Connected as ${runtimeState.sessionUser.email}.`
    : "Open the web dashboard with the extension installed to complete auth handoff.";
  monitorStatusElement.textContent = runtimeState.connectionState || "idle";
  assignmentCountElement.textContent = String(runtimeState.assignments?.length || 0);
  tradingViewStatusElement.textContent = runtimeState.assignments?.length > 0 ? "monitoring" : "idle";
  armToggleElement.textContent = runtimeState.isArmed ? "Disable enforcement" : "Enable enforcement";
  renderAssignments(runtimeState.assignments || []);
  renderViolation(runtimeState.pendingViolation || null);
}

async function loadInitialState() {
  const response = await chrome.runtime.sendMessage({ type: MESSAGE_TYPES.getState });
  renderState(response.state || {});
}

armToggleElement.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.setArmed,
    payload: { isArmed: armToggleElement.textContent !== "Disable enforcement" }
  });
  renderState(response.state || {});
});

signOutButtonElement.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.signOut
  });
  renderState(response.state || {});
});

complyButtonElement.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.resolveViolation,
    payload: { action: "comply" }
  });
  renderState(response.state || {});
});

bypassButtonElement.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.resolveViolation,
    payload: { action: "pay_to_bypass" }
  });
  renderState(response.state || {});
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[STORAGE_KEY]?.newValue) {
    return;
  }

  renderState(changes[STORAGE_KEY].newValue);
});

loadInitialState();
