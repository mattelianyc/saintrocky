import { buildDateTime, coerceDateTime, resolveTimezone } from '@saintrocky/shared';

function parseScheduleClockValue(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

function buildWindowBoundaryDateTime({ zone, referenceDateTime, clockValue, dayOffset = 0 }) {
  const timeParts = parseScheduleClockValue(clockValue);
  if (!referenceDateTime || !timeParts) {
    return null;
  }

  const boundaryDate = referenceDateTime.plus({ days: dayOffset });
  return buildDateTime({
    year: boundaryDate.year,
    month: boundaryDate.month,
    day: boundaryDate.day,
    hour: timeParts.hours,
    minute: timeParts.minutes,
    zone
  });
}

function getTimeWindowEndDate(window, referenceDate = new Date()) {
  if (!window?.start || !window?.end) {
    return null;
  }

  const zone = resolveTimezone(window.timezone, 'UTC');
  const referenceDateTime = coerceDateTime(referenceDate, { zone }) || coerceDateTime(new Date(), { zone });
  if (!referenceDateTime) {
    return null;
  }

  const currentTime = referenceDateTime.toFormat('HH:mm');
  const startsSameDay = String(window.start) <= String(window.end);

  if (startsSameDay) {
    if (currentTime < window.start || currentTime >= window.end) {
      return null;
    }

    return buildWindowBoundaryDateTime({
      zone,
      referenceDateTime,
      clockValue: window.end
    })?.toJSDate() || null;
  }

  if (currentTime >= window.start) {
    return buildWindowBoundaryDateTime({
      zone,
      referenceDateTime,
      clockValue: window.end,
      dayOffset: 1
    })?.toJSDate() || null;
  }

  if (currentTime < window.end) {
    return buildWindowBoundaryDateTime({
      zone,
      referenceDateTime,
      clockValue: window.end
    })?.toJSDate() || null;
  }

  return null;
}

export function getScheduleWindowEndTime(schedule = {}, referenceDate = new Date()) {
  if (!schedule?.type || schedule.type === 'always') {
    return null;
  }

  if (schedule.type === 'manual_lock') {
    return null;
  }

  if (schedule.type === 'cooldown') {
    if (!schedule.armedAt) {
      return null;
    }

    const durationMinutes = Number(schedule.durationMinutes || 0);
    if (durationMinutes <= 0) {
      return null;
    }

    const armedAtDate = new Date(schedule.armedAt);
    if (Number.isNaN(armedAtDate.getTime())) {
      return null;
    }

    const endDate = new Date(armedAtDate.getTime() + durationMinutes * 60_000);
    return endDate.getTime() > new Date(referenceDate).getTime() ? endDate : null;
  }

  if (schedule.type === 'window') {
    const activeWindowEndDates = (schedule.windows || [])
      .map((window) => getTimeWindowEndDate(window, referenceDate))
      .filter((value) => value instanceof Date && !Number.isNaN(value.getTime()));

    if (!activeWindowEndDates.length) {
      return null;
    }

    return activeWindowEndDates.sort((leftDate, rightDate) => leftDate.getTime() - rightDate.getTime())[0];
  }

  return null;
}
