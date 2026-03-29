"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@saintrocky/ui";
import { saintRockyBranding } from "@saintrocky/branding";

import { useAuthSession } from "@/src/auth/auth-session.jsx";

export default function MarketingLayout({ children }) {
  const [isHeroOutOfView, setIsHeroOutOfView] = useState(false);
  const { isAuthenticated, isLoadingSession } = useAuthSession();

  useEffect(() => {
    const heroElement = document.getElementById("marketing-hero-section");
    if (!heroElement) {
      setIsHeroOutOfView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroOutOfView(!entry.isIntersecting);
      },
      {
        threshold: 0
      }
    );

    observer.observe(heroElement);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`sr-MarketingShell ${isHeroOutOfView ? "is-scrolled" : ""}`}>
      {isHeroOutOfView ? (
        <header className="sr-MarketingHeader">
          <Link href="/" className="sr-MarketingBrand">
            <Image
              src="/images/logonav.png"
              alt={`${saintRockyBranding.productName} logo`}
              width={384}
              height={107}
              className="sr-MarketingBrandLogo"
              priority
            />
          </Link>
          <nav className="sr-MarketingActions">
            {isLoadingSession ? (
              <Button variant="secondary" disabled>
                Checking session...
              </Button>
            ) : (
              <Link href={isAuthenticated ? "/dashboard" : "/signin"}>
                <Button variant={isAuthenticated ? "primary" : "secondary"}>
                  {isAuthenticated ? "Open control plane" : "Sign in"}
                </Button>
              </Link>
            )}
          </nav>
        </header>
      ) : null}
      {children}
    </div>
  );
}
