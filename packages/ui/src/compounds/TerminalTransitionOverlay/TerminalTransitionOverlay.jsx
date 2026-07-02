"use client";

import { AnimatePresence, motion } from 'framer-motion';
import { cx } from '../../primitives/_utils/cx.js';

export function TerminalTransitionOverlay({
  isVisible,
  lines = [],
  className = '',
  prefersReducedMotion = false,
  autoFadeOut = false,
  lineAnimationDuration = 0.22,
  lineAnimationStagger = 0.06,
  overlayFadeOutDelay = 0.18,
  overlayFadeOutDuration = 0.34
}) {
  const finalLineRevealDelay = Math.max(lines.length - 1, 0) * lineAnimationStagger;
  const overlayFadeOutStartTime =
    finalLineRevealDelay + lineAnimationDuration + overlayFadeOutDelay;
  const totalDuration = overlayFadeOutStartTime + overlayFadeOutDuration;

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          className={cx('c-TerminalTransitionOverlay', className)}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : autoFadeOut
                ? { opacity: [0, 1, 1, 0] }
                : { opacity: 1 }
          }
          exit={{ opacity: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0.12 }
              : autoFadeOut
                ? {
                    duration: totalDuration,
                    times: [0, 0.08, overlayFadeOutStartTime / totalDuration, 1],
                    ease: 'linear'
                  }
                : { duration: 0.2 }
          }
        >
          <div className="c-TerminalTransitionOverlay__scanlines" aria-hidden="true" />
          <div className="c-TerminalTransitionOverlay__content">
            {lines.map((line, index) => (
              <motion.p
                key={line}
                className="c-TerminalTransitionOverlay__line"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: prefersReducedMotion ? 0.1 : lineAnimationDuration,
                  delay: prefersReducedMotion ? 0 : index * lineAnimationStagger,
                  ease: [0.2, 0.8, 0.2, 1]
                }}
              >
                {line}
              </motion.p>
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
