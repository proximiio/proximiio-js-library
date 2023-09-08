"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var feature_1 = require("../../models/feature");
var turf = require("@turf/turf");
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
var GuidanceStepsGenerator = /** @class */ (function () {
    function GuidanceStepsGenerator(points) {
        this.points = points;
        if (this.points && this.points.length > 0) {
            this.generateStepsFromPoints();
        }
    }
    GuidanceStepsGenerator.prototype.generateStepsFromPoints = function () {
        var _this = this;
        this.steps = this.points.map(function (point, index) {
            var previousPoint = _this.points[index - 1] ? new feature_1.default(_this.points[index - 1]) : null;
            var currentPoint = new feature_1.default(point);
            var nextPoint = _this.points[index + 1] ? new feature_1.default(_this.points[index + 1]) : null;
            var data = {
                previousPoint: previousPoint,
                currentPoint: currentPoint,
                nextPoint: nextPoint,
            };
            return {
                bearingFromLastStep: _this.getBearingFromLastStep(data),
                coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]],
                direction: _this.getStepDirection(data),
                distanceFromLastStep: _this.getDistanceFromLastStep(data),
                level: point.properties.level,
                levelChangerId: currentPoint.isLevelChanger ? currentPoint.id : null,
                levelChangerType: currentPoint.isLevelChanger ? currentPoint.properties.type : null,
                levelChangerDirection: currentPoint.isLevelChanger ? _this.getLevelChangerDirection(data) : null,
                levelChangerDestinationLevel: currentPoint.isLevelChanger && nextPoint.properties.level !== currentPoint.properties.level
                    ? nextPoint.properties.level
                    : null,
                lineStringFeatureFromLastStep: _this.getLineStringFeatureFromLastStep(data),
            };
        });
    };
    GuidanceStepsGenerator.prototype.getBearingFromLastStep = function (_a) {
        var previousPoint = _a.previousPoint, currentPoint = _a.currentPoint, nextPoint = _a.nextPoint;
        if (!previousPoint) {
            return 0;
        }
        var bearing = turf.bearing(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
        return bearing;
    };
    GuidanceStepsGenerator.prototype.getStepDirection = function (_a) {
        var previousPoint = _a.previousPoint, currentPoint = _a.currentPoint, nextPoint = _a.nextPoint;
        if (!previousPoint) {
            return Direction.Start;
        }
        if (!nextPoint) {
            return Direction.Finish;
        }
        if (currentPoint.isLevelChanger && nextPoint.properties.level > currentPoint.properties.level) {
            return Direction.Up + "_" + LevelChangerTypes[currentPoint.properties.type];
        }
        if (currentPoint.isLevelChanger && nextPoint.properties.level < currentPoint.properties.level) {
            return Direction.Down + "_" + LevelChangerTypes[currentPoint.properties.type];
        }
        if (previousPoint.isLevelChanger && currentPoint.isLevelChanger) {
            return Direction.Exit + "_" + LevelChangerTypes[currentPoint.properties.type];
        }
        var bearing = turf.bearing(currentPoint.geometry.coordinates, nextPoint.geometry.coordinates) -
            turf.bearing(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
        var degreeNormalized = this.degreeNormalized(bearing);
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
    };
    GuidanceStepsGenerator.prototype.getDistanceFromLastStep = function (_a) {
        var previousPoint = _a.previousPoint, currentPoint = _a.currentPoint, nextPoint = _a.nextPoint;
        if (!previousPoint) {
            return 0;
        }
        if (previousPoint.isLevelChanger && currentPoint.isLevelChanger) {
            return 0;
        }
        var distance = turf.distance(previousPoint.geometry.coordinates, currentPoint.geometry.coordinates);
        return distance * 1000;
    };
    GuidanceStepsGenerator.prototype.getLevelChangerDirection = function (_a) {
        var previousPoint = _a.previousPoint, currentPoint = _a.currentPoint, nextPoint = _a.nextPoint;
        if (currentPoint.isLevelChanger && nextPoint.properties.level > currentPoint.properties.level) {
            return Direction.Up;
        }
        if (currentPoint.isLevelChanger && nextPoint.properties.level < currentPoint.properties.level) {
            return Direction.Down;
        }
    };
    GuidanceStepsGenerator.prototype.getLineStringFeatureFromLastStep = function (_a) {
        var previousPoint = _a.previousPoint, currentPoint = _a.currentPoint, nextPoint = _a.nextPoint;
        if (!previousPoint) {
            return null;
        }
        if (currentPoint.properties.level !== previousPoint.properties.level) {
            return null;
        }
        var lineString = turf.lineString([previousPoint.geometry.coordinates, currentPoint.geometry.coordinates]);
        return lineString;
    };
    GuidanceStepsGenerator.prototype.degreeNormalized = function (degrees) {
        if (degrees > 180) {
            return degrees - 360;
        }
        else if (degrees < -180) {
            return degrees + 360;
        }
        else {
            return degrees;
        }
    };
    return GuidanceStepsGenerator;
}());
exports.default = GuidanceStepsGenerator;
