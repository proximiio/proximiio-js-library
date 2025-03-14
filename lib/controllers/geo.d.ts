import Feature, { FeatureCollection } from '../models/feature';
import { AmenityModel } from '../models/amenity';
import { PolygonLayer } from '../components/map/main';
import { FeatureCollection as FCModel, Feature as FModel } from '@turf/helpers';
import { LngLatBoundsLike } from 'maplibre-gl';
export declare const getFeatures: ({ initPolygons, polygonLayers, autoLabelLines, hiddenAmenities, useTimerangeData, filter, featuresMaxBounds, localSources, }: {
    initPolygons?: boolean;
    polygonLayers: PolygonLayer[];
    autoLabelLines?: boolean;
    hiddenAmenities?: string[];
    useTimerangeData?: boolean;
    filter?: {
        key: string;
        value: string;
        hideIconOnly?: boolean;
    };
    featuresMaxBounds?: LngLatBoundsLike;
    localSources?: {
        features?: FeatureCollection;
    };
}) => Promise<FeatureCollection>;
export declare const getFeaturesBundle: ({ initPolygons, polygonLayers, autoLabelLines, hiddenAmenities, useTimerangeData, filter, bundleUrl, }: {
    initPolygons?: boolean;
    polygonLayers: PolygonLayer[];
    autoLabelLines?: boolean;
    hiddenAmenities?: string[];
    useTimerangeData?: boolean;
    filter?: {
        key: string;
        value: string;
        hideIconOnly?: boolean;
    };
    bundleUrl: string;
}) => Promise<FeatureCollection>;
export declare const getAmenities: ({ amenityIdProperty, localSources, }: {
    amenityIdProperty?: string;
    localSources?: {
        amenities?: AmenityModel[];
    };
}) => Promise<any>;
export declare const getAmenitiesBundle: ({ amenityIdProperty, bundleUrl, }: {
    amenityIdProperty?: string;
    bundleUrl: string;
}) => Promise<any>;
export declare const getPois: () => Promise<Feature[]>;
export declare const addFeatures: (featureCollection: FCModel) => Promise<void>;
export declare const updateFeature: (featureData: FModel, featureId: string) => Promise<void>;
export declare const deleteFeatures: (featureCollection: FCModel) => Promise<void>;
export declare const getFeatureById: (featureId: string) => Promise<Feature>;
export declare const getFeatureByIdBundle: ({ bundleUrl, featureId, }: {
    bundleUrl: string;
    featureId: string;
}) => Promise<Feature>;
declare const _default: {
    getFeatures: ({ initPolygons, polygonLayers, autoLabelLines, hiddenAmenities, useTimerangeData, filter, featuresMaxBounds, localSources, }: {
        initPolygons?: boolean;
        polygonLayers: PolygonLayer[];
        autoLabelLines?: boolean;
        hiddenAmenities?: string[];
        useTimerangeData?: boolean;
        filter?: {
            key: string;
            value: string;
            hideIconOnly?: boolean;
        };
        featuresMaxBounds?: LngLatBoundsLike;
        localSources?: {
            features?: FeatureCollection;
        };
    }) => Promise<FeatureCollection>;
    addFeatures: (featureCollection: FCModel<import("@turf/helpers").Geometry | import("@turf/helpers").GeometryCollection, {
        [name: string]: any;
    }>) => Promise<void>;
    updateFeature: (featureData: FModel<import("@turf/helpers").Geometry | import("@turf/helpers").GeometryCollection, {
        [name: string]: any;
    }>, featureId: string) => Promise<void>;
    deleteFeatures: (featureCollection: FCModel<import("@turf/helpers").Geometry | import("@turf/helpers").GeometryCollection, {
        [name: string]: any;
    }>) => Promise<void>;
    getAmenities: ({ amenityIdProperty, localSources, }: {
        amenityIdProperty?: string;
        localSources?: {
            amenities?: AmenityModel[];
        };
    }) => Promise<any>;
    getPois: () => Promise<Feature[]>;
    getFeatureById: (featureId: string) => Promise<Feature>;
    getFeatureByIdBundle: ({ bundleUrl, featureId, }: {
        bundleUrl: string;
        featureId: string;
    }) => Promise<Feature>;
};
export default _default;
