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

  const processEnv = typeof process !== "undefined" ? process.env : undefined;

  if (processEnv?.EXPO_PUBLIC_API_URL) {
    return joinUrl(processEnv.EXPO_PUBLIC_API_URL, "api");
  }

  if (processEnv?.ELECTRON_API_BASE_URL) {
    return joinUrl(processEnv.ELECTRON_API_BASE_URL, "api");
  }

  if (processEnv?.EXTENSION_API_BASE_URL) {
    return joinUrl(processEnv.EXTENSION_API_BASE_URL, "api");
  }

  if (processEnv?.NEXT_PUBLIC_API_BASE_URL) {
    return joinUrl(processEnv.NEXT_PUBLIC_API_BASE_URL, "api");
  }

  if (processEnv?.API_BASE_URL) {
    return joinUrl(processEnv.API_BASE_URL, "api");
  }

  return "http://localhost:4000/api";
}
