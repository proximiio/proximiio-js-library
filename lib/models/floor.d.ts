import BaseModel from './base';
import { Geopoint } from './geopoint';
export interface FloorEditorModel {
    angle: number;
    center: Geopoint;
    opacity: number;
    scale?: number;
    url?: string;
    width?: number;
    coordinates?: {
        c1: Geopoint;
        c2: Geopoint;
        c3: Geopoint;
        c4: Geopoint;
    } | number[][];
}
export declare type Coordinates = [number, number];
export declare class FloorModel extends BaseModel {
    name: string;
    placeId: string;
    placeName?: string;
    floorplanImageUrl: string;
    level: number;
    anchors?: [Coordinates, Coordinates, Coordinates, Coordinates];
    editor?: FloorEditorModel;
    geopoint?: [number, number];
    remoteId?: string;
    constructor(data: any);
    get hasFloorplan(): boolean;
}
