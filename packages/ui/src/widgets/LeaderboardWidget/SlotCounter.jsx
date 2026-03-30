"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

const DIGIT_HEIGHT = 1.2;
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function AnimatedDigit({ digit, delay = 0 }) {
  const spring = useSpring(0, {
    stiffness: 80,
    damping: 18,
    mass: 0.6
  });
  const translateY = useTransform(spring, (value) => `${-value * DIGIT_HEIGHT}em`);

  useEffect(() => {
    const timer = globalThis.setTimeout(() => spring.set(digit), delay);
    return () => globalThis.clearTimeout(timer);
  }, [digit, delay, spring]);

  return (
    <span className="w-SlotCounter__digitWrapper">
      <motion.span className="w-SlotCounter__digitStrip" style={{ y: translateY }}>
        {DIGITS.map((digitValue) => (
          <span key={digitValue} className="w-SlotCounter__digit">
            {digitValue}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function splitNumberToCharacters(value, decimals) {
  const formatted = Number(value || 0).toFixed(decimals);
  return formatted.split("");
}

export function SlotCounter({ value = 0, prefix = "", suffix = "", decimals = 2 }) {
  const characters = splitNumberToCharacters(value, decimals);
  const previousLengthRef = useRef(characters.length);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (characters.length !== previousLengthRef.current) {
      previousLengthRef.current = characters.length;
      setRenderKey((previous) => previous + 1);
    }
  }, [characters.length]);

  return (
    <span className="w-SlotCounter" aria-label={`${prefix}${Number(value).toFixed(decimals)}${suffix}`}>
      {prefix ? <span className="w-SlotCounter__static">{prefix}</span> : null}
      {characters.map((character, index) => {
        const isDigit = character >= "0" && character <= "9";
        if (!isDigit) {
          return (
            <span key={`${renderKey}-sep-${index}`} className="w-SlotCounter__static">
              {character}
            </span>
          );
        }

        return (
          <AnimatedDigit
            key={`${renderKey}-d-${index}`}
            digit={Number(character)}
            delay={index * 60}
          />
        );
      })}
      {suffix ? <span className="w-SlotCounter__static">{suffix}</span> : null}
    </span>
  );
}
