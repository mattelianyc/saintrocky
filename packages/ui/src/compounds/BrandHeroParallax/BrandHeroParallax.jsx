"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  HERO_WORDMARK,
  HERO_BACKGROUND_VIDEO_SRC,
  HERO_BLACK_PANEL_FINAL_SPLIT_COVERAGE,
  HERO_DOG_IMAGE_SRC,
  HERO_DOG_REVEAL_END_PROGRESS,
  HERO_INTRO_LINES,
  HERO_INTRO_REVEAL_END_PROGRESS,
  HERO_INTRO_REVEAL_START_PROGRESS,
  HERO_INTRO_SIGNOFF_LINES,
  HERO_BLACK_TRIANGLE_INITIAL_TIP_X_COVERAGE,
  HERO_BLACK_TRIANGLE_INITIAL_TIP_Y_COVERAGE,
  HERO_CHARACTER_EXIT_BLUR,
  HERO_CHARACTER_EXIT_DISTANCE,
  HERO_CHARACTER_EXIT_DURATION,
  HERO_CHARACTER_FADE_RATE_FACTOR,
  HERO_CHARACTER_EXIT_STAGGER,
  HERO_CHARACTER_EXIT_START,
  HERO_CONTENT_BLUR_AMOUNT,
  HERO_CONTENT_REVEAL_DELAY,
  HERO_CONTENT_REVEAL_DURATION,
  HERO_MEDIA_SETTLE_DURATION,
  HERO_OVERLAY_COVER_PROGRESS,
  HERO_REVEAL_DELAY_MS,
  OUTRO_SCROLL_DISTANCE_FACTOR,
  REVENUE_SCROLL_EXTENSION_FACTOR,
  REVENUE_REVEAL_START,
  REVENUE_REVEAL_END,
  REVENUE_MODEL_EYEBROW,
  REVENUE_MODEL_HEADING,
  REVENUE_MODEL_SUMMARY,
  REVENUE_MODEL_PILLARS,
  REVENUE_MODEL_VALUE_PROPS,
  REVENUE_MODEL_SIGNOFF,
  clamp
} from "./brandHeroParallax.config.js";
import { BrandHeroParallaxOverview } from "./BrandHeroParallaxOverview.jsx";
import { renderHeroIntroLine } from "./renderHeroIntroLine.jsx";

