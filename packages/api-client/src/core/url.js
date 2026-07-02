export function joinUrl(baseUrl, pathName = "") {
  const normalizedBaseUrl = String(baseUrl || "").replace(/\/+$/, "");
  const normalizedPath = String(pathName || "").replace(/^\/+/, "");

  if (!normalizedBaseUrl) {
    return normalizedPath ? `/${normalizedPath}` : "/";
  }

  return normalizedPath ? `${normalizedBaseUrl}/${normalizedPath}` : normalizedBaseUrl;
}

export function resolveApiBaseUrl(overrides = {}) {
  if (overrides.baseUrl) {
    return joinUrl(overrides.baseUrl, "api");
  }

  if (typeof window !== "undefined") {
    const publicApiBaseUrl = window.__SAINTROCKY_API_BASE_URL__ || window.__NEXT_PUBLIC_API_BASE_URL__;
    if (publicApiBaseUrl) {
      return joinUrl(publicApiBaseUrl, "api");
    }
  }

  const hasProcess = typeof process !== "undefined" && process.env;

  // babel-preset-expo inlines EXPO_PUBLIC_* only when accessed as
  // the full `process.env.EXPO_PUBLIC_X` member-expression.
  // Aliasing process.env to a variable breaks the static AST match.
  if (hasProcess && process.env.EXPO_PUBLIC_API_URL) {
    return joinUrl(process.env.EXPO_PUBLIC_API_URL, "api");
  }

  if (hasProcess && process.env.ELECTRON_API_BASE_URL) {
    return joinUrl(process.env.ELECTRON_API_BASE_URL, "api");
  }

  if (hasProcess && process.env.EXTENSION_API_BASE_URL) {
    return joinUrl(process.env.EXTENSION_API_BASE_URL, "api");
  }

  if (hasProcess && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return joinUrl(process.env.NEXT_PUBLIC_API_BASE_URL, "api");
  }

  if (hasProcess && process.env.API_BASE_URL) {
    return joinUrl(process.env.API_BASE_URL, "api");
  }

  return "http://localhost:4000/api";
}
