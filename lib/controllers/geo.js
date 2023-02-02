"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFeatures = exports.updateFeature = exports.addFeatures = exports.getPois = exports.getAmenities = exports.getFeatures = void 0;
var common_1 = require("../common");
var feature_1 = require("../models/feature");
var amenity_1 = require("../models/amenity");
var main_1 = require("../components/map/main");
var turf_1 = require("@turf/turf");
var getFeatures = function (initPolygons) { return __awaiter(void 0, void 0, void 0, function () {
    var url, res, featuresToAdd_1, shopPolygons_1, labelLineFeatures_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = '/v5/geo/features';
                return [4 /*yield*/, common_1.axios.get(url)];
            case 1:
                res = _a.sent();
                if (initPolygons) {
                    featuresToAdd_1 = [];
                    shopPolygons_1 = res.data.features.filter(function (f) { return f.properties.type === 'shop' && f.geometry.type === 'MultiPolygon'; });
                    labelLineFeatures_1 = res.data.features.filter(function (f) { return f.properties.type === 'label-line'; });
                    res.data.features = res.data.features.map(function (feature, key) {
                        var _a, _b, _c;
                        if (feature.properties.type === 'poi') {
                            feature.id = feature.id ? feature.id.replace(/\{|\}/g, '') : null;
                            feature.properties.id = feature.properties.id ? feature.properties.id.replace(/\{|\}/g, '') : null;
                            var connectedPolygon_1;
                            var connectedLabelLine_1;
                            // check if feature is inside a polygon
                            shopPolygons_1.forEach(function (polygon) {
                                var _a, _b;
                                if (((_a = feature.properties) === null || _a === void 0 ? void 0 : _a.level) === ((_b = polygon.properties) === null || _b === void 0 ? void 0 : _b.level)) {
                                    if (turf_1.booleanPointInPolygon(feature, polygon)) {
                                        connectedPolygon_1 = polygon;
                                    }
                                }
                            });
                            // or if not check if the polygon is defined in metadata and use it instead
                            if (!connectedPolygon_1 && feature.properties.metadata && feature.properties.metadata.polygon_id) {
                                connectedPolygon_1 = res.data.features.find(function (f) { var _a, _b; return ((_a = f.properties.id) === null || _a === void 0 ? void 0 : _a.replace(/\{|\}/g, '')) === ((_b = feature.properties.metadata.polygon_id) === null || _b === void 0 ? void 0 : _b.replace(/\{|\}/g, '')); });
                            }
                            if (connectedPolygon_1) {
                                feature.properties._dynamic = feature.properties._dynamic ? feature.properties._dynamic : {};
                                feature.properties._dynamic.id = feature.id;
                                feature.properties._dynamic.type = 'poi-custom';
                                feature.properties._dynamic.amenity = feature.properties.amenity;
                                feature.properties._dynamic.polygon_id = (_a = connectedPolygon_1.properties.id) === null || _a === void 0 ? void 0 : _a.replace(/\{|\}/g, '');
                                connectedPolygon_1.properties._dynamic = connectedPolygon_1.properties._dynamic
                                    ? connectedPolygon_1.properties._dynamic
                                    : {};
                                connectedPolygon_1.properties._dynamic.id = (_b = connectedPolygon_1.properties.id) === null || _b === void 0 ? void 0 : _b.replace(/\{|\}/g, '');
                                connectedPolygon_1.properties._dynamic.type = 'shop-custom';
                                connectedPolygon_1.properties._dynamic.poi_id = feature.properties.id;
                                connectedPolygon_1.properties._dynamic.amenity = feature.properties.amenity;
                                // id have to be changed to numetic type so feature state will work
                                connectedPolygon_1.id = JSON.stringify(key);
                                // check if feature is inside a polygon
                                labelLineFeatures_1.forEach(function (line) {
                                    var _a, _b;
                                    if (((_a = connectedPolygon_1.properties) === null || _a === void 0 ? void 0 : _a.level) === ((_b = line.properties) === null || _b === void 0 ? void 0 : _b.level)) {
                                        if (turf_1.booleanPointInPolygon(turf_1.pointOnFeature(line), connectedPolygon_1)) {
                                            connectedLabelLine_1 = line;
                                        }
                                    }
                                });
                                if (connectedLabelLine_1) {
                                    // id have to be changed to numetic type so feature state will work
                                    connectedLabelLine_1.id = JSON.stringify(key + 9999);
                                    feature.properties._dynamic.label_id = connectedLabelLine_1.id;
                                    connectedPolygon_1.properties._dynamic.label_id = connectedLabelLine_1.id;
                                    connectedLabelLine_1.properties._dynamic = connectedLabelLine_1.properties._dynamic
                                        ? connectedLabelLine_1.properties._dynamic
                                        : {};
                                    connectedLabelLine_1.properties._dynamic.id = (_c = connectedLabelLine_1.properties.id) === null || _c === void 0 ? void 0 : _c.replace(/\{|\}/g, '');
                                    connectedLabelLine_1.properties._dynamic.type = 'shop-label';
                                    connectedLabelLine_1.properties._dynamic.poi_id = feature.properties.id;
                                    connectedLabelLine_1.properties._dynamic.amenity = feature.properties.amenity;
                                    connectedLabelLine_1.properties._dynamic.polygon_id = connectedPolygon_1.properties._dynamic.id;
                                    connectedLabelLine_1.properties.title = feature.properties.title;
                                    connectedLabelLine_1.properties.title_i18n = feature.properties.title_i18n;
                                }
                                var labelLine = connectedPolygon_1.properties['label-line']
                                    ? JSON.parse(JSON.stringify(connectedPolygon_1.properties['label-line']))
                                    : connectedPolygon_1.properties.metadata && connectedPolygon_1.properties.metadata['label-line']
                                        ? JSON.parse(JSON.stringify(connectedPolygon_1.properties.metadata['label-line']))
                                        : feature.properties.metadata && feature.properties.metadata['label-line']
                                            ? JSON.parse(JSON.stringify(feature.properties.metadata['label-line']))
                                            : undefined;
                                if (labelLine && labelLine !== undefined && labelLine.length > 0) {
                                    var parsedLabelLine = JSON.parse(labelLine);
                                    if (parsedLabelLine[0] instanceof Array && parsedLabelLine[1] instanceof Array) {
                                        var labelLineFeature = JSON.parse(JSON.stringify(feature));
                                        labelLineFeature.geometry = {
                                            coordinates: parsedLabelLine,
                                            type: 'LineString',
                                        };
                                        labelLineFeature.properties.id = JSON.stringify(key + 9999);
                                        labelLineFeature.id = JSON.stringify(key + 9999);
                                        labelLineFeature.properties.type = 'shop-label';
                                        labelLineFeature.properties._dynamic.type = 'shop-label';
                                        connectedPolygon_1.properties._dynamic.label_id = labelLineFeature.properties.id;
                                        featuresToAdd_1.push(labelLineFeature);
                                    }
                                }
                            }
                        }
                        return feature;
                    });
                    res.data.features = res.data.features.concat(featuresToAdd_1);
                }
                return [2 /*return*/, new feature_1.FeatureCollection(res.data)];
        }
    });
}); };
exports.getFeatures = getFeatures;
var getAmenities = function (amenityIdProperty) { return __awaiter(void 0, void 0, void 0, function () {
    var url, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = '/v5/geo/amenities';
                return [4 /*yield*/, common_1.axios.get(url)];
            case 1:
                res = _a.sent();
                return [2 /*return*/, res.data.map(function (item) {
                        if (amenityIdProperty && item[amenityIdProperty] && item.category !== 'default') {
                            item.id = item[amenityIdProperty].toLowerCase();
                        }
                        return new amenity_1.AmenityModel(item);
                    })];
        }
    });
}); };
exports.getAmenities = getAmenities;
var getPois = function () { return __awaiter(void 0, void 0, void 0, function () {
    var url, res, customPois, pois;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = '/v5/geo/features';
                return [4 /*yield*/, common_1.axios.get(url)];
            case 1:
                res = _a.sent();
                customPois = main_1.globalState.dynamicFeatures;
                pois = __spreadArray(__spreadArray([], res.data.features), customPois.features).filter(function (feature) { return feature.properties.usecase === 'poi' || feature.properties.type === 'poi'; })
                    .sort(function (a, b) { return (a.properties.title > b.properties.title ? -1 : 1); })
                    .sort(function (a, b) { return (a.properties.level > b.properties.level ? 1 : -1); })
                    .map(function (item) { return new feature_1.default(item); });
                return [2 /*return*/, pois];
        }
    });
}); };
exports.getPois = getPois;
var addFeatures = function (featureCollection) { return __awaiter(void 0, void 0, void 0, function () {
    var url, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = '/v5/geo/features';
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, common_1.axios.post(url, featureCollection)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                console.log('Adding new features to db failed', error_1.message);
                throw new Error(error_1.message);
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.addFeatures = addFeatures;
var updateFeature = function (featureData, featureId) { return __awaiter(void 0, void 0, void 0, function () {
    var url, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = '/v5/geo/features/' + featureId;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, common_1.axios.put(url, featureData)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.log('Updating feature in db failed', error_2.message);
                throw new Error(error_2.message);
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateFeature = updateFeature;
var deleteFeatures = function (featureCollection) { return __awaiter(void 0, void 0, void 0, function () {
    var url, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = '/v5/geo/features/delete';
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, common_1.axios.post(url, featureCollection)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                console.log('Deleting features from db failed', error_3.message);
                throw new Error(error_3.message);
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteFeatures = deleteFeatures;
exports.default = {
    getFeatures: exports.getFeatures,
    addFeatures: exports.addFeatures,
    updateFeature: exports.updateFeature,
    deleteFeatures: exports.deleteFeatures,
    getAmenities: exports.getAmenities,
    getPois: exports.getPois,
};
