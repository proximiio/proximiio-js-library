import DataSource from './data_source';
import Feature from '../../../models/feature';
import Routing from '../routing';
import { GuidanceStep, WayfindingConfigModel } from '../../../models/wayfinding';
interface ChangeContainer {
    action: string;
    feature: Feature;
}
export default class RoutingSource extends DataSource {
    isEditable: boolean;
    start?: Feature;
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
            elevator: number;
            escalator: number;
            staircase: number;
            realistic: number;
            shortest: number;
        };
    };
    steps: GuidanceStep[];
    preview?: boolean;
    language: string;
    navigationType: 'mall' | 'city';
    fullPath?: Feature;
    isMultipoint: boolean;
    landmarkTBT: boolean;
    pois?: Feature[];
    levelChangers?: Feature[];
    initialBearing: number;
    constructor();
    toggleAccessible(value: any): void;
    setConfig(config: WayfindingConfigModel): void;
    setNavigationType(type: 'mall' | 'city'): void;
    setLandmarkTBT(value: boolean): void;
    setInitialBearing(initialBearing: number): void;
    setPois(pois: Feature[]): void;
    setLevelChangers(levelChangers: Feature[]): void;
    update({ start, finish, stops, preview, language, }: {
        start?: Feature;
        finish?: Feature;
        stops?: Feature[];
        preview?: boolean;
        language: string;
    }): Promise<void>;
    cancel(): void;
}
export {};
