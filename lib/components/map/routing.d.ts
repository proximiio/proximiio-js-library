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
    route({ start, finish, stops, landmarkTBT, priorityEntrance, }: {
        start: Feature;
        finish?: Feature;
        stops?: Feature[];
        landmarkTBT?: boolean;
        priorityEntrance?: Feature;
    }): {
        paths: any;
        points: any;
        route: {};
        fullPath: Feature;
        levelPaths: any;
        levelPoints: any;
        details: any;
    };
    cityRoute({ start, finish, language }: {
        start: Feature;
        finish: Feature;
        language?: string;
    }): Promise<{
        data: any;
        route: any;
        points: Feature[];
        fullPath: Feature;
        paths: {};
        levelPaths: {};
        levelPoints: any;
        details: any;
    }>;
}
