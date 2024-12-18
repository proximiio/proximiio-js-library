import { axios, getNestedObjectValue, optimizeFeatures, removeNonNumeric, validateLabelLine } from '../common';
import Feature, { FeatureCollection } from '../models/feature';
import { AmenityModel } from '../models/amenity';
import { globalState } from '../components/map/main';
import { FeatureCollection as FCModel, Feature as FModel } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import pointOnFeature from '@turf/point-on-feature';
import length from '@turf/length';
import pointToLineDistance from '@turf/point-to-line-distance';
import lineOffset from '@turf/line-offset';
import transformScale from '@turf/transform-scale';
import lineIntersect from '@turf/line-intersect';
import { lineString } from '@turf/helpers';
import { LngLatBoundsLike } from 'maplibre-gl';
import center from '@turf/center';

async function fetchFeatures({
  from,
  size,
  featuresMaxBounds,
}: {
  from: number;
  size: number;
  featuresMaxBounds?: LngLatBoundsLike;
}) {
  let url = `/v7/geo/features`;
  if (featuresMaxBounds) {
    url += `/${featuresMaxBounds[0][0]},${featuresMaxBounds[0][1]},${featuresMaxBounds[1][0]},${featuresMaxBounds[1][1]}`;
  }
  url += `?from=${from}&size=${size}`;
  try {
    const { data, headers } = await axios.get(url);
    return { data, total: parseInt(headers['record-total'], 10) };
  } catch (error) {
    console.error('Error fetching features:', error);
    throw error;
  }
}

