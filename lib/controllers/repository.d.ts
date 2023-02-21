import { PlaceModel } from '../models/place';
import { FloorModel } from '../models/floor';
import StyleModel from '../models/style';
import { FeatureCollection } from '../models/feature';
import { AmenityModel } from '../models/amenity';
export declare const getPackage: (initPolygons?: boolean, amenityIdProperty?: string, hiddenAmenities?: string[]) => Promise<{
    places: PlaceModel[];
    floors: FloorModel[];
    style: StyleModel;
    styles: StyleModel[];
    features: FeatureCollection;
    amenities: AmenityModel[];
}>;
declare const _default: {
    getPackage: (initPolygons?: boolean, amenityIdProperty?: string, hiddenAmenities?: string[]) => Promise<{
        places: PlaceModel[];
        floors: FloorModel[];
        style: StyleModel;
        styles: StyleModel[];
        features: FeatureCollection;
        amenities: AmenityModel[];
    }>;
};
export default _default;
