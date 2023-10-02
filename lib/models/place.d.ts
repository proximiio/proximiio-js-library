import BaseModel from './base';
export declare class PlaceModel extends BaseModel {
    name: string;
    address: string;
    location: {
        lat: number;
        lng: number;
        zoom?: number;
    };
    tags?: string[];
    remoteId?: string;
    metadata?: {
        [key: string]: string | undefined;
    };
    constructor(data: any);
    get hasLocation(): boolean;
}
