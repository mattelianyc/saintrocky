"use client";

import {
  calculateLockedStake,
  getProblemIndexLabel,
  LAMPORTS_PER_SOL
} from "@saintrocky/fuckyoupayme";

import { Slider } from "../../primitives/Slider/Slider.jsx";

function normalizeSliderValue(nextValue) {
  if (Array.isArray(nextValue)) {
    return Number(nextValue[0] || 0);
  }

  return Number(nextValue || 0);
}

export function ProblemIndexSlider({ value = 50, onChange, disabled = false, variant = "default" }) {
  const currentValue = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const lockedStakeSol = calculateLockedStake(currentValue) / LAMPORTS_PER_SOL;
  const isHero = variant === "hero";

  return (
    <div className={`c-ProblemIndexSlider ${isHero ? "c-ProblemIndexSlider--hero" : ""}`}>
      <div className="c-ProblemIndexSlider__header">
        <div>
          <p className="c-ProblemIndexSlider__eyebrow">Problem index</p>
          <strong className="c-ProblemIndexSlider__value">{currentValue} / 100</strong>
        </div>
        <div className="c-ProblemIndexSlider__summary">
          <strong>{getProblemIndexLabel(currentValue)}</strong>
          <span>{lockedStakeSol.toFixed(2)} SOL locked when this rule goes active</span>
        </div>
      </div>

      <Slider.Root
        value={currentValue}
        min={0}
        max={100}
        step={1}
        disabled={disabled}
        aria-label="Problem index"
        onValueChange={(nextValue) => onChange?.(normalizeSliderValue(nextValue))}
      >
        <Slider.Control className={isHero ? "ui-SliderControl--fullWidth" : ""}>
          <Slider.Track className={isHero ? "ui-SliderTrack--prominent" : ""}>
            <Slider.Indicator className={isHero ? "ui-SliderIndicator--gradient" : ""} />
          </Slider.Track>
          <Slider.Thumb />
        </Slider.Control>
      </Slider.Root>

    </div>
  );
}
