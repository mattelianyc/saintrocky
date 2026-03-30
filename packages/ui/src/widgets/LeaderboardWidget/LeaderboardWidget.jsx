"use client";

import { AnimatePresence, motion } from "framer-motion";

import { SlotCounter } from "./SlotCounter.jsx";
import { useLeaderboardStream } from "./useLeaderboardStream.js";

const ROW_ANIMATION = {
  initial: { opacity: 0, y: 18, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -18, filter: "blur(8px)" },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
};

function resolveDisplayName(entry) {
  return entry.displayName || "Anonymous";
}

function resolvePulseClass(index) {
  if (index === 0) return "is-hot";
  if (index >= 3) return "is-watch";
  return "";
}

function LeaderboardRow({ entry, index, variant }) {
  const isHero = variant === "hero";

  return (
    <motion.div
      layout
      className={`w-LeaderboardWidget__row ${resolvePulseClass(index)}`}
      {...ROW_ANIMATION}
      transition={{ ...ROW_ANIMATION.transition, delay: index * 0.05 }}
    >
      <span className="w-LeaderboardWidget__rank">#{entry.rank || index + 1}</span>
      <span className="w-LeaderboardWidget__trader">{resolveDisplayName(entry)}</span>
      <span className="w-LeaderboardWidget__score">{entry.disciplineScore ?? "—"}</span>
      <span className="w-LeaderboardWidget__streak">{entry.cleanStreak ?? 0}d</span>
      <span className="w-LeaderboardWidget__earnings">
        {isHero ? (
          <SlotCounter value={entry.earningsSol ?? 0} prefix="" suffix=" SOL" decimals={3} />
        ) : (
          `${(entry.earningsSol ?? 0).toFixed(3)} SOL`
        )}
      </span>
      <span className="w-LeaderboardWidget__staked">{(entry.lockedStakeSol ?? 0).toFixed(2)}</span>
    </motion.div>
  );
}

export function LeaderboardWidget({
  entries: initialEntries = [],
  limit = 10,
  variant = "hero",
  enableRealtime = true
}) {
  const { entries: streamEntries, connectionState } = useLeaderboardStream(
    enableRealtime ? initialEntries : []
  );

  const displayEntries = enableRealtime && streamEntries.length > 0
    ? streamEntries.slice(0, limit)
    : initialEntries.slice(0, limit);

  const isLive = enableRealtime && (connectionState === "connected" || streamEntries.length > 0);

  return (
    <div className={`w-LeaderboardWidget w-LeaderboardWidget--${variant}`}>
      <div className="w-LeaderboardWidget__header">
        <span className={`w-LeaderboardWidget__livePill ${isLive ? "is-live" : ""}`}>
          {isLive ? "Live" : "Loading"}
        </span>
        <span>Trader</span>
        <span>Score</span>
        <span>Streak</span>
        <span>Earned</span>
        <span>Staked</span>
      </div>

      <div className="w-LeaderboardWidget__rows">
        <AnimatePresence mode="popLayout" initial={false}>
          {displayEntries.map((entry, index) => (
            <LeaderboardRow
              key={entry.userId || entry.email || index}
              entry={entry}
              index={index}
              variant={variant}
            />
          ))}
        </AnimatePresence>

        {!displayEntries.length && (
          <div className="w-LeaderboardWidget__empty">
            <span>Leaderboard loading...</span>
          </div>
        )}
      </div>
    </div>
  );
}
