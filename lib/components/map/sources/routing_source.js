var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import DataSource from './data_source';
import { FeatureCollection } from '../../../models/feature';
import Routing from '../routing';
import GuidanceStepsGenerator from '../guidanceStepsGenerator';
import combineRoutes from '../combineRoutes';
export default class RoutingSource extends DataSource {
    constructor() {
        super('route');
        this.isEditable = false;
        this.isMultipoint = false;
        this.changes = [];
        this.routing = new Routing();
        this.navigationType = 'mall';
        this.landmarkTBT = false;
    }
    toggleAccessible(value) {
        this.routing.toggleOnlyAccessible(value);
    }
    setConfig(config) {
        this.routing.setConfig(config);
    }
    setNavigationType(type) {
        this.navigationType = type;
    }
    setLandmarkTBT(value) {
        this.landmarkTBT = value;
    }
    setInitialBearing(initialBearing) {
        this.initialBearing = initialBearing;
    }
    setPois(pois) {
        this.pois = pois;
    }
    setLevelChangers(levelChangers) {
        this.levelChangers = levelChangers;
    }
    update({ start, connectingPoint, finish, stops, preview, language, }) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    route = yield this.routing.cityRoute({ start, finish, language: this.language });
                }
                else if (this.navigationType === 'mall') {
                    route = this.routing.route({ start, finish, stops, landmarkTBT: this.landmarkTBT });
                }
                else if (this.navigationType === 'combined' && connectingPoint) {
                    if (startAtMall) {
                        cityRoute = yield this.routing.cityRoute({ start: connectingPoint, finish, language: this.language });
                        mallRoute = this.routing.route({ start, finish: connectingPoint, stops, landmarkTBT: this.landmarkTBT });
                    }
                    else {
                        cityRoute = yield this.routing.cityRoute({ start, finish: connectingPoint, language: this.language });
                        mallRoute = this.routing.route({ start: connectingPoint, finish, stops, landmarkTBT: this.landmarkTBT });
                    }
                    console.log('mallRoute', mallRoute);
                }
                // @ts-ignore
                let paths = route === null || route === void 0 ? void 0 : route.paths;
                // @ts-ignore
                this.route = route === null || route === void 0 ? void 0 : route.paths;
                // @ts-ignore
                this.points = route === null || route === void 0 ? void 0 : route.points;
                this.levelPaths = route === null || route === void 0 ? void 0 : route.levelPaths;
                this.levelPoints = route === null || route === void 0 ? void 0 : route.levelPoints;
                this.details = route === null || route === void 0 ? void 0 : route.details;
                this.fullPath = route === null || route === void 0 ? void 0 : route.fullPath;
                if (this.navigationType === 'mall') {
                    const guidanceStepsGenerator = new GuidanceStepsGenerator({
                        points: route === null || route === void 0 ? void 0 : route.points,
                        language: this.language,
                        landMarkNav: this.landmarkTBT,
                        pois: this.pois,
                        levelChangers: this.levelChangers,
                        initialBearing: this.initialBearing,
                    });
                    if (guidanceStepsGenerator.steps) {
                        this.steps = guidanceStepsGenerator.steps.filter((i) => i !== undefined);
                    }
                }
                if (this.navigationType === 'city') {
                    this.steps = [];
                    route.route.legs.forEach((leg) => {
                        leg.steps.forEach((step) => {
                            this.steps.push(step);
                        });
                    });
                }
                if (this.navigationType === 'combined') {
                    const combined = combineRoutes(cityRoute, mallRoute, startAtMall ? 'mall-first' : 'city-first');
                    // @ts-ignore
                    paths = combined === null || combined === void 0 ? void 0 : combined.paths;
                    // @ts-ignore
                    this.route = combined === null || combined === void 0 ? void 0 : combined.paths;
                    // @ts-ignore
                    this.points = combined === null || combined === void 0 ? void 0 : combined.points;
                    this.levelPaths = combined === null || combined === void 0 ? void 0 : combined.levelPaths;
                    this.levelPoints = combined === null || combined === void 0 ? void 0 : combined.levelPoints;
                    this.details = combined === null || combined === void 0 ? void 0 : combined.details;
                    this.fullPath = combined === null || combined === void 0 ? void 0 : combined.fullPath;
                    this.steps = [];
                    const citySteps = [];
                    cityRoute.route.legs.forEach((leg) => {
                        leg.steps.forEach((step) => {
                            step.navMode = 'city';
                            citySteps.push(step);
                        });
                    });
                    const mallStepsGenerator = new GuidanceStepsGenerator({
                        points: mallRoute === null || mallRoute === void 0 ? void 0 : mallRoute.points,
                        language: this.language,
                        landMarkNav: this.landmarkTBT,
                        pois: this.pois,
                        levelChangers: this.levelChangers,
                        initialBearing: this.initialBearing,
                    });
                    if (mallStepsGenerator.steps) {
                        const mallSteps = mallStepsGenerator.steps.filter((i) => i !== undefined);
                        this.steps = startAtMall
                            ? mallSteps.map((i) => (Object.assign(Object.assign({}, i), { navMode: 'mall' }))).concat(citySteps)
                            : citySteps.concat(mallSteps.map((i) => (Object.assign(Object.assign({}, i), { navMode: 'mall' }))));
                    }
                }
                if (paths) {
                    const lines = [];
                    for (const [k, v] of Object.entries(paths)) {
                        // @ts-ignore
                        lines.push(v);
                    }
                    this.lines = lines;
                }
                else {
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
        });
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
