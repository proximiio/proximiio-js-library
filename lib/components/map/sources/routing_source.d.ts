import DataSource from './data_source';
import Feature from '../../../models/feature';
import Routing from '../routing';
import { GuidanceStep, WayfindingConfigModel } from '../../../models/wayfinding';
import { FloorModel } from '../../../models/floor';
interface ChangeContainer {
    action: string;
    feature: Feature;
}
export default class RoutingSource extends DataSource {
    isEditable: boolean;
    start?: Feature;
    connectingPoint?: Feature;
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
            elevator?: number;
            escalator?: number;
            staircase?: number;
            realistic: number;
            shortest: number;
        };
    };
    steps: GuidanceStep[];
    preview?: boolean;
    language: string;
    navigationType: 'mall' | 'city' | 'combined';
    fullPath?: Feature;
    isMultipoint: boolean;
    stepsNavigation?: 'disabled' | 'simple' | 'simple-levelChangers' | 'full' | 'full-levelChangers' | 'landmark' | 'landmark-levelChangers';
    pois?: Feature[];
    levelChangers?: Feature[];
    initialBearing: number;
    floors: FloorModel[];
    currentFloor: FloorModel;
    constructor();
    toggleAccessible(value: any): void;
    setConfig(config: WayfindingConfigModel): void;
    setNavigationType(type: 'mall' | 'city' | 'combined'): void;
    setStepsNavigation(value: 'disabled' | 'simple' | 'simple-levelChangers' | 'full' | 'full-levelChangers' | 'landmark' | 'landmark-levelChangers'): void;
    setInitialBearing(initialBearing: number): void;
    setPois(pois: Feature[]): void;
    setLevelChangers(levelChangers: Feature[]): void;
    setFloors(floors: FloorModel[]): void;
    setCurrentFloor(currentFloor: FloorModel): void;
    update({ start, connectingPoint, finish, stops, preview, language, }: {
        start?: Feature;
        connectingPoint?: Feature;
        finish?: Feature;
        stops?: Feature[];
        preview?: boolean;
        language: string;
    }): Promise<void>;
    cancel(): void;
}
export {};
