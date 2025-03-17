var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { axios, getNestedObjectValue, isLevelChanger, validateLabelLine, } from '../common';
import Feature, { FeatureCollection } from '../models/feature';
import { AmenityModel } from '../models/amenity';
import { globalState } from '../components/map/main';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import pointOnFeature from '@turf/point-on-feature';
import length from '@turf/length';
import pointToLineDistance from '@turf/point-to-line-distance';
import lineOffset from '@turf/line-offset';
import transformScale from '@turf/transform-scale';
import lineIntersect from '@turf/line-intersect';
import { lineString } from '@turf/helpers';
import center from '@turf/center';
function fetchFeatures({ from, size, featuresMaxBounds, }) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = `/v7/geo/features`;
        if (featuresMaxBounds) {
            url += `/${featuresMaxBounds[0][0]},${featuresMaxBounds[0][1]},${featuresMaxBounds[1][0]},${featuresMaxBounds[1][1]}`;
        }
        url += `?from=${from}&size=${size}`;
        try {
            const { data, headers } = yield axios.get(url);
            return { data, total: parseInt(headers['record-total'], 10) };
        }
        catch (error) {
            console.error('Error fetching features:', error);
            throw error;
        }
    });
}
export const getFeatures = ({ initPolygons, polygonLayers, autoLabelLines, hiddenAmenities, useTimerangeData, filter, featuresMaxBounds, localSources, }) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let url = '/v5/geo/features';
    if (featuresMaxBounds) {
        url += `/${featuresMaxBounds[0][0]},${featuresMaxBounds[0][1]},${featuresMaxBounds[1][0]},${featuresMaxBounds[1][1]}`;
    }
    let res;
    if (((_b = (_a = localSources === null || localSources === void 0 ? void 0 : localSources.features) === null || _a === void 0 ? void 0 : _a.features) === null || _b === void 0 ? void 0 : _b.length) > 0) {
        res = {
            data: localSources.features,
        };
    }
    else {
        res = yield axios.get(url);
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
        const featuresToAdd = [];
        if (useTimerangeData) {
            res.data.features = res.data.features
                .map((feature) => {
                var _a, _b;
                if (feature.properties && ((_a = feature.properties.metadata) === null || _a === void 0 ? void 0 : _a.dateStart) && ((_b = feature.properties.metadata) === null || _b === void 0 ? void 0 : _b.dateEnd)) {
                    // if feature have dateStart and dateEnd check the range and filter
                    if (feature.properties.metadata.dateStart <= Date.now() &&
                        feature.properties.metadata.dateEnd >= Date.now()) {
                        // if feature is in range return feature
                        return feature;
                    }
                    else {
                        // if feature is outside of range return undefined
                        return undefined;
                    }
                }
                else {
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
                    if (getNestedObjectValue(feature, filter.key).toLowerCase() === filter.value.toLocaleLowerCase() ||
                        getNestedObjectValue(feature, filter.key).toLowerCase().split(' ')[0] ===
                            filter.value.toLocaleLowerCase().split(' ')[0]) {
                        // if feature property value is same as filter value
                        return feature;
                    }
                    else {
                        // if they are not same
                        if (filter.hideIconOnly === true) {
                            feature.properties.visibility = 'hidden';
                            return feature;
                        }
                        else {
                            return undefined;
                        }
                    }
                }
                else {
                    // if feature filter property does not exists
                    return feature;
                }
            })
                .filter((feature) => feature !== undefined);
        }
        polygonLayers.forEach((polygonLayer, index) => {
            const shopPolygons = res.data.features.filter((f) => f.properties.type === polygonLayer.featureType &&
                (f.geometry.type === 'MultiPolygon' || f.geometry.type === 'Polygon') &&
                polygonLayer.autoAssign);
            const labelLineFeatures = res.data.features.filter((f) => f.properties.type === 'label-line');
            res.data.features = res.data.features.map((feature, key) => {
                var _a, _b, _c, _d, _e, _f, _g;
                if (hiddenAmenities && hiddenAmenities.length > 0 && hiddenAmenities.includes(feature.properties.amenity)) {
                    feature.properties.hideIcon = 'hide';
                }
                if (feature.properties.type === 'poi' ||
                    (polygonLayer.initOnLevelchangers && isLevelChanger(feature) && feature.properties.usecase === 'poi')) {
                    feature.id = feature.id ? feature.id.replace(/\{|\}/g, '') : null;
                    feature.properties.id = feature.properties.id ? feature.properties.id.replace(/\{|\}/g, '') : null;
                    let connectedPolygon;
                    let connectedLabelLine;
                    // check if feature is inside a polygon
                    shopPolygons.forEach((polygon) => {
                        var _a, _b;
                        if (!polygon.properties.id) {
                            polygon.properties.id = polygon.id;
                        }
                        if (((_a = feature.properties) === null || _a === void 0 ? void 0 : _a.level) === ((_b = polygon.properties) === null || _b === void 0 ? void 0 : _b.level)) {
                            if (booleanPointInPolygon(feature, polygon)) {
                                connectedPolygon = polygon;
                            }
                        }
                    });
                    // or if not check if the polygon is defined in metadata and use it instead
                    if (!connectedPolygon && feature.properties.metadata && feature.properties.metadata.polygon_id) {
                        connectedPolygon = res.data.features.find((f) => {
                            var _a, _b, _c, _d;
                            return f.properties.type === polygonLayer.featureType &&
                                (((_a = f.properties.id) === null || _a === void 0 ? void 0 : _a.replace(/\{|\}/g, '')) ===
                                    ((_b = feature.properties.metadata.polygon_id) === null || _b === void 0 ? void 0 : _b.replace(/\{|\}/g, '')) ||
                                    ((_c = f.id) === null || _c === void 0 ? void 0 : _c.replace(/\{|\}/g, '')) === ((_d = feature.properties.metadata.polygon_id) === null || _d === void 0 ? void 0 : _d.replace(/\{|\}/g, '')));
                        });
                    }
                    if (connectedPolygon) {
                        feature.properties._dynamic = feature.properties._dynamic ? feature.properties._dynamic : {};
                        if (((_b = (_a = feature.properties) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.prevent_polygon) === true ||
                            ((_d = (_c = feature.properties) === null || _c === void 0 ? void 0 : _c.metadata) === null || _d === void 0 ? void 0 : _d.prevent_polygon) === 'true') {
                            feature.properties._dynamic.prevented_polygon_id = (_e = connectedPolygon.properties.id) === null || _e === void 0 ? void 0 : _e.replace(/\{|\}/g, '');
                            return feature;
                        }
                        feature.properties._dynamic.id = feature.id;
                        feature.properties._dynamic.type = 'poi-custom';
                        feature.properties._dynamic.amenity = feature.properties.amenity;
                        feature.properties._dynamic.polygon_id = (_f = connectedPolygon.properties.id) === null || _f === void 0 ? void 0 : _f.replace(/\{|\}/g, '');
                        connectedPolygon.properties._dynamic = connectedPolygon.properties._dynamic
                            ? connectedPolygon.properties._dynamic
                            : {};
                        connectedPolygon.properties._dynamic.id = (_g = connectedPolygon.properties.id) === null || _g === void 0 ? void 0 : _g.replace(/\{|\}/g, '');
                        connectedPolygon.properties._dynamic.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-custom`;
                        connectedPolygon.properties._dynamic.poi_id = feature.properties.id;
                        connectedPolygon.properties._dynamic.amenity = feature.properties.amenity;
                        connectedPolygon.properties = Object.assign(Object.assign({}, connectedPolygon.properties), { dynamic_minZoom: polygonLayer.minZoom, dynamic_maxZoom: polygonLayer.maxZoom, dynamic_selectedHeight: polygonLayer.selectedPolygonHeight, dynamic_hoverHeight: polygonLayer.hoverPolygonHeight, dynamic_activeHeight: polygonLayer.activePolygonHeight || polygonLayer.hoverPolygonHeight, dynamic_disabledHeight: polygonLayer.disabledPolygonHeight, dynamic_defaultHeight: polygonLayer.defaultPolygonHeight, dynamic_base: polygonLayer.base, dynamic_selectedColor: polygonLayer.selectedPolygonColor, dynamic_hoverColor: polygonLayer.hoverPolygonColor, dynamic_activeColor: polygonLayer.activePolygonColor || polygonLayer.hoverPolygonColor, dynamic_disabledColor: polygonLayer.disabledPolygonColor, dynamic_defaultColor: polygonLayer.defaultPolygonColor });
                        // id have to be changed to numeric type so feature state will work
                        connectedPolygon.id = connectedPolygon.id;
                        // check if feature is inside a polygon
                        labelLineFeatures.forEach((line) => {
                            var _a, _b;
                            if (((_a = connectedPolygon.properties) === null || _a === void 0 ? void 0 : _a.level) === ((_b = line.properties) === null || _b === void 0 ? void 0 : _b.level)) {
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
                            connectedLabelLine.properties.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                            connectedLabelLine.properties._dynamic.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                            connectedLabelLine.properties._dynamic.poi_id = feature.properties.id;
                            connectedLabelLine.properties._dynamic.amenity = feature.properties.amenity;
                            connectedLabelLine.properties._dynamic.polygon_id = connectedPolygon.properties._dynamic.id;
                            connectedLabelLine.properties._dynamic.length = Math.ceil(length(connectedLabelLine) * 1000);
                            connectedLabelLine.properties.title = feature.properties.title;
                            connectedLabelLine.properties.title_i18n = feature.properties.title_i18n;
                            connectedLabelLine.properties = Object.assign(Object.assign({}, connectedLabelLine.properties), { dynamic_iconMinZoom: polygonLayer.iconMinZoom, dynamic_iconMaxZoom: polygonLayer.iconMaxZoom, dynamic_labelMinZoom: polygonLayer.labelMinZoom, dynamic_labelMaxZoom: polygonLayer.labelMaxZoom, dynamic_symbolPlacement: polygonLayer.symbolPlacement, dynamic_disabledOpacity: polygonLayer.iconImageDefaultVisible || polygonLayer.iconImageDefaultVisible === undefined ? 1 : 0, dynamic_selectedTextColor: polygonLayer.selectedLabelColor, dynamic_hoverTextColor: polygonLayer.hoverLabelColor, dynamic_activeTextColor: polygonLayer.activeLabelColor || polygonLayer.hoverLabelColor, dynamic_disabledTextColor: polygonLayer.disabledLabelColor, dynamic_defaultTextColor: polygonLayer.defaultLabelColor });
                        }
                        if (!connectedLabelLine) {
                            const labelLine = connectedPolygon.properties['label-line']
                                ? JSON.parse(JSON.stringify(connectedPolygon.properties['label-line']))
                                : connectedPolygon.properties.metadata && connectedPolygon.properties.metadata['label-line']
                                    ? JSON.parse(JSON.stringify(connectedPolygon.properties.metadata['label-line']))
                                    : feature.properties.metadata && feature.properties.metadata['label-line']
                                        ? JSON.parse(JSON.stringify(feature.properties.metadata['label-line']))
                                        : undefined;
                            if (labelLine &&
                                labelLine !== undefined &&
                                labelLine.length > 0 &&
                                validateLabelLine(labelLine, connectedPolygon, feature)) {
                                const parsedLabelLine = typeof labelLine === 'string' ? JSON.parse(labelLine) : labelLine;
                                if (parsedLabelLine[0] instanceof Array && parsedLabelLine[1] instanceof Array) {
                                    const labelLineFeature = JSON.parse(JSON.stringify(feature));
                                    labelLineFeature.geometry = {
                                        coordinates: parsedLabelLine,
                                        type: 'LineString',
                                    };
                                    labelLineFeature.properties.id = `${connectedPolygon.id}9999`;
                                    labelLineFeature.id = `${connectedPolygon.id}9999`;
                                    labelLineFeature.properties.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                                    labelLineFeature.properties._dynamic.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                                    labelLineFeature.properties._dynamic.length = Math.ceil(length(labelLineFeature) * 1000);
                                    labelLineFeature.properties = Object.assign(Object.assign({}, labelLineFeature.properties), { dynamic_iconMinZoom: polygonLayer.iconMinZoom, dynamic_iconMaxZoom: polygonLayer.iconMaxZoom, dynamic_labelMinZoom: polygonLayer.labelMinZoom, dynamic_labelMaxZoom: polygonLayer.labelMaxZoom, dynamic_symbolPlacement: polygonLayer.symbolPlacement, dynamic_disabledOpacity: polygonLayer.iconImageDefaultVisible || polygonLayer.iconImageDefaultVisible === undefined
                                            ? 1
                                            : 0, dynamic_selectedTextColor: polygonLayer.selectedLabelColor, dynamic_hoverTextColor: polygonLayer.hoverLabelColor, dynamic_activeTextColor: polygonLayer.activeLabelColor || polygonLayer.hoverLabelColor, dynamic_disabledTextColor: polygonLayer.disabledLabelColor, dynamic_defaultTextColor: polygonLayer.defaultLabelColor });
                                    connectedPolygon.properties._dynamic.label_id = labelLineFeature.properties.id;
                                    featuresToAdd.push(labelLineFeature);
                                }
                            }
                            else if (autoLabelLines) {
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
                                    const border = lineString([currentCoords, nextCoords], Object.assign({}, feature.properties));
                                    // Measure border length
                                    const borderLength = length(border);
                                    border.properties._dynamic = Object.assign(Object.assign({}, border.properties._dynamic), { length: Math.ceil(borderLength * 1000) });
                                    // Update the longest border if the current segment is longer
                                    if (borderLength > longestBorderLength) {
                                        longestBorderLength = borderLength;
                                        longestBorderIndex = i;
                                    }
                                }
                                // Check if a longest border was found
                                if (longestBorderIndex !== -1) {
                                    // Create the longest border line string
                                    longestBorder = lineString([exteriorRing[longestBorderIndex], exteriorRing[longestBorderIndex + 1]], Object.assign({}, feature.properties));
                                    longestBorder.properties._dynamic = Object.assign(Object.assign({}, longestBorder.properties._dynamic), { length: Math.ceil(length(longestBorder) * 1000) });
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
                                }
                                else {
                                    // Handle case where no longest border was found
                                    console.error('No longest border found.');
                                }
                                // labelBorder.properties = { ...labelBorder.properties, ...feature.properties };
                                labelBorder.properties.id = `${connectedPolygon.id}9999`;
                                labelBorder.id = `${connectedPolygon.id}9999`;
                                labelBorder.properties.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                                labelBorder.properties._dynamic.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                                connectedPolygon.properties._dynamic.label_id = labelBorder.properties.id;
                                labelBorder.properties = Object.assign(Object.assign({}, labelBorder.properties), { dynamic_iconMinZoom: polygonLayer.iconMinZoom, dynamic_iconMaxZoom: polygonLayer.iconMaxZoom, dynamic_labelMinZoom: polygonLayer.labelMinZoom, dynamic_labelMaxZoom: polygonLayer.labelMaxZoom, dynamic_symbolPlacement: polygonLayer.symbolPlacement, dynamic_disabledOpacity: polygonLayer.iconImageDefaultVisible || polygonLayer.iconImageDefaultVisible === undefined ? 1 : 0, dynamic_selectedTextColor: polygonLayer.selectedLabelColor, dynamic_hoverTextColor: polygonLayer.hoverLabelColor, dynamic_activeTextColor: polygonLayer.activeLabelColor || polygonLayer.hoverLabelColor, dynamic_disabledTextColor: polygonLayer.disabledLabelColor, dynamic_defaultTextColor: polygonLayer.defaultLabelColor });
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
});
export const getFeaturesBundle = ({ initPolygons, polygonLayers, autoLabelLines, hiddenAmenities, useTimerangeData, filter, bundleUrl, }) => __awaiter(void 0, void 0, void 0, function* () {
    const res = yield fetch(`${bundleUrl}/features.json`);
    const data = yield res.json();
    if (initPolygons) {
        const featuresToAdd = [];
        if (useTimerangeData) {
            data.features = data.features
                .map((feature) => {
                var _a, _b;
                if (feature.properties && ((_a = feature.properties.metadata) === null || _a === void 0 ? void 0 : _a.dateStart) && ((_b = feature.properties.metadata) === null || _b === void 0 ? void 0 : _b.dateEnd)) {
                    // if feature have dateStart and dateEnd check the range and filter
                    if (feature.properties.metadata.dateStart <= Date.now() &&
                        feature.properties.metadata.dateEnd >= Date.now()) {
                        // if feature is in range return feature
                        return feature;
                    }
                    else {
                        // if feature is outside of range return undefined
                        return undefined;
                    }
                }
                else {
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
                    if (getNestedObjectValue(feature, filter.key).toLowerCase() === filter.value.toLocaleLowerCase() ||
                        getNestedObjectValue(feature, filter.key).toLowerCase().split(' ')[0] ===
                            filter.value.toLocaleLowerCase().split(' ')[0]) {
                        // if feature property value is same as filter value
                        return feature;
                    }
                    else {
                        // if they are not same
                        if (filter.hideIconOnly === true) {
                            feature.properties.visibility = 'hidden';
                            return feature;
                        }
                        else {
                            return undefined;
                        }
                    }
                }
                else {
                    // if feature filter property does not exists
                    return feature;
                }
            })
                .filter((feature) => feature !== undefined);
        }
        polygonLayers.forEach((polygonLayer, index) => {
            const shopPolygons = data.features.filter((f) => f.properties.type === polygonLayer.featureType &&
                (f.geometry.type === 'MultiPolygon' || f.geometry.type === 'Polygon') &&
                polygonLayer.autoAssign);
            const labelLineFeatures = data.features.filter((f) => f.properties.type === 'label-line');
            data.features = data.features.map((feature, key) => {
                var _a, _b, _c, _d, _e, _f, _g;
                if (hiddenAmenities && hiddenAmenities.length > 0 && hiddenAmenities.includes(feature.properties.amenity)) {
                    feature.properties.hideIcon = 'hide';
                }
                if (feature.properties.type === 'poi' ||
                    (polygonLayer.initOnLevelchangers && isLevelChanger(feature) && feature.properties.usecase === 'poi')) {
                    feature.id = feature.id ? feature.id.replace(/\{|\}/g, '') : null;
                    feature.properties.id = feature.properties.id ? feature.properties.id.replace(/\{|\}/g, '') : null;
                    let connectedPolygon;
                    let connectedLabelLine;
                    // check if feature is inside a polygon
                    shopPolygons.forEach((polygon) => {
                        var _a, _b;
                        if (!polygon.properties.id) {
                            polygon.properties.id = polygon.id;
                        }
                        if (((_a = feature.properties) === null || _a === void 0 ? void 0 : _a.level) === ((_b = polygon.properties) === null || _b === void 0 ? void 0 : _b.level)) {
                            if (booleanPointInPolygon(feature, polygon)) {
                                connectedPolygon = polygon;
                            }
                        }
                    });
                    // or if not check if the polygon is defined in metadata and use it instead
                    if (!connectedPolygon && feature.properties.metadata && feature.properties.metadata.polygon_id) {
                        connectedPolygon = data.features.find((f) => {
                            var _a, _b, _c, _d;
                            return f.properties.type === polygonLayer.featureType &&
                                (((_a = f.properties.id) === null || _a === void 0 ? void 0 : _a.replace(/\{|\}/g, '')) ===
                                    ((_b = feature.properties.metadata.polygon_id) === null || _b === void 0 ? void 0 : _b.replace(/\{|\}/g, '')) ||
                                    ((_c = f.id) === null || _c === void 0 ? void 0 : _c.replace(/\{|\}/g, '')) === ((_d = feature.properties.metadata.polygon_id) === null || _d === void 0 ? void 0 : _d.replace(/\{|\}/g, '')));
                        });
                    }
                    if (connectedPolygon) {
                        feature.properties._dynamic = feature.properties._dynamic ? feature.properties._dynamic : {};
                        if (((_b = (_a = feature.properties) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.prevent_polygon) === true ||
                            ((_d = (_c = feature.properties) === null || _c === void 0 ? void 0 : _c.metadata) === null || _d === void 0 ? void 0 : _d.prevent_polygon) === 'true') {
                            feature.properties._dynamic.prevented_polygon_id = (_e = connectedPolygon.properties.id) === null || _e === void 0 ? void 0 : _e.replace(/\{|\}/g, '');
                            return feature;
                        }
                        feature.properties._dynamic.id = feature.id;
                        feature.properties._dynamic.type = 'poi-custom';
                        feature.properties._dynamic.amenity = feature.properties.amenity;
                        feature.properties._dynamic.polygon_id = (_f = connectedPolygon.properties.id) === null || _f === void 0 ? void 0 : _f.replace(/\{|\}/g, '');
                        connectedPolygon.properties._dynamic = connectedPolygon.properties._dynamic
                            ? connectedPolygon.properties._dynamic
                            : {};
                        connectedPolygon.properties._dynamic.id = (_g = connectedPolygon.properties.id) === null || _g === void 0 ? void 0 : _g.replace(/\{|\}/g, '');
                        connectedPolygon.properties._dynamic.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-custom`;
                        connectedPolygon.properties._dynamic.poi_id = feature.properties.id;
                        connectedPolygon.properties._dynamic.amenity = feature.properties.amenity;
                        connectedPolygon.properties = Object.assign(Object.assign({}, connectedPolygon.properties), { dynamic_minZoom: polygonLayer.minZoom, dynamic_maxZoom: polygonLayer.maxZoom, dynamic_selectedHeight: polygonLayer.selectedPolygonHeight, dynamic_hoverHeight: polygonLayer.hoverPolygonHeight, dynamic_activeHeight: polygonLayer.activePolygonHeight || polygonLayer.hoverPolygonHeight, dynamic_disabledHeight: polygonLayer.disabledPolygonHeight, dynamic_defaultHeight: polygonLayer.defaultPolygonHeight, dynamic_base: polygonLayer.base, dynamic_selectedColor: polygonLayer.selectedPolygonColor, dynamic_hoverColor: polygonLayer.hoverPolygonColor, dynamic_activeColor: polygonLayer.activePolygonColor || polygonLayer.hoverPolygonColor, dynamic_disabledColor: polygonLayer.disabledPolygonColor, dynamic_defaultColor: polygonLayer.defaultPolygonColor });
                        // id have to be changed to numeric type so feature state will work
                        connectedPolygon.id = connectedPolygon.id;
                        // check if feature is inside a polygon
                        labelLineFeatures.forEach((line) => {
                            var _a, _b;
                            if (((_a = connectedPolygon.properties) === null || _a === void 0 ? void 0 : _a.level) === ((_b = line.properties) === null || _b === void 0 ? void 0 : _b.level)) {
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
                            connectedLabelLine.properties.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                            connectedLabelLine.properties._dynamic.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                            connectedLabelLine.properties._dynamic.poi_id = feature.properties.id;
                            connectedLabelLine.properties._dynamic.amenity = feature.properties.amenity;
                            connectedLabelLine.properties._dynamic.polygon_id = connectedPolygon.properties._dynamic.id;
                            connectedLabelLine.properties._dynamic.length = Math.ceil(length(connectedLabelLine) * 1000);
                            connectedLabelLine.properties.title = feature.properties.title;
                            connectedLabelLine.properties.title_i18n = feature.properties.title_i18n;
                            connectedLabelLine.properties = Object.assign(Object.assign({}, connectedLabelLine.properties), { dynamic_iconMinZoom: polygonLayer.iconMinZoom, dynamic_iconMaxZoom: polygonLayer.iconMaxZoom, dynamic_labelMinZoom: polygonLayer.labelMinZoom, dynamic_labelMaxZoom: polygonLayer.labelMaxZoom, dynamic_symbolPlacement: polygonLayer.symbolPlacement, dynamic_disabledOpacity: polygonLayer.iconImageDefaultVisible || polygonLayer.iconImageDefaultVisible === undefined ? 1 : 0, dynamic_selectedTextColor: polygonLayer.selectedLabelColor, dynamic_hoverTextColor: polygonLayer.hoverLabelColor, dynamic_activeTextColor: polygonLayer.activeLabelColor || polygonLayer.hoverLabelColor, dynamic_disabledTextColor: polygonLayer.disabledLabelColor, dynamic_defaultTextColor: polygonLayer.defaultLabelColor });
                        }
                        if (!connectedLabelLine) {
                            const labelLine = connectedPolygon.properties['label-line']
                                ? JSON.parse(JSON.stringify(connectedPolygon.properties['label-line']))
                                : connectedPolygon.properties.metadata && connectedPolygon.properties.metadata['label-line']
                                    ? JSON.parse(JSON.stringify(connectedPolygon.properties.metadata['label-line']))
                                    : feature.properties.metadata && feature.properties.metadata['label-line']
                                        ? JSON.parse(JSON.stringify(feature.properties.metadata['label-line']))
                                        : undefined;
                            if (labelLine &&
                                labelLine !== undefined &&
                                labelLine.length > 0 &&
                                validateLabelLine(labelLine, connectedPolygon, feature)) {
                                const parsedLabelLine = typeof labelLine === 'string' ? JSON.parse(labelLine) : labelLine;
                                if (parsedLabelLine[0] instanceof Array && parsedLabelLine[1] instanceof Array) {
                                    const labelLineFeature = JSON.parse(JSON.stringify(feature));
                                    labelLineFeature.geometry = {
                                        coordinates: parsedLabelLine,
                                        type: 'LineString',
                                    };
                                    labelLineFeature.properties.id = `${connectedPolygon.id}9999`;
                                    labelLineFeature.id = `${connectedPolygon.id}9999`;
                                    labelLineFeature.properties.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                                    labelLineFeature.properties._dynamic.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                                    labelLineFeature.properties._dynamic.length = Math.ceil(length(labelLineFeature) * 1000);
                                    labelLineFeature.properties = Object.assign(Object.assign({}, labelLineFeature.properties), { dynamic_iconMinZoom: polygonLayer.iconMinZoom, dynamic_iconMaxZoom: polygonLayer.iconMaxZoom, dynamic_labelMinZoom: polygonLayer.labelMinZoom, dynamic_labelMaxZoom: polygonLayer.labelMaxZoom, dynamic_symbolPlacement: polygonLayer.symbolPlacement, dynamic_disabledOpacity: polygonLayer.iconImageDefaultVisible || polygonLayer.iconImageDefaultVisible === undefined
                                            ? 1
                                            : 0, dynamic_selectedTextColor: polygonLayer.selectedLabelColor, dynamic_hoverTextColor: polygonLayer.hoverLabelColor, dynamic_activeTextColor: polygonLayer.activeLabelColor || polygonLayer.hoverLabelColor, dynamic_disabledTextColor: polygonLayer.disabledLabelColor, dynamic_defaultTextColor: polygonLayer.defaultLabelColor });
                                    connectedPolygon.properties._dynamic.label_id = labelLineFeature.properties.id;
                                    featuresToAdd.push(labelLineFeature);
                                }
                            }
                            else if (autoLabelLines) {
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
                                    const border = lineString([currentCoords, nextCoords], Object.assign({}, feature.properties));
                                    // Measure border length
                                    const borderLength = length(border);
                                    border.properties._dynamic = Object.assign(Object.assign({}, border.properties._dynamic), { length: Math.ceil(borderLength * 1000) });
                                    // Update the longest border if the current segment is longer
                                    if (borderLength > longestBorderLength) {
                                        longestBorderLength = borderLength;
                                        longestBorderIndex = i;
                                    }
                                }
                                // Check if a longest border was found
                                if (longestBorderIndex !== -1) {
                                    // Create the longest border line string
                                    longestBorder = lineString([exteriorRing[longestBorderIndex], exteriorRing[longestBorderIndex + 1]], Object.assign({}, feature.properties));
                                    longestBorder.properties._dynamic = Object.assign(Object.assign({}, longestBorder.properties._dynamic), { length: Math.ceil(length(longestBorder) * 1000) });
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
                                }
                                else {
                                    // Handle case where no longest border was found
                                    console.error('No longest border found.');
                                }
                                // labelBorder.properties = { ...labelBorder.properties, ...feature.properties };
                                labelBorder.properties.id = `${connectedPolygon.id}9999`;
                                labelBorder.id = `${connectedPolygon.id}9999`;
                                labelBorder.properties.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                                labelBorder.properties._dynamic.type = `${polygonLayer.layerId ? polygonLayer.layerId : 'polygons'}-label`;
                                connectedPolygon.properties._dynamic.label_id = labelBorder.properties.id;
                                labelBorder.properties = Object.assign(Object.assign({}, labelBorder.properties), { dynamic_iconMinZoom: polygonLayer.iconMinZoom, dynamic_iconMaxZoom: polygonLayer.iconMaxZoom, dynamic_labelMinZoom: polygonLayer.labelMinZoom, dynamic_labelMaxZoom: polygonLayer.labelMaxZoom, dynamic_symbolPlacement: polygonLayer.symbolPlacement, dynamic_disabledOpacity: polygonLayer.iconImageDefaultVisible || polygonLayer.iconImageDefaultVisible === undefined ? 1 : 0, dynamic_selectedTextColor: polygonLayer.selectedLabelColor, dynamic_hoverTextColor: polygonLayer.hoverLabelColor, dynamic_activeTextColor: polygonLayer.activeLabelColor || polygonLayer.hoverLabelColor, dynamic_disabledTextColor: polygonLayer.disabledLabelColor, dynamic_defaultTextColor: polygonLayer.defaultLabelColor });
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
});
export const getAmenities = ({ amenityIdProperty, localSources, }) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    let res;
    if (((_c = localSources === null || localSources === void 0 ? void 0 : localSources.amenities) === null || _c === void 0 ? void 0 : _c.length) > 0) {
        res = {
            data: localSources.amenities,
        };
    }
    else {
        const url = '/v5/geo/amenities';
        res = yield axios.get(url);
    }
    return res.data.map((item) => {
        if (amenityIdProperty && item[amenityIdProperty] && item.category !== 'default') {
            item.id = item[amenityIdProperty].toLowerCase();
        }
        return new AmenityModel(item);
    });
});
export const getAmenitiesBundle = ({ amenityIdProperty, bundleUrl, }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch(`${bundleUrl}/amenities.json`);
        const data = yield res.json();
        return data.map((item) => {
            if (amenityIdProperty && item[amenityIdProperty] && item.category !== 'default') {
                item.id = item[amenityIdProperty].toLowerCase();
            }
            return new AmenityModel(item);
        });
    }
    catch (e) {
        throw new Error(`Retrieving amenities failed, ${e.message}`);
    }
});
export const getPois = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = '/v5/geo/features';
    const res = yield axios.get(url);
    const customPois = globalState.dynamicFeatures;
    const pois = [...res.data.features, ...customPois.features]
        .filter((feature) => feature.properties.usecase === 'poi' || feature.properties.type === 'poi')
        .sort((a, b) => (a.properties.title > b.properties.title ? -1 : 1))
        .sort((a, b) => (a.properties.level > b.properties.level ? 1 : -1))
        .map((item) => new Feature(item));
    return pois;
});
export const addFeatures = (featureCollection) => __awaiter(void 0, void 0, void 0, function* () {
    const url = '/v5/geo/features';
    try {
        yield axios.post(url, featureCollection);
    }
    catch (error) {
        console.log('Adding new features to db failed', error.message);
        throw new Error(error.message);
    }
});
export const updateFeature = (featureData, featureId) => __awaiter(void 0, void 0, void 0, function* () {
    const url = '/v5/geo/features/' + featureId;
    try {
        yield axios.put(url, featureData);
    }
    catch (error) {
        console.log('Updating feature in db failed', error.message);
        throw new Error(error.message);
    }
});
export const deleteFeatures = (featureCollection) => __awaiter(void 0, void 0, void 0, function* () {
    const url = '/v5/geo/features/delete';
    try {
        yield axios.post(url, featureCollection);
    }
    catch (error) {
        console.log('Deleting features from db failed', error.message);
        throw new Error(error.message);
    }
});
export const getFeatureById = (featureId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield axios.get(`/v5/geo/feature/${featureId}`);
        return new Feature(res.data);
    }
    catch (e) {
        throw new Error(`Retrieving feature by id '${featureId}' failed, ${e.message}`);
    }
});
export const getFeatureByIdBundle = ({ bundleUrl, featureId, }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch(`${bundleUrl}/features.json`);
        const data = yield res.json();
        return data.features.find((item) => {
            var _a, _b, _c, _d, _e;
            return ((_a = item.id) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === featureId.toLowerCase() ||
                ((_c = (_b = item.properties) === null || _b === void 0 ? void 0 : _b.title) === null || _c === void 0 ? void 0 : _c.toLowerCase()) === featureId.toLowerCase() ||
                ((_e = (_d = item.properties) === null || _d === void 0 ? void 0 : _d.id) === null || _e === void 0 ? void 0 : _e.toLowerCase()) === featureId.toLowerCase();
        });
    }
    catch (e) {
        throw new Error(`Retrieving feature failed, ${e.message}`);
    }
});
export default {
    getFeatures,
    addFeatures,
    updateFeature,
    deleteFeatures,
    getAmenities,
    getPois,
    getFeatureById,
    getFeatureByIdBundle,
};
