import Feature from '../../models/feature';
import { GuidanceStep } from '../../models/wayfinding';
import bearing from '@turf/bearing';
import distance from '@turf/distance';
import { FeatureCollection, lineString } from '@turf/helpers';
import { translations } from './i18n';
import nearestPoint from '@turf/nearest-point';

enum Direction {
  Start = 'START',
  Finish = 'FINISH',
  UpStaircase = 'UP_STAIRS',
  UpEscalator = 'UP_ESCALATOR',
  UpElevator = 'UP_ELEVATOR',
  UpRamp = 'UP_RAMP',
  DownStaircase = 'DOWN_STAIRS',
  DownEscalator = 'DOWN_ESCALATOR',
  DownElevator = 'DOWN_ELEVATOR',
  DownRamp = 'DOWN_RAMP',
  Exit = 'EXIT',
  ExitStaircase = 'EXIT_STAIRS',
  ExitEscalator = 'EXIT_ESCALATOR',
  ExitElevator = 'EXIT_ELEVATOR',
  ExitRamp = 'EXIT_RAMP',
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
  language: string;
  landMarkNav: boolean;
  pois?: Feature[];

  constructor({
    points,
    language,
    landMarkNav,
    pois,
  }: {
    points: Feature[];
    language: string;
    landMarkNav: boolean;
    pois?: Feature[];
  }) {
    this.points = points;
    this.language = language;
    if (landMarkNav) {
      this.landMarkNav = landMarkNav;
      this.pois = pois;
    }
    if (this.points && this.points.length > 0) {
      this.generateStepsFromPoints();
    }
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

      const direction: Direction | string = this.getStepDirection(data);
      const distanceFromLastStep = this.getDistanceFromLastStep(data);

      const extendedData = { ...data, direction, distanceFromLastStep };

      if (
        this.landMarkNav &&
        (direction === Direction.Start ||
          direction === Direction.TurnAround ||
          direction === `${Direction.Exit}_${LevelChangerTypes[currentPoint.properties.type]}` ||
          distanceFromLastStep === 0)
      ) {
        return;
      }

      return {
        bearingFromLastStep: this.getBearingFromLastStep(data),
        coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]],
        direction,
        distanceFromLastStep,
        level: point.properties.level,
        levelChangerId: currentPoint.isLevelChanger ? currentPoint.id : null,
        levelChangerType: currentPoint.isLevelChanger ? currentPoint.properties.type : null,
        levelChangerDirection: currentPoint.isLevelChanger ? this.getLevelChangerDirection(data) : null,
        levelChangerDestinationLevel:
          currentPoint.isLevelChanger && nextPoint.properties.level !== currentPoint.properties.level
            ? nextPoint.properties.level
            : null,
        lineStringFeatureFromLastStep: this.getLineStringFeatureFromLastStep(data),
        instruction: this.generateInstruction(extendedData), // New attribute
      };
    });
  }

  private generateInstruction({
    previousPoint,
    currentPoint,
    nextPoint,
    direction,
    distanceFromLastStep,
  }: {
    previousPoint: Feature;
    currentPoint: Feature;
    nextPoint: Feature;
    direction: Direction | string;
    distanceFromLastStep: number;
  }) {
    let instruction = '';
    if (distanceFromLastStep > 0) {
      instruction += `${translations[this.language].IN} ${distanceFromLastStep.toFixed(0)} ${
        translations[this.language].METERS
      } `;
    }

    switch (direction) {
      case Direction.Start:
        instruction += translations[this.language].START;
        break;
      case Direction.Finish:
        instruction += translations[this.language].DESTINATION;
        break;
      case Direction.Straight:
        instruction += translations[this.language].STRAIGHT;
        break;
      case Direction.TurnAround:
        instruction += translations[this.language].TURN_AROUND;
        break;
      case Direction.HardLeft:
        instruction += translations[this.language].HARD_LEFT;
        break;
      case Direction.SlightLeft:
        instruction += translations[this.language].SLIGHT_LEFT;
        break;
      case Direction.Left:
        instruction += translations[this.language].LEFT;
        break;
      case Direction.HardRight:
        instruction += translations[this.language].HARD_RIGHT;
        break;
      case Direction.SlightRight:
        instruction += translations[this.language].SLIGHT_RIGHT;
        break;
      case Direction.Right:
        instruction += translations[this.language].RIGHT;
        break;
      case Direction.UpStaircase:
        instruction += translations[this.language].UP_STAIRCASE;
        break;
      case Direction.UpEscalator:
        instruction += translations[this.language].UP_ESCALATOR;
        break;
      case Direction.UpElevator:
        instruction += translations[this.language].UP_ELEVATOR;
        break;
      case Direction.UpRamp:
        instruction += translations[this.language].UP_RAMP;
        break;
      case Direction.DownStaircase:
        instruction += translations[this.language].DOWN_STAIRCASE;
        break;
      case Direction.DownEscalator:
        instruction += translations[this.language].DOWN_ESCALATOR;
        break;
      case Direction.DownElevator:
        instruction += translations[this.language].DOWN_ELEVATOR;
        break;
      case Direction.DownRamp:
        instruction += translations[this.language].DOWN_RAMP;
        break;
      case Direction.ExitStaircase:
        instruction += translations[this.language].EXIT_STAIRCASE;
        break;
      case Direction.ExitEscalator:
        instruction += translations[this.language].EXIT_ESCALATOR;
        break;
      case Direction.ExitElevator:
        instruction += translations[this.language].EXIT_ELEVATOR;
        break;
      case Direction.ExitRamp:
        instruction += translations[this.language].EXIT_RAMP;
        break;
      default:
        instruction += translations[this.language].CONTINUE;
        break;
    }

    if (direction === Direction.TurnAround || direction === Direction.Start || direction === Direction.Finish) {
      return instruction;
    }

    if (this.landMarkNav) {
      const featureCollection = {
        type: 'FeatureCollection',
        features: this.pois.filter((feature: Feature) => feature.properties.level === currentPoint.properties.level),
      };
      const nearestPoi = nearestPoint(currentPoint.geometry.coordinates, featureCollection as any);
      instruction = `${instruction.slice(0, -1)} ${translations[this.language].BY} ${
        nearestPoi.properties.title_i18n && nearestPoi.properties.title_i18n[this.language]
          ? nearestPoi.properties.title_i18n[this.language]
          : nearestPoi.properties.title
      }`;
    }

    return instruction;
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
    const bearingVar = bearing(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
    return bearingVar;
  }

  private getStepDirection({
    previousPoint,
    currentPoint,
    nextPoint,
  }: {
    previousPoint: Feature;
    currentPoint: Feature;
    nextPoint: Feature;
  }): Direction | string {
    if (!previousPoint) {
      return Direction.Start;
    }
    if (!nextPoint) {
      return Direction.Finish;
    }
    if (currentPoint.isPoi && nextPoint.isPoi && currentPoint.id === nextPoint.id) {
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

    const bearingVar =
      bearing(currentPoint.geometry.coordinates, nextPoint.geometry.coordinates) -
      bearing(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
    const degreeNormalized = this.degreeNormalized(bearingVar);

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
    const distanceVar = distance(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
    return distanceVar * 1000;
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
    const lineStringVar = lineString([previousPoint.geometry.coordinates, currentPoint.geometry.coordinates]);
    return lineStringVar;
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
