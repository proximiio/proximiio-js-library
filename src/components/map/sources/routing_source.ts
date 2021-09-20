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
      const levelPaths = route.levelPaths;
      // @ts-ignore
      this.route = route.levelPaths;
      // @ts-ignore
      this.points = route.points;
      if (levelPaths) {
        const lines = [] as Feature[];
        const levels = Object.keys(levelPaths);
        levels.forEach((level) => {
          const path = levelPaths[level] as Feature;
          path.id = `routing-path-${level}`;
          path.properties.amenity = 'chevron_right';
          path.properties.level = level;
          lines.push(path);
        });
        this.lines = lines.sort((a, b) => (+a.properties.level > +b.properties.level ? 1 : -1));
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
