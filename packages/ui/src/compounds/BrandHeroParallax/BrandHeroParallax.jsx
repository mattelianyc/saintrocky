"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  HERO_WORDMARK,
  HERO_BACKGROUND_VIDEO_SRC,
  HERO_BLACK_PANEL_FINAL_SPLIT_COVERAGE,
  HERO_DOG_IMAGE_SRC,
  HERO_DOG_REVEAL_END_PROGRESS,
  HERO_DOG_REVEAL_START_PROGRESS,
  HERO_TREE_IMAGE_SRC,
  HERO_TREE_REVEAL_END_PROGRESS,
  HERO_TREE_REVEAL_START_PROGRESS,
  HERO_INTRO_LINES,
  HERO_INTRO_LOGO_SRC,
  HERO_INTRO_REVEAL_END_PROGRESS,
  HERO_INTRO_REVEAL_START_PROGRESS,
  HERO_INTRO_SIGNOFF_LINES,
  HERO_INTRO_WORDMARK,
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
  HERO_VIDEO_FADE_OUT_PROGRESS,
  OUTRO_SCROLL_DISTANCE_FACTOR,
  clamp
} from "./brandHeroParallax.config.js";

export function BrandHeroParallax() {
  const heroContainerReference = useRef(null);
  const heroMediaReference = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [viewportHeight, setViewportHeight] = useState(900);
  const [isHeroRevealReady, setIsHeroRevealReady] = useState(Boolean(prefersReducedMotion));
  const brandWords = HERO_WORDMARK.split(" ");

  useEffect(() => {
    const heroMediaElement = heroMediaReference.current;

    if (prefersReducedMotion || !heroMediaElement) {
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
  }, [prefersReducedMotion]);

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
      setScrollProgress(clamp(scrollWithinHero / animationDistance, 0, 1));
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
  const heroVideoOpacity = 1 - clamp(scrollProgress / HERO_VIDEO_FADE_OUT_PROGRESS, 0, 1);
  const overlayCoverProgress = clamp(scrollProgress / HERO_OVERLAY_COVER_PROGRESS, 0, 1);
  const panelProgress = Math.sin((overlayCoverProgress * Math.PI) / 2);
  const initialTipXCoverage =
    viewportWidth < 1024 ? 20 : HERO_BLACK_TRIANGLE_INITIAL_TIP_X_COVERAGE;
  const initialTipYCoverage =
    viewportHeight < 900 ? 46 : HERO_BLACK_TRIANGLE_INITIAL_TIP_Y_COVERAGE;
  const topRightXCoverage =
    initialTipXCoverage + (HERO_BLACK_PANEL_FINAL_SPLIT_COVERAGE - initialTipXCoverage) * panelProgress;
  const topRightYCoverage = initialTipYCoverage * (1 - panelProgress);
  const bottomRightXCoverage =
    initialTipXCoverage + (HERO_BLACK_PANEL_FINAL_SPLIT_COVERAGE - initialTipXCoverage) * panelProgress;
  const bottomRightYCoverage =
    initialTipYCoverage + (100 - initialTipYCoverage) * panelProgress;
  const blackPanelClipPath = `polygon(0 0, ${topRightXCoverage}% ${topRightYCoverage}%, ${bottomRightXCoverage}% ${bottomRightYCoverage}%, 0 100%)`;
  const dogRevealProgress = shouldReduceMotion
    ? 1
    : clamp(
        (panelProgress - HERO_DOG_REVEAL_START_PROGRESS) /
          (HERO_DOG_REVEAL_END_PROGRESS - HERO_DOG_REVEAL_START_PROGRESS),
        0,
        1
      );
  const treeRevealProgress = shouldReduceMotion
    ? 1
    : clamp(
        (panelProgress - HERO_TREE_REVEAL_START_PROGRESS) /
          (HERO_TREE_REVEAL_END_PROGRESS - HERO_TREE_REVEAL_START_PROGRESS),
        0,
        1
      );
  const introRevealProgress = shouldReduceMotion
    ? 1
    : clamp(
        (panelProgress - HERO_INTRO_REVEAL_START_PROGRESS) /
          (HERO_INTRO_REVEAL_END_PROGRESS - HERO_INTRO_REVEAL_START_PROGRESS),
        0,
        1
      );

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
            <span className={innerClassName}>{character}</span>
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

  function renderIntroLine(line) {
    if (!line.includes("Wikipedia")) {
      return line;
    }

    const [beforeWikipedia, afterWikipedia] = line.split("Wikipedia");

    return (
      <>
        {beforeWikipedia}
        <a
          href="https://en.wikipedia.org/wiki/Saint_Roch"
          target="_blank"
          rel="noreferrer"
          className="c-BrandHeroParallax__introLink"
        >
          Wikipedia
        </a>
        {afterWikipedia}
      </>
    );
  }

  return (
    <div
      ref={heroContainerReference}
      id="marketing-hero-section"
      className="c-BrandHeroParallax"
    >
      <div className="c-BrandHeroParallax__viewport">
        <section className="c-BrandHeroParallax__section" aria-label={`${HERO_WORDMARK} hero`}>
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
                opacity: { duration: 0.28, ease: "linear" },
                scale: {
                  duration: shouldReduceMotion ? 0 : HERO_MEDIA_SETTLE_DURATION,
                  ease: [0.16, 1, 0.3, 1]
                }
              }}
            />
          </div>

          <motion.div
            className="c-BrandHeroParallax__dogStage"
            initial={false}
            animate={{ opacity: dogRevealProgress }}
            transition={{ duration: 0.18, ease: "linear" }}
          >
            <motion.div
              className="c-BrandHeroParallax__treeReveal"
              initial={false}
              animate={{
                opacity: treeRevealProgress,
                clipPath: `inset(${(1 - treeRevealProgress) * 100}% 0 0 0 round 0)`,
                scale: 0.9 + treeRevealProgress * 0.1,
                y: `${(1 - treeRevealProgress) * 10}%`
              }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={HERO_TREE_IMAGE_SRC}
                alt=""
                aria-hidden="true"
                className="c-BrandHeroParallax__treeImage"
              />
            </motion.div>
            <motion.img
              src={HERO_DOG_IMAGE_SRC}
              alt=""
              aria-hidden="true"
              className="c-BrandHeroParallax__dogImage"
              initial={false}
              animate={{
                y: `${(1 - dogRevealProgress) * 100}%`
              }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            />
          </motion.div>

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
                  ? { opacity: isHeroRevealReady ? 1 : 0 }
                  : {
                      opacity: isHeroRevealReady ? 1 : 0,
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
                aria-label={HERO_WORDMARK}
                className="c-BrandHeroParallax__wordmark c-BrandHeroParallax__wordmarkPrimary"
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
                  ? { opacity: isHeroRevealReady ? 1 : 0, clipPath: blackPanelClipPath }
                  : {
                      opacity: isHeroRevealReady ? 1 : 0,
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
              <motion.div
                className="c-BrandHeroParallax__intro"
                initial={false}
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
                    {renderIntroLine(line)}
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
              <h1 className="c-BrandHeroParallax__wordmark c-BrandHeroParallax__wordmarkStencil">
                {renderWordmarkCharacters("c-BrandHeroParallax__characterInner")}
              </h1>
            </motion.div>
          </div>
        </section>
      </div>
      <div className="c-BrandHeroParallax__scrollSpacer" aria-hidden="true" />
    </div>
  );
}
