import Feature, { FeatureCollection } from '../../models/feature';
import { WayfindingConfigModel } from '../../models/wayfinding';
export default class Routing {
    data: FeatureCollection;
    wayfinding: any;
    forceFloorLevel: number;
    routeWithDetails: boolean;
    constructor();
    setData(collection: FeatureCollection): void;
    toggleOnlyAccessible(onlyAccessible: any): void;
    setConfig(config: WayfindingConfigModel): void;
    route(start: Feature, finish: Feature): {
        paths: any;
        points: any;
        levelPaths: any;
        levelPoints: any;
        details: any;
    };
}
