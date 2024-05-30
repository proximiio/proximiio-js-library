import { PlaceModel } from '../models/place';
export declare const getPlaces: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string, filter?: string) => Promise<{
    data: PlaceModel[];
    total: number;
}>;
export declare const getPlacesBundle: ({ bundleUrl, }: {
    bundleUrl: string;
}) => Promise<{
    data: PlaceModel[];
    total: number;
}>;
export declare const getPlaceById: (placeId: string) => Promise<PlaceModel>;
export declare const getPlaceByIdBundle: ({ bundleUrl, placeId, }: {
    bundleUrl: string;
    placeId: string;
}) => Promise<PlaceModel>;
declare const _default: {
    getPlaces: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string, filter?: string) => Promise<{
        data: PlaceModel[];
        total: number;
    }>;
    getPlaceById: (placeId: string) => Promise<PlaceModel>;
};
export default _default;
