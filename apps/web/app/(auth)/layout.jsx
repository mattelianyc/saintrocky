"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@saintrocky/icons";
import { useAdaptiveCornerIconTone } from "@saintrocky/shared";

export default function AuthLayout({ children }) {
  const pathname = usePathname();
  const isSignInPage = pathname === "/signin";
  const { iconLinkReference, iconTone } = useAdaptiveCornerIconTone();

  return (
    <div className="sr-AuthShell">
      {isSignInPage ? (
        <Link
          ref={iconLinkReference}
          href="/"
          className={`sr-CornerIconLink sr-CornerIconLink--topLeft sr-CornerIconLink--${iconTone}`}
        >
          <Icon name="chevronLeft" size={32} />
          <span className="srOnly">Back to landing page</span>
        </Link>
      ) : (
        <Link
          ref={iconLinkReference}
          href="/signin"
          className={`sr-CornerIconLink sr-CornerIconLink--topLeft sr-CornerIconLink--${iconTone}`}
        >
          <Icon name="keyOutline" size={32} />
          <span className="srOnly">Go to sign in</span>
        </Link>
      )}
      {children}
    </div>
  );
}
