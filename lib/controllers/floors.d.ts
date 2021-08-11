import { FloorModel } from '../models/floor';
export declare const getFloors: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string) => Promise<{
    data: FloorModel[];
    total: number;
}>;
export declare const getPlaceFloors: (placeId: string) => Promise<FloorModel[]>;
declare const _default: {
    getFloors: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string) => Promise<{
        data: FloorModel[];
        total: number;
    }>;
    getPlaceFloors: (placeId: string) => Promise<FloorModel[]>;
};
export default _default;
