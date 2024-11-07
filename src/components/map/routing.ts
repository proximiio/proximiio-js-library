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
    this.wayfinding.setConfiguration(config);
  }

  route(start: Feature, finish: Feature) {
    let points = null;
    let details = null;
    if (this.routeWithDetails) {
      const res = this.wayfinding.runAStarWithDetails(start, finish);
      points = res.path;
      details = {
        distance: res.distance,
        duration: res.duration,
      };
    } else {
      points = this.wayfinding.runAStar(start, finish);
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
        }
      }
    });

    const paths = {} as any;
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
      paths[key].id = key;
      // @ts-ignore
      paths[key].properties = {
        // @ts-ignore
        level: pointsList[pointsList.length - 1].properties.level,
        amenity: 'chevron_right',
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
        duration: route.duration,
      };

      const fullPath = new Feature(lineString(route.geometry.coordinates, { level: start.properties.level }));

      const points = fullPath.geometry.coordinates.map((p: any) => new Feature(point(p)));

      const paths = {};
      for (const [index, val] of route.legs[0].steps.entries()) {
        paths[`path-part-${index}`] = new Feature(
          lineString(val.geometry.coordinates, { level: start.properties.level }),
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
