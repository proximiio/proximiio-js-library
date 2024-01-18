import { getPlaces } from './places';
import { getFloors } from './floors';
import { getStyle, getStyles } from './style';
import { PlaceModel } from '../models/place';
import { FloorModel } from '../models/floor';
import StyleModel from '../models/style';
import { getAmenities, getFeatures } from './geo';
import { FeatureCollection } from '../models/feature';
import { AmenityModel } from '../models/amenity';
import { LngLatBoundsLike } from 'maplibre-gl';
import { getKiosks } from './kiosks';
import { KioskModel } from '../models/kiosk';

export const getPackage = async ({
  initPolygons,
  autoLabelLines,
  amenityIdProperty,
  hiddenAmenities,
  useTimerangeData,
  filter,
  featuresMaxBounds,
}: {
  initPolygons?: boolean;
  autoLabelLines?: boolean;
  amenityIdProperty?: string;
  hiddenAmenities?: string[];
  useTimerangeData?: boolean;
  filter?: { key: string; value: string };
  featuresMaxBounds?: LngLatBoundsLike;
}): Promise<{
  places: PlaceModel[];
  floors: FloorModel[];
  kiosks: KioskModel[];
  style: StyleModel;
  styles: StyleModel[];
  features: FeatureCollection;
  amenities: AmenityModel[];
}> => {
  const result: any = {};
  const promises = [
    getPlaces().then((places) => (result.places = places.data)),
    getFloors().then((floors) => (result.floors = floors.data)),
    getKiosks().then((kiosks) => (result.kiosks = kiosks.data)),
    getStyle().then((style) => (result.style = style)),
    getStyles().then((styles) => (result.styles = styles)),
    getFeatures({ initPolygons, autoLabelLines, hiddenAmenities, useTimerangeData, filter, featuresMaxBounds }).then(
      (features) => (result.features = features),
    ),
    getAmenities(amenityIdProperty).then((amenities) => (result.amenities = amenities)),
  ];
  await Promise.all(promises);
  return result;
};

export default {
  getPackage,
};
