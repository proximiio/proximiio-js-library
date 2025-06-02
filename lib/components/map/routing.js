var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// @ts-ignore
import { Wayfinding } from '../../../lib/assets/wayfinding';
import Feature, { FeatureCollection } from '../../models/feature';
import { lineString, point } from '@turf/helpers';
import osrmTextInstructionsPackage from 'osrm-text-instructions';
const version = 'v5';
const osrmTextInstructions = osrmTextInstructionsPackage(version);
export default class Routing {
    constructor() {
        this.data = new FeatureCollection({});
    }
    setData(collection) {
        this.data = collection;
        this.wayfinding = new Wayfinding(this.data);
        this.wayfinding.preprocess();
        // pathfinding.load(neighbourList, wallOffsets);
        // this.pathFinder.setConfiguration({
        // avoidEscalators: true,
        // avoidNarrowPaths: true,
        // avoidRevolvingDoors: true
        // });
    }
    toggleOnlyAccessible(onlyAccessible) {
        if (onlyAccessible) {
            this.wayfinding.setConfiguration({
                avoidElevators: false,
                avoidRamps: false,
                avoidEscalators: true,
                avoidStaircases: true,
                avoidNarrowPaths: true,
                avoidRevolvingDoors: true,
                avoidTicketGates: true,
                avoidBarriers: true,
                avoidHills: true,
            });
        }
        else {
            this.wayfinding.setConfiguration({
                avoidElevators: true,
                avoidRamps: true,
                avoidEscalators: false,
                avoidStaircases: false,
                avoidNarrowPaths: false,
                avoidRevolvingDoors: false,
                avoidTicketGates: false,
                avoidBarriers: false,
                avoidHills: false,
            });
        }
    }
    setConfig(config) {
        this.wayfinding.setConfiguration(config);
    }
    route({ start, finish, stops, landmarkTBT = false, }) {
        const isMultipoint = stops && stops.length > 1;
        let points = null;
        let details = null;
        if (isMultipoint) {
            for (const [index, stop] of stops.entries()) {
                const isFirstStop = index === 0;
                if (this.routeWithDetails) {
                    const res = this.wayfinding.runAStarWithDetails(isFirstStop ? start : stops[index - 1], stop);
                    points = points ? points.concat(res.path) : res.path;
                    if (!details) {
                        details = {
                            distance: res.distance,
                            duration: res.duration,
                        };
                    }
                    else {
                        details.distance += res.distance;
                        details.duration.elevator += res.duration.elevator;
                        details.duration.escalator += res.duration.escalator;
                        details.duration.staircase += res.duration.staircase;
                        details.duration.realistic += res.duration.realistic;
                        details.duration.shortest += res.duration.shortest;
                    }
                }
                else {
                    points = points
                        ? points.concat(this.wayfinding.runAStar(start, stop))
                        : this.wayfinding.runAStar(isFirstStop ? start : stops[index - 1], stop);
                }
            }
        }
        else {
            if (this.routeWithDetails) {
                const res = this.wayfinding.runAStarWithDetails(start, finish);
                points = res.path;
                details = {
                    distance: res.distance,
                    duration: res.duration,
                };
            }
            else {
                points = this.wayfinding.runAStar(start, finish);
            }
        }
        if (!points) {
            return null;
        }
        points = points.map((i) => {
            return new Feature(i);
        });
        const pathPoints = {};
        let pathPartIndex = 0;
        points.forEach((p, index) => {
            var _a, _b, _c;
            if (landmarkTBT) {
                if (typeof pathPoints[`path-part-${pathPartIndex}`] === 'undefined') {
                    if (p.isLevelChanger && p.properties.level !== points[index + 1].properties.level) {
                        return;
                    }
                    else if (p.isPoi && p.id === ((_a = points[index + 1]) === null || _a === void 0 ? void 0 : _a.id)) {
                        return;
                    }
                    else if ((_b = points[index + 1]) === null || _b === void 0 ? void 0 : _b.isPoi) {
                        // do not add another path part if next poi is finish
                        return;
                    } /* else if (points[index + 1]?.isLevelChanger) {
                      // do not add another path part if next poi is levelChanger
                      return;
                    }*/
                    if (points[index + 1]) {
                        pathPoints[`path-part-${pathPartIndex}`] = [];
                        if (points[index + 2] && points[index + 2].isPoi) {
                            // if second next poi is path destination, add three points to path part as there won't be another path part added
                            pathPoints[`path-part-${pathPartIndex}`].push(p, points[index + 1], points[index + 2]);
                        } /* else if (points[index + 2] && points[index + 2].isLevelChanger) {
                          // if second next poi is level changer, add three points to path part as there won't be another path part added
                          pathPoints[`path-part-${pathPartIndex}`].push(p, points[index + 1], points[index + 2]);
                        }*/
                        else {
                            pathPoints[`path-part-${pathPartIndex}`].push(p, points[index + 1]);
                        }
                        pathPartIndex++;
                    }
                }
            }
            else {
                if (this.forceFloorLevel !== null && this.forceFloorLevel !== undefined) {
                    if (typeof pathPoints['path-part-'.concat(pathPartIndex)] === 'undefined') {
                        pathPoints['path-part-'.concat(pathPartIndex)] = [];
                    }
                    pathPoints['path-part-'.concat(pathPartIndex)].push(p);
                    if (p.isLevelChanger && points[index + 1].isLevelChanger && p.level !== points[index + 1].level) {
                        pathPartIndex++;
                    }
                }
                else {
                    if (typeof pathPoints[`path-part-${pathPartIndex}`] === 'undefined') {
                        pathPoints[`path-part-${pathPartIndex}`] = [];
                    }
                    pathPoints[`path-part-${pathPartIndex}`].push(p);
                    if (p.isLevelChanger && p.properties.level !== points[index + 1].properties.level) {
                        pathPartIndex++;
                    }
                    else if (p.isPoi && p.id === ((_c = points[index + 1]) === null || _c === void 0 ? void 0 : _c.id)) {
                        pathPartIndex++;
                    }
                }
            }
        });
        const paths = {};
        let stopIndex = 0;
        for (const [key, pointsList] of Object.entries(pathPoints)) {
            if (this.forceFloorLevel !== null && this.forceFloorLevel !== undefined) {
                // @ts-ignore
                if (pointsList.length > 1) {
                    // @ts-ignore
                    paths[key] = new Feature((0, lineString)(pointsList.map((i) => i.geometry.coordinates)));
                }
                else {
                    // @ts-ignore
                    paths[key] = new Feature((0, point)(pointsList[0].geometry.coordinates));
                }
            }
            else {
                // @ts-ignore
                if (pointsList.length > 1) {
                    // @ts-ignore
                    paths[key] = new Feature(lineString(pointsList.map((i) => i.geometry.coordinates)));
                }
                else {
                    // @ts-ignore
                    paths[key] = new Feature(point(pointsList[0].geometry.coordinates));
                }
            }
            if (isMultipoint &&
                pointsList[0].isPoi &&
                pointsList[0].id &&
                stops.findIndex((i) => i.id === pointsList[0].id) !== -1) {
                stopIndex++;
            }
            paths[key].id = key;
            // @ts-ignore
            paths[key].properties = {
                // @ts-ignore
                level: pointsList[pointsList.length - 1].properties.level,
                amenity: 'chevron_right',
                step: +key.split('-')[2],
                stop: stopIndex,
                source: 'mallRoute',
            };
        }
        const levelPaths = {};
        for (const [key, path] of Object.entries(paths)) {
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
        const levelPoints = {};
        // tslint:disable-next-line:no-shadowed-variable
        points.forEach((point) => {
            if (typeof levelPoints[point.properties.level] === 'undefined') {
                levelPoints[point.properties.level] = [];
            }
            levelPoints[point.properties.level].push(point);
        });
        return { paths, points, route: {}, fullPath: {}, levelPaths, levelPoints, details };
    }
    cityRoute({ start, finish, language = 'en' }) {
        return __awaiter(this, void 0, void 0, function* () {
            let details = null;
            const osrmApiUrl = 'https://osrm.proximi.fi';
            const url = `${osrmApiUrl}/gcc/route/v1/driving/${start.geometry.coordinates[0]},${start.geometry.coordinates[1]};${finish.geometry.coordinates[0]},${finish.geometry.coordinates[1]}?steps=true&geometries=geojson`;
            try {
                const response = yield fetch(url);
                const data = yield response.json();
                const route = data.routes[0];
                if (!route) {
                    return null;
                }
                route.legs.forEach((leg) => {
                    leg.steps.forEach((step) => {
                        step.instruction = osrmTextInstructions.compile(language, step);
                    });
                });
                route.properties = {
                    level: start.properties.level,
                };
                details = {
                    distance: route.distance,
                    duration: route.duration,
                };
                const fullPath = new Feature(lineString(route.geometry.coordinates, { level: start.properties.level, source: 'cityRoute' }));
                const points = fullPath.geometry.coordinates.map((p) => new Feature(point(p)));
                const paths = {};
                for (const [index, val] of route.legs[0].steps.entries()) {
                    paths[`path-part-${index}`] = new Feature(lineString(val.geometry.coordinates, { level: start.properties.level, source: 'cityRoute' }));
                }
                const levelPaths = {};
                levelPaths[route.properties.level] = {
                    level: route.properties.level,
                    paths: [route],
                };
                const levelPoints = {};
                levelPoints[route.properties.level] = [route];
                return { data, route, points, fullPath, paths, levelPaths, levelPoints, details };
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
