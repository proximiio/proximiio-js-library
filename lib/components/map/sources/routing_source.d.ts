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
    constructor();
    toggleAccessible(value: any): void;
    setConfig(config: WayfindingConfigModel): void;
    update(start?: Feature, finish?: Feature, preview?: boolean): Promise<void>;
    cancel(): void;
}
export {};
