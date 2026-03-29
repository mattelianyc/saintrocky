"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { api, setUnauthorizedHandler } from "@saintrocky/api-client";
import { createRealtimeClient } from "@saintrocky/realtime";

const AuthSessionContext = createContext(undefined);

export function AuthSessionProvider({ children }) {
  const realtimeClientRef = useRef(null);
  const [sessionUser, setSessionUser] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const clearSession = useCallback(() => {
    realtimeClientRef.current?.disconnect();
    realtimeClientRef.current = null;
    setSessionUser(null);
    setIsLoadingSession(false);
  }, []);

  const refreshSession = useCallback(async () => {
    setIsLoadingSession(true);

    try {
      const response = await api.auth.me();
      setSessionUser(response?.user || null);
    } catch {
      setSessionUser(null);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    setUnauthorizedHandler(() => {
      if (!isMounted) {
        return;
      }

      clearSession();
    });

    async function loadSession() {
      try {
        const response = await api.auth.me();

        if (!isMounted) {
          return;
        }

        setSessionUser(response?.user || null);
      } catch {
        if (!isMounted) {
          return;
        }

        setSessionUser(null);
      } finally {
        if (isMounted) {
          setIsLoadingSession(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
      setUnauthorizedHandler(null);
    };
  }, [clearSession]);

  useEffect(() => {
    if (!sessionUser?.email) {
      realtimeClientRef.current?.disconnect();
      realtimeClientRef.current = null;
      return undefined;
    }

    let isMounted = true;

    async function connectRealtimeAuth() {
      try {
        const runtimeAuth = await api.auth.createRuntimeToken({ runtimeSurface: "web" });
        if (!isMounted) {
          return;
        }

        realtimeClientRef.current?.disconnect();
        const realtimeClient = createRealtimeClient({
          clientType: "web",
          authToken: runtimeAuth.token,
          onAuthRevoked() {
            clearSession();
            globalThis.window?.location?.assign("/signin");
          }
        });
        realtimeClientRef.current = realtimeClient;
        realtimeClient.connect();
      } catch {
        // Let normal HTTP session bootstrap handle auth failures.
      }
    }

    connectRealtimeAuth();

    return () => {
      isMounted = false;
      realtimeClientRef.current?.disconnect();
      realtimeClientRef.current = null;
    };
  }, [clearSession, sessionUser?.email]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(sessionUser),
      isLoadingSession,
      refreshSession,
      clearSession,
      sessionUser,
      setSessionUser
    }),
    [clearSession, isLoadingSession, refreshSession, sessionUser]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const value = useContext(AuthSessionContext);

  if (!value) {
    throw new Error("useAuthSession must be used within an AuthSessionProvider.");
  }

  return value;
}
