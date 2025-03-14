import { FloorModel } from '../models/floor';
export declare const getFloors: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string) => Promise<{
    data: FloorModel[];
    total: number;
}>;
export declare const getFloorsBundle: ({ bundleUrl, }: {
    bundleUrl: string;
}) => Promise<{
    data: FloorModel[];
    total: number;
}>;
export declare const getPlaceFloors: (placeId: string) => Promise<FloorModel[]>;
export declare const getPlaceFloorsBundle: ({ bundleUrl, placeId, }: {
    bundleUrl: string;
    placeId: string;
}) => Promise<FloorModel[]>;
export declare const getFloorById: (floorId: string) => Promise<FloorModel>;
export declare const getFloorByIdBundle: ({ bundleUrl, floorId, }: {
    bundleUrl: string;
    floorId: string;
}) => Promise<FloorModel>;
declare const _default: {
    getFloors: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string) => Promise<{
        data: FloorModel[];
        total: number;
    }>;
    getFloorsBundle: ({ bundleUrl, }: {
        bundleUrl: string;
    }) => Promise<{
        data: FloorModel[];
        total: number;
    }>;
    getPlaceFloors: (placeId: string) => Promise<FloorModel[]>;
    getFloorById: (floorId: string) => Promise<FloorModel>;
    getFloorByIdBundle: ({ bundleUrl, floorId, }: {
        bundleUrl: string;
        floorId: string;
    }) => Promise<FloorModel>;
};
export default _default;
