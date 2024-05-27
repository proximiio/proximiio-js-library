import Feature from '../../models/feature';
import bearing from '@turf/bearing';
import distance from '@turf/distance';
import { lineString } from '@turf/helpers';
import { translations } from './i18n';
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
    constructor(points, language) {
        this.points = points;
        this.language = language;
        if (this.points && this.points.length > 0) {
            this.generateStepsFromPoints();
        }
    }
    generateStepsFromPoints() {
        this.steps = this.points.map((point, index) => {
            const previousPoint = this.points[index - 1] ? new Feature(this.points[index - 1]) : null;
            const currentPoint = new Feature(point);
            const nextPoint = this.points[index + 1] ? new Feature(this.points[index + 1]) : null;
            const data = {
                previousPoint,
                currentPoint,
                nextPoint,
            };
            const direction = this.getStepDirection(data);
            const distanceFromLastStep = this.getDistanceFromLastStep(data);
            const extendedData = Object.assign(Object.assign({}, data), { direction, distanceFromLastStep });
            return {
                bearingFromLastStep: this.getBearingFromLastStep(data),
                coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]],
                direction,
                distanceFromLastStep,
                level: point.properties.level,
                levelChangerId: currentPoint.isLevelChanger ? currentPoint.id : null,
                levelChangerType: currentPoint.isLevelChanger ? currentPoint.properties.type : null,
                levelChangerDirection: currentPoint.isLevelChanger ? this.getLevelChangerDirection(data) : null,
                levelChangerDestinationLevel: currentPoint.isLevelChanger && nextPoint.properties.level !== currentPoint.properties.level
                    ? nextPoint.properties.level
                    : null,
                lineStringFeatureFromLastStep: this.getLineStringFeatureFromLastStep(data),
                instruction: this.generateInstruction(extendedData), // New attribute
            };
        });
    }
    generateInstruction({ previousPoint, currentPoint, nextPoint, direction, distanceFromLastStep, }) {
        let instruction = '';
        if (distanceFromLastStep > 0) {
            instruction += `${translations[this.language].IN} ${distanceFromLastStep.toFixed(0)} ${translations[this.language].METERS} `;
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
        return instruction;
    }
    getBearingFromLastStep({ previousPoint, currentPoint, nextPoint, }) {
        if (!previousPoint) {
            return 0;
        }
        const bearingVar = bearing(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
        return bearingVar;
    }
    getStepDirection({ previousPoint, currentPoint, nextPoint, }) {
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
        const bearingVar = bearing(currentPoint.geometry.coordinates, nextPoint.geometry.coordinates) -
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
