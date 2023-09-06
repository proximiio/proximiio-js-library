
import Feature from '../../models/feature';
import { GuidanceStep } from '../../models/wayfinding';

export default class GuidanceTextGenerator {
  points: Feature[];
  steps: GuidanceStep[];

  constructor(points: Feature[]) {
    this.points = points;
    this.generateStepsFromPoints();
  }

  generateStepsFromPoints() {
    this.steps = this.points.map((point: Feature) => {
      return {
        bearingFromLastStep: 0,
        coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]],
        direction: 'direction',
        distanceFromLastStep: 0,
        isWaypoint: false,
        level: point.properties.level
      };
    });
  }
}
