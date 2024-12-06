import BaseModel from './base';
export declare class AdModel extends BaseModel {
    name: string;
    url: string;
    isDefault: boolean;
    isActive: boolean;
    features?: string[];
    amenities?: string[];
    startDate?: number;
    endDate?: number;
    constructor(data: any);
}
