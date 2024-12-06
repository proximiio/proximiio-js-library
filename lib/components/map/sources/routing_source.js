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
export default class RoutingSource extends DataSource {
    constructor() {
        super('route');
        this.isEditable = false;
        this.isMultipoint = false;
        this.changes = [];
        this.routing = new Routing();
        this.navigationType = 'mall';
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
    update({ start, finish, stops, preview, language, }) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const route = this.navigationType === 'city'
                    ? yield this.routing.cityRoute({ start, finish, language: this.language })
                    : this.routing.route({ start, finish, stops });
                // @ts-ignore
                const paths = route === null || route === void 0 ? void 0 : route.paths;
                // @ts-ignore
                this.route = route === null || route === void 0 ? void 0 : route.paths;
                // @ts-ignore
                this.points = route === null || route === void 0 ? void 0 : route.points;
                this.levelPaths = route === null || route === void 0 ? void 0 : route.levelPaths;
                this.levelPoints = route === null || route === void 0 ? void 0 : route.levelPoints;
                this.details = route === null || route === void 0 ? void 0 : route.details;
                this.fullPath = route === null || route === void 0 ? void 0 : route.fullPath;
                if (this.navigationType === 'mall') {
                    const guidanceStepsGenerator = new GuidanceStepsGenerator(route === null || route === void 0 ? void 0 : route.points, this.language);
                    this.steps = guidanceStepsGenerator.steps;
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
        this.data = new FeatureCollection({
            features: [this.start, this.finish].concat(this.lines || []).filter((i) => i),
        });
        this.navigationType = 'mall';
        this.notify('feature-updated');
    }
}
