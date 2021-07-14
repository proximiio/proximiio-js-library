import Feature, { FeatureCollection } from '../models/feature';
export declare const getFeatures: () => Promise<FeatureCollection>;
export declare const getAmenities: () => Promise<any>;
export declare const getPois: () => Promise<Feature[]>;
declare const _default: {
    getFeatures: () => Promise<FeatureCollection>;
    getAmenities: () => Promise<any>;
    getPois: () => Promise<Feature[]>;
};
export default _default;
