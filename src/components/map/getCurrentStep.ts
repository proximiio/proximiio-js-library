import { lineString, point } from '@turf/helpers';
import pointToLineDistance from '@turf/point-to-line-distance';
import distance from '@turf/distance';

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

  let closestStepIndex = lastKnownStepIndex ? lastKnownStepIndex : 0;
  let minDistance = Infinity;

  // Only check steps ahead of current one to avoid regressions
  for (let i = lastKnownStepIndex; i < steps.length; i++) {
    const step = steps[i];
    const isStartOrLevelChanger = step.direction === 'START' || step.levelChangerId;
    if (step.navMode === 'mall' && !step.lineStringFeatureFromLastStep && !isStartOrLevelChanger) {
      return;
    }
    //if (step.lineStringFeatureFromLastStep || step.navMode !== 'mall' || isStartOrLevelChanger) {
    let pointDistance = 0;
    if (isStartOrLevelChanger) {
      pointDistance = distance(userPoint, point(step.coordinates), { units: 'meters' });
    } else {
      const lineCoords =
        step.navMode === 'mall' ? step.lineStringFeatureFromLastStep.geometry.coordinates : step.geometry.coordinates;
      const line = lineString(lineCoords);
      pointDistance = pointToLineDistance(userPoint, line, { units: 'meters' });
    }

    // If within threshold and closest so far, consider this as best candidate
    if (pointDistance < thresholdMeters && pointDistance < minDistance) {
      minDistance = pointDistance;
      closestStepIndex = i;
    }
    //}
  }

  // Return updated index if user is close enough to a new step, else stick to last one
  return closestStepIndex;
};

export default getCurrentStepIndex;
