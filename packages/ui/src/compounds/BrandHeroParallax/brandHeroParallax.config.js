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
export const HERO_DOG_IMAGE_SRC = "/images/dawgfull.png";
export const HERO_TREE_IMAGE_SRC = "/images/flowerbg.png";
export const HERO_INTRO_LOGO_SRC = "/images/logoAlt_shorthand.webp";
export const HERO_INTRO_WORDMARK = "$TANDARD DEVIANT$";
export const HERO_DOG_REVEAL_START_PROGRESS = 0.88;
export const HERO_DOG_REVEAL_END_PROGRESS = 1;
export const HERO_TREE_REVEAL_START_PROGRESS = 0.12;
export const HERO_TREE_REVEAL_END_PROGRESS = 0.48;
export const HERO_INTRO_REVEAL_START_PROGRESS = 0.62;
export const HERO_INTRO_REVEAL_END_PROGRESS = 0.86;
export const HERO_INTRO_LINES = [
  "I'm the patron saint of dawgs, invalids, falsely accused people, bachelors, and several other things according to Wikipedia.",
  "When Wall St. refers to us as 'dumb money' it doesn't quite qualify as a false accusation, but that's neither here nor there...",
  "I'm here to help those interested in helping themselves keep their hard-earned 'dumb money' because it's still legal tender",
  "My assignment is simple: get you to honor the standards you set for yourself before you inevitably spiral into deviant behavior before you finish your first cup of coffee.",
];
export const HERO_INTRO_SIGNOFF_LINES = ["- Saint Rocky"];
export const OUTRO_SCROLL_DISTANCE_FACTOR = 0.68;
export const MINIMUM_OUTRO_LIFT_VIEWPORT_FACTOR = 0.62;
export const DECAY_RATE = 0.21;
export const BASE_LIFT_DISTANCE = 840;
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
