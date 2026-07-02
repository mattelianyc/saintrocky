import { LAMPORTS_PER_SOL } from './constants.js';

export function formatFeeSol(lamports, fractionDigits = 4) {
  return ((Number(lamports) || 0) / LAMPORTS_PER_SOL).toFixed(fractionDigits);
}

export function getRemainingDuration(freeAt, now = new Date()) {
  const freeAtDate = freeAt instanceof Date ? freeAt : new Date(freeAt);
  const nowDate = now instanceof Date ? now : new Date(now);
  const totalMs = Math.max(0, freeAtDate.getTime() - nowDate.getTime());

  const totalSeconds = Math.floor(totalMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  return {
    totalMs,
    days,
    hours,
    minutes,
    seconds,
    isComplete: totalMs === 0
  };
}

export function formatRemainingDuration(freeAt, now = new Date()) {
  const remaining = getRemainingDuration(freeAt, now);
  if (remaining.isComplete) {
    return '0m';
  }

  if (remaining.days > 0) {
    return `${remaining.days}d ${remaining.hours}h`;
  }

  if (remaining.hours > 0) {
    return `${remaining.hours}h ${remaining.minutes}m`;
  }

  return `${remaining.minutes}m ${remaining.seconds}s`;
}
