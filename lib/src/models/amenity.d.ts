import BaseModel from './base';
export declare class AmenityModel extends BaseModel {
    category: string;
    iconOffset: [number, number];
    list: boolean;
    title: string;
    description: string;
    icon: string;
    constructor(data: any);
    get hasIcon(): boolean;
}
