import { Feature } from "@turf/helpers";

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
  isWaypoint: boolean;
  level: number;
  levelChangerId?: string;
  levelChangerType?: string;
  levelChangeDirection?: 'UP' | 'DOWN'
  lineStringFeatureFromLastStep?: Feature;
  waypointId?: string;
}