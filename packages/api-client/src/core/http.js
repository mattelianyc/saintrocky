import axios from "axios";
import { normalizeHttpError } from "./errors.js";
import { resolveApiBaseUrl } from "./url.js";

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === "function" ? handler : null;
}

export function createHttpClient(options = {}) {
  const client = axios.create({
    baseURL: resolveApiBaseUrl(options),
    withCredentials: true,
    timeout: 30_000,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    }
  });

  client.interceptors.request.use((config) => {
    const authToken =
      typeof options.getAuthToken === "function"
        ? options.getAuthToken()
        : options.authToken;

    if (authToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401 && unauthorizedHandler) {
        unauthorizedHandler();
      }

      return Promise.reject(normalizeHttpError(error));
    }
  );

  return client;
}
