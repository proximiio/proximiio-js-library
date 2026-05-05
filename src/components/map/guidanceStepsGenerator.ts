import Feature from '../../models/feature';
import { GuidanceStep } from '../../models/wayfinding';
import bearing from '@turf/bearing';
import distance from '@turf/distance';
import { feature, FeatureCollection, lineString } from '@turf/helpers';
import { translations } from './i18n';
import nearestPoint from '@turf/nearest-point';
import { FloorModel } from '../../models/floor';
import { getFloorName } from '../../common';

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
  At = 'AT',
  AtStaircase = 'AT_STAIRS',
  AtEscalator = 'AT_ESCALATOR',
  AtElevator = 'AT_ELEVATOR',
  AtRamp = 'AT_RAMP',
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

interface GenerateInstructionParams {
  previousPoint?: Feature;
  secondPreviousPoint?: Feature;
  currentPoint?: Feature;
  nextPoint?: Feature;
  secondNextPoint?: Feature;
  direction?: Direction | string;
  distanceFromLastStep?: number;
  step?: GuidanceStep;
}

export default class GuidanceStepsGenerator {
  points: Feature[];
  steps: GuidanceStep[];
  language: string;
  stepsNavigation:
    | 'disabled'
    | 'simple'
    | 'simple-levelChangers'
    | 'full'
    | 'full-levelChangers'
    | 'landmark'
    | 'landmark-levelChangers';
  pois?: Feature[];
  levelChangers?: Feature[];
  initialBearing: number;
  landmarkSteps: boolean;
  fullSteps: boolean;
  simpleSteps: boolean;
  levelChangersSteps: boolean;
  floors: FloorModel[];
  currentFloor: FloorModel;

  constructor({
    points,
    language,
    stepsNavigation,
    pois,
    levelChangers,
    initialBearing,
    floors,
    currentFloor,
  }: {
    points: Feature[];
    language: string;
    stepsNavigation:
      | 'disabled'
      | 'simple'
      | 'simple-levelChangers'
      | 'full'
      | 'full-levelChangers'
      | 'landmark'
      | 'landmark-levelChangers';
    pois?: Feature[];
    levelChangers?: Feature[];
    initialBearing: number;
    floors: FloorModel[];
    currentFloor: FloorModel;
  }) {
    this.points = points;
    this.language = language;
    this.stepsNavigation = stepsNavigation;
    this.floors = floors;
    this.currentFloor = currentFloor;
    this.landmarkSteps = this.stepsNavigation === 'landmark' || this.stepsNavigation === 'landmark-levelChangers';
    this.fullSteps = this.stepsNavigation === 'full' || this.stepsNavigation === 'full-levelChangers';
    this.simpleSteps = this.stepsNavigation === 'simple' || this.stepsNavigation === 'simple-levelChangers';
    this.levelChangersSteps =
      this.stepsNavigation === 'simple-levelChangers' ||
      this.stepsNavigation === 'full-levelChangers' ||
      this.stepsNavigation === 'landmark-levelChangers';
    if (this.landmarkSteps) {
      this.pois = pois;
      this.levelChangers = levelChangers;
      this.initialBearing = initialBearing;
    }
    if (this.points && this.points.length > 0) {
      if (this.levelChangersSteps) {
        this.points = this.points.flatMap((point, i) => {
          const next = this.points[i + 1];

          if (point.isLevelChanger && next?.isLevelChanger && point.properties.level !== next.properties.level) {
            const transition = new Feature({
              ...point,
            });
            return [point, transition];
          }

          return [point];
        });
      }
      this.generateStepsFromPoints();
    }
  }

  private capitalize = (s: string) => s && String(s[0]).toUpperCase() + String(s).slice(1);

