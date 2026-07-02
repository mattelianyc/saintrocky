"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { saintRockyBranding } from "@saintrocky/branding";
import { useIsMobileViewport, useTerminalTyping } from "@saintrocky/shared";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const REPRISAL_SCROLL_DISTANCE_FACTOR = 0.72;
const REPRISAL_FINAL_TOP_LEFT_COVERAGE = 84;
const REPRISAL_FINAL_BOTTOM_LEFT_COVERAGE = 64;
const REPRISAL_CHARACTER_REVEAL_START = 0.18;
const REPRISAL_CHARACTER_REVEAL_DURATION = 0.17;
const REPRISAL_CHARACTER_REVEAL_STAGGER = 0.028;
const REPRISAL_CHARACTER_EXIT_DISTANCE = 260;
const REPRISAL_CHARACTER_EXIT_VIEWPORT_FACTOR = 0.14;
const REPRISAL_PANEL_REVEAL_PROGRESS = 0.58;
const REPRISAL_PANEL_REVEAL_START = 0.04;
const REPRISAL_MEDIA_REVEAL_START = 0.06;
const REPRISAL_MEDIA_REVEAL_END = 0.22;
const REPRISAL_TERMINAL_REVEAL_START = 0.001;
const REPRISAL_TERMINAL_REVEAL_END = 0.002;
const REPRISAL_FOOTER_CHARACTER_EXIT_START = 0.03;
const REPRISAL_FOOTER_CHARACTER_EXIT_STAGGER = 0.018;
const REPRISAL_FOOTER_CHARACTER_EXIT_DURATION = 0.22;

const REPRISAL_BRAND_NAME =
  saintRockyBranding.inlineWordmark ||
  saintRockyBranding.wordmark ||
  saintRockyBranding.productName.toUpperCase();
const REPRISAL_INSTAGRAM_URL = saintRockyBranding.social?.url || saintRockyBranding.siteUrl || "/";
const REPRISAL_TERMINAL_COMMAND = saintRockyBranding.social?.handle || "@standarddeviants";

