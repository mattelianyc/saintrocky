"use client";

import Link from "next/link";

import { Icon } from "@saintrocky/icons";

export default function MarketingLayout({ children }) {
  return (
    <div className="sr-MarketingShell">
      <header className="sr-MarketingHeader" aria-label="Landing page actions">
        <Link href="/signin" className="sr-CornerIconLink sr-CornerIconLink--topRight">
          <Icon name="key" size={32} />
          <span className="srOnly">Sign in</span>
        </Link>
      </header>
      {children}
    </div>
  );
}
