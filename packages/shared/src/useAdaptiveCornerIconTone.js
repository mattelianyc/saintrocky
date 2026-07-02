"use client";

import { useEffect, useRef, useState } from "react";

function parseRgbColorValue(colorValue) {
  const match = colorValue?.match(/rgba?\(([^)]+)\)/i);

  if (!match) {
    return null;
  }

  const [red, green, blue, alpha = "1"] = match[1]
    .split(",")
    .map((part) => part.trim());

  return {
    red: Number(red),
    green: Number(green),
    blue: Number(blue),
    alpha: Number(alpha)
  };
}

function resolveBackgroundColorForElement(element) {
  let currentElement = element;

  while (currentElement && currentElement instanceof HTMLElement) {
    const backgroundColor = window.getComputedStyle(currentElement).backgroundColor;
    const parsedColor = parseRgbColorValue(backgroundColor);

    if (parsedColor && parsedColor.alpha > 0) {
      return parsedColor;
    }

    currentElement = currentElement.parentElement;
  }

  return null;
}

function isDarkColor(color) {
  if (!color) {
    return false;
  }

  const luminance = (
    (0.2126 * color.red) +
    (0.7152 * color.green) +
    (0.0722 * color.blue)
  ) / 255;

  return luminance < 0.5;
}

export function useAdaptiveCornerIconTone(excludedClassNames = []) {
  const iconLinkReference = useRef(null);
  const [iconTone, setIconTone] = useState("lightBackground");

  useEffect(() => {
    function updateIconTone() {
      if (!iconLinkReference.current) {
        return;
      }

      const linkBounds = iconLinkReference.current.getBoundingClientRect();
      const sampleX = Math.max(Math.round(linkBounds.left + linkBounds.width / 2), 0);
      const sampleY = Math.max(Math.round(linkBounds.top + linkBounds.height / 2), 0);
      const elementsAtPoint = document.elementsFromPoint(sampleX, sampleY);
      const toneElement = elementsAtPoint.find((element) => {
        return (
          element instanceof HTMLElement &&
          !iconLinkReference.current?.contains(element) &&
          element.closest("[data-corner-icon-tone]")
        );
      });

      const explicitTone =
        toneElement instanceof HTMLElement
          ? toneElement.closest("[data-corner-icon-tone]")?.getAttribute("data-corner-icon-tone")
          : null;

      if (explicitTone === "dark" || explicitTone === "light") {
        setIconTone(explicitTone === "dark" ? "darkBackground" : "lightBackground");
        return;
      }

      const backgroundElement = elementsAtPoint.find((element) => {
        return (
          element instanceof HTMLElement &&
          !iconLinkReference.current?.contains(element) &&
          !excludedClassNames.some((className) => element.classList.contains(className))
        );
      });

      const backgroundColor = resolveBackgroundColorForElement(backgroundElement || document.body);
      setIconTone(isDarkColor(backgroundColor) ? "darkBackground" : "lightBackground");
    }

    let animationFrameId = null;
    function handleScrollOrResize() {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(updateIconTone);
    }

    updateIconTone();
    window.addEventListener("scroll", handleScrollOrResize, { passive: true });
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener("scroll", handleScrollOrResize);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [excludedClassNames]);

  return {
    iconLinkReference,
    iconTone
  };
}