function BrandHeroReprisalMobileFooter({ brandName }) {
  return (
    <div
      className="c-BrandHeroReprisal c-BrandHeroReprisal--mobile"
      data-corner-icon-tone="dark"
    >
      <section className="c-BrandHeroReprisal__mobileSection" aria-label="Brand footer">
        <div className="c-BrandHeroReprisal__footerRoot">
          <div className="c-BrandHeroReprisal__footerBrandBlock">
            <div className="c-BrandHeroReprisal__monogram" aria-hidden="true">
              {(saintRockyBranding.monogramLines || ["STD", "DEV"]).map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
            <h2 className="c-BrandHeroReprisal__footerBrandName">{brandName}</h2>
            <p className="c-BrandHeroReprisal__footerDescription">
              {saintRockyBranding.footerDescription || saintRockyBranding.description}
            </p>
          </div>

          <div className="c-BrandHeroReprisal__footerLinkRow">
            <a
              href={REPRISAL_INSTAGRAM_URL}
              rel="noreferrer"
              className="c-BrandHeroReprisal__footerSocialLink"
            >
              {REPRISAL_TERMINAL_COMMAND}
            </a>
          </div>

          <div className="c-BrandHeroReprisal__footerBottomRow">
            <p className="c-BrandHeroReprisal__footerCopyright">
              &copy; 2026 {brandName}. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function BrandHeroReprisal({
  brandName = REPRISAL_BRAND_NAME
}) {
  const isMobileViewport = useIsMobileViewport();

  if (isMobileViewport == null) {
    return null;
  }

  if (isMobileViewport) {
    return <BrandHeroReprisalMobileFooter brandName={brandName} />;
  }

  return <AnimatedBrandHeroReprisal brandName={brandName} />;
}

function AnimatedBrandHeroReprisal({ brandName }) {
  const sceneReference = useRef(null);
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [scrollProgress, setScrollProgress] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(900);

  const brandCharacters = brandName.split("");
  const leadingAccentCharacterIndex = brandCharacters.indexOf("$");
  const trailingAccentCharacterIndex = brandCharacters.lastIndexOf("$");

  function getCharacterClassName(innerClassName, character, index) {
    const classNames = [innerClassName];

    if (character === "$") {
      if (index === leadingAccentCharacterIndex) {
        classNames.push("c-BrandHeroReprisal__characterInner--accentLeading");
      }

      if (index === trailingAccentCharacterIndex) {
        classNames.push("c-BrandHeroReprisal__characterInner--accentTrailing");
      }
    }

    if (character === "/") {
      classNames.push("c-BrandHeroReprisal__characterInner--divider");
    }

    return classNames.join(" ");
  }
  const terminalRevealProgress = shouldReduceMotion
    ? 1
    : clamp(
        (scrollProgress - REPRISAL_TERMINAL_REVEAL_START) /
          (REPRISAL_TERMINAL_REVEAL_END - REPRISAL_TERMINAL_REVEAL_START),
        0,
        1
      );
  const panelRevealProgress = shouldReduceMotion
    ? 1
    : clamp(scrollProgress / REPRISAL_PANEL_REVEAL_PROGRESS, 0, 1);
  const panelRevealProgressWithDelay = shouldReduceMotion
    ? 1
    : clamp(
        (scrollProgress - REPRISAL_PANEL_REVEAL_START) /
          (REPRISAL_PANEL_REVEAL_PROGRESS - REPRISAL_PANEL_REVEAL_START),
        0,
        1
      );
  const mediaRevealProgress = shouldReduceMotion
    ? 1
    : clamp(
        (scrollProgress - REPRISAL_MEDIA_REVEAL_START) /
          (REPRISAL_MEDIA_REVEAL_END - REPRISAL_MEDIA_REVEAL_START),
        0,
        1
      );
  const blackPanelTopLeftCoverage =
    REPRISAL_FINAL_TOP_LEFT_COVERAGE * panelRevealProgressWithDelay;
  const blackPanelBottomLeftCoverage =
    REPRISAL_FINAL_BOTTOM_LEFT_COVERAGE * panelRevealProgressWithDelay;
  const blackPanelClipPath = `polygon(${blackPanelTopLeftCoverage}% 0, 100% 0, 100% 100%, ${blackPanelBottomLeftCoverage}% 100%)`;
  const redPanelClipPath = `polygon(0 0, ${blackPanelTopLeftCoverage}% 0, ${blackPanelBottomLeftCoverage}% 100%, 0 100%)`;
  const baseHeadingOpacity = shouldReduceMotion ? 0 : clamp(1 - panelRevealProgress / 0.28, 0, 1);
  const terminalOffsetX = (1 - terminalRevealProgress) * 22;
  const terminalOffsetY = (1 - terminalRevealProgress) * 16;
  const terminalBlurAmount = (1 - terminalRevealProgress) * 6;
  const footerLayerOpacity = shouldReduceMotion
    ? 1
    : clamp(1 - panelRevealProgressWithDelay / 0.5, 0, 1);

  const { isTypingComplete, visibleTerminalLine } = useTerminalTyping({
    isReady: shouldReduceMotion || terminalRevealProgress >= 0.98,
    prefersReducedMotion: shouldReduceMotion,
    promptText: "",
    typedText: REPRISAL_TERMINAL_COMMAND,
    typingStartDelayMs: 600,
    typingStepDurationMs: 52
  });

  useEffect(() => {
    function handleEnterKey(event) {
      if (event.key !== "Enter") return;

      const activeElement = document.activeElement;
      const isTypingIntoField =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isTypingIntoField || !sceneReference.current) {
        return;
      }

      const rect = sceneReference.current.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      if (Math.abs(sectionCenter - viewportCenter) > window.innerHeight * 0.6) {
        return;
      }

      event.preventDefault();
      window.location.assign(REPRISAL_INSTAGRAM_URL);
    }

    window.addEventListener("keydown", handleEnterKey);
    return () => window.removeEventListener("keydown", handleEnterKey);
  }, []);

  useEffect(() => {
    function updateViewportHeight() {
      setViewportHeight(window.innerHeight);
    }

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, []);

  useEffect(() => {
    function updateProgress() {
      if (!sceneReference.current) {
        return;
      }

      const sectionTopOffset = sceneReference.current.offsetTop;
      const scrollWithinSection = Math.max(window.scrollY - sectionTopOffset, 0);
      const animationDistance = window.innerHeight * REPRISAL_SCROLL_DISTANCE_FACTOR;
      setScrollProgress(clamp(scrollWithinSection / animationDistance, 0, 1));
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

  function renderCharacters(innerClassName, options = {}) {
    return brandCharacters.map((character, index) => {
      const staggerIndex = options.reverse ? brandCharacters.length - index - 1 : index;
      const revealStart =
        REPRISAL_CHARACTER_REVEAL_START + staggerIndex * REPRISAL_CHARACTER_REVEAL_STAGGER;
      const revealEnd = revealStart + REPRISAL_CHARACTER_REVEAL_DURATION;
      const revealProgress = shouldReduceMotion
        ? 1
        : clamp((scrollProgress - revealStart) / (revealEnd - revealStart), 0, 1);
      const hiddenTranslateY =
        viewportHeight * REPRISAL_CHARACTER_EXIT_VIEWPORT_FACTOR +
        REPRISAL_CHARACTER_EXIT_DISTANCE;
      const translateY = hiddenTranslateY * (1 - revealProgress);
      const opacity = revealProgress;
      const blurAmount = (1 - revealProgress) * 8;

      return (
        <motion.span
          key={`${innerClassName}-${character}-${index}`}
          className="c-BrandHeroReprisal__characterOuter"
          animate={{
            y: translateY,
            opacity,
            filter: `blur(${blurAmount}px)`
          }}
          transition={{ duration: 0.08, ease: "linear" }}
        >
          <span className={getCharacterClassName(innerClassName, character, index)}>
            {character === " " ? "\u00A0" : character}
          </span>
        </motion.span>
      );
    });
  }

  function renderFooterWordmarkCharacters() {
    return brandCharacters.map((character, index) => {
      const characterExitStart =
        REPRISAL_FOOTER_CHARACTER_EXIT_START + index * REPRISAL_FOOTER_CHARACTER_EXIT_STAGGER;
      const characterExitProgress = shouldReduceMotion
        ? panelRevealProgressWithDelay
        : clamp(
            (panelRevealProgressWithDelay - characterExitStart) /
              REPRISAL_FOOTER_CHARACTER_EXIT_DURATION,
            0,
            1
          );

      return (
        <motion.span
          key={`footer-${character}-${index}`}
          className="c-BrandHeroReprisal__footerWordmarkCharacterOuter"
          animate={{
            y: (viewportHeight * 0.22 + 100) * characterExitProgress,
            opacity: 1 - characterExitProgress,
            filter: `blur(${characterExitProgress * 4}px)`
          }}
          transition={{ duration: 0.08, ease: "linear" }}
        >
          <span className={getCharacterClassName("c-BrandHeroReprisal__footerWordmarkCharacterInner", character, index)}>
            {character === " " ? "\u00A0" : character}
          </span>
        </motion.span>
      );
    });
  }

  return (
    <div
      ref={sceneReference}
      className="c-BrandHeroReprisal"
      data-corner-icon-tone="dark"
    >
      <div className="c-BrandHeroReprisal__viewport">
        <section className="c-BrandHeroReprisal__section" aria-label="Brand reprisal">
          <motion.div
            className="c-BrandHeroReprisal__footerLayer"
            animate={{ opacity: footerLayerOpacity }}
            transition={{ duration: 0.08, ease: "linear" }}
          >
            <div className="c-BrandHeroReprisal__footerRoot">
              <div className="c-BrandHeroReprisal__footerBrandBlock">
                <div className="c-BrandHeroReprisal__monogram" aria-hidden="true">
                  {(saintRockyBranding.monogramLines || ["STD", "DEV"]).map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
                <h2 className="c-BrandHeroReprisal__footerBrandName">
                  {renderFooterWordmarkCharacters()}
                </h2>
                <p className="c-BrandHeroReprisal__footerDescription">
                  {saintRockyBranding.footerDescription || saintRockyBranding.description}
                </p>
              </div>
              <div className="c-BrandHeroReprisal__footerBottomRow">
                <p className="c-BrandHeroReprisal__footerCopyright">
                  &copy; 2026 {brandName}. All rights reserved.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="c-BrandHeroReprisal__media"
            aria-hidden="true"
            animate={{ opacity: mediaRevealProgress }}
            transition={{ duration: 0.08, ease: "linear" }}
          >
            <div className="c-BrandHeroReprisal__mediaArtwork" />
            <div className="c-BrandHeroReprisal__overlayLeft" />
          </motion.div>

          <motion.div
            className="c-BrandHeroReprisal__baseHeadingPanel"
            animate={{ opacity: baseHeadingOpacity }}
            transition={{ duration: 0.08, ease: "linear" }}
          >
            <h2 className="c-BrandHeroReprisal__baseHeading">
              {renderCharacters("c-BrandHeroReprisal__baseCharacterInner", { reverse: true })}
            </h2>
          </motion.div>

          <motion.div
            aria-hidden="true"
            className="c-BrandHeroReprisal__stencilPanel"
            animate={{ clipPath: blackPanelClipPath }}
            transition={{ duration: 0.08, ease: "linear" }}
          >
            <h2 className="c-BrandHeroReprisal__stencilHeading">
              {renderCharacters("c-BrandHeroReprisal__stencilCharacterInner", { reverse: true })}
            </h2>
          </motion.div>

          <motion.div
            className="c-BrandHeroReprisal__contentPanel"
            animate={{ clipPath: redPanelClipPath }}
            transition={{ duration: 0.08, ease: "linear" }}
          >
            <h2 aria-label={brandName} className="c-BrandHeroReprisal__heading">
              {renderCharacters("c-BrandHeroReprisal__characterInner", { reverse: true })}
            </h2>
          </motion.div>

          <motion.div
            className="c-BrandHeroReprisal__terminal"
            animate={
              shouldReduceMotion
                ? { opacity: terminalRevealProgress }
                : {
                    opacity: terminalRevealProgress,
                    x: terminalOffsetX,
                    y: terminalOffsetY,
                    filter: `blur(${terminalBlurAmount}px)`
                  }
            }
            transition={{ duration: 0.08, ease: "linear" }}
          >
            <pre className="c-BrandHeroReprisal__terminalLine">
              <a
                href={REPRISAL_INSTAGRAM_URL}
                rel="noreferrer"
                className="c-BrandHeroReprisal__terminalLink"
              >
                {visibleTerminalLine}
              </a>
              <span
                aria-hidden="true"
                className={`c-BrandHeroReprisal__terminalCursor ${isTypingComplete ? "c-BrandHeroReprisal__terminalCursorIdle" : ""}`}
              >
                █
              </span>
            </pre>
            <p className="c-BrandHeroReprisal__terminalHint">
              <span className="c-BrandHeroReprisal__terminalHintText">press &lt;Enter&gt;</span>
            </p>
          </motion.div>
        </section>
      </div>
      <div className="c-BrandHeroReprisal__scrollSpacer" aria-hidden="true" />
    </div>
  );
}
