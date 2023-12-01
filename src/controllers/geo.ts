import { axios, getNestedObjectValue, uuidv4 } from '../common';
import Feature, { FeatureCollection } from '../models/feature';
import { AmenityModel } from '../models/amenity';
import { globalState } from '../components/map/main';
import { FeatureCollection as FCModel, Feature as FModel, Polygon, MultiPolygon } from '@turf/helpers';
import {
  booleanPointInPolygon,
  pointOnFeature,
  lineString,
  length,
  pointToLineDistance,
  centroid,
  lineOffset,
  transformScale,
  lineIntersect,
} from '@turf/turf';
import { LngLatBoundsLike } from 'maplibre-gl';

export const getFeatures = async ({
  initPolygons,
  autoLabelLines,
  hiddenAmenities,
  useTimerangeData,
  filter,
  featuresMaxBounds,
}: {
  initPolygons?: boolean;
  autoLabelLines?: boolean;
  hiddenAmenities?: string[];
  useTimerangeData?: boolean;
  filter?: { key: string; value: string };
  featuresMaxBounds?: LngLatBoundsLike;
}) => {
  let url = '/v5/geo/features';
  if (featuresMaxBounds) {
    url += `/${featuresMaxBounds[0][0]},${featuresMaxBounds[0][1]},${featuresMaxBounds[1][0]},${featuresMaxBounds[1][1]}`;
  }
  const res = await axios.get(url);
  if (initPolygons) {
    const featuresToAdd: any[] = [];

    if (useTimerangeData) {
      res.data.features = res.data.features
        .map((feature) => {
          if (feature.properties && feature.properties.metadata?.dateStart && feature.properties.metadata?.dateEnd) {
            // if feature have dateStart and dateEnd check the range and filter
            if (
              feature.properties.metadata.dateStart <= Date.now() &&
              feature.properties.metadata.dateEnd >= Date.now()
            ) {
              // if feature is in range return feature
              return feature;
            } else {
              // if feature is outside of range return undefined
              return undefined;
            }
          } else {
            // if feature dont have dateStart and dateEnd return feature
            return feature;
          }
        })
        .filter((feature) => feature !== undefined);
    }

    if (filter && filter.key && filter.value) {
      res.data.features = res.data.features
        .map((feature) => {
          if (getNestedObjectValue(feature, filter.key)) {
            // if feature filter property exists
            if (getNestedObjectValue(feature, filter.key) === filter.value) {
              // if feature property value is same as filter value
              return feature;
            } else {
              // if they are not same
              return undefined;
            }
          } else {
            // if feature filter property does not exists
            return feature;
          }
        })
        .filter((feature) => feature !== undefined);
    }

    const shopPolygons = res.data.features.filter(
      (f) => f.properties.type === 'shop' && f.geometry.type === 'MultiPolygon',
    );
    const labelLineFeatures = res.data.features.filter((f) => f.properties.type === 'label-line');

    res.data.features = res.data.features.map((feature: any, key: number) => {
      if (hiddenAmenities && hiddenAmenities.length > 0 && hiddenAmenities.includes(feature.properties.amenity)) {
        feature.properties.hideIcon = 'hide';
      }
      if (feature.properties.type === 'poi') {
        feature.id = feature.id ? feature.id.replace(/\{|\}/g, '') : null;
        feature.properties.id = feature.properties.id ? feature.properties.id.replace(/\{|\}/g, '') : null;

        let connectedPolygon;
        let connectedLabelLine;
        // check if feature is inside a polygon
        shopPolygons.forEach((polygon) => {
          if (!polygon.properties.id) {
            polygon.properties.id = polygon.id;
          }
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
          // id have to be changed to numeric type so feature state will work
          connectedPolygon.id = JSON.stringify(key);

          // check if feature is inside a polygon
          labelLineFeatures.forEach((line) => {
            if (connectedPolygon.properties?.level === line.properties?.level) {
              if (booleanPointInPolygon(pointOnFeature(line), connectedPolygon)) {
                connectedLabelLine = line;
              }
            }
          });

          if (connectedLabelLine) {
            // id have to be changed to numeric type so feature state will work
            connectedLabelLine.id = JSON.stringify(key + 9999);
            feature.properties._dynamic.label_id = connectedLabelLine.id;
            connectedPolygon.properties._dynamic.label_id = connectedLabelLine.id;

            connectedLabelLine.properties._dynamic = connectedLabelLine.properties._dynamic
              ? connectedLabelLine.properties._dynamic
              : {};

            connectedLabelLine.properties._dynamic.id = connectedLabelLine.properties.id?.replace(/\{|\}/g, '');
            connectedLabelLine.properties._dynamic.type = 'shop-label';
            connectedLabelLine.properties._dynamic.poi_id = feature.properties.id;
            connectedLabelLine.properties._dynamic.amenity = feature.properties.amenity;
            connectedLabelLine.properties._dynamic.polygon_id = connectedPolygon.properties._dynamic.id;
            connectedLabelLine.properties._dynamic.length = Math.ceil(length(connectedLabelLine) * 1000);
            connectedLabelLine.properties.title = feature.properties.title;
            connectedLabelLine.properties.title_i18n = feature.properties.title_i18n;
          }

          if (!connectedLabelLine) {
            const labelLine = connectedPolygon.properties['label-line']
              ? JSON.parse(JSON.stringify(connectedPolygon.properties['label-line']))
              : connectedPolygon.properties.metadata && connectedPolygon.properties.metadata['label-line']
              ? JSON.parse(JSON.stringify(connectedPolygon.properties.metadata['label-line']))
              : feature.properties.metadata && feature.properties.metadata['label-line']
              ? JSON.parse(JSON.stringify(feature.properties.metadata['label-line']))
              : undefined;
            if (labelLine && labelLine !== undefined && labelLine.length > 0) {
              const parsedLabelLine = typeof labelLine === 'string' ? JSON.parse(labelLine) : labelLine;
              if (parsedLabelLine[0] instanceof Array && parsedLabelLine[1] instanceof Array) {
                const labelLineFeature = JSON.parse(JSON.stringify(feature));
                labelLineFeature.geometry = {
                  coordinates: parsedLabelLine,
                  type: 'LineString',
                };
                labelLineFeature.properties.id = JSON.stringify(key + 9999);
                labelLineFeature.id = JSON.stringify(key + 9999);
                labelLineFeature.properties.type = 'shop-label';
                labelLineFeature.properties._dynamic.type = 'shop-label';
                labelLineFeature.properties._dynamic.length = Math.ceil(length(labelLineFeature) * 1000);
                connectedPolygon.properties._dynamic.label_id = labelLineFeature.properties.id;
                featuresToAdd.push(labelLineFeature);
              }
            } else if (autoLabelLines) {
              let longestBorder;
              let labelBorder;

              // loop through segments and find the longest border
              for (let i = 0; i < connectedPolygon.geometry.coordinates[0][0].length; i++) {
                const currentCoords = connectedPolygon.geometry.coordinates[0][0][i];
                const nextCoords = connectedPolygon.geometry.coordinates[0][0][i + 1];

                if (nextCoords) {
                  const border = lineString([currentCoords, nextCoords], {
                    ...feature.properties,
                  });

                  // measure border length
                  const borderLength = length(border);
                  border.properties._dynamic = { ...border.properties._dynamic, length: Math.ceil(borderLength * 1000) };

                  // if there is not longest border define it
                  if (!longestBorder) {
                    longestBorder = border;
                  } else {
                    // if current segment border is longer, rewrite it
                    if (borderLength > longestBorder.properties._dynamic.length) {
                      longestBorder = border;
                    }
                  }
                }
              }

              // measure length from longest border to polygon center
              const distanceToCenter = pointToLineDistance(centroid(connectedPolygon), longestBorder);

              // offset border to polygon center and make it longer to get intersections with the polygon
              labelBorder = lineOffset(longestBorder, distanceToCenter);
              labelBorder = transformScale(labelBorder, 10);

              const intersection = lineIntersect(connectedPolygon, labelBorder);

              // if there are more than 1 intersections, get the line betweeen them
              if (intersection.features.length > 1) {
                const intersectedLine = lineString([
                  intersection.features[0].geometry.coordinates,
                  intersection.features[intersection.features.length - 1].geometry.coordinates,
                ]);

                // use the interstections line as the label line
                labelBorder.geometry = intersectedLine.geometry;
              }

              labelBorder.properties.id = JSON.stringify(key + 9999);
              labelBorder.id = JSON.stringify(key + 9999);
              labelBorder.properties.type = 'shop-label';
              labelBorder.properties._dynamic.type = 'shop-label';
              connectedPolygon.properties._dynamic.label_id = labelBorder.properties.id;
              featuresToAdd.push(labelBorder);
            }
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
