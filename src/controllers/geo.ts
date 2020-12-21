import { axios } from '../common';
import Feature, { FeatureCollection } from '../models/feature';
import { AmenityModel } from '../models/amenity';
import { globalState } from '../components/map/main';

export const getFeatures = async () => {
  const url = '/v5/geo/features';
  const res = await axios.get(url);
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
      .filter((feature: Feature) => (feature.properties.usecase === 'poi' || feature.properties.type === 'poi'))
      .sort((a: Feature, b: Feature) => a.properties.title > b.properties.title ? -1 : 1)
      .sort((a: Feature, b: Feature) => a.properties.level > b.properties.level ? 1 : -1)
      .map((item: any) => new Feature(item));
  return pois;
}

export default {
  getFeatures,
  getAmenities,
  getPois
}
