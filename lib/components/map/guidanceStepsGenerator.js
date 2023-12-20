import Feature from '../../models/feature';
import bearing from '@turf/bearing';
import distance from '@turf/distance';
import { lineString } from '@turf/helpers';
var Direction;
(function (Direction) {
    Direction["Start"] = "START";
    Direction["Finish"] = "FINISH";
    Direction["Exit"] = "EXIT";
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
    constructor(points) {
        this.points = points;
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
            return {
                bearingFromLastStep: this.getBearingFromLastStep(data),
                coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]],
                direction: this.getStepDirection(data),
                distanceFromLastStep: this.getDistanceFromLastStep(data),
                level: point.properties.level,
                levelChangerId: currentPoint.isLevelChanger ? currentPoint.id : null,
                levelChangerType: currentPoint.isLevelChanger ? currentPoint.properties.type : null,
                levelChangerDirection: currentPoint.isLevelChanger ? this.getLevelChangerDirection(data) : null,
                levelChangerDestinationLevel: currentPoint.isLevelChanger && nextPoint.properties.level !== currentPoint.properties.level
                    ? nextPoint.properties.level
                    : null,
                lineStringFeatureFromLastStep: this.getLineStringFeatureFromLastStep(data),
            };
        });
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
