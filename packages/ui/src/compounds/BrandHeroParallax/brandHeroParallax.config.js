export const HERO_WORDMARK = "$TANDARD/DEVIANT$";
export const HERO_BACKGROUND_VIDEO_SRC = "/videos/bg.mp4";
export const HERO_REVEAL_DELAY_MS = 280;
export const HERO_MEDIA_SETTLE_DURATION = 2.4;
export const HERO_OVERLAY_REVEAL_DELAY = 0.16;
export const HERO_OVERLAY_REVEAL_DURATION = 2.2;
export const HERO_CONTENT_REVEAL_DURATION = 1.8;
export const HERO_CONTENT_REVEAL_DELAY = 0.38;
export const HERO_VIDEO_FADE_OUT_PROGRESS = 0.8;
export const HERO_CONTENT_BLUR_AMOUNT = 10;
export const HERO_OVERLAY_COVER_PROGRESS = 0.5;
export const HERO_OVERLAY_SOLID_START_PROGRESS = 0.16;
export const HERO_OVERLAY_SOLID_END_PROGRESS = 0.23;
export const HERO_BLACK_TRIANGLE_INITIAL_TIP_X_COVERAGE = -50;
export const HERO_BLACK_TRIANGLE_INITIAL_TIP_Y_COVERAGE = 25;
export const HERO_BLACK_PANEL_FINAL_SPLIT_COVERAGE = 50;
export const HERO_DOG_IMAGE_SRC = "/images/rocco-tall-logo.png";
export const HERO_TREE_IMAGE_SRC = "/images/flowerbg.png";
export const HERO_INTRO_LOGO_SRC = "/images/logoAlt_shorthand.webp";
export const HERO_INTRO_WORDMARK = "$TANDARD DEVIANT$";
export const HERO_DOG_REVEAL_START_PROGRESS = 0.78;
export const HERO_DOG_REVEAL_END_PROGRESS = 0.92;
export const HERO_TREE_REVEAL_START_PROGRESS = 0.12;
export const HERO_TREE_REVEAL_END_PROGRESS = 0.48;
export const HERO_INTRO_REVEAL_START_PROGRESS = 0.62;
export const HERO_INTRO_REVEAL_END_PROGRESS = 0.86;
export const HERO_INTRO_LINES = [
  "I was named after St. Roch, the patron saint of dogs, invalids, falsely accused people, bachelors, and several other things according to Wikipedia.  You can call me Rocco.",
  "When Wall St. refers to us as 'dumb money' it doesn't quite qualify as a false accusation, but that's neither here nor there...",
  "Stupidity is a spectrum and we're all on it.  I'm developed this platform to not to extract any more than my fair share.",
  "The way I see it, my share is only fair if user are benefiting.  As it stands, payment is entirely optional.",
  "In fact, those users exercisng discipline share in the profits from those who don't.  That's the way it should be.",
  "My assignment is simple: get you to honor the standards you set for yourself before you inevitably spiral into deviant behavior before you finish your first cup of coffee.",
];
export const HERO_INTRO_SIGNOFF_LINES = ["- Rocco"];
export const OUTRO_SCROLL_DISTANCE_FACTOR = 0.68;
export const REVENUE_SCROLL_EXTENSION_FACTOR = 0.62;
export const REVENUE_REVEAL_START = 1.0;
export const REVENUE_REVEAL_END = 1.5;
export const MINIMUM_OUTRO_LIFT_VIEWPORT_FACTOR = 0.62;
export const DECAY_RATE = 0.21;
export const BASE_LIFT_DISTANCE = 840;

export const REVENUE_MODEL_EYEBROW = "Built for degen traders who want guardrails";
export const REVENUE_MODEL_HEADING =
  "Write the rule. Stake the escrow. Get paid for discipline.";
export const REVENUE_MODEL_SUMMARY =
  "Set the rule. Overrides cost money from your on-chain escrow. Half the net gets paid back to the traders who keep it together.";
export const REVENUE_MODEL_PILLARS = [
  {
    title: "Escrow-backed enforcement",
    summary:
      "Stake SOL into your vault. Break your own rule, penalty gets deducted on-chain."
  },
  {
    title: "Discipline earns the rebate",
    summary:
      "The cleaner the behavior, the bigger the payout from the fee pool."
  },
  {
    title: "On-chain transparency",
    summary:
      "Every penalty and reward is verifiable on Solana. No trust required."
  }
];
export const REVENUE_MODEL_VALUE_PROPS = [
  "You only pay when you choose to override your own rules.",
  "Payment is always optional.",
  "50% of all override fees are redistributed to traders who stay disciplined."
];
export const REVENUE_MODEL_SIGNOFF = "- Saint Rocky";

export const HERO_LEADERBOARD_SEED_ENTRIES = [
  { rank: 1, displayName: "Harper Quinn", disciplineScore: 92, cleanStreak: 30, earningsSol: 5.572, lockedStakeSol: 3.28 },
  { rank: 2, displayName: "Soren Blake", disciplineScore: 85, cleanStreak: 14, earningsSol: 5.323, lockedStakeSol: 3.72 },
  { rank: 3, displayName: "Owen Mercer", disciplineScore: 84, cleanStreak: 14, earningsSol: 6.251, lockedStakeSol: 3.97 },
  { rank: 4, displayName: "Dahlia Stone", disciplineScore: 82, cleanStreak: 9, earningsSol: 5.280, lockedStakeSol: 4.16 },
  { rank: 5, displayName: "Rhea Banerjee", disciplineScore: 82, cleanStreak: 7, earningsSol: 5.206, lockedStakeSol: 4.00 },
  { rank: 6, displayName: "Bianca Lowe", disciplineScore: 81, cleanStreak: 14, earningsSol: 5.625, lockedStakeSol: 3.84 },
  { rank: 7, displayName: "Nina Delgado", disciplineScore: 81, cleanStreak: 13, earningsSol: 5.038, lockedStakeSol: 4.14 },
  { rank: 8, displayName: "Jonah Pierce", disciplineScore: 81, cleanStreak: 11, earningsSol: 4.978, lockedStakeSol: 4.10 },
  { rank: 9, displayName: "Alina Park", disciplineScore: 81, cleanStreak: 10, earningsSol: 4.169, lockedStakeSol: 2.87 },
  { rank: 10, displayName: "Victor Chen", disciplineScore: 81, cleanStreak: 7, earningsSol: 5.279, lockedStakeSol: 4.13 },
];

export const HERO_CHARACTER_EXIT_START = 0.06;
export const HERO_CHARACTER_EXIT_DURATION = 0.12;
export const HERO_CHARACTER_EXIT_STAGGER = 0.028;
export const HERO_CHARACTER_EXIT_DISTANCE = 1200;
export const HERO_CHARACTER_EXIT_BLUR = 20;
export const HERO_CHARACTER_FADE_RATE_FACTOR = 0.2;

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getMovementDistance(index) {
  const movementMultiplier = Math.exp(-DECAY_RATE * index);
  return BASE_LIFT_DISTANCE * movementMultiplier;
}
