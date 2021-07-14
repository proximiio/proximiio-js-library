import { FloorModel } from '../models/floor';
export declare const getFloors: (limit?: number | undefined, skip?: number | undefined, order?: string | undefined, dir?: string | undefined, filterByIndex?: string | undefined, q?: string | undefined) => Promise<{
    data: FloorModel[];
    total: number;
}>;
export declare const getPlaceFloors: (placeId: string) => Promise<FloorModel[]>;
declare const _default: {
    getFloors: (limit?: number | undefined, skip?: number | undefined, order?: string | undefined, dir?: string | undefined, filterByIndex?: string | undefined, q?: string | undefined) => Promise<{
        data: FloorModel[];
        total: number;
    }>;
    getPlaceFloors: (placeId: string) => Promise<FloorModel[]>;
};
export default _default;
