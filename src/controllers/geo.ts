import { axios, uuidv4 } from '../common';
import Feature, { FeatureCollection } from '../models/feature';
import { AmenityModel } from '../models/amenity';
import { globalState } from '../components/map/main';
import { FeatureCollection as FCModel, Feature as FModel, Polygon, MultiPolygon } from '@turf/helpers';
import { booleanPointInPolygon } from '@turf/turf';

export const getFeatures = async (initPolygons?: boolean) => {
  const url = '/v5/geo/features';
  const res = await axios.get(url);
  if (initPolygons) {
    const featuresToAdd: any[] = [];
    const shopPolygons = res.data.features.filter(
      (f) => f.properties.type === 'shop' && f.geometry.type === 'MultiPolygon',
    );

    res.data.features = res.data.features.map((feature: any, key: number) => {
      if (feature.properties.type === 'poi') {
        feature.id = feature.id ? feature.id.replace(/\{|\}/g, '') : null;
        feature.properties.id = feature.properties.id ? feature.properties.id.replace(/\{|\}/g, '') : null;

        let connectedPolygon;
        // check if feature is inside a polygon
        shopPolygons.forEach((polygon) => {
          if (feature.properties?.level === polygon.properties?.level) {
            if (booleanPointInPolygon(feature, polygon)) {
              connectedPolygon = polygon;
            }
          }
        });

        // or if not check if the polygon is defined in metadata and use it instead
        if (!connectedPolygon && feature.properties.metadata && feature.properties.metadata.polygon_id) {
          connectedPolygon = res.data.features.find(
            (f: any) =>
              f.properties.id?.replace(/\{|\}/g, '') === feature.properties.metadata.polygon_id?.replace(/\{|\}/g, ''),
          );
        }

        if (connectedPolygon) {
          feature.properties._dynamic = feature.properties._dynamic ? feature.properties._dynamic : {};
          feature.properties._dynamic.id = feature.id;
          feature.properties._dynamic.type = 'poi-custom';
          feature.properties._dynamic.amenity = feature.properties.amenity;
          feature.properties._dynamic.polygon_id = connectedPolygon.properties.id?.replace(/\{|\}/g, '');

          connectedPolygon.properties._dynamic = connectedPolygon.properties._dynamic
            ? connectedPolygon.properties._dynamic
            : {};
          connectedPolygon.properties._dynamic.id = connectedPolygon.properties.id?.replace(/\{|\}/g, '');
          connectedPolygon.properties._dynamic.type = 'shop-custom';
          connectedPolygon.properties._dynamic.poi_id = feature.properties.id;
          connectedPolygon.properties._dynamic.amenity = feature.properties.amenity;
          connectedPolygon.id = JSON.stringify(key);
          const labelLine = connectedPolygon.properties['label-line']
            ? JSON.parse(connectedPolygon.properties['label-line'])
            : connectedPolygon.properties.metadata['label-line']
            ? JSON.parse(connectedPolygon.properties.metadata['label-line'])
            : feature.properties.metadata['label-line']
            ? JSON.parse(feature.properties.metadata['label-line'])
            : undefined;
          if (labelLine)
          if (labelLine && labelLine[0] instanceof Array && labelLine[1] instanceof Array) {
            const labelLineFeature = JSON.parse(JSON.stringify(feature));
            labelLineFeature.geometry = {
              coordinates: labelLine,
              type: 'LineString',
            };
            labelLineFeature.properties.id = JSON.stringify(key + 9999);
            labelLineFeature.id = JSON.stringify(key + 9999);
            labelLineFeature.properties.type = 'shop-label';
            labelLineFeature.properties._dynamic.type = 'shop-label';
            connectedPolygon.properties._dynamic.label_id = labelLineFeature.properties.id;
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

export const getAmenities = async (amenityIdProperty?: string) => {
  const url = '/v5/geo/amenities';
  const res = await axios.get(url);
  return res.data.map((item: any) => {
    if (amenityIdProperty && item[amenityIdProperty] && item.category !== 'default') {
      item.id = item[amenityIdProperty].toLowerCase();
    }
    return new AmenityModel(item);
  });
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

export const addFeatures = async (featureCollection: FCModel) => {
  const url = '/v5/geo/features';
  try {
    await axios.post(url, featureCollection);
  } catch (error) {
    console.log('Adding new features to db failed', error.message);
    throw new Error(error.message);
  }
};

export const updateFeature = async (featureData: FModel, featureId: string) => {
  const url = '/v5/geo/features/' + featureId;
  try {
    await axios.put(url, featureData);
  } catch (error) {
    console.log('Updating feature in db failed', error.message);
    throw new Error(error.message);
  }
};

export const deleteFeatures = async (featureCollection: FCModel) => {
  const url = '/v5/geo/features/delete';
  try {
    await axios.post(url, featureCollection);
  } catch (error) {
    console.log('Deleting features from db failed', error.message);
    throw new Error(error.message);
  }
};

export default {
  getFeatures,
  addFeatures,
  updateFeature,
  deleteFeatures,
  getAmenities,
  getPois,
};
