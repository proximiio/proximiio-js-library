"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GuidanceTextGenerator = /** @class */ (function () {
    function GuidanceTextGenerator(points) {
        this.points = points;
        this.generateStepsFromPoints();
    }
    GuidanceTextGenerator.prototype.generateStepsFromPoints = function () {
        this.steps = this.points.map(function (point) {
            return {
                bearingFromLastStep: 0,
                coordinates: [point.geometry.coordinates[0], point.geometry.coordinates[1]],
                direction: 'direction',
                distanceFromLastStep: 0,
                isWaypoint: false,
                level: point.properties.level
            };
        });
    };
    return GuidanceTextGenerator;
}());
exports.default = GuidanceTextGenerator;
