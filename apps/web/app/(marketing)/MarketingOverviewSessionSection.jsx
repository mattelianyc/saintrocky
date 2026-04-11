"use client";

import { BrandHeroParallax } from "@saintrocky/ui/web";
import { useIsMobileViewport } from "@saintrocky/shared";

import { marketingLandingBrandPreview } from "./marketingBrandPreview.js";
import MobileHeroSection from "./MobileHeroSection.jsx";

export default function MarketingOverviewSessionSection() {
  const isMobileViewport = useIsMobileViewport();

  if (isMobileViewport == null) {
    return null;
  }

  if (isMobileViewport) {
    return <MobileHeroSection heroWordmark={marketingLandingBrandPreview.name} />;
  }

  return <BrandHeroParallax heroWordmark={marketingLandingBrandPreview.name} />;
}
