import { Wayfinding } from '../../../assets/wayfinding';
import Feature, { FeatureCollection } from '../../models/feature';
import { lineString, point } from '@turf/helpers';

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
        avoidTicketGates: true
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
        avoidBarriers: false
      });
    }
  }

  route(start: Feature, finish: Feature) {
    const points = this.wayfinding.runAStar(start, finish);
    if (!points) {
      return null;
    }

    const levelPoints = {} as any;
    // tslint:disable-next-line:no-shadowed-variable
    points.forEach((point: any) => {
      if (typeof levelPoints[point.properties.level] === 'undefined') {
        levelPoints[point.properties.level] = [];
      }
      levelPoints[point.properties.level].push(point);
    });

    const levels = Object.keys(levelPoints);
    const levelPaths = {} as any;
    levels.forEach(level => {
      if (levelPoints[level].length > 1) {
        // tslint:disable-next-line:no-shadowed-variable
        levelPaths[level] = new Feature(lineString(levelPoints[level].map((point: any) => point.geometry.coordinates)));
      } else {
        // tslint:disable-next-line:no-shadowed-variable
        levelPaths[level] = new Feature(point(levelPoints[level].map((point: any) => point.geometry.coordinates)));
      }

    });
    return levelPaths;
  }
}
