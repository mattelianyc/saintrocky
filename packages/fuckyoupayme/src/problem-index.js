import {
  LAMPORTS_PER_POINT,
  PROBLEM_INDEX_MAX,
  PROBLEM_INDEX_MIN
} from './constants.js';

export const PROBLEM_INDEX_LABELS = [
  { min: 0, max: 14, label: "Ain't no thang" },
  { min: 15, max: 29, label: 'Kinda sus' },
  { min: 30, max: 49, label: 'Lowkey bad for me' },
  { min: 50, max: 69, label: 'This is a problem' },
  { min: 70, max: 84, label: 'Straight up degenerate' },
  { min: 85, max: 99, label: 'I need to be stopped' },
  { min: 100, max: 100, label: "If I don't stop this might actually kill me" }
];

export function clampProblemIndex(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return PROBLEM_INDEX_MIN;
  }

  return Math.min(PROBLEM_INDEX_MAX, Math.max(PROBLEM_INDEX_MIN, Math.round(numericValue)));
}

export function getProblemIndexLabel(problemIndex) {
  const normalizedProblemIndex = clampProblemIndex(problemIndex);

  return (
    PROBLEM_INDEX_LABELS.find(
      (entry) => normalizedProblemIndex >= entry.min && normalizedProblemIndex <= entry.max
    )?.label || PROBLEM_INDEX_LABELS[0].label
  );
}

export function calculateLockedStake(problemIndex) {
  return clampProblemIndex(problemIndex) * LAMPORTS_PER_POINT;
}
