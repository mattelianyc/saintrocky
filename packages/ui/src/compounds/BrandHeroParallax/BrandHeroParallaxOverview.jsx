"use client";

import { LeaderboardWidget } from "../../widgets/LeaderboardWidget/LeaderboardWidget.jsx";
import { HERO_LEADERBOARD_SEED_ENTRIES } from "./brandHeroParallax.config.js";

export function BrandHeroParallaxOverview() {
  return (
    <div className="c-BrandHeroParallax__leaderboardReveal">
      <LeaderboardWidget
        variant="heroLight"
        limit={10}
        entries={HERO_LEADERBOARD_SEED_ENTRIES}
      />
    </div>
  );
}
