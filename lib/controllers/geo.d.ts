import Feature, { FeatureCollection } from '../models/feature';
import { FeatureCollection as FCModel, Feature as FModel } from '@turf/helpers';
export declare const getFeatures: (initPolygons?: boolean, hiddenAmenities?: string[]) => Promise<FeatureCollection>;
export declare const getAmenities: (amenityIdProperty?: string) => Promise<any>;
export declare const getPois: () => Promise<Feature[]>;
export declare const addFeatures: (featureCollection: FCModel) => Promise<void>;
export declare const updateFeature: (featureData: FModel, featureId: string) => Promise<void>;
export declare const deleteFeatures: (featureCollection: FCModel) => Promise<void>;
declare const _default: {
    getFeatures: (initPolygons?: boolean, hiddenAmenities?: string[]) => Promise<FeatureCollection>;
    addFeatures: (featureCollection: FCModel<import("@turf/helpers").Geometry | import("@turf/helpers").GeometryCollection, {
        [name: string]: any;
    }>) => Promise<void>;
    updateFeature: (featureData: FModel<import("@turf/helpers").Geometry | import("@turf/helpers").GeometryCollection, {
        [name: string]: any;
    }>, featureId: string) => Promise<void>;
    deleteFeatures: (featureCollection: FCModel<import("@turf/helpers").Geometry | import("@turf/helpers").GeometryCollection, {
        [name: string]: any;
    }>) => Promise<void>;
    getAmenities: (amenityIdProperty?: string) => Promise<any>;
    getPois: () => Promise<Feature[]>;
};
export default _default;
