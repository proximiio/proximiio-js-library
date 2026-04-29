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
    route({ start, finish, stops, stepsNavigation, priorityEntrance, }: {
        start: Feature;
        finish?: Feature;
        stops?: Feature[];
        stepsNavigation?: 'disabled' | 'simple' | 'simple-levelChangers' | 'full' | 'full-levelChangers' | 'landmark' | 'landmark-levelChangers';
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
