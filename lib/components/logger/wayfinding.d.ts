import BaseLogger from './base';
export default class WayfindingLogger extends BaseLogger {
    startLngLat: [number, number];
    startLevel: number;
    startSegmentId?: string;
    startSegmentName?: string;
    startGeofenceId?: string;
    startGeofenceName?: string;
    destinationFeatureId?: string;
    destinationName?: string;
    destinationLngLat: [number, number];
    destinationLevel: number;
    foundPath: boolean;
    optionAvoidBarrier: boolean;
    optionAvoidElevators: boolean;
    optionAvoidEscalators: boolean;
    optionAvoidNarrowPaths: boolean;
    optionAvoidRamps: boolean;
    optionAvoidStaircases: boolean;
    optionAvoidTicketGates: boolean;
    route: [number, number, number][];
    rerouted?: boolean;
    navigationType?: 'mall' | 'city';
    constructor(data: any);
    save(): Promise<void>;
}