export const getFeatures = async ({
  initPolygons,
  polygonFeatureTypes,
  autoLabelLines,
  hiddenAmenities,
  useTimerangeData,
  filter,
  featuresMaxBounds,
  localSources,
}: {
  initPolygons?: boolean;
  polygonFeatureTypes?: string[];
  autoLabelLines?: boolean;
  hiddenAmenities?: string[];
  useTimerangeData?: boolean;
  filter?: { key: string; value: string; hideIconOnly?: boolean };
  featuresMaxBounds?: LngLatBoundsLike;
  localSources?: {
    features?: FeatureCollection;
  };
}) => {
  let url = '/v5/geo/features';
  if (featuresMaxBounds) {
    url += `/${featuresMaxBounds[0][0]},${featuresMaxBounds[0][1]},${featuresMaxBounds[1][0]},${featuresMaxBounds[1][1]}`;
  }
  let res;
  if (localSources?.features?.features?.length > 0) {
    res = {
      data: localSources.features,
    };
  } else {
    res = await axios.get(url);
    /*const items = [] as Feature[];
    let from = 0;
    let size = 250;
    let totalRecords = 0;
    let recordsFetched = 0;

    // Fetch the total number of records for the first time
    const firstResponse = await fetchFeatures({ from, size, featuresMaxBounds });
    totalRecords = firstResponse.total;
    recordsFetched += firstResponse.data.features.length;
    items.push(...firstResponse.data.features);

    // Calculate the number of parallel requests to make
    const numParallelRequests = Math.ceil(totalRecords / size);

    // Define the number of queues
    const numQueues = 8;

    // Calculate the number of requests per queue
    const requestsPerQueue = Math.ceil(numParallelRequests / numQueues);

    // Create an array to hold all queues
    const queues = [];

    // Create and populate the queues with requests
    for (let i = 0; i < numQueues; i++) {
      const queueRequests = [];
      for (let j = 0; j < requestsPerQueue; j++) {
        const pageIndex = i * requestsPerQueue + j;
        if (pageIndex < numParallelRequests) {
          const newFrom = from + pageIndex * size;
          if (pageIndex !== 0) {
            // Skip the first request
            queueRequests.push(fetchFeatures({ from: newFrom, size, featuresMaxBounds }));
          }
        }
      }
      queues.push(queueRequests);
    }

    // Execute all queues with limited concurrency
    for (const queue of queues) {
      const results = await Promise.all(queue);
      results.forEach((result) => {
        recordsFetched += result.data.features.length;
        items.push(...result.data.features);
      });
    }

    res = {
      data: {
        features: items,
      },
    };*/
  }

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
            if (
              getNestedObjectValue(feature, filter.key).toLowerCase() === filter.value.toLocaleLowerCase() ||
              getNestedObjectValue(feature, filter.key).toLowerCase().split(' ')[0] ===
                filter.value.toLocaleLowerCase().split(' ')[0]
            ) {
              // if feature property value is same as filter value
              return feature;
            } else {
              // if they are not same
              if (filter.hideIconOnly === true) {
                feature.properties.visibility = 'hidden';
                return feature;
              } else {
                return undefined;
              }
            }
          } else {
            // if feature filter property does not exists
            return feature;
          }
        })
        .filter((feature) => feature !== undefined);
    }

    polygonFeatureTypes.forEach((featureType, index) => {
      const shopPolygons = res.data.features.filter(
        (f) => f.properties.type === featureType && f.geometry.type === 'MultiPolygon',
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
                f.properties.type === featureType &&
                (f.properties.id?.replace(/\{|\}/g, '') ===
                  feature.properties.metadata.polygon_id?.replace(/\{|\}/g, '') ||
                  f.id?.replace(/\{|\}/g, '') === feature.properties.metadata.polygon_id?.replace(/\{|\}/g, '')),
            );
          }

          if (connectedPolygon) {
            feature.properties._dynamic = feature.properties._dynamic ? feature.properties._dynamic : {};
            if (
              feature.properties?.metadata?.prevent_polygon === true ||
              feature.properties?.metadata?.prevent_polygon === 'true'
            ) {
              feature.properties._dynamic.prevented_polygon_id = connectedPolygon.properties.id?.replace(/\{|\}/g, '');
              return feature;
            }
            feature.properties._dynamic.id = feature.id;
            feature.properties._dynamic.type = 'poi-custom';
            feature.properties._dynamic.amenity = feature.properties.amenity;
            feature.properties._dynamic.polygon_id = connectedPolygon.properties.id?.replace(/\{|\}/g, '');

            connectedPolygon.properties._dynamic = connectedPolygon.properties._dynamic
              ? connectedPolygon.properties._dynamic
              : {};
            connectedPolygon.properties._dynamic.id = connectedPolygon.properties.id?.replace(/\{|\}/g, '');
            connectedPolygon.properties._dynamic.type = `${featureType}-custom`;
            connectedPolygon.properties._dynamic.poi_id = feature.properties.id;
            connectedPolygon.properties._dynamic.amenity = feature.properties.amenity;
            // id have to be changed to numeric type so feature state will work
            connectedPolygon.id = connectedPolygon.id;

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
              connectedLabelLine.id = connectedLabelLine.id;
              feature.properties._dynamic.label_id = connectedLabelLine.id;
              connectedPolygon.properties._dynamic.label_id = connectedLabelLine.id;

              connectedLabelLine.properties._dynamic = connectedLabelLine.properties._dynamic
                ? connectedLabelLine.properties._dynamic
                : {};

              connectedLabelLine.properties.metadata = feature.properties.metadata;
              connectedLabelLine.properties.icon_only = feature.properties.icon_only;
              connectedLabelLine.properties.text_only = feature.properties.text_only;
              connectedLabelLine.properties.metadata = feature.properties.metadata;
              connectedLabelLine.properties.id = connectedLabelLine.id;
              connectedLabelLine.properties._dynamic.id = connectedLabelLine.id;
              connectedLabelLine.properties.type = `${featureType}-label`;
              connectedLabelLine.properties._dynamic.type = `${featureType}-label`;
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
              if (
                labelLine &&
                labelLine !== undefined &&
                labelLine.length > 0 &&
                validateLabelLine(labelLine, connectedPolygon, feature)
              ) {
                const parsedLabelLine = typeof labelLine === 'string' ? JSON.parse(labelLine) : labelLine;
                if (parsedLabelLine[0] instanceof Array && parsedLabelLine[1] instanceof Array) {
                  const labelLineFeature = JSON.parse(JSON.stringify(feature));
                  labelLineFeature.geometry = {
                    coordinates: parsedLabelLine,
                    type: 'LineString',
                  };
                  labelLineFeature.properties.id = `${connectedPolygon.id}9999`;
                  labelLineFeature.id = `${connectedPolygon.id}9999`;
                  labelLineFeature.properties.type = `${featureType}-label`;
                  labelLineFeature.properties._dynamic.type = `${featureType}-label`;
                  labelLineFeature.properties._dynamic.length = Math.ceil(length(labelLineFeature) * 1000);
                  connectedPolygon.properties._dynamic.label_id = labelLineFeature.properties.id;
                  featuresToAdd.push(labelLineFeature);
                }
              } else if (autoLabelLines) {
                let longestBorder;
                let labelBorder;

                // Extract the exterior ring coordinates of the connectedPolygon
                const exteriorRing = connectedPolygon.geometry.coordinates[0][0];

                // Initialize variables to store the longest border length and its index
                let longestBorderLength = 0;
                let longestBorderIndex = -1;

                // loop through segments and find the longest border
                for (let i = 0; i < exteriorRing.length - 1; i++) {
                  const currentCoords = exteriorRing[i];
                  const nextCoords = exteriorRing[i + 1];

                  // Create a line string for the current segment
                  const border = lineString([currentCoords, nextCoords], { ...feature.properties });

                  // Measure border length
                  const borderLength = length(border);
                  border.properties._dynamic = {
                    ...border.properties._dynamic,
                    length: Math.ceil(borderLength * 1000),
                  };

                  // Update the longest border if the current segment is longer
                  if (borderLength > longestBorderLength) {
                    longestBorderLength = borderLength;
                    longestBorderIndex = i;
                  }
                }

                // Check if a longest border was found
                if (longestBorderIndex !== -1) {
                  // Create the longest border line string
                  longestBorder = lineString([exteriorRing[longestBorderIndex], exteriorRing[longestBorderIndex + 1]], {
                    ...feature.properties,
                  });
                  longestBorder.properties._dynamic = {
                    ...longestBorder.properties._dynamic,
                    length: Math.ceil(length(longestBorder) * 1000),
                  };

                  // Measure length from longest border to polygon center
                  const distanceToCenter = pointToLineDistance(center(connectedPolygon), longestBorder);

                  // Offset border to polygon center and make it longer to get intersections with the polygon
                  labelBorder = transformScale(lineOffset(longestBorder, distanceToCenter), 10);

                  // Find intersections between connectedPolygon and labelBorder
                  const intersection = lineIntersect(connectedPolygon, labelBorder);

                  // If there are more than 1 intersections, get the line between them
                  if (intersection.features.length > 1) {
                    const intersectedLine = lineString([
                      intersection.features[0].geometry.coordinates,
                      intersection.features[intersection.features.length - 1].geometry.coordinates,
                    ]);

                    // Use the intersected line as the label line
                    labelBorder.geometry = intersectedLine.geometry;

                    labelBorder = transformScale(labelBorder, -0.75);
                  }
                } else {
                  // Handle case where no longest border was found
                  console.error('No longest border found.');
                }

                // labelBorder.properties = { ...labelBorder.properties, ...feature.properties };
                labelBorder.properties.id = `${connectedPolygon.id}9999`;
                labelBorder.id = `${connectedPolygon.id}9999`;
                labelBorder.properties.type = `${featureType}-label`;
                labelBorder.properties._dynamic.type = `${featureType}-label`;
                connectedPolygon.properties._dynamic.label_id = labelBorder.properties.id;
                featuresToAdd.push(labelBorder);
              }
            }
          }
        }
        return feature;
      });
    });

    res.data.features = res.data.features.concat(featuresToAdd);
  }
  return new FeatureCollection(res.data);
};

