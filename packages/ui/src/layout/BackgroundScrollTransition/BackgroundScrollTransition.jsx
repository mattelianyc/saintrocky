"use client";

import { useEffect } from "react";

import { useIsMobileViewport } from "@saintrocky/shared";

const START_BACKGROUND_COLOR = [255, 250, 252];
const END_BACKGROUND_COLOR = [246, 255, 250];

function interpolateColorChannel(startValue, endValue, progress) {
  return Math.round(startValue + (endValue - startValue) * progress);
}

function getInterpolatedBackgroundColor(progress) {
  const redChannel = interpolateColorChannel(
    START_BACKGROUND_COLOR[0],
    END_BACKGROUND_COLOR[0],
    progress
  );
  const greenChannel = interpolateColorChannel(
    START_BACKGROUND_COLOR[1],
    END_BACKGROUND_COLOR[1],
    progress
  );
  const blueChannel = interpolateColorChannel(
    START_BACKGROUND_COLOR[2],
    END_BACKGROUND_COLOR[2],
    progress
  );

  return `rgb(${redChannel} ${greenChannel} ${blueChannel})`;
}

export function BackgroundScrollTransition() {
  const isMobileViewport = useIsMobileViewport();

  useEffect(() => {
    const rootElement = document.documentElement;
    let animationFrameId = null;

    if (isMobileViewport == null || isMobileViewport) {
      rootElement.style.setProperty("--ui-marketing-background-color", "rgb(255 250 252)");
      return undefined;
    }

    function updateBackgroundColor() {
      const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = scrollableDistance > 0 ? Math.min(window.scrollY / scrollableDistance, 1) : 0;
      rootElement.style.setProperty(
        "--ui-marketing-background-color",
        getInterpolatedBackgroundColor(scrollProgress)
      );
    }

    function handleScroll() {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(updateBackgroundColor);
    }

    updateBackgroundColor();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      rootElement.style.setProperty("--ui-marketing-background-color", "rgb(255 250 252)");
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isMobileViewport]);

  return null;
}
