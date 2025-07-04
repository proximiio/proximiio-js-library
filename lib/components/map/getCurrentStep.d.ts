/**
 * Find the most appropriate navigation step index based on user's current position.
 *
 * @param {Array<number>} userPosition - [lng, lat] of user's current position.
 * @param {Array<Object>} steps - Array of TBTNav steps from the route.
 * @param {number} lastKnownStepIndex - Last matched step index to ensure forward progression.
 * @param {number} thresholdMeters - Optional distance threshold to avoid false matches (default: 5m).
 * @returns {number} - Best matching step index (could be same as lastKnownStepIndex).
 */
declare const getCurrentStepIndex: ({ userPosition, steps, lastKnownStepIndex, thresholdMeters, }: {
    userPosition: number[];
    steps: any[];
    lastKnownStepIndex?: number;
    thresholdMeters?: number;
}) => number;
export default getCurrentStepIndex;