export function BrandHeroParallax({
  heroWordmark = HERO_WORDMARK,
  variant = "full",
  wordmarkOnlyOverlay = null
}) {
  const isWordmarkOnlyVariant = variant === "wordmarkOnly";
  const heroContainerReference = useRef(null);
  const heroMediaReference = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [isHeroRevealReady, setIsHeroRevealReady] = useState(Boolean(prefersReducedMotion));
  const brandWords = heroWordmark.split(" ");
  const compactWordmarkCharacters = heroWordmark.replaceAll(" ", "").split("");
  const leadingAccentCharacterIndex = compactWordmarkCharacters.indexOf("$");
  const trailingAccentCharacterIndex = compactWordmarkCharacters.lastIndexOf("$");
  const wordmarkFadeProgress = clamp(scrollProgress / 0.16, 0, 1);
  const wordmarkPanelOpacity = isHeroRevealReady ? 1 - wordmarkFadeProgress : 0;
  const loadOverlayOpacity = isWordmarkOnlyVariant ? 0 : isHeroRevealReady ? 1 - wordmarkFadeProgress : 1;
  const wordmarkTextBlendPercentage = Math.round(clamp(wordmarkFadeProgress * 100, 0, 100));
  const wordmarkPrimaryColor = `color-mix(in srgb, var(--ui-dark-fg) ${
    100 - wordmarkTextBlendPercentage
  }%, var(--ui-shell-text) ${wordmarkTextBlendPercentage}%)`;
  const stencilPanelOpacity = isWordmarkOnlyVariant ? 1 : isHeroRevealReady ? 1 : 0;

  function getCharacterClassName(innerClassName, character, index) {
    const classNames = [innerClassName];

    if (character === "$") {
      if (index === leadingAccentCharacterIndex) {
        classNames.push("c-BrandHeroParallax__characterInner--accentLeading");
      }

      if (index === trailingAccentCharacterIndex) {
        classNames.push("c-BrandHeroParallax__characterInner--accentTrailing");
      }
    }

    if (character === "/") {
      classNames.push("c-BrandHeroParallax__characterInner--divider");
    }

    return classNames.join(" ");
  }

  useEffect(() => {
    const heroMediaElement = heroMediaReference.current;

    if (isWordmarkOnlyVariant || prefersReducedMotion || !heroMediaElement) {
      setIsHeroRevealReady(true);
      return undefined;
    }

    function markHeroAsReady() {
      setIsHeroRevealReady(true);
    }

    if (heroMediaElement.readyState >= 2) {
      markHeroAsReady();
      return undefined;
    }

    const timeoutId = window.setTimeout(markHeroAsReady, HERO_REVEAL_DELAY_MS);
    heroMediaElement.addEventListener("loadeddata", markHeroAsReady, { once: true });
    heroMediaElement.addEventListener("error", markHeroAsReady, { once: true });

    return () => {
      window.clearTimeout(timeoutId);
      heroMediaElement.removeEventListener("loadeddata", markHeroAsReady);
      heroMediaElement.removeEventListener("error", markHeroAsReady);
    };
  }, [isWordmarkOnlyVariant, prefersReducedMotion]);

  useEffect(() => {
    function updateViewportDimensions() {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    }

    updateViewportDimensions();
    window.addEventListener("resize", updateViewportDimensions);
    return () => window.removeEventListener("resize", updateViewportDimensions);
  }, []);

  useEffect(() => {
    function updateProgress() {
      if (!heroContainerReference.current) {
        return;
      }

      const heroTopOffset = heroContainerReference.current.offsetTop;
      const scrollWithinHero = Math.max(window.scrollY - heroTopOffset, 0);
      const animationDistance = window.innerHeight * OUTRO_SCROLL_DISTANCE_FACTOR;
      setScrollProgress(Math.max(scrollWithinHero / animationDistance, 0));
    }

    let animationFrameId = null;
    function handleScrollOrResize() {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(updateProgress);
    }

    updateProgress();
    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, []);

  const shouldReduceMotion = Boolean(prefersReducedMotion);
  const isMobileViewport = viewportWidth < 640;
  const isTabletViewport = viewportWidth >= 640 && viewportWidth < 1024;
  const overlayCoverProgress = clamp(scrollProgress / HERO_OVERLAY_COVER_PROGRESS, 0, 1);
  const panelProgress = Math.sin((overlayCoverProgress * Math.PI) / 2);
  let blackPanelClipPath;

  if (isWordmarkOnlyVariant) {
    blackPanelClipPath = "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
  } else if (isMobileViewport) {
    const curtainY = panelProgress * 100;
    blackPanelClipPath = `polygon(0 0, 100% 0, 100% ${curtainY}%, 0 ${curtainY}%)`;
  } else if (isTabletViewport) {
    const edgeX = panelProgress * HERO_BLACK_PANEL_FINAL_SPLIT_COVERAGE;
    blackPanelClipPath = `polygon(0 0, ${edgeX}% 0, ${edgeX}% 100%, 0 100%)`;
  } else {
    const initialTipXCoverage = HERO_BLACK_TRIANGLE_INITIAL_TIP_X_COVERAGE;
    const initialTipYCoverage =
      viewportHeight < 900 ? 46 : HERO_BLACK_TRIANGLE_INITIAL_TIP_Y_COVERAGE;
    const topRightXCoverage =
      initialTipXCoverage +
      (HERO_BLACK_PANEL_FINAL_SPLIT_COVERAGE - initialTipXCoverage) * panelProgress;
    const topRightYCoverage = initialTipYCoverage * (1 - panelProgress);
    const bottomRightXCoverage =
      initialTipXCoverage +
      (HERO_BLACK_PANEL_FINAL_SPLIT_COVERAGE - initialTipXCoverage) * panelProgress;
    const bottomRightYCoverage =
      initialTipYCoverage + (100 - initialTipYCoverage) * panelProgress;
    blackPanelClipPath = `polygon(0 0, ${topRightXCoverage}% ${topRightYCoverage}%, ${bottomRightXCoverage}% ${bottomRightYCoverage}%, 0 100%)`;
  }
  const introRevealProgress = shouldReduceMotion
    ? 1
    : clamp(
        (panelProgress - HERO_INTRO_REVEAL_START_PROGRESS) /
          (HERO_INTRO_REVEAL_END_PROGRESS - HERO_INTRO_REVEAL_START_PROGRESS),
        0,
        1
      );
  const wordmarkOnlyOverlayProgress = isWordmarkOnlyVariant
    ? shouldReduceMotion
      ? 1
      : clamp((scrollProgress - 0.08) / 0.16, 0, 1)
    : 0;
  const roccoWalkProgress = shouldReduceMotion
    ? 1
    : clamp((panelProgress - 0.28) / (0.62 - 0.28), 0, 1);
  const isRoccoWalking = !shouldReduceMotion && roccoWalkProgress > 0 && roccoWalkProgress < 1;
  const overviewRevealProgress = isWordmarkOnlyVariant
    ? 0
    : shouldReduceMotion ? 1 : clamp((scrollProgress - 0.68) / 0.32, 0, 1);
  const shouldPrioritizeIntroLayer =
    !isWordmarkOnlyVariant && introRevealProgress > 0.12 && overviewRevealProgress < 0.08;
  const cornerIconTone = isWordmarkOnlyVariant
    ? "dark"
    : introRevealProgress > 0.08 && overviewRevealProgress < 0.45
      ? "light"
      : "dark";
  const heroVideoOpacity = isWordmarkOnlyVariant ? 0 : shouldReduceMotion ? 1 : 1 - overviewRevealProgress;
  const introMediaVeilOpacity = isWordmarkOnlyVariant
    ? 0
    : shouldReduceMotion
      ? 0.22
      : clamp(0.08 + introRevealProgress * 0.22 - overviewRevealProgress * 0.3, 0, 0.3);

  let overviewDoorClipPath;

  if (isMobileViewport) {
    if (overviewRevealProgress <= 0.5) {
      const closingPhase = overviewRevealProgress / 0.5;
      const coverY = closingPhase * 100;
      overviewDoorClipPath = `polygon(0 0, 100% 0, 100% ${coverY}%, 0 ${coverY}%)`;
    } else {
      const openingPhase = (overviewRevealProgress - 0.5) / 0.5;
      const revealStartY = openingPhase * 100;
      overviewDoorClipPath = `polygon(0 ${revealStartY}%, 100% ${revealStartY}%, 100% 100%, 0 100%)`;
    }
  } else {
    const doorTipY = HERO_BLACK_TRIANGLE_INITIAL_TIP_Y_COVERAGE;

    if (overviewRevealProgress <= 0.5) {
      const closingPhase = overviewRevealProgress / 0.5;
      const freeX = closingPhase * 50;
      const topY = doorTipY * closingPhase;
      const bottomY = 100 - doorTipY * closingPhase;
      overviewDoorClipPath = `polygon(${freeX}% ${topY}%, 50% 0%, 50% 100%, ${freeX}% ${bottomY}%)`;
    } else {
      const openingPhase = (overviewRevealProgress - 0.5) / 0.5;
      const freeX = 50 + openingPhase * 50;
      const topY = doorTipY * (1 - openingPhase);
      const bottomY = 100 - doorTipY * (1 - openingPhase);
      overviewDoorClipPath = `polygon(50% 0%, ${freeX}% ${topY}%, ${freeX}% ${bottomY}%, 50% 100%)`;
    }
  }

  const revenueRevealProgress = shouldReduceMotion
    ? 1
    : clamp(
        (scrollProgress - REVENUE_REVEAL_START) /
          (REVENUE_REVEAL_END - REVENUE_REVEAL_START),
        0,
        1
      );

  const totalRevenueItems =
    1 + 1 + REVENUE_MODEL_PILLARS.length + REVENUE_MODEL_VALUE_PROPS.length + 1;

  function getRevenueItemMotion(index) {
    if (shouldReduceMotion) {
      return { opacity: 1, y: 0, filter: "blur(0px)" };
    }

    const itemWindow = 1 / Math.max(totalRevenueItems, 1);
    const enterStart = index * itemWindow * 0.65;
    const enterEnd = enterStart + itemWindow * 1.8;
    const itemProgress = clamp(
      (revenueRevealProgress - enterStart) / (enterEnd - enterStart),
      0,
      1
    );

    return {
      opacity: itemProgress,
      y: (1 - itemProgress) * 24,
      filter: `blur(${(1 - itemProgress) * 5}px)`
    };
  }

  function getIntroLineMotion(index) {
    if (shouldReduceMotion) {
      return {
        opacity: 1,
        y: 0,
        filter: "blur(0px)"
      };
    }

    const totalIntroLines = HERO_INTRO_LINES.length + HERO_INTRO_SIGNOFF_LINES.length;
    const sequenceWindow = HERO_DOG_REVEAL_END_PROGRESS - HERO_INTRO_REVEAL_START_PROGRESS;
    const lineWindow = sequenceWindow / Math.max(totalIntroLines, 1);
    const enterStart = HERO_INTRO_REVEAL_START_PROGRESS + index * lineWindow;
    const enterEnd = enterStart + lineWindow * 0.92;
    const enterProgress = clamp((panelProgress - enterStart) / (enterEnd - enterStart), 0, 1);

    return {
      opacity: enterProgress,
      y: (1 - enterProgress) * 24,
      filter: `blur(${(1 - enterProgress) * 10}px)`
    };
  }

  function renderWordmarkCharacters(innerClassName) {
    let characterIndex = 0;

    return brandWords.map((word, wordIndex) => {
      const wordCharacters = word.split("").map((character) => {
        const index = characterIndex;
        characterIndex += 1;

        const exitStart = HERO_CHARACTER_EXIT_START + index * HERO_CHARACTER_EXIT_STAGGER;
        const exitEnd = exitStart + HERO_CHARACTER_EXIT_DURATION;
        const exitProgress = shouldReduceMotion
          ? scrollProgress
          : clamp((scrollProgress - exitStart) / (exitEnd - exitStart), 0, 1);

        return (
          <motion.span
            key={`${innerClassName}-${character}-${index}`}
            className="c-BrandHeroParallax__characterOuter"
            animate={{
              y: -exitProgress * HERO_CHARACTER_EXIT_DISTANCE,
              opacity: Math.max(1 - exitProgress * HERO_CHARACTER_FADE_RATE_FACTOR, 0),
              filter: `blur(${exitProgress * HERO_CHARACTER_EXIT_BLUR}px)`
            }}
            transition={{ duration: 0.08, ease: "linear" }}
          >
            <span className={getCharacterClassName(innerClassName, character, index)}>{character}</span>
          </motion.span>
        );
      });

      return (
        <span key={`${innerClassName}-word-${wordIndex}`} className="c-BrandHeroParallax__word">
          {wordCharacters}
        </span>
      );
    });
  }

  return (
    <div
      ref={heroContainerReference}
      id="marketing-hero-section"
      data-corner-icon-tone={cornerIconTone}
      className={`c-BrandHeroParallax ${isHeroRevealReady ? "c-BrandHeroParallax--heroRevealReady" : ""} ${isWordmarkOnlyVariant ? "c-BrandHeroParallax--wordmarkOnly" : ""}`}
    >
      <div className="c-BrandHeroParallax__viewport">
        <section className="c-BrandHeroParallax__section" aria-label={`${heroWordmark} hero`}>
          {!isWordmarkOnlyVariant && (
            <div className="c-BrandHeroParallax__media" aria-hidden="true">
              <motion.video
                ref={heroMediaReference}
                className="c-BrandHeroParallax__mediaVideo"
                src={HERO_BACKGROUND_VIDEO_SRC}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                initial={shouldReduceMotion ? false : { scale: 1.06, filter: "blur(0px)" }}
                animate={
                  shouldReduceMotion
                    ? { opacity: heroVideoOpacity }
                    : {
                        opacity: heroVideoOpacity,
                        scale: isHeroRevealReady ? 1 : 1.06,
                        filter: "blur(0px)"
                      }
                }
                transition={{
                  opacity: { duration: 0.18, ease: "linear" },
                  scale: {
                    duration: shouldReduceMotion ? 0 : HERO_MEDIA_SETTLE_DURATION,
                    ease: [0.16, 1, 0.3, 1]
                  }
                }}
              />
            </div>
          )}

          {!isWordmarkOnlyVariant && (
            <motion.div
              aria-hidden="true"
              className="c-BrandHeroParallax__loadOverlay"
              initial={false}
              animate={{ opacity: loadOverlayOpacity }}
              transition={{ duration: shouldReduceMotion ? 0.12 : 0.16, ease: "linear" }}
            />
          )}

          {!isWordmarkOnlyVariant && (
            <motion.div
              aria-hidden="true"
              className="c-BrandHeroParallax__introMediaVeil"
              initial={false}
              animate={{ opacity: introMediaVeilOpacity }}
              transition={{ duration: 0.18, ease: "linear" }}
            />
          )}

          {!isWordmarkOnlyVariant && (
            <motion.div
              aria-hidden="true"
              className={`c-BrandHeroParallax__introDog ${isRoccoWalking ? "c-BrandHeroParallax__introDog--walking" : ""}`}
              initial={false}
              animate={
                shouldReduceMotion
                  ? { opacity: 1, x: 0, y: 0, scaleX: -1 }
                  : {
                      opacity: clamp(roccoWalkProgress / 0.15, 0, 1),
                      x: `${(1 - roccoWalkProgress) * 120}%`,
                      y: `${(1 - roccoWalkProgress) * 2}%`,
                      scaleX: -1
                    }
              }
              transition={{ duration: 0.08, ease: "linear" }}
            >
              <img
                src={HERO_DOG_IMAGE_SRC}
                alt=""
                aria-hidden="true"
                className="c-BrandHeroParallax__introDogImage"
              />
            </motion.div>
          )}

          {isWordmarkOnlyVariant && (
            <>
              <div
                aria-hidden="true"
                className="c-BrandHeroParallax__wordmarkOnlyDog"
              >
                <img
                  src={HERO_DOG_IMAGE_SRC}
                  alt=""
                  className="c-BrandHeroParallax__wordmarkOnlyDogImage"
                />
              </div>
              <div
                aria-hidden="true"
                className="c-BrandHeroParallax__wordmarkOnlyScrim"
              />
            </>
          )}

          <div className="c-BrandHeroParallax__wordmarkFrame">
            <motion.div
              className="c-BrandHeroParallax__contentPanel"
              initial={
                shouldReduceMotion
                  ? false
                  : { opacity: 0, y: 28, filter: `blur(${HERO_CONTENT_BLUR_AMOUNT}px)` }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: wordmarkPanelOpacity }
                  : {
                      opacity: wordmarkPanelOpacity,
                      y: isHeroRevealReady ? 0 : 28,
                      filter: isHeroRevealReady ? "blur(0px)" : `blur(${HERO_CONTENT_BLUR_AMOUNT}px)`
                    }
              }
              transition={{
                opacity: {
                  duration: shouldReduceMotion ? 0.2 : HERO_CONTENT_REVEAL_DURATION,
                  delay: shouldReduceMotion ? 0 : HERO_CONTENT_REVEAL_DELAY,
                  ease: [0.16, 1, 0.3, 1]
                },
                y: {
                  duration: shouldReduceMotion ? 0 : HERO_CONTENT_REVEAL_DURATION,
                  delay: shouldReduceMotion ? 0 : HERO_CONTENT_REVEAL_DELAY,
                  ease: [0.16, 1, 0.3, 1]
                },
                filter: {
                  duration: shouldReduceMotion ? 0 : HERO_CONTENT_REVEAL_DURATION,
                  delay: shouldReduceMotion ? 0 : HERO_CONTENT_REVEAL_DELAY,
                  ease: [0.16, 1, 0.3, 1]
                }
              }}
            >
              <h1
                aria-label={heroWordmark}
                className="c-BrandHeroParallax__wordmark c-BrandHeroParallax__wordmarkPrimary"
                style={{ color: wordmarkPrimaryColor }}
              >
                {renderWordmarkCharacters("c-BrandHeroParallax__characterInner")}
              </h1>
            </motion.div>

            <motion.div
              aria-hidden="true"
              className="c-BrandHeroParallax__stencilPanel"
              initial={
                shouldReduceMotion
                  ? false
                  : { opacity: 0, y: 28, filter: `blur(${HERO_CONTENT_BLUR_AMOUNT}px)` }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: stencilPanelOpacity, clipPath: blackPanelClipPath }
                  : {
                      opacity: stencilPanelOpacity,
                      y: isHeroRevealReady ? 0 : 28,
                      filter: isHeroRevealReady ? "blur(0px)" : `blur(${HERO_CONTENT_BLUR_AMOUNT}px)`,
                      clipPath: blackPanelClipPath
                    }
              }
              transition={{
                opacity: {
                  duration: shouldReduceMotion ? 0.2 : HERO_CONTENT_REVEAL_DURATION,
                  delay: shouldReduceMotion ? 0 : HERO_CONTENT_REVEAL_DELAY,
                  ease: [0.16, 1, 0.3, 1]
                },
                y: {
                  duration: shouldReduceMotion ? 0 : HERO_CONTENT_REVEAL_DURATION,
                  delay: shouldReduceMotion ? 0 : HERO_CONTENT_REVEAL_DELAY,
                  ease: [0.16, 1, 0.3, 1]
                },
                filter: {
                  duration: shouldReduceMotion ? 0 : HERO_CONTENT_REVEAL_DURATION,
                  delay: shouldReduceMotion ? 0 : HERO_CONTENT_REVEAL_DELAY,
                  ease: [0.16, 1, 0.3, 1]
                },
                clipPath: { duration: 0.08, ease: "linear" }
              }}
            >
              {!isWordmarkOnlyVariant && (
                <motion.div
                  className="c-BrandHeroParallax__intro"
                  initial={false}
                  style={{
                    zIndex: shouldPrioritizeIntroLayer ? 6 : 3,
                    pointerEvents: introRevealProgress > 0.02 ? "auto" : "none"
                  }}
                  animate={{
                    opacity: introRevealProgress,
                    y: `${(1 - introRevealProgress) * 24}px`,
                    filter: `blur(${(1 - introRevealProgress) * 8}px)`
                  }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="c-BrandHeroParallax__introEyebrow">DUMB MONEY IS STILL LEGAL TENDER</p>
                  <motion.div
                    className="c-BrandHeroParallax__introBrandStack"
                    initial={false}
                    animate={{
                      opacity: introRevealProgress,
                      y: (1 - introRevealProgress) * 18,
                      filter: `blur(${(1 - introRevealProgress) * 6}px)`
                    }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  >
                  </motion.div>
                  {HERO_INTRO_LINES.map((line, index) => (
                    <motion.p
                      key={line}
                      className="c-BrandHeroParallax__introLine"
                      initial={false}
                      animate={getIntroLineMotion(index)}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {renderHeroIntroLine(line)}
                    </motion.p>
                  ))}
                  <div className="c-BrandHeroParallax__introSignoff">
                    {HERO_INTRO_SIGNOFF_LINES.map((line, index) => (
                      <motion.p
                        key={line}
                        className="c-BrandHeroParallax__introSignoffLine"
                        initial={false}
                        animate={getIntroLineMotion(HERO_INTRO_LINES.length + index)}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {line}
                      </motion.p>
                    ))}
                  </div>
                </motion.div>
              )}
              {isWordmarkOnlyVariant && wordmarkOnlyOverlay ? (
                <motion.div
                  className="c-BrandHeroParallax__wordmarkOnlyOverlay"
                  initial={false}
                  animate={{
                    opacity: wordmarkOnlyOverlayProgress,
                    y: `${(1 - wordmarkOnlyOverlayProgress) * 18}px`,
                    filter: `blur(${(1 - wordmarkOnlyOverlayProgress) * 8}px)`
                  }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  {wordmarkOnlyOverlay}
                </motion.div>
              ) : null}
              <h1 className="c-BrandHeroParallax__wordmark c-BrandHeroParallax__wordmarkStencil">
                {renderWordmarkCharacters("c-BrandHeroParallax__characterInner")}
              </h1>
            </motion.div>
          </div>

          {!isWordmarkOnlyVariant && (
            <motion.div
              className="c-BrandHeroParallax__overviewScene"
              initial={false}
              style={{
                zIndex: shouldPrioritizeIntroLayer ? 4 : 6
              }}
              animate={{ opacity: overviewRevealProgress }}
              transition={{ duration: 0.12, ease: "linear" }}
            >
              <motion.div
                aria-hidden="true"
                className="c-BrandHeroParallax__overviewDoor"
                initial={false}
                animate={{
                  clipPath: shouldReduceMotion
                    ? isMobileViewport
                      ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
                      : "polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)"
                    : overviewDoorClipPath
                }}
                transition={{ duration: 0.08, ease: "linear" }}
              />
              <BrandHeroParallaxOverview />

              <motion.div
                className="c-BrandHeroParallax__revenueModel"
                initial={false}
                animate={{
                  opacity: shouldReduceMotion ? 1 : revenueRevealProgress
                }}
                transition={{ duration: 0.12, ease: "linear" }}
              >
                <motion.p
                  className="c-BrandHeroParallax__revenueEyebrow"
                  initial={false}
                  animate={getRevenueItemMotion(0)}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {REVENUE_MODEL_EYEBROW}
                </motion.p>

                <motion.h2
                  className="c-BrandHeroParallax__revenueHeading"
                  initial={false}
                  animate={getRevenueItemMotion(1)}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {REVENUE_MODEL_HEADING}
                </motion.h2>

                <motion.p
                  className="c-BrandHeroParallax__revenueSummary"
                  initial={false}
                  animate={getRevenueItemMotion(2)}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {REVENUE_MODEL_SUMMARY}
                </motion.p>

                <div className="c-BrandHeroParallax__revenuePillars">
                  {REVENUE_MODEL_PILLARS.map((pillar, index) => (
                    <motion.div
                      key={pillar.title}
                      className="c-BrandHeroParallax__revenuePillar"
                      initial={false}
                      animate={getRevenueItemMotion(3 + index)}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <h4 className="c-BrandHeroParallax__revenuePillarTitle">
                        {pillar.title}
                      </h4>
                      <p className="c-BrandHeroParallax__revenuePillarSummary">
                        {pillar.summary}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <motion.ul
                  className="c-BrandHeroParallax__revenueValueProps"
                  initial={false}
                  animate={getRevenueItemMotion(
                    3 + REVENUE_MODEL_PILLARS.length
                  )}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {REVENUE_MODEL_VALUE_PROPS.map((line) => (
                    <li key={line} className="c-BrandHeroParallax__revenueValueProp">
                      {line}
                    </li>
                  ))}
                </motion.ul>

                <motion.p
                  className="c-BrandHeroParallax__revenueSignoff"
                  initial={false}
                  animate={getRevenueItemMotion(totalRevenueItems - 1)}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {REVENUE_MODEL_SIGNOFF}
                </motion.p>
              </motion.div>
            </motion.div>
          )}

        </section>
      </div>
      <div
        className="c-BrandHeroParallax__scrollSpacer"
        aria-hidden="true"
        style={{
          height: isWordmarkOnlyVariant
            ? `${OUTRO_SCROLL_DISTANCE_FACTOR * 100}vh`
            : `${(OUTRO_SCROLL_DISTANCE_FACTOR + REVENUE_SCROLL_EXTENSION_FACTOR) * 100}vh`
        }}
      />
    </div>
  );
}
