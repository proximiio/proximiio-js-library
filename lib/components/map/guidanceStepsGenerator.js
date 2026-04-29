import Feature from '../../models/feature';
import bearing from '@turf/bearing';
import distance from '@turf/distance';
import { lineString } from '@turf/helpers';
import { translations } from './i18n';
import nearestPoint from '@turf/nearest-point';
import { getFloorName } from '../../common';
var Direction;
(function (Direction) {
    Direction["Start"] = "START";
    Direction["Finish"] = "FINISH";
    Direction["UpStaircase"] = "UP_STAIRS";
    Direction["UpEscalator"] = "UP_ESCALATOR";
    Direction["UpElevator"] = "UP_ELEVATOR";
    Direction["UpRamp"] = "UP_RAMP";
    Direction["DownStaircase"] = "DOWN_STAIRS";
    Direction["DownEscalator"] = "DOWN_ESCALATOR";
    Direction["DownElevator"] = "DOWN_ELEVATOR";
    Direction["DownRamp"] = "DOWN_RAMP";
    Direction["Exit"] = "EXIT";
    Direction["ExitStaircase"] = "EXIT_STAIRS";
    Direction["ExitEscalator"] = "EXIT_ESCALATOR";
    Direction["ExitElevator"] = "EXIT_ELEVATOR";
    Direction["ExitRamp"] = "EXIT_RAMP";
    Direction["At"] = "AT";
    Direction["AtStaircase"] = "AT_STAIRS";
    Direction["AtEscalator"] = "AT_ESCALATOR";
    Direction["AtElevator"] = "AT_ELEVATOR";
    Direction["AtRamp"] = "AT_RAMP";
    Direction["Up"] = "UP";
    Direction["Down"] = "DOWN";
    Direction["Left"] = "LEFT";
    Direction["Right"] = "RIGHT";
    Direction["Straight"] = "STRAIGHT";
    Direction["TurnAround"] = "TURN_AROUND";
    Direction["HardLeft"] = "HARD_LEFT";
    Direction["SlightLeft"] = "SLIGHT_LEFT";
    Direction["HardRight"] = "HARD_RIGHT";
    Direction["SlightRight"] = "SLIGHT_RIGHT";
})(Direction || (Direction = {}));
var LevelChangerTypes;
(function (LevelChangerTypes) {
    LevelChangerTypes["staircase"] = "STAIRS";
    LevelChangerTypes["escalator"] = "ESCALATOR";
    LevelChangerTypes["elevator"] = "ELEVATOR";
    LevelChangerTypes["ramp"] = "RAMP";
})(LevelChangerTypes || (LevelChangerTypes = {}));
export default class GuidanceStepsGenerator {
    constructor({ points, language, stepsNavigation, pois, levelChangers, initialBearing, floors, currentFloor, }) {
        this.capitalize = (s) => s && String(s[0]).toUpperCase() + String(s).slice(1);
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
                    if (point.isLevelChanger && (next === null || next === void 0 ? void 0 : next.isLevelChanger) && point.properties.level !== next.properties.level) {
                        const transition = new Feature(Object.assign({}, point));
                        return [point, transition];
                    }
                    return [point];
                });
            }
            this.generateStepsFromPoints();
        }
    }
    generateStepsFromPoints() {
        this.steps = this.points.map((point, index) => {
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
            const direction = this.getStepDirection(data);
            const nextStepDirection = this.getStepDirection({
                previousPoint: currentPoint,
                currentPoint: nextPoint,
                nextPoint: secondNextPoint,
            });
            const distanceFromLastStep = this.getDistanceFromLastStep(data);
            const extendedData = Object.assign(Object.assign({}, data), { direction, distanceFromLastStep });
            if (this.stepsNavigation === 'landmark' &&
                (direction === Direction.Start ||
                    (direction === Direction.Finish && currentPoint.isPoi) ||
                    direction === Direction.TurnAround ||
                    direction === `${Direction.Exit}_${LevelChangerTypes[currentPoint.properties.type]}` ||
                    distanceFromLastStep === 0)) {
                return;
            }
            if (this.stepsNavigation === 'landmark-levelChangers' &&
                (direction === Direction.Start ||
                    (direction === Direction.Finish && currentPoint.isPoi) ||
                    direction === Direction.TurnAround)) {
                return;
            }
            if (this.stepsNavigation === 'full' &&
                (direction === Direction.Start ||
                    direction === Direction.TurnAround ||
                    direction === `${Direction.Exit}_${LevelChangerTypes[currentPoint.properties.type]}` ||
                    distanceFromLastStep === 0)) {
                return;
            }
            if (this.stepsNavigation === 'full-levelChangers' &&
                (direction === Direction.Start || direction === Direction.TurnAround)) {
                return;
            }
            const step = {
                bearingFromLastStep: this.getBearingFromLastStep(data),
                coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]],
                direction: this.landmarkSteps
                    ? nextStepDirection === Direction.Finish && (nextPoint === null || nextPoint === void 0 ? void 0 : nextPoint.isPoi)
                        ? Direction.Finish
                        : direction
                    : direction,
                distanceFromLastStep,
                level: point.properties.level,
                levelChangerId: currentPoint.isLevelChanger ? currentPoint.id : null,
                levelChangerType: currentPoint.isLevelChanger ? currentPoint.properties.type : null,
                levelChangerDirection: currentPoint.isLevelChanger ? this.getLevelChangerDirection(data) : null,
                levelChangerDestinationLevel: currentPoint.isLevelChanger && nextPoint.properties.level !== currentPoint.properties.level
                    ? nextPoint.properties.level
                    : null,
                lineStringFeatureFromLastStep: this.getLineStringFeatureFromLastStep(data),
            };
            const destinationFloor = step.levelChangerDestinationLevel && this.floors.filter((f) => f.level === step.levelChangerDestinationLevel)
                ? this.floors.filter((f) => f.level === step.levelChangerDestinationLevel)[0]
                : this.currentFloor;
            step.destinationFloor = destinationFloor;
            return Object.assign(Object.assign({}, step), { instruction: this.generateInstruction(Object.assign(Object.assign({}, extendedData), { step })) });
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
                }
                else {
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
                const stepsUntilDistance = step.stepsUntil && step.stepsUntil.length > 0
                    ? step.stepsUntil.reduce((total, item) => total + item.distanceFromLastStep, 0)
                    : 0;
                const totalDistance = step.distanceFromLastStep + stepsUntilDistance;
                const simplifiedStep = Object.assign(Object.assign({}, step), { totalDistance });
                return Object.assign(Object.assign({}, simplifiedStep), { instruction: this.generateInstruction({ direction: simplifiedStep.direction, step: simplifiedStep }) });
            });
        }
    }
    generateInstruction(params) {
        if (this.simpleSteps)
            return this.generateSimpleInstruction(params);
        if (this.fullSteps)
            return this.generateFullInstruction(params);
        if (this.landmarkSteps)
            return this.generateLandmarkInstruction(params);
        return '';
    }
    // ─── Simple ───────────────────────────────────────────────────────────────────
    generateSimpleInstruction({ step, direction }) {
        var _a, _b, _c;
        if (!(step === null || step === void 0 ? void 0 : step.totalDistance) && !this.levelChangersSteps)
            return '';
        const t = translations[this.language];
        if (direction === 'FINISH') {
            return [
                this.capitalize(t.IN),
                step.totalDistance ? step.totalDistance.toFixed(0) : 0,
                t.METERS,
                this.getDirectionInstruction(direction),
            ].join(' ');
        }
        const floorName = ((_a = step.destinationFloor) === null || _a === void 0 ? void 0 : _a.name)
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
            (_c = t[(_b = step.levelChangerType) === null || _b === void 0 ? void 0 : _b.toUpperCase()]) === null || _c === void 0 ? void 0 : _c.toLowerCase(),
            t[step.levelChangerDirection],
            t.TO,
            floorName,
            t.FLOOR + '.',
        ].join(' ');
    }
    // ─── Full ─────────────────────────────────────────────────────────────────────
    generateFullInstruction({ direction, distanceFromLastStep, step, currentPoint, }) {
        const t = translations[this.language];
        if ((currentPoint === null || currentPoint === void 0 ? void 0 : currentPoint.isLevelChanger) && step && step.distanceFromLastStep) {
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
    generateFullLevelChangerInstruction({ step, t, }) {
        var _a;
        const floorName = ((_a = step.destinationFloor) === null || _a === void 0 ? void 0 : _a.name)
            ? getFloorName({ floor: step.destinationFloor, language: this.language })
            : String(step.destinationLevel);
        return [
            this.capitalize(t.IN),
            step.distanceFromLastStep.toFixed(0),
            t.METERS + ',',
            t.TAKE_THE,
            t[step.levelChangerType.toUpperCase()].toLowerCase(),
            t[step.levelChangerDirection],
            t.TO,
            floorName,
            t.FLOOR + '.',
        ].join(' ');
    }
    generateLevelChangerStepInstruction({ step, t, }) {
        var _a, _b, _c, _d, _e, _f, _g;
        const floorName = ((_a = step.destinationFloor) === null || _a === void 0 ? void 0 : _a.name)
            ? getFloorName({ floor: step.destinationFloor, language: this.language })
            : String(step.destinationLevel);
        const stepDirection = step.direction.split('_')[0];
        // at level changer step
        if (stepDirection === 'UP' || stepDirection === 'DOWN') {
            return [
                this.capitalize(t.YOU_ARE_AT_THE),
                ((_c = t[(_b = step.levelChangerType) === null || _b === void 0 ? void 0 : _b.toUpperCase()]) === null || _c === void 0 ? void 0 : _c.toLowerCase()) + ',',
                t.GO,
                t[step.levelChangerDirection],
                t.VIA,
                (_e = t[(_d = step.levelChangerType) === null || _d === void 0 ? void 0 : _d.toUpperCase()]) === null || _e === void 0 ? void 0 : _e.toLowerCase(),
                t.TO,
                floorName,
                t.FLOOR + '.',
            ].join(' ');
        }
        // exit level changer step
        if (stepDirection === 'EXIT') {
            return [
                this.capitalize(t.EXIT_THE),
                ((_g = t[(_f = step.levelChangerType) === null || _f === void 0 ? void 0 : _f.toUpperCase()]) === null || _g === void 0 ? void 0 : _g.toLowerCase()) + ',',
                t.YOU_ARE_AT.toLowerCase(),
                floorName,
                t.FLOOR + '.',
            ].join(' ');
        }
    }
    // ─── Landmark ────────────────────────────────────────────────────────────────
    generateLandmarkInstruction(params) {
        const parts = [];
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
    getLandmarkLevelChangerPrefix({ previousPoint, currentPoint, step }) {
        if (!(previousPoint === null || previousPoint === void 0 ? void 0 : previousPoint.isLevelChanger))
            return [];
        if (this.levelChangersSteps && (step === null || step === void 0 ? void 0 : step.levelChangerId))
            return [];
        const levelChangerFeature = this.levelChangers.find((f) => f.id === previousPoint.id);
        const levelChangeDirection = this.getStepDirection({
            previousPoint: levelChangerFeature,
            currentPoint: previousPoint,
            nextPoint: currentPoint,
            levelChangerDirection: true,
        });
        return [this.capitalize(this.getDirectionInstruction(levelChangeDirection))];
    }
    getLandmarkInitialBearingPrefix({ previousPoint, secondPreviousPoint, currentPoint, step, }) {
        if (secondPreviousPoint || !this.initialBearing)
            return [];
        if (this.levelChangersSteps && (step === null || step === void 0 ? void 0 : step.levelChangerId))
            return [];
        const bearingVar = bearing(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates) - this.initialBearing;
        const dir = this.getDirectionFromBearing(bearingVar);
        return [this.getDirectionInstruction(dir)];
    }
    getLandmarkDistancePrefix({ distanceFromLastStep, currentPoint, step }) {
        if (!distanceFromLastStep || distanceFromLastStep <= 0)
            return [];
        if (this.levelChangersSteps && (currentPoint === null || currentPoint === void 0 ? void 0 : currentPoint.isLevelChanger))
            return [];
        if (this.levelChangersSteps && (step === null || step === void 0 ? void 0 : step.levelChangerId))
            return [];
        const t = translations[this.language];
        return [this.capitalize(t.IN), distanceFromLastStep.toFixed(0), t.METERS];
    }
    getLandmarkDirectionWithContext({ currentPoint, nextPoint, secondNextPoint, direction, step, }) {
        var _a, _b, _c, _d, _e;
        const t = translations[this.language];
        const nextPointDirection = this.getStepDirection({
            previousPoint: currentPoint,
            currentPoint: nextPoint,
            nextPoint: secondNextPoint,
        });
        // Approaching a POI destination
        if (nextPointDirection === Direction.Finish && (nextPoint === null || nextPoint === void 0 ? void 0 : nextPoint.isPoi)) {
            const title = (_b = (_a = nextPoint.properties.title_i18n) === null || _a === void 0 ? void 0 : _a[this.language]) !== null && _b !== void 0 ? _b : nextPoint.properties.title;
            return [t.DESTINATION, title, t.navInstructions[direction]];
        }
        const directionInstruction = this.getDirectionInstruction(direction);
        // Exiting a level changer
        if (currentPoint === null || currentPoint === void 0 ? void 0 : currentPoint.isLevelChanger) {
            const floorName = ((_c = step.destinationFloor) === null || _c === void 0 ? void 0 : _c.name)
                ? getFloorName({ floor: step.destinationFloor, language: this.language })
                : String(step.destinationLevel);
            if (this.levelChangersSteps) {
                if (step.distanceFromLastStep > 0) {
                    return [this.generateFullLevelChangerInstruction({ step, t })];
                }
                else {
                    return [this.generateLevelChangerStepInstruction({ step, t })];
                }
            }
            else {
                // Trim trailing punctuation from direction instruction before appending floor
                return [`${directionInstruction.replace(/[.,]$/, '')} ${t.TO} ${floorName} ${t.FLOOR}.`];
            }
        }
        // Standard landmark: direction + nearest POI
        const floorPois = {
            type: 'FeatureCollection',
            features: this.pois.filter((f) => f.properties.level === currentPoint.properties.level),
        };
        const nearestPoi = nearestPoint(currentPoint.geometry.coordinates, floorPois);
        const poiTitle = (_e = (_d = nearestPoi.properties.title_i18n) === null || _d === void 0 ? void 0 : _d[this.language]) !== null && _e !== void 0 ? _e : nearestPoi.properties.title;
        return [`${directionInstruction.replace(/[.,]$/, '')} ${t.BY} ${poiTitle}`];
    }
    getDirectionInstruction(direction) {
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
    getBearingFromLastStep({ previousPoint, currentPoint, nextPoint, }) {
        if (!previousPoint) {
            return 0;
        }
        const bearingVar = bearing(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
        return bearingVar;
    }
    getStepDirection({ previousPoint, currentPoint, nextPoint, levelChangerDirection = false, }) {
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
        const bearingVar = bearing(currentPoint.geometry.coordinates, nextPoint.geometry.coordinates) -
            bearing(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
        return this.getDirectionFromBearing(bearingVar);
    }
    getDirectionFromBearing(bearingValue) {
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
    getDistanceFromLastStep({ previousPoint, currentPoint, nextPoint, }) {
        if (!previousPoint) {
            return 0;
        }
        if (previousPoint.isLevelChanger && currentPoint.isLevelChanger) {
            return 0;
        }
        const distanceVar = distance(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
        return distanceVar * 1000;
    }
    getLevelChangerDirection({ previousPoint, currentPoint, nextPoint, }) {
        if (currentPoint.isLevelChanger && nextPoint.properties.level > currentPoint.properties.level) {
            return Direction.Up;
        }
        if (currentPoint.isLevelChanger && nextPoint.properties.level < currentPoint.properties.level) {
            return Direction.Down;
        }
    }
    getLineStringFeatureFromLastStep({ previousPoint, currentPoint, nextPoint, }) {
        if (!previousPoint) {
            return null;
        }
        if (currentPoint.properties.level !== previousPoint.properties.level) {
            return null;
        }
        const lineStringVar = lineString([previousPoint.geometry.coordinates, currentPoint.geometry.coordinates]);
        return lineStringVar;
    }
    degreeNormalized(degrees) {
        if (degrees > 180) {
            return degrees - 360;
        }
        else if (degrees < -180) {
            return degrees + 360;
        }
        else {
            return degrees;
        }
    }
}
