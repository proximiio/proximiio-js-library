// @ts-ignore
import { Wayfinding } from '../../../assets/wayfinding';
import Feature, { FeatureCollection } from '../../models/feature';
import { lineString, point } from '@turf/helpers';
import { kebabToCamel } from '../../common';

export default class Routing {
  data: FeatureCollection;
  wayfinding: any;

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
      });
    }
  }

  route(start: Feature, finish: Feature) {
    const points = this.wayfinding.runAStar(start, finish).map(i => {
      return new Feature(i);
    });
    if (!points) {
      return null;
    }

    const pathPoints = {} as any;
    let pathPartIndex = 0;
    points.forEach((p: Feature, index: number) => {
      if (typeof pathPoints[`path-part-${pathPartIndex}`] === 'undefined') {
        pathPoints[`path-part-${pathPartIndex}`] = [];
      }
      pathPoints[`path-part-${pathPartIndex}`].push(p);
      if (p.isLevelChanger && points[index+1].isLevelChanger) {
        pathPartIndex++;
      }
    });

    const paths = {} as any;
    for (const [key, pointsList] of Object.entries(pathPoints)) {
      // @ts-ignore
      if (pointsList.length > 1) {
        // @ts-ignore
        paths[key] = new Feature(lineString(pointsList.map((i: any) => i.geometry.coordinates)));
      } else {
        // @ts-ignore
        paths[key] = new Feature(point(pointsList.map((i: any) => i.geometry.coordinates)));
      }
      paths[key].id = key;
      // @ts-ignore
      paths[key].properties = {
        // @ts-ignore
        level: pointsList[pointsList.length-1].properties.level,
        amenity: 'chevron_right'
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
          paths: [path]
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

    return { paths, points, levelPaths, levelPoints };
  }
}
