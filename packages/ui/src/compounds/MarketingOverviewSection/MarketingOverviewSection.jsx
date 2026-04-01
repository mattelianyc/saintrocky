"use client";

import Link from "next/link";

import { Icon } from "@saintrocky/icons";
import { saintRockyBranding } from "@saintrocky/branding";

import { Button } from "../../primitives/Button/Button.jsx";

export function MarketingOverviewSection({
  sectionId = "marketing-products-section",
  marketingOverview = saintRockyBranding.marketingOverview,
  actionHref = "/signup",
  actionLabel = "Join the network",
  isActionPending = false
}) {
  const {
    featureMatrix,
    supportedPlatforms,
    platformsSection,
    productModules,
    ethosSection
  } = saintRockyBranding;

  const { ecosystemPillars } = marketingOverview;

  return (
    <div className="c-MarketingOverviewSection">
      {/* Band 1 — Economics */}
      <section
        id={sectionId}
        className="c-MarketingOverviewSection__band c-MarketingOverviewSection__band--economics"
      >
        <div className="c-MarketingOverviewSection__inner c-MarketingOverviewSection__inner--centered">
          <p className="c-MarketingOverviewSection__eyebrow">
            {marketingOverview.eyebrow}
          </p>
          <h2 className="c-MarketingOverviewSection__heading">
            {marketingOverview.heading}
          </h2>
          <p className="c-MarketingOverviewSection__summary">
            {marketingOverview.summary}
          </p>
          <div className="c-MarketingOverviewSection__actionRow">
            {isActionPending ? (
              <Button disabled>{actionLabel}</Button>
            ) : (
              <Link href={actionHref}>
                <Button>{actionLabel}</Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Band 2 — Feature Matrix */}
      <section className="c-MarketingOverviewSection__band c-MarketingOverviewSection__band--features">
        <div className="c-MarketingOverviewSection__inner">
          <div className="c-MarketingOverviewSection__featureGrid">
            {featureMatrix.map((feature) => (
              <div key={feature.name} className="c-MarketingOverviewSection__featureCard">
                <div className="c-MarketingOverviewSection__featureIcon">
                  <Icon name={feature.icon} size={32} />
                </div>
                <h3 className="c-MarketingOverviewSection__featureTitle">
                  {feature.name}
                </h3>
                <p className="c-MarketingOverviewSection__featureSummary">
                  {feature.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Band 3 — Supported Platforms */}
      <section className="c-MarketingOverviewSection__band c-MarketingOverviewSection__band--platforms">
        <div className="c-MarketingOverviewSection__inner c-MarketingOverviewSection__inner--centered">
          <p className="c-MarketingOverviewSection__eyebrow">
            {platformsSection.eyebrow}
          </p>
          <h2 className="c-MarketingOverviewSection__heading">
            {platformsSection.heading}
          </h2>
          <div className="c-MarketingOverviewSection__platformRow">
            {supportedPlatforms.map((platform) => (
              <div key={platform.label} className="c-MarketingOverviewSection__platformBadge">
                <Icon name={platform.icon} size={28} />
                <span className="c-MarketingOverviewSection__platformLabel">
                  {platform.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Band 4 — Product Modules */}
      <section className="c-MarketingOverviewSection__band c-MarketingOverviewSection__band--modules">
        <div className="c-MarketingOverviewSection__inner">
          <p className="c-MarketingOverviewSection__eyebrow">
            The control plane
          </p>
          <h2 className="c-MarketingOverviewSection__subheading">
            Everything you need. Nothing you don't.
          </h2>
          <div className="c-MarketingOverviewSection__moduleGrid">
            {productModules.map((mod) => (
              <div key={mod.title} className="c-MarketingOverviewSection__moduleCard">
                <div className="c-MarketingOverviewSection__moduleIcon">
                  <Icon name={mod.icon} size={24} />
                </div>
                <h3 className="c-MarketingOverviewSection__moduleTitle">
                  {mod.title}
                </h3>
                <p className="c-MarketingOverviewSection__moduleSummary">
                  {mod.summary}
                </p>
              </div>
            ))}
          </div>
          <img
            src="/images/dawgfull.png"
            alt=""
            aria-hidden="true"
            className="c-MarketingOverviewSection__decorativeDog"
          />
        </div>
      </section>

      {/* Band 5 — Ecosystem / Community */}
      <section className="c-MarketingOverviewSection__band c-MarketingOverviewSection__band--ecosystem">
        <div className="c-MarketingOverviewSection__inner">
          <div className="c-MarketingOverviewSection__copyColumn">
            <p className="c-MarketingOverviewSection__eyebrow">
              Community layer
            </p>
            <h3 className="c-MarketingOverviewSection__subheading">
              Forum, enforcement, consequences.
            </h3>
            <p className="c-MarketingOverviewSection__summary">
              A sharp community, clear rules, and machine-enforced follow-through.
              No motivational poster energy.
            </p>
          </div>
          <div className="c-MarketingOverviewSection__pillarGrid">
            {ecosystemPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="c-MarketingOverviewSection__pillar"
              >
                <div className="c-MarketingOverviewSection__pillarIcon">
                  <Icon name={pillar.icon} size={28} />
                </div>
                <div className="c-MarketingOverviewSection__cardStack">
                  <h3>{pillar.title}</h3>
                  <p>{pillar.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Band 6 — Ethos */}
      <section className="c-MarketingOverviewSection__band c-MarketingOverviewSection__band--ethos">
        <div className="c-MarketingOverviewSection__inner c-MarketingOverviewSection__inner--centered">
          <p className="c-MarketingOverviewSection__eyebrow">
            {ethosSection.eyebrow}
          </p>
          <h2 className="c-MarketingOverviewSection__heading">
            {ethosSection.heading}
          </h2>
          <div className="c-MarketingOverviewSection__ethosBody">
            {ethosSection.bodyLines.map((line) => (
              <p key={line} className="c-MarketingOverviewSection__ethosLine">
                {line}
              </p>
            ))}
          </div>
          <img
            src="/images/paywalldog.png"
            alt=""
            aria-hidden="true"
            className="c-MarketingOverviewSection__ethosWatermark"
          />
        </div>
      </section>
    </div>
  );
}