  private generateStepsFromPoints() {
    this.steps = this.points.map((point: Feature, index: number) => {
      const previousPoint = this.points[index - 1] ? new Feature(this.points[index - 1]) : null;
      const secondPreviousPoint = this.points[index - 2] ? new Feature(this.points[index - 2]) : null;
      const currentPoint = new Feature(point);
      const nextPoint = this.points[index + 1] ? new Feature(this.points[index + 1]) : null;
      const secondNextPoint = this.points[index + 2] ? new Feature(this.points[index + 2]) : null;

      const data = {
        previousPoint,
        secondPreviousPoint,
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
        this.stepsNavigation === 'landmark' &&
        (direction === Direction.Start ||
          (direction === Direction.Finish && currentPoint.isPoi) ||
          direction === Direction.TurnAround ||
          direction === `${Direction.Exit}_${LevelChangerTypes[currentPoint.properties.type]}` ||
          distanceFromLastStep === 0)
      ) {
        return;
      }

      if (
        this.stepsNavigation === 'landmark-levelChangers' &&
        (direction === Direction.Start ||
          (direction === Direction.Finish && currentPoint.isPoi) ||
          direction === Direction.TurnAround)
      ) {
        return;
      }

      if (
        this.stepsNavigation === 'full' &&
        (direction === Direction.Start ||
          direction === Direction.TurnAround ||
          direction === `${Direction.Exit}_${LevelChangerTypes[currentPoint.properties.type]}` ||
          distanceFromLastStep === 0)
      ) {
        return;
      }

      if (
        this.stepsNavigation === 'full-levelChangers' &&
        (direction === Direction.Start || direction === Direction.TurnAround)
      ) {
        return;
      }

      const step: GuidanceStep = {
        bearingFromLastStep: this.getBearingFromLastStep(data),
        coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]],
        direction: this.landmarkSteps
          ? nextStepDirection === Direction.Finish && nextPoint?.isPoi
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
      };

      const destinationFloor =
        step.levelChangerDestinationLevel && this.floors.filter((f) => f.level === step.levelChangerDestinationLevel)
          ? this.floors.filter((f) => f.level === step.levelChangerDestinationLevel)[0]
          : this.currentFloor;

      step.destinationFloor = destinationFloor;

      return {
        ...step,
        instruction: this.generateInstruction({ ...extendedData, step }), // New attribute
      };
    });

    if (this.simpleSteps) {
      let previousIndex = 0;
      this.steps = this.steps
        .filter((i, index, array) => {
          // Get the first part of the direction string
          const direction = i.direction.split('_')[0];
          if (this.stepsNavigation === 'simple') {
            // Check if the current step is a level changer and has a valid direction or is finish
            if ((i.levelChangerId && (direction === 'UP' || direction === 'DOWN')) || i.direction === 'FINISH') {
              i.stepsUntil = array.slice(previousIndex, index);
              previousIndex = index + 1;
              return i;
            }
          } else {
            if (i.levelChangerId) {
              i.stepsUntil = array.slice(previousIndex, index);
              previousIndex = index + 1;
              return i;
            }
            if (i.direction === 'FINISH') {
              i.stepsUntil = array.slice(previousIndex, index);
              previousIndex = index + 1;
              return i;
            }
          }
        })
        .map((step) => {
          const stepsUntilDistance =
            step.stepsUntil && step.stepsUntil.length > 0
              ? step.stepsUntil!.reduce((total, item) => total + item.distanceFromLastStep, 0)
              : 0;
          const totalDistance = step.distanceFromLastStep + stepsUntilDistance;

          const simplifiedStep = {
            ...step,
            totalDistance,
          };

          return {
            ...simplifiedStep,
            instruction: this.generateInstruction({ direction: simplifiedStep.direction, step: simplifiedStep }),
          };
        });
    }
  }

  private generateInstruction(params: GenerateInstructionParams): string {
    if (this.simpleSteps) return this.generateSimpleInstruction(params);
    if (this.fullSteps) return this.generateFullInstruction(params);
    if (this.landmarkSteps) return this.generateLandmarkInstruction(params);
    return '';
  }

  // ─── Simple ───────────────────────────────────────────────────────────────────

  private generateSimpleInstruction({ step, direction }: GenerateInstructionParams): string {
    if (!step?.totalDistance && !this.levelChangersSteps) return '';

    const t = translations[this.language];

    if (direction === 'FINISH') {
      return [
        this.capitalize(t.IN),
        step.totalDistance ? step.totalDistance.toFixed(0) : 0,
        t.METERS,
        this.getDirectionInstruction(direction),
      ].join(' ');
    }

    const floorName = step.destinationFloor?.name
      ? getFloorName({ floor: step.destinationFloor, language: this.language })
      : String(step.destinationLevel);

    if (this.levelChangersSteps && step.levelChangerId && !step.distanceFromLastStep) {
      return this.generateLevelChangerStepInstruction({ step, t });
    }

    return [
      this.capitalize(t.GO),
      step.totalDistance ? step.totalDistance.toFixed(0) : 0,
      t.METERS,
      t.AND_TAKE_THE,
      t[LevelChangerTypes[step.levelChangerType]]?.toLowerCase(),
      t[step.levelChangerDirection],
      t.TO,
      floorName,
      t.FLOOR + '.',
    ].join(' ');
  }

  // ─── Full ─────────────────────────────────────────────────────────────────────

  private generateFullInstruction({
    direction,
    distanceFromLastStep,
    step,
    currentPoint,
  }: GenerateInstructionParams): string {
    const t = translations[this.language];

    if (currentPoint?.isLevelChanger && step && step.distanceFromLastStep) {
      return this.generateFullLevelChangerInstruction({ step, t });
    }

    if (direction === Direction.Start) {
      return this.getDirectionInstruction(direction);
    }

    if (direction === Direction.Finish) {
      return [
        this.capitalize(t.IN),
        distanceFromLastStep.toFixed(0),
        t.METERS + ',',
        this.getDirectionInstruction(direction),
      ].join(' ');
    }

    if (distanceFromLastStep > 0) {
      return [
        this.capitalize(t.IN),
        distanceFromLastStep.toFixed(0),
        t.METERS + ',',
        this.getDirectionInstruction(direction),
      ].join(' ');
    }

    if (this.levelChangersSteps && step.levelChangerId) {
      return this.generateLevelChangerStepInstruction({ step, t });
    }

    // Fallback: no distance yet (first step or distance not available)
    return this.capitalize(this.getDirectionInstruction(direction));
  }

  private generateFullLevelChangerInstruction({
    step,
    t,
  }: {
    step: GuidanceStep;
    t: (typeof translations)[keyof typeof translations];
  }): string {
    const floorName = step.destinationFloor?.name
      ? getFloorName({ floor: step.destinationFloor, language: this.language })
      : String(step.destinationLevel);

    return [
      this.capitalize(t.IN),
      step.distanceFromLastStep.toFixed(0),
      t.METERS + ',',
      t.TAKE_THE,
      t[LevelChangerTypes[step.levelChangerType]]?.toLowerCase(),
      t[step.levelChangerDirection],
      t.TO,
      floorName,
      t.FLOOR + '.',
    ].join(' ');
  }

  private generateLevelChangerStepInstruction({
    step,
    t,
  }: {
    step: GuidanceStep;
    t: (typeof translations)[keyof typeof translations];
  }): string {
    const floorName = step.destinationFloor?.name
      ? getFloorName({ floor: step.destinationFloor, language: this.language })
      : String(step.destinationLevel);

    const stepDirection = step.direction.split('_')[0];
    // at level changer step
    if (stepDirection === 'UP' || stepDirection === 'DOWN') {
      return [
        this.capitalize(t.YOU_ARE_AT_THE),
        t[LevelChangerTypes[step.levelChangerType]]?.toLowerCase() + ',',
        t.GO,
        t[step.levelChangerDirection],
        t.VIA,
        t[LevelChangerTypes[step.levelChangerType]]?.toLowerCase(),
        t.TO,
        floorName,
        t.FLOOR + '.',
      ].join(' ');
    }
    // exit level changer step
    if (stepDirection === 'EXIT') {
      return [
        this.capitalize(t.EXIT_THE),
        t[LevelChangerTypes[step.levelChangerType]]?.toLowerCase() + ',',
        t.YOU_ARE_AT.toLowerCase(),
        floorName,
        t.FLOOR + '.',
      ].join(' ');
    }
  }

  // ─── Landmark ────────────────────────────────────────────────────────────────

  private generateLandmarkInstruction(params: GenerateInstructionParams): string {
    const parts: string[] = [];

    parts.push(...this.getLandmarkLevelChangerPrefix(params));
    parts.push(...this.getLandmarkInitialBearingPrefix(params));
    parts.push(...this.getLandmarkDistancePrefix(params));

    const { direction } = params;

    if (direction === Direction.TurnAround || direction === Direction.Start || direction === Direction.Finish) {
      parts.push(this.getDirectionInstruction(direction));
      return parts.join(' ');
    }

    parts.push(...this.getLandmarkDirectionWithContext(params));
    return parts.join(' ');
  }

  private getLandmarkLevelChangerPrefix({ previousPoint, currentPoint, step }: GenerateInstructionParams): string[] {
    if (!previousPoint?.isLevelChanger) return [];
    if (this.levelChangersSteps && step?.levelChangerId) return [];

    const levelChangerFeature = this.levelChangers.find((f) => f.id === previousPoint.id);
    const levelChangeDirection = this.getStepDirection({
      previousPoint: levelChangerFeature,
      currentPoint: previousPoint,
      nextPoint: currentPoint,
      levelChangerDirection: true,
    });

    return [this.capitalize(this.getDirectionInstruction(levelChangeDirection))];
  }

  private getLandmarkInitialBearingPrefix({
    previousPoint,
    secondPreviousPoint,
    currentPoint,
    step,
  }: GenerateInstructionParams): string[] {
    if (secondPreviousPoint || !this.initialBearing) return [];
    if (this.levelChangersSteps && step?.levelChangerId) return [];

    const bearingVar =
      bearing(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates) - this.initialBearing;

    const dir = this.getDirectionFromBearing(bearingVar);
    return [this.getDirectionInstruction(dir)];
  }

  private getLandmarkDistancePrefix({ distanceFromLastStep, currentPoint, step }: GenerateInstructionParams): string[] {
    if (!distanceFromLastStep || distanceFromLastStep <= 0) return [];
    if (this.levelChangersSteps && currentPoint?.isLevelChanger) return [];
    if (this.levelChangersSteps && step?.levelChangerId) return [];

    const t = translations[this.language];
    return [this.capitalize(t.IN), distanceFromLastStep.toFixed(0), t.METERS];
  }

  private getLandmarkDirectionWithContext({
    currentPoint,
    nextPoint,
    secondNextPoint,
    direction,
    step,
  }: GenerateInstructionParams): string[] {
    const t = translations[this.language];

    const nextPointDirection = this.getStepDirection({
      previousPoint: currentPoint,
      currentPoint: nextPoint,
      nextPoint: secondNextPoint,
    });

    // Approaching a POI destination
    if (nextPointDirection === Direction.Finish && nextPoint?.isPoi) {
      const title = nextPoint.properties.title_i18n?.[this.language] ?? nextPoint.properties.title;
      return [t.DESTINATION, title, t.navInstructions[direction]];
    }

    const directionInstruction = this.getDirectionInstruction(direction);

    // Exiting a level changer
    if (currentPoint?.isLevelChanger) {
      const floorName = step.destinationFloor?.name
        ? getFloorName({ floor: step.destinationFloor, language: this.language })
        : String(step.destinationLevel);

      if (this.levelChangersSteps) {
        if (step.distanceFromLastStep > 0) {
          return [this.generateFullLevelChangerInstruction({ step, t })];
        } else {
          return [this.generateLevelChangerStepInstruction({ step, t })];
        }
      } else {
        // Trim trailing punctuation from direction instruction before appending floor
        return [`${directionInstruction.replace(/[.,]$/, '')} ${t.TO} ${floorName} ${t.FLOOR}.`];
      }
    }

    // Standard landmark: direction + nearest POI
    const floorPois = {
      type: 'FeatureCollection' as const,
      features: this.pois.filter((f: Feature) => f.properties.level === currentPoint.properties.level),
    };
    const nearestPoi = nearestPoint(currentPoint.geometry.coordinates, floorPois as any);
    const poiTitle = nearestPoi.properties.title_i18n?.[this.language] ?? nearestPoi.properties.title;

    return [`${directionInstruction.replace(/[.,]$/, '')} ${t.BY} ${poiTitle}`];
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

    return this.getDirectionFromBearing(bearingVar);
  }

  private getDirectionFromBearing(bearingValue: number) {
    const degreeNormalized = this.degreeNormalized(bearingValue);

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
