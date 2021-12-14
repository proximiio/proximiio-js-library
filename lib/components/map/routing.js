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
                avoidTicketGates: true,
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
                avoidBarriers: false,
            });
        }
    };
    Routing.prototype.route = function (start, finish) {
        var points = this.wayfinding.runAStar(start, finish).map(function (i) {
            return new feature_1.default(i);
        });
        if (!points) {
            return null;
        }
        var pathPoints = {};
        var pathPartIndex = 0;
        points.forEach(function (p, index) {
            if (typeof pathPoints["path-part-" + pathPartIndex] === 'undefined') {
                pathPoints["path-part-" + pathPartIndex] = [];
            }
            pathPoints["path-part-" + pathPartIndex].push(p);
            if (p.isLevelChanger && points[index + 1].isLevelChanger) {
                pathPartIndex++;
            }
        });
        var paths = {};
        for (var _i = 0, _a = Object.entries(pathPoints); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], pointsList = _b[1];
            // @ts-ignore
            if (pointsList.length > 1) {
                // @ts-ignore
                paths[key] = new feature_1.default(helpers_1.lineString(pointsList.map(function (i) { return i.geometry.coordinates; })));
            }
            else {
                // @ts-ignore
                paths[key] = new feature_1.default(helpers_1.point(pointsList.map(function (i) { return i.geometry.coordinates; })));
            }
            paths[key].id = key;
            // @ts-ignore
            paths[key].properties = {
                // @ts-ignore
                level: pointsList[pointsList.length - 1].properties.level,
                amenity: 'chevron_right',
            };
        }
        var levelPaths = {};
        for (var _c = 0, _d = Object.entries(paths); _c < _d.length; _c++) {
            var _e = _d[_c], key = _e[0], path = _e[1];
            // @ts-ignore
            if (typeof levelPaths[path.properties.level] === 'undefined') {
                // @ts-ignore
                levelPaths[path.properties.level] = {
                    // @ts-ignore
                    level: path.properties.level,
                    paths: [path],
                };
            }
            else {
                // @ts-ignore
                levelPaths[path.properties.level].paths.push(path);
            }
        }
        var levelPoints = {};
        // tslint:disable-next-line:no-shadowed-variable
        points.forEach(function (point) {
            if (typeof levelPoints[point.properties.level] === 'undefined') {
                levelPoints[point.properties.level] = [];
            }
            levelPoints[point.properties.level].push(point);
        });
        return { paths: paths, points: points, levelPaths: levelPaths, levelPoints: levelPoints };
    };
    return Routing;
}());
exports.default = Routing;
