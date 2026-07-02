"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthSession } from "@/src/auth/auth-session.jsx";

export function DashboardAccessGate({ children }) {
  const router = useRouter();
  const { isAuthenticated, isLoadingSession } = useAuthSession();

  useEffect(() => {
    if (!isLoadingSession && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [isAuthenticated, isLoadingSession, router]);

  if (isLoadingSession || !isAuthenticated) {
    return null;
  }

  return children;
}
