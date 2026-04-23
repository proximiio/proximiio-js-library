import Feature from '../../models/feature';
import { FeatureCollection } from '@turf/helpers';
import { WayfindingConfigModel } from '../../models/wayfinding';
export default class Routing {
    data: FeatureCollection;
    wayfinding: any;
    forceFloorLevel: number;
    routeWithDetails: boolean;
    config: WayfindingConfigModel;
    constructor();
    setData(collection: FeatureCollection): void;
    toggleOnlyAccessible(onlyAccessible: any): void;
    setConfig(config: WayfindingConfigModel): void;
    route({ start, finish, stops, landmarkTBT, simplifiedTBT, priorityEntrance, }: {
        start: Feature;
        finish?: Feature;
        stops?: Feature[];
        landmarkTBT?: boolean;
        simplifiedTBT?: boolean;
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
