import BaseModel from './base';
export declare class GeofenceModel extends BaseModel {
    name: string;
    type: string;
    area: {
        lat: number;
        lng: number;
    };
    address: string;
    radius?: number;
    polygon?: [number, number][];
    metadata?: {
        [key: string]: string | undefined;
    };
    place_id: string;
    place_name?: string;
    floor_id: string;
    floor_name?: string;
    department_id: string;
    department_name?: string;
    remote_id?: string;
    constructor(data: any);
}
