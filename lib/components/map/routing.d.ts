import Feature, { FeatureCollection } from '../../models/feature';
export default class Routing {
    data: FeatureCollection;
    wayfinding: any;
    forceFloorLevel: number;
    constructor();
    setData(collection: FeatureCollection): void;
    toggleOnlyAccessible(onlyAccessible: any): void;
    route(start: Feature, finish: Feature): {
        paths: any;
        points: any;
        levelPaths: any;
        levelPoints: any;
    };
}
