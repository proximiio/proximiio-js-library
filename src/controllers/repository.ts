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
  polygonFeatureTypes,
  autoLabelLines,
  amenityIdProperty,
  hiddenAmenities,
  useTimerangeData,
  filter,
  featuresMaxBounds,
}: {
  initPolygons?: boolean;
  polygonFeatureTypes?: { type: string; autoAssign?: boolean }[];
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
  try {
    const result: any = {};

    const placesPromise = getPlaces().then((places) => (result.places = places.data));

    const floorsPromise = getFloors().then((floors) => (result.floors = floors.data));

    const kiosksPromise = getKiosks().then((kiosks) => (result.kiosks = kiosks.data));

    const stylePromise = getStyle().then((style) => (result.style = style));

    const stylesPromise = getStyles().then((styles) => (result.styles = styles));

    const featuresPromise = getFeatures({
      initPolygons,
      polygonFeatureTypes,
      autoLabelLines,
      hiddenAmenities,
      useTimerangeData,
      filter,
      featuresMaxBounds,
    }).then((features) => (result.features = features));

    const amenitiesPromise = getAmenities({ amenityIdProperty }).then((amenities) => (result.amenities = amenities));

    await Promise.all([
      placesPromise,
      floorsPromise,
      kiosksPromise,
      stylePromise,
      stylesPromise,
      featuresPromise,
      amenitiesPromise,
    ]);

    return result;
  } catch (error) {
    throw new Error(`Retrieving repository failed, ${error.message}`);
  }
};

export default {
  getPackage,
};
