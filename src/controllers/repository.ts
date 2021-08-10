import { getPlaces } from './places';
import { getFloors } from './floors';
import { getStyle, getStyles } from './style';
import { PlaceModel } from '../models/place';
import { FloorModel } from '../models/floor';
import StyleModel from '../models/style';
import { getAmenities, getFeatures } from './geo';
import { FeatureCollection } from '../models/feature';
import { AmenityModel } from '../models/amenity';

export const getPackage = async (initPolygons?: boolean): Promise<{ places: PlaceModel[], floors: FloorModel[], style: StyleModel, styles: StyleModel[], features: FeatureCollection, amenities: AmenityModel[] }> => {
  const result: any = {};
  const promises = [
    getPlaces().then(places => result.places = places.data),
    getFloors().then(floors => result.floors = floors.data),
    getStyle().then(style => result.style = style),
    getStyles().then(styles => result.styles = styles),
    getFeatures(initPolygons).then(features => result.features = features),
    getAmenities().then(amenities => result.amenities = amenities)
  ];
  await Promise.all(promises);
  return result;
};

export default {
  getPackage
}
