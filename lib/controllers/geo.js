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
exports.getPois = exports.getAmenities = exports.getFeatures = void 0;
var common_1 = require("../common");
var feature_1 = require("../models/feature");
var amenity_1 = require("../models/amenity");
var main_1 = require("../components/map/main");
var getFeatures = function (initPolygons) { return __awaiter(void 0, void 0, void 0, function () {
    var url, res, featuresToAdd_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = '/v5/geo/features';
                return [4 /*yield*/, common_1.axios.get(url)];
            case 1:
                res = _a.sent();
                if (initPolygons) {
                    featuresToAdd_1 = [];
                    res.data.features = res.data.features.map(function (feature, key) {
                        if (feature.properties.type === 'poi' && feature.properties.metadata && feature.properties.metadata.polygon_id) {
                            feature.properties.type = 'poi-custom';
                            var polygon = res.data.features.find(function (f) { return f.properties.id === feature.properties.metadata.polygon_id; });
                            if (polygon) {
                                var polygonFeature = JSON.parse(JSON.stringify(polygon));
                                polygonFeature.properties.type = 'shop-custom';
                                polygonFeature.properties.poi_id = feature.properties.id;
                                polygonFeature.properties.amenity = feature.properties.amenity;
                                polygonFeature.id = JSON.stringify(key);
                                featuresToAdd_1.push(polygonFeature);
                                if (polygonFeature.properties['label-line'] &&
                                    polygonFeature.properties['label-line'][0] instanceof Array &&
                                    polygonFeature.properties['label-line'][1] instanceof Array) {
                                    var labelLineFeature = JSON.parse(JSON.stringify(feature));
                                    labelLineFeature.geometry = {
                                        coordinates: polygonFeature.properties['label-line'],
                                        type: 'LineString',
                                    };
                                    labelLineFeature.properties.id = JSON.stringify(key + 9999);
                                    labelLineFeature.id = JSON.stringify(key + 9999);
                                    labelLineFeature.properties.type = 'shop-label';
                                    polygonFeature.properties.label_id = labelLineFeature.properties.id;
                                    featuresToAdd_1.push(labelLineFeature);
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
var getAmenities = function () { return __awaiter(void 0, void 0, void 0, function () {
    var url, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                url = '/v5/geo/amenities';
                return [4 /*yield*/, common_1.axios.get(url)];
            case 1:
                res = _a.sent();
                return [2 /*return*/, res.data.map(function (item) { return new amenity_1.AmenityModel(item); })];
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
exports.default = {
    getFeatures: exports.getFeatures,
    getAmenities: exports.getAmenities,
    getPois: exports.getPois,
};
