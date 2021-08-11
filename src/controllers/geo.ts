import { axios, uuidv4 } from '../common';
import Feature, { FeatureCollection } from '../models/feature';
import { AmenityModel } from '../models/amenity';
import { globalState } from '../components/map/main';

export const getFeatures = async (initPolygons?: boolean) => {
  const url = '/v5/geo/features';
  const res = await axios.get(url);
  if (initPolygons) {
    const featuresToAdd: any[] = [];
    res.data.features = res.data.features.map((feature: any, key: number) => {
      if (feature.properties.type === 'poi' && feature.properties.metadata && feature.properties.metadata.polygon_id) {
        feature.properties.type = 'poi-custom';
        const polygon = res.data.features.find((f: any) => f.properties.id === feature.properties.metadata.polygon_id);
        if (polygon) {
          polygon.properties.type = 'shop-custom';
          polygon.properties.poi_id = feature.properties.id;
          polygon.properties.amenity = feature.properties.amenity;
          polygon.id = JSON.stringify(key);
          if (
            polygon.properties['label-line'] &&
            polygon.properties['label-line'][0] instanceof Array &&
            polygon.properties['label-line'][1] instanceof Array
          ) {
            const labelLineFeature = JSON.parse(JSON.stringify(feature));
            labelLineFeature.geometry = {
              coordinates: polygon.properties['label-line'],
              type: 'LineString',
            };
            labelLineFeature.properties.id = JSON.stringify(key + 9999);
            labelLineFeature.id = JSON.stringify(key + 9999);
            labelLineFeature.properties.type = 'shop-label';
            polygon.properties.label_id = labelLineFeature.properties.id;
            featuresToAdd.push(labelLineFeature);
          }
        }
      }
      return feature;
    });
    res.data.features = res.data.features.concat(featuresToAdd);
  }
  return new FeatureCollection(res.data);
};

export const getAmenities = async () => {
  const url = '/v5/geo/amenities';
  const res = await axios.get(url);
  return res.data.map((item: any) => new AmenityModel(item));
};

export const getPois = async () => {
  const url = '/v5/geo/features';
  const res = await axios.get(url);
  const customPois = globalState.dynamicFeatures;
  const pois = [...(res.data as FeatureCollection).features, ...customPois.features]
    .filter((feature: Feature) => feature.properties.usecase === 'poi' || feature.properties.type === 'poi')
    .sort((a: Feature, b: Feature) => (a.properties.title > b.properties.title ? -1 : 1))
    .sort((a: Feature, b: Feature) => (a.properties.level > b.properties.level ? 1 : -1))
    .map((item: any) => new Feature(item));
  return pois;
};

export default {
  getFeatures,
  getAmenities,
  getPois,
};
