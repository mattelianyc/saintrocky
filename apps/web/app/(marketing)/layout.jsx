"use client";

import Link from "next/link";

import { Icon } from "@saintrocky/icons";
import { useAdaptiveCornerIconTone } from "@saintrocky/shared";

export default function MarketingLayout({ children }) {
  const { iconLinkReference, iconTone } = useAdaptiveCornerIconTone([
    "sr-MarketingHeader"
  ]);

  return (
    <div className="sr-MarketingShell">
      <header className="sr-MarketingHeader" aria-label="Landing page actions">
        <Link
          ref={iconLinkReference}
          href="/signin"
          className={`sr-CornerIconLink sr-CornerIconLink--topRight sr-CornerIconLink--${iconTone}`}
        >
          <Icon name="keyOutline" size={32} />
          <span className="srOnly">Sign in</span>
        </Link>
      </header>
      {children}
    </div>
  );
}
