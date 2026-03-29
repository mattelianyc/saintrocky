"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { saintRockyBranding } from "@saintrocky/branding";

import { Button } from '../../primitives/Button/Button.jsx';

export function MarketingOverviewSection({
  sectionId = "marketing-products-section",
  marketingOverview = saintRockyBranding.marketingOverview,
  actionHref = "/signup",
  actionLabel = "Join the network",
  isActionPending = false
}) {
  const { corePillars, ecosystemPillars, leaderboard } = marketingOverview;
  const leaderboardFrames = useMemo(() => {
    const items = leaderboard.items;

    return [
      [items[0], items[1], items[2]],
      [items[0], items[2], items[1]],
      [items[1], items[0], items[2]],
      [items[0], items[1], items[2]]
    ].map((frameItems, frameIndex) =>
      frameItems.map((item, index) => ({
        ...item,
        rankLabel: item.visibility === "Private" ? "HIDDEN" : `#${index + 1}`,
        liveScore: item.disciplineScore - frameIndex + (index === 0 ? 0 : -index),
        pulse: index === 0 ? "hot" : index === 1 ? "steady" : "watch"
      }))
    );
  }, [leaderboard.items]);
  const [leaderboardFrameIndex, setLeaderboardFrameIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLeaderboardFrameIndex((currentIndex) => (currentIndex + 1) % leaderboardFrames.length);
    }, 2200);

    return () => window.clearInterval(intervalId);
  }, [leaderboardFrames.length]);

  const liveEntries = leaderboardFrames[leaderboardFrameIndex];

  return (
    <section id={sectionId} className="c-MarketingOverviewSection">
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
          {/* <div className="c-MarketingOverviewSection__pillarGrid">
            {corePillars.map((pillar) => (
              <article key={pillar.title} className="c-MarketingOverviewSection__pillar">
                <div className="c-MarketingOverviewSection__cardStack">
                  <p className="c-MarketingOverviewSection__label">Economics</p>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.summary}</p>
                </div>
              </article>
            ))}
          </div> */}
        </div>
      </div>

      <div className="c-MarketingOverviewSection__section c-MarketingOverviewSection__section--leaderboard">
        <div className="c-MarketingOverviewSection__inner c-MarketingOverviewSection__inner--leaderboard">
          <div className="c-MarketingOverviewSection__leaderboardCopy">
            <p className="c-MarketingOverviewSection__eyebrow">Realtime pressure</p>
            <h3 className="c-MarketingOverviewSection__subheading">{leaderboard.title}</h3>
            <p className="c-MarketingOverviewSection__summary">{leaderboard.summary}</p>
          </div>
          <div className="c-MarketingOverviewSection__leaderboardCard" aria-live="polite">
            <div className="c-MarketingOverviewSection__leaderboardHeader">
              <span className="c-MarketingOverviewSection__livePill">Live</span>
              <span>Trader</span>
              <span>Visibility</span>
              <span>Payout</span>
              <span>Score</span>
            </div>
            <div className="c-MarketingOverviewSection__leaderboardRows">
              <AnimatePresence mode="popLayout" initial={false}>
                {liveEntries.map((entry) => (
                  <motion.div
                    key={`${leaderboardFrameIndex}-${entry.displayName}`}
                    layout
                    initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -18, filter: "blur(8px)" }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className={`c-MarketingOverviewSection__leaderboardRow is-${entry.pulse}`}
                  >
                    <span className="c-MarketingOverviewSection__rank">{entry.rankLabel}</span>
                    <div className="c-MarketingOverviewSection__leaderboardIdentity">
                      <span>{entry.displayName}</span>
                    </div>
                    <span>{entry.visibility}</span>
                    <span>{entry.dividend}</span>
                    <span className="c-MarketingOverviewSection__leaderboardScore">{entry.liveScore}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
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
