"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "@saintrocky/api-client";
import { saintRockyBranding } from "@saintrocky/branding";
import { Icon } from "@saintrocky/icons";
import { AppSidebar, BrandWordmarkLogo, Button } from "@saintrocky/ui";

import { useAuthSession } from "@/src/auth/auth-session.jsx";
import { getVisibleDashboardSections } from "@/src/dashboard/dashboard-navigation.js";

const sectionIconMap = {
  tactics: "tactics",
  strategy: "strategy",
  wallet: "wallet",
  trades: "trades",
  friends: "users",
  messages: "chat",
  campaigns: "calendar"
};

const navigationItems = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
    icon: <Icon name="dashboard" size={18} />
  },
  ...getVisibleDashboardSections().map((section) => ({
    id: section.slug,
    label: section.title,
    href: `/dashboard/${section.slug}`,
    icon: <Icon name={sectionIconMap[section.slug] || "dashboard"} size={18} />
  }))
];

export function DashboardSidebarShell({ onNavigate }) {
  const router = useRouter();
  const { clearSession, sessionUser } = useAuthSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    onNavigate?.();

    try {
      await api.auth.logout();
    } catch {
      // Clear local session state even if the network request fails.
    } finally {
      clearSession();
      router.push("/signin");
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  return (
    <AppSidebar
      className="sr-WebDashboardSidebar"
      items={navigationItems}
      onNavigate={onNavigate}
      renderLink={({ item, children, className, onNavigate: handleNavigate }) => (
        <Link
          href={item.href || "#"}
          className={className}
          onClick={() => handleNavigate?.(item)}
        >
          {children}
        </Link>
      )}
      brand={
        <div className="sr-WebDashboardBrand">
          <BrandWordmarkLogo
            className="sr-WebDashboardBrandLogo"
            variant="inline"
            width="100%"
          />
        </div>
      }
      footer={
        <div className="sr-WebDashboardFooter">
          <Link href="/dashboard/profile" className="sr-WebDashboardFooterLink"  >
            <p className="sr-WebDashboardBrandUser">
              {sessionUser?.displayName || sessionUser?.email || saintRockyBranding.shortProductName}
            </p>
          </Link>
          <hr className="sr-WebDashboardFooterSeparator" />
            <Button
              type="button"
              variant="ghost"
              block
              loading={isLoggingOut}
              loadingLabel="Logging out..."
              onClick={handleLogout}
              leadingIcon={<Icon name="logout" size={18} />}
            >
            Log out
          </Button>
        </div>
      }
    />
  );
}
