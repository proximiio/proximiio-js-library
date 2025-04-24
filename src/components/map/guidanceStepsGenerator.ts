import Feature from '../../models/feature';
import { GuidanceStep } from '../../models/wayfinding';
import bearing from '@turf/bearing';
import distance from '@turf/distance';
import { feature, FeatureCollection, lineString } from '@turf/helpers';
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
  levelChangers?: Feature[];

  constructor({
    points,
    language,
    landMarkNav,
    pois,
    levelChangers,
  }: {
    points: Feature[];
    language: string;
    landMarkNav: boolean;
    pois?: Feature[];
    levelChangers?: Feature[];
  }) {
    this.points = points;
    this.language = language;
    if (landMarkNav) {
      this.landMarkNav = landMarkNav;
      this.pois = pois;
      this.levelChangers = levelChangers;
    }
    if (this.points && this.points.length > 0) {
      this.generateStepsFromPoints();
    }
  }

  private capitalize = (s: string) => s && String(s[0]).toUpperCase() + String(s).slice(1);

  private generateStepsFromPoints() {
    this.steps = this.points.map((point: Feature, index: number) => {
      const previousPoint = this.points[index - 1] ? new Feature(this.points[index - 1]) : null;
      const currentPoint = new Feature(point);
      const nextPoint = this.points[index + 1] ? new Feature(this.points[index + 1]) : null;
      const secondNextPoint = this.points[index + 2] ? new Feature(this.points[index + 2]) : null;

      const data = {
        previousPoint,
        currentPoint,
        nextPoint,
        secondNextPoint,
      };

      const direction: Direction | string = this.getStepDirection(data);
      const nextStepDirection: Direction | string = this.getStepDirection({
        previousPoint: currentPoint,
        currentPoint: nextPoint,
        nextPoint: secondNextPoint,
      });
      const distanceFromLastStep = this.getDistanceFromLastStep(data);

      const extendedData = { ...data, direction, distanceFromLastStep };

      if (
        this.landMarkNav &&
        (direction === Direction.Start ||
          direction === Direction.Finish ||
          direction === Direction.TurnAround ||
          direction === `${Direction.Exit}_${LevelChangerTypes[currentPoint.properties.type]}` ||
          distanceFromLastStep === 0)
      ) {
        return;
      }

      return {
        bearingFromLastStep: this.getBearingFromLastStep(data),
        coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]],
        direction: this.landMarkNav
          ? nextStepDirection === Direction.Finish
            ? Direction.Finish
            : direction
          : direction,
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
    secondNextPoint,
    direction,
    distanceFromLastStep,
  }: {
    previousPoint: Feature;
    currentPoint: Feature;
    nextPoint: Feature;
    secondNextPoint: Feature;
    direction: Direction | string;
    distanceFromLastStep: number;
  }) {
    let instruction = '';

    if (previousPoint.isLevelChanger) {
      const levelChangerFeature = this.levelChangers.find((f) => f.id === previousPoint.id);
      const levelChangeDirection = this.getStepDirection({
        previousPoint: levelChangerFeature,
        currentPoint: previousPoint,
        nextPoint: currentPoint,
        levelChangerDirection: true,
      });
      instruction += `${this.capitalize(this.getDirectionInstruction(levelChangeDirection))} `;
    }

    if (distanceFromLastStep > 0) {
      instruction += `${this.capitalize(translations[this.language].IN)} ${distanceFromLastStep.toFixed(0)} ${
        translations[this.language].METERS
      } `;
    }

    if (direction === Direction.TurnAround || direction === Direction.Start || direction === Direction.Finish) {
      instruction += this.getDirectionInstruction(direction);
      return instruction;
    }

    if (this.landMarkNav) {
      const featureCollection = {
        type: 'FeatureCollection',
        features: this.pois.filter((f: Feature) => f.properties.level === currentPoint.properties.level),
      };

      const nextPointDirection = this.getStepDirection({
        previousPoint: currentPoint,
        currentPoint: nextPoint,
        nextPoint: secondNextPoint,
      });

      if (nextPointDirection === Direction.Finish) {
        instruction += `${translations[this.language].DESTINATION} ${
          nextPoint.properties.title_i18n && nextPoint.properties.title_i18n[this.language]
            ? nextPoint.properties.title_i18n[this.language]
            : nextPoint.properties.title
        } ${translations[this.language].IS_ON_YOUR} ${this.getDirectionInstruction(direction).replace('turn ', '')}`;
        return instruction;
      }

      instruction += this.getDirectionInstruction(direction);

      const nearestPoi = nearestPoint(currentPoint.geometry.coordinates, featureCollection as any);
      instruction = `${instruction.slice(0, -1)} ${translations[this.language].BY} ${
        nearestPoi.properties.title_i18n && nearestPoi.properties.title_i18n[this.language]
          ? nearestPoi.properties.title_i18n[this.language]
          : nearestPoi.properties.title
      }`;
    }

    return instruction;
  }

  private getDirectionInstruction(direction: string): string {
    switch (direction) {
      case Direction.Start:
        return translations[this.language].START;
      case Direction.Finish:
        return translations[this.language].DESTINATION;
      case Direction.Straight:
        return translations[this.language].STRAIGHT;
      case Direction.TurnAround:
        return translations[this.language].TURN_AROUND;
      case Direction.HardLeft:
        return translations[this.language].HARD_LEFT;
      case Direction.SlightLeft:
        return translations[this.language].SLIGHT_LEFT;
      case Direction.Left:
        return translations[this.language].LEFT;
      case Direction.HardRight:
        return translations[this.language].HARD_RIGHT;
      case Direction.SlightRight:
        return translations[this.language].SLIGHT_RIGHT;
      case Direction.Right:
        return translations[this.language].RIGHT;
      case Direction.UpStaircase:
        return translations[this.language].UP_STAIRCASE;
      case Direction.UpEscalator:
        return translations[this.language].UP_ESCALATOR;
      case Direction.UpElevator:
        return translations[this.language].UP_ELEVATOR;
      case Direction.UpRamp:
        return translations[this.language].UP_RAMP;
      case Direction.DownStaircase:
        return translations[this.language].DOWN_STAIRCASE;
      case Direction.DownEscalator:
        return translations[this.language].DOWN_ESCALATOR;
      case Direction.DownElevator:
        return translations[this.language].DOWN_ELEVATOR;
      case Direction.DownRamp:
        return translations[this.language].DOWN_RAMP;
      case Direction.ExitStaircase:
        return translations[this.language].EXIT_STAIRCASE;
      case Direction.ExitEscalator:
        return translations[this.language].EXIT_ESCALATOR;
      case Direction.ExitElevator:
        return translations[this.language].EXIT_ELEVATOR;
      case Direction.ExitRamp:
        return translations[this.language].EXIT_RAMP;
      default:
        return translations[this.language].CONTINUE;
    }
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
    levelChangerDirection = false,
  }: {
    previousPoint: Feature;
    currentPoint: Feature;
    nextPoint: Feature;
    levelChangerDirection?: boolean;
  }): Direction | string {
    if (!levelChangerDirection) {
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
