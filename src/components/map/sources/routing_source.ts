import DataSource from './data_source';
import Feature, { FeatureCollection } from '../../../models/feature';
import Routing from '../routing';
import { GuidanceStep, WayfindingConfigModel } from '../../../models/wayfinding';
import GuidanceStepsGenerator from '../guidanceStepsGenerator';

interface ChangeContainer {
  action: string;
  feature: Feature;
}

export default class RoutingSource extends DataSource {
  isEditable = false;
  start?: Feature;
  finish?: Feature;
  stops?: Feature[];
  lines?: Feature[];
  changes: ChangeContainer[];
  route: any;
  points: any;
  levelPaths: any;
  levelPoints: any;
  routing: Routing;
  details: {
    distance: number;
    duration: {
      elevator: number;
      escalator: number;
      staircase: number;
      realistic: number;
      shortest: number;
    };
  };
  steps: GuidanceStep[];
  preview?: boolean;
  language: string;
  navigationType: 'mall' | 'city';
  fullPath?: Feature;
  isMultipoint = false;
  landmarkTBT: boolean;
  pois?: Feature[];

  constructor() {
    super('route');
    this.changes = [];
    this.routing = new Routing();
    this.navigationType = 'mall';
    this.landmarkTBT = false;
  }

  toggleAccessible(value: any) {
    this.routing.toggleOnlyAccessible(value);
  }

  setConfig(config: WayfindingConfigModel) {
    this.routing.setConfig(config);
  }

  setNavigationType(type: 'mall' | 'city') {
    this.navigationType = type;
  }

  setLandmarkTBT(value: boolean) {
    this.landmarkTBT = value;
  }

  setPois(pois: Feature[]) {
    this.pois = pois;
  }

  async update({
    start,
    finish,
    stops,
    preview,
    language,
  }: {
    start?: Feature;
    finish?: Feature;
    stops?: Feature[];
    preview?: boolean;
    language: string;
  }) {
    this.isMultipoint = stops && stops.length > 1;
    finish = this.isMultipoint ? stops[stops.length - 1] : finish;

    this.start = start;
    this.finish = finish;
    this.stops = stops;
    this.preview = preview;
    this.language = language;

    this.data = new FeatureCollection({
      features: [this.start, this.finish].concat(this.lines || []).filter((i) => i),
    });
    this.notify('feature-updated');

    if (start && finish) {
      this.notify('loading-start');
      const route =
        this.navigationType === 'city'
          ? await this.routing.cityRoute({ start, finish, language: this.language })
          : this.routing.route({ start, finish, stops, landmarkTBT: this.landmarkTBT });

      // @ts-ignore
      const paths = route?.paths;
      // @ts-ignore
      this.route = route?.paths;
      // @ts-ignore
      this.points = route?.points;
      this.levelPaths = route?.levelPaths;
      this.levelPoints = route?.levelPoints;
      this.details = route?.details;
      this.fullPath = route?.fullPath;

      if (this.navigationType === 'mall') {
        const guidanceStepsGenerator = new GuidanceStepsGenerator({
          points: route?.points,
          language: this.language,
          landMarkNav: this.landmarkTBT,
          pois: this.pois,
        });
        this.steps = guidanceStepsGenerator.steps.filter((i) => i !== undefined);
      }

      if (this.navigationType === 'city') {
        this.steps = [];
        route.route.legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            this.steps.push(step);
          });
        });
      }

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

      this.data =
        preview && this.navigationType === 'mall'
          ? new FeatureCollection({})
          : new FeatureCollection({
              features: [this.start, this.finish].concat(this.lines || []).filter((i) => i),
            });
      this.notify(preview ? 'preview-finished' : 'loading-finished');
      this.notify('feature-updated');
    }
  }

  cancel() {
    this.start = undefined;
    this.finish = undefined;
    this.lines = undefined;
    this.route = undefined;
    this.points = undefined;
    this.levelPaths = undefined;
    this.levelPoints = undefined;
    this.details = undefined;
    this.steps = undefined;
    this.preview = undefined;
    this.data = new FeatureCollection({
      features: [this.start, this.finish].concat(this.lines || []).filter((i) => i),
    });
    this.navigationType = 'mall';
    this.notify('feature-updated');
  }
}
