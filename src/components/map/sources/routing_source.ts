import DataSource from './data_source';
import Feature, { FeatureCollection } from '../../../models/feature';
import Routing from '../routing';

interface ChangeContainer {
  action: string;
  feature: Feature;
}

export default class RoutingSource extends DataSource {
  isEditable = false;
  start?: Feature;
  finish?: Feature;
  lines?: Feature[];
  changes: ChangeContainer[];
  route: any;
  points: any;
  levelPaths: any;
  levelPoints: any;
  routing: Routing;

  constructor() {
    super('route');
    this.changes = [];
    this.routing = new Routing();
  }

  toggleAccessible(value: any) {
    this.routing.toggleOnlyAccessible(value);
  }

  async update(start?: Feature, finish?: Feature) {
    this.start = start;
    this.finish = finish;

    this.data = new FeatureCollection({
      features: [this.start, this.finish].concat(this.lines || []).filter((i) => i),
    });
    this.notify('feature-updated');

    if (start && finish) {
      this.notify('loading-start');
      const route = this.routing.route(start, finish);
      // @ts-ignore
      const paths = route.paths;
      // @ts-ignore
      this.route = route.paths;
      // @ts-ignore
      this.points = route.points;
      this.levelPaths = route.levelPaths;
      this.levelPoints = route.levelPoints;

      if (paths) {
        const lines = [] as Feature[];
        for (const [k, v] of Object.entries(paths)) {
          // @ts-ignore
          lines.push(v);
        }
        this.lines = lines;
      } else {
        this.lines = [];
        this.notify('route-undefined');
      }

      // Older api routing
      // this.route = await getRoute(start, finish)
      // this.lines = Object.keys(this.route.levelPaths).map(key => this.route.levelPaths[key]).map(line => {
      //   line.properties.amenity = 'chevron_right'
      //   return line
      // })
      this.data = new FeatureCollection({
        features: [this.start, this.finish].concat(this.lines || []).filter((i) => i),
      });
      this.notify('loading-finished');
      this.notify('feature-updated');
    }
  }

  cancel() {
    this.start = undefined;
    this.finish = undefined;
    this.lines = undefined;
    this.route = undefined;
    this.data = new FeatureCollection({
      features: [this.start, this.finish].concat(this.lines || []).filter((i) => i),
    });
    this.notify('feature-updated');
  }
}
