import { saintRockyBranding } from "@saintrocky/branding";
import {
  BackgroundScrollTransition,
  BrandHeroParallax,
  BrandHeroReprisal
} from "@saintrocky/ui/web";

import MarketingOverviewSessionSection from "./MarketingOverviewSessionSection.jsx";

export const metadata = {
  title: `${saintRockyBranding.companyName} | ${saintRockyBranding.productName}`,
  description: saintRockyBranding.description
};

export default function MarketingPage() {
  return (
    <main>
      <BackgroundScrollTransition />
      <BrandHeroParallax />
      <MarketingOverviewSessionSection />
      <BrandHeroReprisal />
    </main>
  );
}
