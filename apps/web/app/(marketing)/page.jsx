import { saintRockyBranding } from "@saintrocky/branding";
import {
  BackgroundScrollTransition,
  BrandHeroReprisal
} from "@saintrocky/ui/web";

import MarketingOverviewSessionSection from "./MarketingOverviewSessionSection.jsx";
import MarketingOverviewContentSection from "./MarketingOverviewContentSection.jsx";

export const metadata = {
  title: `${saintRockyBranding.companyName} | ${saintRockyBranding.productName}`,
  description: saintRockyBranding.description
};

export default function MarketingPage() {
  return (
    <main>
      <BackgroundScrollTransition />
      <MarketingOverviewSessionSection />
      <MarketingOverviewContentSection />
      <BrandHeroReprisal />
    </main>
  );
}
