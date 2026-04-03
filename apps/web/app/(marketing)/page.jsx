import { saintRockyBranding } from "@saintrocky/branding";
import {
  BackgroundScrollTransition,
  BrandHeroReprisal
} from "@saintrocky/ui/web";

import MarketingOverviewSessionSection from "./MarketingOverviewSessionSection.jsx";
import MarketingOverviewContentSection from "./MarketingOverviewContentSection.jsx";
import { marketingLandingBrandPreview } from "./marketingBrandPreview.js";

export const metadata = {
  title: `${saintRockyBranding.companyName} | ${marketingLandingBrandPreview.name}`,
  description: marketingLandingBrandPreview.descriptionReplacement
};

export default function MarketingPage() {
  return (
    <main>
      <BackgroundScrollTransition />
      <MarketingOverviewSessionSection />
      <MarketingOverviewContentSection />
      <BrandHeroReprisal brandName={marketingLandingBrandPreview.name} />
    </main>
  );
}
