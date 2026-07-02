"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SignUpCard } from "@saintrocky/ui/web";

import { useAuthSession } from "@/src/auth/auth-session.jsx";

export default function SignUpPage() {
  const router = useRouter();
  const { isAuthenticated, isLoadingSession, setSessionUser } = useAuthSession();

  useEffect(() => {
    if (!isLoadingSession && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoadingSession, router]);

  if (isLoadingSession) {
    return null;
  }

  return <SignUpCard onSuccess={setSessionUser} />;
}
