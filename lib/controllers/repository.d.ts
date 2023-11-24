import { PlaceModel } from '../models/place';
import { FloorModel } from '../models/floor';
import StyleModel from '../models/style';
import { FeatureCollection } from '../models/feature';
import { AmenityModel } from '../models/amenity';
import { LngLatBoundsLike } from 'maplibre-gl';
export declare const getPackage: ({ initPolygons, autoLabelLines, amenityIdProperty, hiddenAmenities, useTimerangeData, filter, featuresMaxBounds, }: {
    initPolygons?: boolean;
    autoLabelLines?: boolean;
    amenityIdProperty?: string;
    hiddenAmenities?: string[];
    useTimerangeData?: boolean;
    filter?: {
        key: string;
        value: string;
    };
    featuresMaxBounds?: LngLatBoundsLike;
}) => Promise<{
    places: PlaceModel[];
    floors: FloorModel[];
    style: StyleModel;
    styles: StyleModel[];
    features: FeatureCollection;
    amenities: AmenityModel[];
}>;
declare const _default: {
    getPackage: ({ initPolygons, autoLabelLines, amenityIdProperty, hiddenAmenities, useTimerangeData, filter, featuresMaxBounds, }: {
        initPolygons?: boolean;
        autoLabelLines?: boolean;
        amenityIdProperty?: string;
        hiddenAmenities?: string[];
        useTimerangeData?: boolean;
        filter?: {
            key: string;
            value: string;
        };
        featuresMaxBounds?: LngLatBoundsLike;
    }) => Promise<{
        places: PlaceModel[];
        floors: FloorModel[];
        style: StyleModel;
        styles: StyleModel[];
        features: FeatureCollection;
        amenities: AmenityModel[];
    }>;
};
export default _default;