export const getFeaturesBundle = async ({
  initPolygons,
  polygonFeatureTypes,
  autoLabelLines,
  hiddenAmenities,
  useTimerangeData,
  filter,
  bundleUrl,
}: {
  initPolygons?: boolean;
  polygonFeatureTypes?: string[];
  autoLabelLines?: boolean;
  hiddenAmenities?: string[];
  useTimerangeData?: boolean;
  filter?: { key: string; value: string; hideIconOnly?: boolean };
  bundleUrl: string;
}) => {
  const res = await fetch(`${bundleUrl}/features.json`);
  const data = await res.json();
  if (initPolygons) {
    const featuresToAdd: any[] = [];

    if (useTimerangeData) {
      data.features = data.features
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
      data.features = data.features
        .map((feature) => {
          if (getNestedObjectValue(feature, filter.key)) {
            // if feature filter property exists
            if (
              getNestedObjectValue(feature, filter.key).toLowerCase() === filter.value.toLocaleLowerCase() ||
              getNestedObjectValue(feature, filter.key).toLowerCase().split(' ')[0] ===
                filter.value.toLocaleLowerCase().split(' ')[0]
            ) {
              // if feature property value is same as filter value
              return feature;
            } else {
              // if they are not same
              if (filter.hideIconOnly === true) {
                feature.properties.visibility = 'hidden';
                return feature;
              } else {
                return undefined;
              }
            }
          } else {
            // if feature filter property does not exists
            return feature;
          }
        })
        .filter((feature) => feature !== undefined);
    }

    polygonFeatureTypes.forEach((featureType, index) => {
      const shopPolygons = data.features.filter(
        (f) => f.properties.type === featureType && f.geometry.type === 'MultiPolygon',
      );
      const labelLineFeatures = data.features.filter((f) => f.properties.type === 'label-line');

      data.features = data.features.map((feature: any, key: number) => {
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
            connectedPolygon = data.features.find(
              (f: any) =>
                f.properties.type === featureType &&
                (f.properties.id?.replace(/\{|\}/g, '') ===
                  feature.properties.metadata.polygon_id?.replace(/\{|\}/g, '') ||
                  f.id?.replace(/\{|\}/g, '') === feature.properties.metadata.polygon_id?.replace(/\{|\}/g, '')),
            );
          }

          if (connectedPolygon) {
            feature.properties._dynamic = feature.properties._dynamic ? feature.properties._dynamic : {};
            if (
              feature.properties?.metadata?.prevent_polygon === true ||
              feature.properties?.metadata?.prevent_polygon === 'true'
            ) {
              feature.properties._dynamic.prevented_polygon_id = connectedPolygon.properties.id?.replace(/\{|\}/g, '');
              return feature;
            }
            feature.properties._dynamic.id = feature.id;
            feature.properties._dynamic.type = 'poi-custom';
            feature.properties._dynamic.amenity = feature.properties.amenity;
            feature.properties._dynamic.polygon_id = connectedPolygon.properties.id?.replace(/\{|\}/g, '');

            connectedPolygon.properties._dynamic = connectedPolygon.properties._dynamic
              ? connectedPolygon.properties._dynamic
              : {};
            connectedPolygon.properties._dynamic.id = connectedPolygon.properties.id?.replace(/\{|\}/g, '');
            connectedPolygon.properties._dynamic.type = `${featureType}-custom`;
            connectedPolygon.properties._dynamic.poi_id = feature.properties.id;
            connectedPolygon.properties._dynamic.amenity = feature.properties.amenity;
            // id have to be changed to numeric type so feature state will work
            connectedPolygon.id = connectedPolygon.id;

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
              connectedLabelLine.id = connectedLabelLine.id;
              feature.properties._dynamic.label_id = connectedLabelLine.id;
              connectedPolygon.properties._dynamic.label_id = connectedLabelLine.id;

              connectedLabelLine.properties._dynamic = connectedLabelLine.properties._dynamic
                ? connectedLabelLine.properties._dynamic
                : {};

              connectedLabelLine.properties.metadata = feature.properties.metadata;
              connectedLabelLine.properties.icon_only = feature.properties.icon_only;
              connectedLabelLine.properties.text_only = feature.properties.text_only;
              connectedLabelLine.properties.metadata = feature.properties.metadata;
              connectedLabelLine.properties.id = connectedLabelLine.id;
              connectedLabelLine.properties._dynamic.id = connectedLabelLine.id;
              connectedLabelLine.properties.type = `${featureType}-label`;
              connectedLabelLine.properties._dynamic.type = `${featureType}-label`;
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
              if (
                labelLine &&
                labelLine !== undefined &&
                labelLine.length > 0 &&
                validateLabelLine(labelLine, connectedPolygon, feature)
              ) {
                const parsedLabelLine = typeof labelLine === 'string' ? JSON.parse(labelLine) : labelLine;
                if (parsedLabelLine[0] instanceof Array && parsedLabelLine[1] instanceof Array) {
                  const labelLineFeature = JSON.parse(JSON.stringify(feature));
                  labelLineFeature.geometry = {
                    coordinates: parsedLabelLine,
                    type: 'LineString',
                  };
                  labelLineFeature.properties.id = `${connectedPolygon.id}9999`;
                  labelLineFeature.id = `${connectedPolygon.id}9999`;
                  labelLineFeature.properties.type = `${featureType}-label`;
                  labelLineFeature.properties._dynamic.type = `${featureType}-label`;
                  labelLineFeature.properties._dynamic.length = Math.ceil(length(labelLineFeature) * 1000);
                  connectedPolygon.properties._dynamic.label_id = labelLineFeature.properties.id;
                  featuresToAdd.push(labelLineFeature);
                }
              } else if (autoLabelLines) {
                let longestBorder;
                let labelBorder;

                // Extract the exterior ring coordinates of the connectedPolygon
                const exteriorRing = connectedPolygon.geometry.coordinates[0][0];

                // Initialize variables to store the longest border length and its index
                let longestBorderLength = 0;
                let longestBorderIndex = -1;

                // loop through segments and find the longest border
                for (let i = 0; i < exteriorRing.length - 1; i++) {
                  const currentCoords = exteriorRing[i];
                  const nextCoords = exteriorRing[i + 1];

                  // Create a line string for the current segment
                  const border = lineString([currentCoords, nextCoords], { ...feature.properties });

                  // Measure border length
                  const borderLength = length(border);
                  border.properties._dynamic = {
                    ...border.properties._dynamic,
                    length: Math.ceil(borderLength * 1000),
                  };

                  // Update the longest border if the current segment is longer
                  if (borderLength > longestBorderLength) {
                    longestBorderLength = borderLength;
                    longestBorderIndex = i;
                  }
                }

                // Check if a longest border was found
                if (longestBorderIndex !== -1) {
                  // Create the longest border line string
                  longestBorder = lineString([exteriorRing[longestBorderIndex], exteriorRing[longestBorderIndex + 1]], {
                    ...feature.properties,
                  });
                  longestBorder.properties._dynamic = {
                    ...longestBorder.properties._dynamic,
                    length: Math.ceil(length(longestBorder) * 1000),
                  };

                  // Measure length from longest border to polygon center
                  const distanceToCenter = pointToLineDistance(center(connectedPolygon), longestBorder);

                  // Offset border to polygon center and make it longer to get intersections with the polygon
                  labelBorder = transformScale(lineOffset(longestBorder, -distanceToCenter), 10);

                  // Find intersections between connectedPolygon and labelBorder
                  const intersection = lineIntersect(connectedPolygon, labelBorder);

                  // If there are more than 1 intersections, get the line between them
                  if (intersection.features.length > 1) {
                    const intersectedLine = lineString([
                      intersection.features[0].geometry.coordinates,
                      intersection.features[intersection.features.length - 1].geometry.coordinates,
                    ]);

                    // Use the intersected line as the label line
                    labelBorder.geometry = intersectedLine.geometry;

                    labelBorder = transformScale(labelBorder, -0.75);
                  }
                } else {
                  // Handle case where no longest border was found
                  console.error('No longest border found.');
                }

                // labelBorder.properties = { ...labelBorder.properties, ...feature.properties };
                labelBorder.properties.id = `${connectedPolygon.id}9999`;
                labelBorder.id = `${connectedPolygon.id}9999`;
                labelBorder.properties.type = `${featureType}-label`;
                labelBorder.properties._dynamic.type = `${featureType}-label`;
                connectedPolygon.properties._dynamic.label_id = labelBorder.properties.id;
                featuresToAdd.push(labelBorder);
              }
            }
          }
        }
        return feature;
      });
    });

    data.features = data.features.concat(featuresToAdd);
  }
  return new FeatureCollection(data);
};

export const getAmenities = async ({
  amenityIdProperty,
  localSources,
}: {
  amenityIdProperty?: string;
  localSources?: {
    amenities?: AmenityModel[];
  };
}) => {
  let res;
  if (localSources?.amenities?.length > 0) {
    res = {
      data: localSources.amenities,
    };
  } else {
    const url = '/v5/geo/amenities';
    res = await axios.get(url);
  }
  return res.data.map((item: any) => {
    if (amenityIdProperty && item[amenityIdProperty] && item.category !== 'default') {
      item.id = item[amenityIdProperty].toLowerCase();
    }
    return new AmenityModel(item);
  });
};

export const getAmenitiesBundle = async ({
  amenityIdProperty,
  bundleUrl,
}: {
  amenityIdProperty?: string;
  bundleUrl: string;
}) => {
  try {
    const res = await fetch(`${bundleUrl}/amenities.json`);
    const data = await res.json();
    return data.map((item: any) => {
      if (amenityIdProperty && item[amenityIdProperty] && item.category !== 'default') {
        item.id = item[amenityIdProperty].toLowerCase();
      }
      return new AmenityModel(item);
    });
  } catch (e) {
    throw new Error(`Retrieving amenities failed, ${e.message}`);
  }
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
