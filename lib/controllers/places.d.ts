import { PlaceModel } from '../models/place';
export declare const getPlaces: (limit?: number | undefined, skip?: number | undefined, order?: string | undefined, dir?: string | undefined, filterByIndex?: string | undefined, q?: string | undefined, filter?: string | undefined) => Promise<{
    data: PlaceModel[];
    total: number;
}>;
export declare const getPlaceById: (placeId: string) => Promise<PlaceModel>;
declare const _default: {
    getPlaces: (limit?: number | undefined, skip?: number | undefined, order?: string | undefined, dir?: string | undefined, filterByIndex?: string | undefined, q?: string | undefined, filter?: string | undefined) => Promise<{
        data: PlaceModel[];
        total: number;
    }>;
    getPlaceById: (placeId: string) => Promise<PlaceModel>;
};
export default _default;
