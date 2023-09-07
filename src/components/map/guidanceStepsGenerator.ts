import Feature from '../../models/feature';
import { GuidanceStep } from '../../models/wayfinding';
import * as turf from '@turf/turf';

enum Direction {
  Start = 'START',
  Finish = 'FINISH',
  Exit = 'EXIT',
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
  Straight = 'STRAIGHT',
  TurnAround = 'TURN_AROUND',
  HardLeft = 'HARD_LEFT',
  SlightLeft = 'SLIGHT_LEFT',
  HardRight = 'HARD_RIGHT',
  SlightRight = 'SLIGHT_RIGHT',
}

enum LevelChangerTypes {
  staircase = 'STAIRS',
  escalator = 'ESCALATOR',
  elevator = 'ELEVATOR',
  ramp = 'RAMP',
}

export default class GuidanceStepsGenerator {
  points: Feature[];
  steps: GuidanceStep[];

  constructor(points: Feature[]) {
    this.points = points;
    this.generateStepsFromPoints();
  }

  private generateStepsFromPoints() {
    this.steps = this.points.map((point: Feature, index: number) => {
      const previousPoint = this.points[index - 1] ? new Feature(this.points[index - 1]) : null;
      const currentPoint = new Feature(point);
      const nextPoint = this.points[index + 1] ? new Feature(this.points[index + 1]) : null;

      const data = {
        previousPoint,
        currentPoint,
        nextPoint,
      };

      return {
        bearingFromLastStep: this.getBearingFromLastStep(data),
        coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]],
        direction: this.getStepDirection(data),
        distanceFromLastStep: this.getDistanceFromLastStep(data),
        level: point.properties.level,
        levelChangerId: currentPoint.isLevelChanger ? currentPoint.id : null,
        levelChangerType: currentPoint.isLevelChanger ? currentPoint.properties.type : null,
        levelChangerDirection: currentPoint.isLevelChanger ? this.getLevelChangerDirection(data) : null,
        levelChangerDestinationLevel:
          currentPoint.isLevelChanger && nextPoint.properties.level !== currentPoint.properties.level
            ? nextPoint.properties.level
            : null,
        lineStringFeatureFromLastStep: this.getLineStringFeatureFromLastStep(data),
      };
    });
  }

  private getBearingFromLastStep({
    previousPoint,
    currentPoint,
    nextPoint,
  }: {
    previousPoint: Feature;
    currentPoint: Feature;
    nextPoint: Feature;
  }) {
    if (!previousPoint) {
      return 0;
    }
    const bearing = turf.bearing(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
    return bearing;
  }

  private getStepDirection({
    previousPoint,
    currentPoint,
    nextPoint,
  }: {
    previousPoint: Feature;
    currentPoint: Feature;
    nextPoint: Feature;
  }) {
    if (!previousPoint) {
      return Direction.Start;
    }
    if (!nextPoint) {
      return Direction.Finish;
    }
    if (currentPoint.isLevelChanger && nextPoint.properties.level > currentPoint.properties.level) {
      return `${Direction.Up}_${LevelChangerTypes[currentPoint.properties.type]}`;
    }
    if (currentPoint.isLevelChanger && nextPoint.properties.level < currentPoint.properties.level) {
      return `${Direction.Down}_${LevelChangerTypes[currentPoint.properties.type]}`;
    }
    if (previousPoint.isLevelChanger && currentPoint.isLevelChanger) {
      return `${Direction.Exit}_${LevelChangerTypes[currentPoint.properties.type]}`;
    }

    const bearing =
      turf.bearing(currentPoint.geometry.coordinates, nextPoint.geometry.coordinates) -
      turf.bearing(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
    const degreeNormalized = this.degreeNormalized(bearing);

    if (Math.abs(degreeNormalized) < 22.5) {
      return Direction.Straight;
    }
    if (Math.abs(degreeNormalized) > 157.5) {
      return Direction.TurnAround;
    }
    if (degreeNormalized < -112.5) {
      return Direction.HardLeft;
    }
    if (degreeNormalized <= -67.5) {
      return Direction.Left;
    }
    if (degreeNormalized <= -22.5) {
      return Direction.SlightLeft;
    }
    if (degreeNormalized > 157.5) {
      return Direction.HardLeft;
    }
    if (degreeNormalized >= 67.5) {
      return Direction.Right;
    }
    if (degreeNormalized >= 22.5) {
      return Direction.SlightRight;
    }
    // Should not be reachable but just in case
    else {
      return Direction.Straight;
    }
  }

  private getDistanceFromLastStep({
    previousPoint,
    currentPoint,
    nextPoint,
  }: {
    previousPoint: Feature;
    currentPoint: Feature;
    nextPoint: Feature;
  }) {
    if (!previousPoint) {
      return 0;
    }
    if (previousPoint.isLevelChanger && currentPoint.isLevelChanger) {
      return 0;
    }
    const distance = turf.distance(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
    return distance * 1000;
  }

  private getLevelChangerDirection({
    previousPoint,
    currentPoint,
    nextPoint,
  }: {
    previousPoint: Feature;
    currentPoint: Feature;
    nextPoint: Feature;
  }) {
    if (currentPoint.isLevelChanger && nextPoint.properties.level > currentPoint.properties.level) {
      return Direction.Up;
    }
    if (currentPoint.isLevelChanger && nextPoint.properties.level < currentPoint.properties.level) {
      return Direction.Down;
    }
  }

  private getLineStringFeatureFromLastStep({
    previousPoint,
    currentPoint,
    nextPoint,
  }: {
    previousPoint: Feature;
    currentPoint: Feature;
    nextPoint: Feature;
  }) {
    if (!previousPoint) {
      return null;
    }
    if (currentPoint.properties.level !== previousPoint.properties.level) {
      return null;
    }
    const lineString = turf.lineString([previousPoint.geometry.coordinates, currentPoint.geometry.coordinates]);
    return lineString;
  }

  private degreeNormalized(degrees: number) {
    if (degrees > 180) {
      return degrees - 360;
    } else if (degrees < -180) {
      return degrees + 360;
    } else {
      return degrees;
    }
  }
}
