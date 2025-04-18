import BaseModel from './base';
export declare class KioskModel extends BaseModel {
    name: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    level: number;
    zoom?: number;
    bearing?: number;
    pitch?: number;
    bounds?: [[number, number], [number, number]];
    floor_id?: string;
    constructor(data: any);
    get hasLocation(): boolean;
}
