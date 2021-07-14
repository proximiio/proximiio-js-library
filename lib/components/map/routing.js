"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
var wayfinding_1 = require("../../../assets/wayfinding");
var feature_1 = require("../../models/feature");
var helpers_1 = require("@turf/helpers");
var Routing = /** @class */ (function () {
    function Routing() {
        this.data = new feature_1.FeatureCollection({});
    }
    Routing.prototype.setData = function (collection) {
        this.data = collection;
        this.wayfinding = new wayfinding_1.Wayfinding(this.data);
        this.wayfinding.preprocess();
        // pathfinding.load(neighbourList, wallOffsets);
        // this.pathFinder.setConfiguration({
        // avoidEscalators: true,
        // avoidNarrowPaths: true,
        // avoidRevolvingDoors: true
        // });
    };
    Routing.prototype.toggleOnlyAccessible = function (onlyAccessible) {
        if (onlyAccessible) {
            this.wayfinding.setConfiguration({
                avoidStaircases: true,
                avoidBarriers: true,
                avoidNarrowPaths: true,
                avoidRevolvingDoors: true,
                avoidTicketGates: true
            });
        }
        else {
            this.wayfinding.setConfiguration({
                avoidElevators: false,
                avoidEscalators: false,
                avoidStaircases: false,
                avoidRamps: false,
                avoidNarrowPaths: false,
                avoidRevolvingDoors: false,
                avoidTicketGates: false,
                avoidBarriers: false
            });
        }
    };
    Routing.prototype.route = function (start, finish) {
        var points = this.wayfinding.runAStar(start, finish);
        if (!points) {
            return null;
        }
        var levelPoints = {};
        // tslint:disable-next-line:no-shadowed-variable
        points.forEach(function (point) {
            if (typeof levelPoints[point.properties.level] === 'undefined') {
                levelPoints[point.properties.level] = [];
            }
            levelPoints[point.properties.level].push(point);
        });
        var levels = Object.keys(levelPoints);
        var levelPaths = {};
        levels.forEach(function (level) {
            if (levelPoints[level].length > 1) {
                // tslint:disable-next-line:no-shadowed-variable
                levelPaths[level] = new feature_1.default(helpers_1.lineString(levelPoints[level].map(function (point) { return point.geometry.coordinates; })));
            }
            else {
                // tslint:disable-next-line:no-shadowed-variable
                levelPaths[level] = new feature_1.default(helpers_1.point(levelPoints[level].map(function (point) { return point.geometry.coordinates; })));
            }
        });
        return { levelPaths: levelPaths, points: points };
    };
    return Routing;
}());
exports.default = Routing;
