import Feature, { FeatureCollection } from '../models/feature';
export declare const getFeatures: (initPolygons?: boolean) => Promise<FeatureCollection>;
export declare const getAmenities: (amenityIdProperty?: string) => Promise<any>;
export declare const getPois: () => Promise<Feature[]>;
declare const _default: {
    getFeatures: (initPolygons?: boolean) => Promise<FeatureCollection>;
    getAmenities: (amenityIdProperty?: string) => Promise<any>;
    getPois: () => Promise<Feature[]>;
};
export default _default;
