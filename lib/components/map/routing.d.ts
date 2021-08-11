import Feature, { FeatureCollection } from '../../models/feature';
export default class Routing {
    data: FeatureCollection;
    wayfinding: any;
    constructor();
    setData(collection: FeatureCollection): void;
    toggleOnlyAccessible(onlyAccessible: any): void;
    route(start: Feature, finish: Feature): {
        levelPaths: any;
        points: any;
    };
}
