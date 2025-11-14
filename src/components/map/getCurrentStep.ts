import { lineString, point } from '@turf/helpers';
import pointToLineDistance from '@turf/point-to-line-distance';

/**
 * Find the most appropriate navigation step index based on user's current position.
 *
 * @param {Array<number>} userPosition - [lng, lat] of user's current position.
 * @param {Array<Object>} steps - Array of TBTNav steps from the route.
 * @param {number} lastKnownStepIndex - Last matched step index to ensure forward progression.
 * @param {number} thresholdMeters - Optional distance threshold to avoid false matches (default: 5m).
 * @returns {number} - Best matching step index (could be same as lastKnownStepIndex).
 */
const getCurrentStepIndex = ({
  userPosition,
  steps,
  lastKnownStepIndex = 0,
  thresholdMeters = 5,
}: {
  userPosition: number[];
  steps: any[];
  lastKnownStepIndex?: number;
  thresholdMeters?: number;
}) => {
  const userPoint = point(userPosition);
  let closestStepIndex = 0; // lastKnownStepIndex;
  let minDistance = Infinity;

  // Only check steps ahead of current one to avoid regressions
  for (let i = 0 /*lastKnownStepIndex*/; i < steps.length; i++) {
    const step = steps[i];
    if (step.navMode === 'mall' && !step.lineStringFeatureFromLastStep) {
      return;
    }
    const lineCoords =
      step.navMode === 'mall' ? step.lineStringFeatureFromLastStep.geometry.coordinates : step.geometry.coordinates;
    const line = lineString(lineCoords);

    // Calculate shortest distance from user to this step's path
    const distance = pointToLineDistance(userPoint, line, { units: 'meters' });

    // If within threshold and closest so far, consider this as best candidate
    if (distance < thresholdMeters && distance < minDistance) {
      minDistance = distance;
      closestStepIndex = i;
    }
  }

  // Return updated index if user is close enough to a new step, else stick to last one
  return closestStepIndex;
};

export default getCurrentStepIndex;
