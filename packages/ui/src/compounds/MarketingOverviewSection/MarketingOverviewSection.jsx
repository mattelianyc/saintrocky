"use client";

import Link from "next/link";

import { saintRockyBranding } from "@saintrocky/branding";

import { Button } from "../../primitives/Button/Button.jsx";
import { LeaderboardWidget } from "../../widgets/LeaderboardWidget/LeaderboardWidget.jsx";

export function MarketingOverviewSection({
  sectionId = "marketing-products-section",
  marketingOverview = saintRockyBranding.marketingOverview,
  actionHref = "/signup",
  actionLabel = "Join the network",
  isActionPending = false
}) {
  const { ecosystemPillars, leaderboard } = marketingOverview;

  return (
    <section id={sectionId} className="c-MarketingOverviewSection">
      <div className="c-MarketingOverviewSection__section c-MarketingOverviewSection__section--leaderboard">
        <div className="c-MarketingOverviewSection__inner c-MarketingOverviewSection__inner--leaderboard">
          <div className="c-MarketingOverviewSection__leaderboardCopy">
            <p className="c-MarketingOverviewSection__eyebrow">Realtime pressure</p>
            <h2 className="c-MarketingOverviewSection__heading">{leaderboard.title}</h2>
            <p className="c-MarketingOverviewSection__summary">{leaderboard.summary}</p>
            {leaderboard.valuePropLines?.length > 0 && (
              <ul className="c-MarketingOverviewSection__valuePropList">
                {leaderboard.valuePropLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          <LeaderboardWidget variant="hero" limit={10} />
        </div>
      </div>

      <div className="c-MarketingOverviewSection__section c-MarketingOverviewSection__section--economics">
        <div className="c-MarketingOverviewSection__inner">
          <div className="c-MarketingOverviewSection__copyColumn">
            <p className="c-MarketingOverviewSection__eyebrow">{marketingOverview.eyebrow}</p>
            <h2 className="c-MarketingOverviewSection__heading">{marketingOverview.heading}</h2>
            <p className="c-MarketingOverviewSection__summary">{marketingOverview.summary}</p>
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
        </div>
      </div>

      <div className="c-MarketingOverviewSection__section c-MarketingOverviewSection__section--ecosystem">
        <div className="c-MarketingOverviewSection__inner">
          <div className="c-MarketingOverviewSection__copyColumn">
            <p className="c-MarketingOverviewSection__eyebrow">Community layer</p>
            <h3 className="c-MarketingOverviewSection__subheading">Forum, enforcement, consequences.</h3>
            <p className="c-MarketingOverviewSection__summary">
              A sharp community, clear rules, and machine-enforced follow-through. No motivational poster energy.
            </p>
          </div>
          <div className="c-MarketingOverviewSection__pillarGrid">
            {ecosystemPillars.map((pillar) => (
              <article key={pillar.title} className="c-MarketingOverviewSection__pillar">
                <div className="c-MarketingOverviewSection__cardStack">
                  <p className="c-MarketingOverviewSection__label">Ecosystem</p>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
