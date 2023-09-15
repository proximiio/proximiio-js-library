import { Feature } from '@turf/helpers';
export interface WayfindingConfigModel {
    avoidElevators: boolean;
    avoidEscalators: boolean;
    avoidStaircases: boolean;
    avoidRamps: boolean;
    avoidNarrowPaths: boolean;
    avoidRevolvingDoors: boolean;
    avoidTicketGates: boolean;
    avoidBarriers: boolean;
    avoidHills: boolean;
}
export interface GuidanceStep {
    bearingFromLastStep: number;
    coordinates: [number, number];
    direction: string;
    distanceFromLastStep: number;
    level: number;
    levelChangerId?: string;
    levelChangerType?: string;
    levelChangerDirection?: 'UP' | 'DOWN';
    levelChangerDestinationLevel?: number;
    lineStringFeatureFromLastStep?: Feature;
}
