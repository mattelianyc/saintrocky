export const BROWSER_EXTENSION_MESSAGE_TYPES = {
  authHandoff: "SAINTROCKY_EXTENSION_AUTH_HANDOFF",
  getState: "SAINTROCKY_EXTENSION_GET_STATE",
  pageContext: "SAINTROCKY_EXTENSION_PAGE_CONTEXT",
  renderBlock: "SAINTROCKY_EXTENSION_RENDER_BLOCK",
  clearBlock: "SAINTROCKY_EXTENSION_CLEAR_BLOCK",
  resolveViolation: "SAINTROCKY_EXTENSION_RESOLVE_VIOLATION",
  signOut: "SAINTROCKY_EXTENSION_SIGN_OUT",
  requestOverride: "SAINTROCKY_EXTENSION_REQUEST_OVERRIDE",
  confirmOverride: "SAINTROCKY_EXTENSION_CONFIRM_OVERRIDE",
  cancelOverride: "SAINTROCKY_EXTENSION_CANCEL_OVERRIDE",
  renderOverrideCountdown: "SAINTROCKY_EXTENSION_RENDER_OVERRIDE_COUNTDOWN"
};

export function normalizeOrigin(origin) {
  return String(origin || "").trim().replace(/\/+$/, "");
}

export function parseAllowedOrigins(originsValue) {
  return Array.from(
    new Set(
      String(originsValue || "")
        .split(",")
        .map((origin) => normalizeOrigin(origin))
        .filter(Boolean)
    )
  );
}

export function isAllowedOrigin(origin, allowedOrigins = []) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return false;
  }

  return allowedOrigins.some((allowedOrigin) => normalizeOrigin(allowedOrigin) === normalizedOrigin);
}
