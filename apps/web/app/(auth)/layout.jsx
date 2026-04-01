"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@saintrocky/icons";

export default function AuthLayout({ children }) {
  const pathname = usePathname();
  const isSignInPage = pathname === "/signin";

  return (
    <div className="sr-AuthShell">
      {isSignInPage ? (
        <Link href="/" className="sr-CornerIconLink sr-CornerIconLink--topLeft">
          <Icon name="chevronLeft" size={32} />
          <span className="srOnly">Back to landing page</span>
        </Link>
      ) : (
        <Link href="/signin" className="sr-CornerIconLink sr-CornerIconLink--topLeft">
          <Icon name="key" size={32} />
          <span className="srOnly">Go to sign in</span>
        </Link>
      )}
      {children}
    </div>
  );
}
