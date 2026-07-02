"use client";

import { useEffect, useMemo, useState } from "react";

export function useTerminalTyping({
  isReady,
  prefersReducedMotion,
  promptText,
  typedText,
  typingStartDelayMs = 400,
  typingStepDurationMs = 40
}) {
  const fullTerminalLine = useMemo(
    () => `${promptText}${typedText}`,
    [promptText, typedText]
  );
  const [visibleCharacterCount, setVisibleCharacterCount] = useState(
    prefersReducedMotion ? fullTerminalLine.length : 0
  );

  useEffect(() => {
    if (!isReady) {
      setVisibleCharacterCount(prefersReducedMotion ? fullTerminalLine.length : 0);
      return undefined;
    }

    if (prefersReducedMotion) {
      setVisibleCharacterCount(fullTerminalLine.length);
      return undefined;
    }

    setVisibleCharacterCount(0);

    let intervalId = null;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setVisibleCharacterCount((currentCount) => {
          if (currentCount >= fullTerminalLine.length) {
            window.clearInterval(intervalId);
            return currentCount;
          }

          return currentCount + 1;
        });
      }, typingStepDurationMs);
    }, typingStartDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [
    fullTerminalLine,
    isReady,
    prefersReducedMotion,
    typingStartDelayMs,
    typingStepDurationMs
  ]);

  return {
    isTypingComplete: visibleCharacterCount >= fullTerminalLine.length,
    visibleTerminalLine: fullTerminalLine.slice(0, visibleCharacterCount)
  };
}
