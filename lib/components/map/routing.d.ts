import Feature from '../../models/feature';
import { FeatureCollection } from '@turf/helpers';
import { WayfindingConfigModel } from '../../models/wayfinding';
export interface RoutingWorkingHoursOptions {
    useWorkingHours?: boolean;
    excludeClosedPois?: boolean;
    /** Override "now" for previewing a route at a different time. Defaults to the device's current time. */
    datetime?: Date;
}
export default class Routing {
    data: FeatureCollection;
    rawData: FeatureCollection;
    wayfinding: any;
    forceFloorLevel: number;
    routeWithDetails: boolean;
    config: WayfindingConfigModel;
    workingHoursOptions: RoutingWorkingHoursOptions;
    constructor();
    private filterRoutableFeatures;
    setData(collection: FeatureCollection, options?: RoutingWorkingHoursOptions): void;
    setWorkingHoursOptions(options: RoutingWorkingHoursOptions): void;
    toggleOnlyAccessible(onlyAccessible: any): void;
    setConfig(config: WayfindingConfigModel): void;
    route({ start, finish, stops, stepsNavigation, priorityEntrance, }: {
        start: Feature;
        finish?: Feature;
        stops?: Feature[];
        stepsNavigation?: 'disabled' | 'simple' | 'simple-levelChangers' | 'full' | 'full-levelChangers' | 'landmark' | 'landmark-levelChangers';
        priorityEntrance?: Feature;
    }): {
        destinationOpen: boolean;
    } | {
        destinationOpen: boolean;
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
