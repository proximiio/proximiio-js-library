/**
 * Working-hours support for client-side routing.
 *
 * Features may carry on `properties`:
 *   _workingHoursEnabled: true
 *   workingHours: [ ["14:00","22:00"], ... ]  // 7 entries, index 0 = SUNDAY
 *
 * This runs on the end user's own device, so "now" is simply the browser's
 * local clock — unlike a server serving clients across timezones, there is
 * no offset to strip: `Date#getDay/getHours/getMinutes` already reflect the
 * device's local wall-clock time.
 *
 * Malformed or missing data fails OPEN: bad venue data must never make a
 * feature unroutable.
 */

export type ClientTime = {
  /** 0 = Sunday … 6 = Saturday, matching the workingHours array order. */
  weekday: number;
  /** Minutes since local midnight, 0–1439. */
  minutes: number;
};

const HH_MM = /^(\d{1,2}):(\d{2})$/;

const MINUTES_PER_DAY = 24 * 60;

/**
 * Derive weekday + wall-clock minutes from a local Date (defaults to now).
 */
export function nowClientTime(date: Date = new Date()): ClientTime {
  return { weekday: date.getDay(), minutes: date.getHours() * 60 + date.getMinutes() };
}

function toMinutes(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const m = HH_MM.exec(value.trim());
  if (!m) return undefined;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 24 || minutes > 59) return undefined;
  return Math.min(hours * 60 + minutes, MINUTES_PER_DAY);
}

type DayWindow = { from: number; to: number };

function dayWindow(workingHours: unknown, weekday: number): DayWindow | undefined {
  if (!Array.isArray(workingHours) || workingHours.length !== 7) return undefined;
  const day = workingHours[weekday];
  if (!Array.isArray(day) || day.length < 2) return undefined;
  const from = toMinutes(day[0]);
  const to = toMinutes(day[1]);
  if (from === undefined || to === undefined) return undefined;
  return { from, to };
}

/**
 * Is a feature open at the given client time?
 *
 * - Features without `_workingHoursEnabled: true` (or with malformed
 *   `workingHours`) are always open.
 * - A window with `from < to` covers [from, to) that day.
 * - An overnight window (`from > to`, e.g. 22:00–06:00) covers [from, 24:00)
 *   that day plus [00:00, to) of the NEXT day — so we also check whether
 *   yesterday's window spills past midnight into now.
 * - `from === to` means closed all day (zero-length window).
 */
export function isOpenAt(properties: any, time: ClientTime): boolean {
  if (properties?._workingHoursEnabled !== true) return true;
  const workingHours = properties.workingHours;
  if (!Array.isArray(workingHours) || workingHours.length !== 7) return true;

  const today = dayWindow(workingHours, time.weekday);
  if (today === undefined) return true;

  if (today.from < today.to && time.minutes >= today.from && time.minutes < today.to) return true;
  if (today.from > today.to && time.minutes >= today.from) return true;

  const yesterday = dayWindow(workingHours, (time.weekday + 6) % 7);
  if (yesterday !== undefined && yesterday.from > yesterday.to && time.minutes < yesterday.to) return true;

  return false;
}
