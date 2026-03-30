"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { api } from "@saintrocky/api-client";
import { saintRockyBranding } from "@saintrocky/branding";
import { Icon } from "@saintrocky/icons";
import { AppSidebar, Button } from "@saintrocky/ui";

import { useAuthSession } from "@/src/auth/auth-session.jsx";

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
  ...saintRockyBranding.dashboardSections.map((section) => ({
    id: section.slug,
    label: section.title,
    href: `/dashboard/${section.slug}`,
    icon: <Icon name={sectionIconMap[section.slug] || "dashboard"} size={18} />
  }))
];

export function DashboardSidebarShell() {
  const router = useRouter();
  const { clearSession, sessionUser } = useAuthSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

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
      brand={
        <div className="sr-WebDashboardBrand">
          <Image
            src="/images/logonav.png"
            alt={`${saintRockyBranding.productName} logo`}
            width={384}
            height={107}
            className="sr-WebDashboardBrandLogo"
            priority
          />
          <div className="sr-WebDashboardBrandMeta">
            <p className="sr-WebDashboardBrandEyebrow">{saintRockyBranding.companyName}</p>
            <p className="sr-WebDashboardBrandUser">
              {sessionUser?.displayName || sessionUser?.email || saintRockyBranding.shortProductName}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="sr-WebDashboardFooter">
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
