// @ts-ignore
import { Wayfinding } from '../../../lib/assets/wayfinding';
import Feature, { FeatureCollection } from '../../models/feature';
import { lineString, point } from '@turf/helpers';
import { WayfindingConfigModel } from '../../models/wayfinding';
import osrmTextInstructionsPackage from 'osrm-text-instructions';

const version = 'v5';
const osrmTextInstructions = osrmTextInstructionsPackage(version);

export default class Routing {
  data: FeatureCollection;
  wayfinding: any;
  forceFloorLevel: number;
  routeWithDetails: boolean;
  config: WayfindingConfigModel;

  constructor() {
    this.data = new FeatureCollection({});
  }

  setData(collection: FeatureCollection) {
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

  toggleOnlyAccessible(onlyAccessible: any) {
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
    } else {
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

  setConfig(config: WayfindingConfigModel) {
    this.config = config;
    this.wayfinding.setConfiguration(config);
  }

  route({
    start,
    finish,
    stops,
    landmarkTBT = false,
    priorityEntrance,
  }: {
    start: Feature;
    finish?: Feature;
    stops?: Feature[];
    landmarkTBT?: boolean;
    priorityEntrance?: Feature;
  }) {
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
          } else {
            details.distance += res.distance;
            details.duration.elevator += res.duration.elevator;
            details.duration.escalator += res.duration.escalator;
            details.duration.staircase += res.duration.staircase;
            details.duration.realistic += res.duration.realistic;
            details.duration.shortest += res.duration.shortest;
          }
        } else {
          points = points
            ? points.concat(this.wayfinding.runAStar(start, stop))
            : this.wayfinding.runAStar(isFirstStop ? start : stops[index - 1], stop);
        }
      }
    } else {
      if (this.routeWithDetails) {
        if (priorityEntrance) {
          let res1 = this.wayfinding.runAStarWithDetails(start, priorityEntrance);
          if (!res1.path) {
            this.wayfinding.setConfiguration({ avoidElevators: false, avoidRamps: false });
            res1 = this.wayfinding.runAStarWithDetails(start, priorityEntrance);
            this.wayfinding.setConfiguration({
              avoidElevators: this.config.avoidElevators,
              avoidRamps: this.config.avoidRamps,
            });
          }
          let res2 = this.wayfinding.runAStarWithDetails(priorityEntrance, finish);
          if (!res2.path) {
            this.wayfinding.setConfiguration({ avoidElevators: false, avoidRamps: false });
            res2 = this.wayfinding.runAStarWithDetails(priorityEntrance, finish);
            this.wayfinding.setConfiguration({
              avoidElevators: this.config.avoidElevators,
              avoidRamps: this.config.avoidRamps,
            });
          }

          if (!res1.path || !res2.path) {
            return null;
          }

          res1.path.splice(res1.path.length - 1, 1);
          res2.path.splice(0, 2);

          points = res1.path.concat(res2.path);
          details = {
            distance: res1.distance + res2.distance,
            duration: {
              elevator: res1.duration.elevator + res2.duration.elevator,
              escalator: res1.duration.escalator + res2.duration.escalator,
              staircase: res1.duration.staircase + res2.duration.staircase,
              realistic: res1.duration.realistic + res2.duration.realistic,
              shortest: res1.duration.shortest + res2.duration.shortest,
            },
          };
        } else {
          const res = this.wayfinding.runAStarWithDetails(start, finish);
          points = res.path;
          details = {
            distance: res.distance,
            duration: res.duration,
          };
        }
      } else {
        if (priorityEntrance) {
          let res1 = this.wayfinding.runAStar(start, priorityEntrance);
          if (!res1.path) {
            this.wayfinding.setConfiguration({ avoidElevators: false, avoidRamps: false });
            res1 = this.wayfinding.runAStar(start, priorityEntrance);
            this.wayfinding.setConfiguration({
              avoidElevators: this.config.avoidElevators,
              avoidRamps: this.config.avoidRamps,
            });
          }
          let res2 = this.wayfinding.runAStar(priorityEntrance, finish);
          if (!res2.path) {
            this.wayfinding.setConfiguration({ avoidElevators: false, avoidRamps: false });
            res2 = this.wayfinding.runAStar(priorityEntrance, finish);
            this.wayfinding.setConfiguration({
              avoidElevators: this.config.avoidElevators,
              avoidRamps: this.config.avoidRamps,
            });
          }

          if (!res1.path || !res2.path) {
            return null;
          }

          res1.path.splice(res1.path.length - 1, 1);
          res2.path.splice(0, 2);

          points = res1.path.concat(res2.path);
        } else {
          const res = this.wayfinding.runAStar(start, finish);
          points = res.path;
        }
      }
    }
    if (!points) {
      return null;
    }
    points = points.map((i) => {
      return new Feature(i);
    });

    const pathPoints = {} as any;
    let pathPartIndex: any = 0;

    points.forEach((p: Feature | any, index: number) => {
      if (landmarkTBT) {
        if (typeof pathPoints[`path-part-${pathPartIndex}`] === 'undefined') {
          if (p.isLevelChanger && p.properties.level !== points[index + 1].properties.level) {
            return;
          } else if (p.isPoi && p.id === points[index + 1]?.id) {
            return;
          } else if (points[index + 1]?.isPoi) {
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
            }*/ else {
              pathPoints[`path-part-${pathPartIndex}`].push(p, points[index + 1]);
            }
            pathPartIndex++;
          }
        }
      } else {
        if (this.forceFloorLevel !== null && this.forceFloorLevel !== undefined) {
          if (typeof pathPoints['path-part-'.concat(pathPartIndex)] === 'undefined') {
            pathPoints['path-part-'.concat(pathPartIndex)] = [];
          }
          pathPoints['path-part-'.concat(pathPartIndex)].push(p);
          if (p.isLevelChanger && points[index + 1].isLevelChanger && p.level !== points[index + 1].level) {
            pathPartIndex++;
          }
        } else {
          if (typeof pathPoints[`path-part-${pathPartIndex}`] === 'undefined') {
            pathPoints[`path-part-${pathPartIndex}`] = [];
          }
          pathPoints[`path-part-${pathPartIndex}`].push(p);
          if (p.isLevelChanger && p.properties.level !== points[index + 1].properties.level) {
            pathPartIndex++;
          } else if (p.isPoi && p.id === points[index + 1]?.id) {
            pathPartIndex++;
          }
        }
      }
    });

    const paths = {} as any;
    let stopIndex = 0;
    for (const [key, pointsList] of Object.entries(pathPoints)) {
      if (this.forceFloorLevel !== null && this.forceFloorLevel !== undefined) {
        // @ts-ignore
        if (pointsList.length > 1) {
          // @ts-ignore
          paths[key] = new Feature((0, lineString)(pointsList.map((i: any) => i.geometry.coordinates)));
        } else {
          // @ts-ignore
          paths[key] = new Feature((0, point)(pointsList[0].geometry.coordinates));
        }
      } else {
        // @ts-ignore
        if (pointsList.length > 1) {
          // @ts-ignore
          paths[key] = new Feature(lineString(pointsList.map((i: any) => i.geometry.coordinates)));
        } else {
          // @ts-ignore
          paths[key] = new Feature(point(pointsList[0].geometry.coordinates));
        }
      }

      if (
        isMultipoint &&
        pointsList[0].isPoi &&
        pointsList[0].id &&
        stops.findIndex((i) => i.id === pointsList[0].id) !== -1
      ) {
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

    const levelPaths = {} as any;
    for (const [key, path] of Object.entries(paths)) {
      // @ts-ignore
      if (typeof levelPaths[path.properties.level] === 'undefined') {
        // @ts-ignore
        levelPaths[path.properties.level] = {
          // @ts-ignore
          level: path.properties.level,
          paths: [path],
        };
      } else {
        // @ts-ignore
        levelPaths[path.properties.level].paths.push(path);
      }
    }

    const levelPoints = {} as any;
    // tslint:disable-next-line:no-shadowed-variable
    points.forEach((point: any) => {
      if (typeof levelPoints[point.properties.level] === 'undefined') {
        levelPoints[point.properties.level] = [];
      }
      levelPoints[point.properties.level].push(point);
    });

    return { paths, points, route: {}, fullPath: {} as Feature, levelPaths, levelPoints, details };
  }

  async cityRoute({ start, finish, language = 'en' }: { start: Feature; finish: Feature; language?: string }) {
    let details = null;

    const osrmApiUrl = 'https://osrm.proximi.fi';
    const url = `${osrmApiUrl}/gcc/route/v1/driving/${start.geometry.coordinates[0]},${start.geometry.coordinates[1]};${finish.geometry.coordinates[0]},${finish.geometry.coordinates[1]}?steps=true&geometries=geojson`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      const route = data.routes[0];

      if (!route) {
        return null;
      }

      route.legs.forEach((leg: any) => {
        leg.steps.forEach((step: any) => {
          step.instruction = osrmTextInstructions.compile(language, step);
        });
      });

      route.properties = {
        level: start.properties.level,
      };

      details = {
        distance: route.distance,
        duration: {
          realistic: route.duration,
          shortest: route.duration,
        },
      };

      const fullPath = new Feature(
        lineString(route.geometry.coordinates, { level: start.properties.level, source: 'cityRoute' }),
      );

      const points = fullPath.geometry.coordinates.map((p: any) => new Feature(point(p)));

      const paths = {};
      for (const [index, val] of route.legs[0].steps.entries()) {
        paths[`path-part-${index}`] = new Feature(
          lineString(val.geometry.coordinates, { level: start.properties.level, source: 'cityRoute' }),
        );
      }

      const levelPaths = {};
      levelPaths[route.properties.level] = {
        level: route.properties.level,
        paths: [route],
      };

      const levelPoints = {} as any;
      levelPoints[route.properties.level] = [route];

      return { data, route, points, fullPath, paths, levelPaths, levelPoints, details };
    } catch (error) {
      console.log(error);
    }
  }
}
