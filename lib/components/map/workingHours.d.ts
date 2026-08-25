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
/**
 * Derive weekday + wall-clock minutes from a local Date (defaults to now).
 */
export declare function nowClientTime(date?: Date): ClientTime;
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
export declare function isOpenAt(properties: any, time: ClientTime): boolean;
