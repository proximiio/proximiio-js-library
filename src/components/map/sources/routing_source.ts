import DataSource from './data_source';
import Feature, { FeatureCollection } from '../../../models/feature';
import Routing from '../routing';
import { GuidanceStep, WayfindingConfigModel } from '../../../models/wayfinding';
import GuidanceStepsGenerator from '../guidanceStepsGenerator';
import combineRoutes from '../combineRoutes';

interface ChangeContainer {
  action: string;
  feature: Feature;
}

export default class RoutingSource extends DataSource {
  isEditable = false;
  start?: Feature;
  connectingPoint?: Feature;
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
      elevator?: number;
      escalator?: number;
      staircase?: number;
      realistic: number;
      shortest: number;
    };
  };
  steps: GuidanceStep[];
  preview?: boolean;
  language: string;
  navigationType: 'mall' | 'city' | 'combined';
  fullPath?: Feature;
  isMultipoint = false;
  landmarkTBT: boolean;
  pois?: Feature[];
  levelChangers?: Feature[];
  initialBearing: number;

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

  setNavigationType(type: 'mall' | 'city' | 'combined') {
    this.navigationType = type;
  }

  setLandmarkTBT(value: boolean) {
    this.landmarkTBT = value;
  }

  setInitialBearing(initialBearing: number) {
    this.initialBearing = initialBearing;
  }

  setPois(pois: Feature[]) {
    this.pois = pois;
  }

  setLevelChangers(levelChangers: Feature[]) {
    this.levelChangers = levelChangers;
  }

  async update({
    start,
    connectingPoint,
    finish,
    stops,
    preview,
    language,
  }: {
    start?: Feature;
    connectingPoint?: Feature;
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
    this.connectingPoint = connectingPoint;

    this.data = new FeatureCollection({
      features: [this.start, this.finish, this.connectingPoint].concat(this.lines || []).filter((i) => i),
    });
    this.notify('feature-updated');

    if (start && finish) {
      this.notify('loading-start');

      let route;
      let mallRoute;
      let cityRoute;
      const startAtMall = !!start.id;
      if (this.navigationType === 'city') {
        route = await this.routing.cityRoute({ start, finish, language: this.language });
      } else if (this.navigationType === 'mall') {
        route = this.routing.route({ start, finish, stops, landmarkTBT: this.landmarkTBT });
      } else if (this.navigationType === 'combined' && connectingPoint) {
        if (startAtMall) {
          const entranceId = start.properties.metadata?.entrance;
          const entranceFeature = this.pois?.find((f) => f.id === entranceId || f.properties.id === entranceId);
          cityRoute = await this.routing.cityRoute({ start: connectingPoint, finish, language: this.language });
          mallRoute = this.routing.route({
            start,
            finish: connectingPoint,
            stops,
            landmarkTBT: this.landmarkTBT,
            priorityEntrance: entranceFeature,
          });
        } else {
          const entranceId = finish.properties.metadata?.entrance;
          const entranceFeature = this.pois?.find((f) => f.id === entranceId || f.properties.id === entranceId);
          cityRoute = await this.routing.cityRoute({ start, finish: connectingPoint, language: this.language });
          mallRoute = this.routing.route({
            start: connectingPoint,
            finish,
            stops,
            landmarkTBT: this.landmarkTBT,
            priorityEntrance: entranceFeature,
          });
        }
      }

      // @ts-ignore
      let paths = route?.paths;
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
          levelChangers: this.levelChangers,
          initialBearing: this.initialBearing,
        });
        if (guidanceStepsGenerator.steps) {
          this.steps = guidanceStepsGenerator.steps
            .filter((i) => i !== undefined)
            .map((i) => ({ ...i, navMode: 'mall' }));
        }
      }

      if (this.navigationType === 'city') {
        this.steps = [];
        route.route.legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            step.navMode = 'city';
            this.steps.push(step);
          });
        });
      }

      if (this.navigationType === 'combined') {
        if (!startAtMall) {
          // remove the arrive path
          const keys = Object.keys(cityRoute.paths);
          const lastKey = keys[keys.length - 1];
          delete cityRoute.paths[lastKey];
        }
        if (!mallRoute?.paths || !cityRoute?.paths) {
          this.lines = [];
          this.notify('route-undefined');
          return;
        }
        const combined = combineRoutes(cityRoute, mallRoute, startAtMall ? 'mall-first' : 'city-first');
        // @ts-ignore
        paths = combined?.paths;
        // @ts-ignore
        this.route = combined?.paths;
        // @ts-ignore
        this.points = combined?.points;
        this.levelPaths = combined?.levelPaths;
        this.levelPoints = combined?.levelPoints;
        this.details = combined?.details;
        this.fullPath = combined?.fullPath as any;

        this.steps = [];
        const citySteps = [];
        cityRoute.route.legs.forEach((leg) => {
          leg.steps.forEach((step, index) => {
            step.navMode = 'city';
            if (!startAtMall && index === leg.steps.length - 1) {
              return;
            }
            citySteps.push(step);
          });
        });

        const mallStepsGenerator = new GuidanceStepsGenerator({
          points: mallRoute?.points,
          language: this.language,
          landMarkNav: this.landmarkTBT,
          pois: this.pois,
          levelChangers: this.levelChangers,
          initialBearing: this.initialBearing,
        });
        if (mallStepsGenerator.steps) {
          const mallSteps = mallStepsGenerator.steps.filter((i) => i !== undefined);
          this.steps = startAtMall
            ? mallSteps.map((i) => ({ ...i, navMode: 'mall' })).concat(citySteps)
            : citySteps.concat(mallSteps.map((i) => ({ ...i, navMode: 'mall' })));
        }
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
    this.initialBearing = undefined;
    this.connectingPoint = undefined;
    this.data = new FeatureCollection({
      features: [this.start, this.finish, this.connectingPoint].concat(this.lines || []).filter((i) => i),
    });
    this.navigationType = 'mall';
    this.notify('feature-updated');
  }
}
