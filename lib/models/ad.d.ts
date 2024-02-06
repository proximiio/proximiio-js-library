import BaseModel from './base';
export declare class AdModel extends BaseModel {
    name: string;
    url: string;
    isDefault: boolean;
    features?: string[];
    amenities?: string[];
    constructor(data: any);
}
