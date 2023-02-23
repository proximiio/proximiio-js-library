// @ts-ignore
import { Wayfinding } from '../../../lib/assets/wayfinding';
import Feature, { FeatureCollection } from '../../models/feature';
import { lineString, point } from '@turf/helpers';
import { kebabToCamel } from '../../common';
import { WayfindingConfigModel } from '../../models/wayfinding';

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
        avoidEscalators: true,
        avoidStaircases: true,
        avoidBarriers: true,
        avoidNarrowPaths: true,
        avoidRevolvingDoors: true,
        avoidTicketGates: true,
      });
    } else {
      this.wayfinding.setConfiguration({
        avoidElevators: false,
        avoidEscalators: false,
        avoidStaircases: false,
        avoidRamps: false,
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
        if (p.isLevelChanger && points[index + 1].isLevelChanger) {
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
          paths[key] = new Feature((0, point)(pointsList.map((i: any) => i.geometry.coordinates)));
        }
      } else {
        // @ts-ignore
        if (pointsList.length > 1) {
          // @ts-ignore
          paths[key] = new Feature(lineString(pointsList.map((i: any) => i.geometry.coordinates)));
        } else {
          // @ts-ignore
          paths[key] = new Feature(point(pointsList.map((i: any) => i.geometry.coordinates)));
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

    return { paths, points, levelPaths, levelPoints, details };
  }
}
