"use client";

import { BrandHeroParallax } from "@saintrocky/ui/web";
import { marketingLandingBrandPreview } from "./marketingBrandPreview.js";

export default function MarketingOverviewSessionSection() {
  return <BrandHeroParallax heroWordmark={marketingLandingBrandPreview.name} />;
}
