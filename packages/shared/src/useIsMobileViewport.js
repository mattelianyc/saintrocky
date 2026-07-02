"use client";

import { useEffect, useState } from "react";

const DEFAULT_MAXIMUM_MOBILE_WIDTH = 767;

function resolveIsMobileViewport(maximumMobileWidth) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth <= maximumMobileWidth;
}

export function useIsMobileViewport(
  maximumMobileWidth = DEFAULT_MAXIMUM_MOBILE_WIDTH
) {
  const [isMobileViewport, setIsMobileViewport] = useState(null);

  useEffect(() => {
    function handleViewportResize() {
      setIsMobileViewport(resolveIsMobileViewport(maximumMobileWidth));
    }

    handleViewportResize();
    window.addEventListener("resize", handleViewportResize);

    return () => {
      window.removeEventListener("resize", handleViewportResize);
    };
  }, [maximumMobileWidth]);

  return isMobileViewport;
}
