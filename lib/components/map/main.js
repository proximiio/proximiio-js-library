"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.Map = exports.globalState = void 0;
var mapboxgl = require("mapbox-gl");
var repository_1 = require("../../controllers/repository");
var place_1 = require("../../models/place");
var floor_1 = require("../../models/floor");
var style_1 = require("../../models/style");
var geojson_source_1 = require("./sources/geojson_source");
var synthetic_source_1 = require("./sources/synthetic_source");
var feature_1 = require("../../models/feature");
var routing_source_1 = require("./sources/routing_source");
var cluster_source_1 = require("./sources/cluster_source");
var image_source_manager_1 = require("./sources/image_source_manager");
var common_1 = require("../../common");
var icons_1 = require("./icons");
var floors_1 = require("../../controllers/floors");
var places_1 = require("../../controllers/places");
var rxjs_1 = require("rxjs");
var turf = require("@turf/turf");
// @ts-ignore
var tingle = require("tingle.js/dist/tingle");
// @ts-ignore
var TBTNav = require("../../../assets/tbtnav");
var constants_1 = require("./constants");
exports.globalState = {
    initializing: true,
    floor: new floor_1.FloorModel({}),
    floors: [],
    place: new place_1.PlaceModel({}),
    places: [],
    style: new style_1.default({}),
    styles: [],
    amenities: [],
    features: new feature_1.FeatureCollection({}),
    dynamicFeatures: new feature_1.FeatureCollection({}),
    allFeatures: new feature_1.FeatureCollection({}),
    latitude: 60.1669635,
    longitude: 24.9217484,
    loadingRoute: false,
    noPlaces: false,
    textNavigation: null
};
var Map = /** @class */ (function () {
    function Map(options) {
        this.geojsonSource = new geojson_source_1.default(new feature_1.FeatureCollection({}));
        this.syntheticSource = new synthetic_source_1.default(new feature_1.FeatureCollection({}));
        this.routingSource = new routing_source_1.default();
        this.clusterSource = new cluster_source_1.default();
        this.imageSourceManager = new image_source_manager_1.default();
        this.onMapReadyListener = new rxjs_1.Subject();
        this.onPlaceSelectListener = new rxjs_1.Subject();
        this.onFloorSelectListener = new rxjs_1.Subject();
        this.onRouteFoundListener = new rxjs_1.Subject();
        this.onRouteFailedListener = new rxjs_1.Subject();
        this.onRouteCancelListener = new rxjs_1.Subject();
        this.onFeatureAddListener = new rxjs_1.Subject();
        this.onFeatureUpdateListener = new rxjs_1.Subject();
        this.onFeatureDeleteListener = new rxjs_1.Subject();
        this.defaultOptions = {
            selector: 'proximiioMap',
            allowNewFeatureModal: false,
            newFeatureModalEvent: 'click',
            enableTBTNavigation: true
        };
        this.defaultOptions = __assign(__assign({}, this.defaultOptions), options);
        this.state = exports.globalState;
        this.onSourceChange = this.onSourceChange.bind(this);
        this.onSyntheticChange = this.onSyntheticChange.bind(this);
        this.onStyleChange = this.onStyleChange.bind(this);
        this.onStyleSelect = this.onStyleSelect.bind(this);
        this.onRouteUpdate = this.onRouteUpdate.bind(this);
        this.onRouteChange = this.onRouteChange.bind(this);
        this.onRouteCancel = this.onRouteCancel.bind(this);
        this.map = new mapboxgl.Map({
            container: this.defaultOptions.selector
        });
        this.initialize();
    }
    Map.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.geojsonSource.on(this.onSourceChange);
                        this.syntheticSource.on(this.onSyntheticChange);
                        this.routingSource.on(this.onRouteChange);
                        return [4 /*yield*/, this.fetch()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Map.prototype.cancelObservers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.geojsonSource.off(this.onSourceChange);
                this.syntheticSource.off(this.onSyntheticChange);
                this.state.style.off(this.onStyleChange);
                return [2 /*return*/];
            });
        });
    };
    Map.prototype.fetch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, places, style, styles, features, amenities, place;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, repository_1.default.getPackage()];
                    case 1:
                        _a = _b.sent(), places = _a.places, style = _a.style, styles = _a.styles, features = _a.features, amenities = _a.amenities;
                        place = places.length > 0 ? places[0] : new place_1.PlaceModel({});
                        style.center = [place.location.lng, place.location.lat];
                        this.geojsonSource.fetch(features);
                        this.routingSource.routing.setData(new feature_1.FeatureCollection(features));
                        this.prepareStyle(style);
                        this.imageSourceManager.belowLayer = style.usesPrefixes() ? 'proximiio-floors' : 'floors';
                        this.imageSourceManager.initialize();
                        this.state = __assign(__assign({}, this.state), { initializing: false, place: place, places: places, style: style, styles: styles, amenities: amenities, features: features, allFeatures: new feature_1.FeatureCollection(features), latitude: place.location.lat, longitude: place.location.lng, noPlaces: places.length === 0 });
                        style.on(this.onStyleChange);
                        this.map.setStyle(this.state.style);
                        this.map.on('load', function (e) {
                            _this.onMapReady(e);
                        });
                        if (this.defaultOptions.allowNewFeatureModal) {
                            this.map.on(this.defaultOptions.newFeatureModalEvent, function (e) {
                                _this.featureDialog(e);
                            });
                        }
                        if (this.defaultOptions.enableTBTNavigation) {
                            this.routeFactory = new TBTNav.RouteFactory(JSON.stringify(this.state.allFeatures.features), 'en');
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Map.prototype.onMapReady = function (e) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var map, routingLayer, usePrefixed, shopsLayer, decodedChevron;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        map = e.target;
                        if (!map) return [3 /*break*/, 3];
                        (_a = this.state.style) === null || _a === void 0 ? void 0 : _a.togglePaths(true);
                        routingLayer = map.getLayer('routing-line-completed');
                        usePrefixed = typeof routingLayer === 'undefined' && typeof map.getLayer('proximiio-routing-line-completed') !== 'undefined';
                        shopsLayer = map.getLayer('shops');
                        if (usePrefixed) {
                            map.moveLayer('proximiio-routing-line-completed', 'proximiio-outer_wall');
                            map.moveLayer('proximiio-routing-line-remaining', 'proximiio-outer_wall');
                            map.moveLayer('proximiio-paths', 'routing-line-completed');
                        }
                        else {
                            if (routingLayer) {
                                if (shopsLayer) {
                                    map.moveLayer('routing-line-completed', 'proximiio-routing-symbols');
                                    map.moveLayer('routing-line-remaining', 'proximiio-routing-symbols');
                                }
                                map.moveLayer('proximiio-paths', 'routing-line-completed');
                            }
                        }
                        map.setMaxZoom(30);
                        return [4 /*yield*/, common_1.getImageFromBase64(icons_1.chevron)];
                    case 1:
                        decodedChevron = _c.sent();
                        map.addImage('chevron_right', decodedChevron);
                        this.onSourceChange();
                        this.updateMapSource(this.geojsonSource);
                        this.updateMapSource(this.routingSource);
                        this.updateCluster();
                        this.updateImages();
                        this.imageSourceManager.setLevel(map, (_b = this.state.floor) === null || _b === void 0 ? void 0 : _b.level);
                        return [4 /*yield*/, this.onPlaceSelect(this.state.place)];
                    case 2:
                        _c.sent();
                        this.onMapReadyListener.next(true);
                        _c.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Map.prototype.featureDialog = function (e) {
        var _this = this;
        var _a;
        var features = this.map.queryRenderedFeatures(e.point, { layers: ['proximiio-pois-icons'] });
        var edit = features.length > 0;
        var modal = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: ['overlay', 'button', 'escape'],
            closeLabel: "Close",
            onClose: function () {
                modal.destroy();
            }
        });
        // set content
        modal.setContent(edit ? constants_1.EDIT_FEATURE_DIALOG(e, features[0]) : constants_1.NEW_FEATURE_DIALOG(e, (_a = this.state.floor) === null || _a === void 0 ? void 0 : _a.level));
        modal.addFooterBtn('Submit', 'tingle-btn tingle-btn--primary', function () { return __awaiter(_this, void 0, void 0, function () {
            var formData, data, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        formData = new FormData((document.querySelector('#modal-form')));
                        _b = {
                            id: "" + formData.get('id'),
                            title: "" + formData.get('title'),
                            level: formData.get('level'),
                            lat: formData.get('lat'),
                            lng: formData.get('lng')
                        };
                        if (!formData.get('icon').size) return [3 /*break*/, 2];
                        return [4 /*yield*/, common_1.getBase64FromImage(formData.get('icon'))];
                    case 1:
                        _a = _c.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = undefined;
                        _c.label = 3;
                    case 3:
                        data = (_b.icon = _a,
                            _b);
                        if (!(data.title && data.level && data.lat && data.lng)) return [3 /*break*/, 8];
                        if (!edit) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.onUpdateFeature(data.id, data.title, +data.level, +data.lat, +data.lng, data.icon)];
                    case 4:
                        _c.sent();
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.onAddNewFeature(data.title, +data.level, +data.lat, +data.lng, data.icon, data.id)];
                    case 6:
                        _c.sent();
                        _c.label = 7;
                    case 7:
                        modal.close();
                        return [3 /*break*/, 9];
                    case 8:
                        alert('Please fill all the required fields!');
                        _c.label = 9;
                    case 9: return [2 /*return*/];
                }
            });
        }); });
        if (edit) {
            modal.addFooterBtn('Delete', 'tingle-btn tingle-btn--danger', function () {
                var _a, _b;
                _this.onDeleteFeature((_b = (_a = features[0]) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b.id);
                modal.close();
            });
        }
        modal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--default tingle-btn--pull-right', function () {
            modal.close();
        });
        modal.open();
    };
    Map.prototype.onAddNewFeature = function (title, level, lat, lng, icon, id, placeId, floorId) {
        return __awaiter(this, void 0, void 0, function () {
            var featureId, feature, decodedIcon;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        featureId = id ? id : common_1.uuidv4();
                        if (this.state.allFeatures.features.findIndex(function (f) { return f.id === featureId || f.properties.id === featureId; }) > 0) {
                            console.error("Create feature failed: Feature with id '" + featureId + "' already exists!");
                            throw new Error("Create feature failed: Feature with id '" + featureId + "' already exists!");
                        }
                        feature = new feature_1.default({
                            type: 'Feature',
                            id: featureId,
                            geometry: new feature_1.Geometry({
                                type: 'Point',
                                coordinates: [lng, lat]
                            }),
                            properties: {
                                type: 'poi',
                                usecase: 'poi',
                                id: featureId,
                                minzoom: 15,
                                visibility: 'visible',
                                amenity: icon ? id : 'default',
                                title: title,
                                level: level,
                                images: [icon],
                                place_id: placeId,
                                floor_id: floorId
                            }
                        });
                        if (!(icon && icon.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, common_1.getImageFromBase64(icon)];
                    case 1:
                        decodedIcon = _a.sent();
                        this.map.addImage(featureId, decodedIcon);
                        _a.label = 2;
                    case 2:
                        this.state.dynamicFeatures.features.push(feature);
                        // this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features];
                        this.geojsonSource.create(feature);
                        // this.onSourceChange();
                        // this.routingSource.routing.setData(this.state.allFeatures);
                        // this.updateMapSource(this.routingSource);
                        this.onFeaturesChange();
                        this.onFeatureAddListener.next(feature);
                        return [2 /*return*/, feature];
                }
            });
        });
    };
    Map.prototype.onUpdateFeature = function (id, title, level, lat, lng, icon, placeId, floorId) {
        return __awaiter(this, void 0, void 0, function () {
            var foundFeature, feature, decodedIcon, dynamicIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        foundFeature = this.state.allFeatures.features.find(function (f) { return f.id === id || f.properties.id === id; });
                        if (!foundFeature) {
                            console.error("Update feature failed: Feature with id '" + id + "' has not been found!");
                            throw new Error("Update feature failed: Feature with id '" + id + "' has not been found!");
                        }
                        feature = new feature_1.default(foundFeature);
                        feature.geometry.coordinates = [lng ? lng : feature.geometry.coordinates[0], lat ? lat : feature.geometry.coordinates[1]];
                        feature.properties = __assign(__assign({}, feature.properties), { title: title ? title : feature.properties.title, level: level ? level : feature.properties.level, amenity: icon ? id : feature.properties.amenity, images: icon ? [icon] : feature.properties.images, place_id: placeId ? placeId : feature.properties.place_id, floor_id: floorId ? floorId : feature.properties.floor_id });
                        if (!(icon && icon.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, common_1.getImageFromBase64(icon)];
                    case 1:
                        decodedIcon = _a.sent();
                        this.map.addImage(id, decodedIcon);
                        _a.label = 2;
                    case 2:
                        dynamicIndex = this.state.dynamicFeatures.features.findIndex(function (x) { return x.id === feature.id || x.properties.id === feature.id; });
                        this.state.dynamicFeatures.features[dynamicIndex] = feature;
                        // this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features]; // this is not probably updated with non dynamic feature update TODO
                        this.geojsonSource.update(feature);
                        // this.onSourceChange();
                        // this.routingSource.routing.setData(this.state.allFeatures);
                        // this.updateMapSource(this.routingSource);
                        this.onFeaturesChange();
                        this.onFeatureUpdateListener.next(feature);
                        return [2 /*return*/, feature];
                }
            });
        });
    };
    Map.prototype.onDeleteFeature = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var foundFeature, dynamicIndex;
            return __generator(this, function (_a) {
                foundFeature = this.state.allFeatures.features.find(function (f) { return f.id === id || f.properties.id === id; });
                if (!foundFeature) {
                    console.error("Deleting feature failed: Feature with id '" + id + "' has not been found!");
                    throw new Error("Deleting feature failed: Feature with id '" + id + "' has not been found!");
                }
                dynamicIndex = this.state.dynamicFeatures.features.findIndex(function (x) { return x.id === id || x.properties.id === id; });
                this.state.dynamicFeatures.features.splice(dynamicIndex, 1);
                // this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features]; // this is not probably updated with non dynamic feature delete TODO
                this.geojsonSource.delete(id);
                // this.onSourceChange();
                // this.routingSource.routing.setData(this.state.allFeatures);
                // this.updateMapSource(this.routingSource);
                this.onFeaturesChange();
                this.onFeatureDeleteListener.next(foundFeature);
                return [2 /*return*/];
            });
        });
    };
    Map.prototype.onFeaturesChange = function () {
        this.state.allFeatures.features = __spreadArray(__spreadArray([], this.state.features.features), this.state.dynamicFeatures.features);
        this.onSourceChange();
        this.routingSource.routing.setData(this.state.allFeatures);
        this.updateMapSource(this.routingSource);
        if (this.defaultOptions.enableTBTNavigation) {
            this.routeFactory = new TBTNav.RouteFactory(JSON.stringify(this.state.allFeatures.features), 'en');
        }
    };
    Map.prototype.prepareStyle = function (style) {
        style.setSource('main', this.geojsonSource);
        style.setSource('synthetic', this.syntheticSource);
        style.setSource('route', this.routingSource);
        style.setSource('clusters', this.clusterSource);
        style.setLevel(0);
    };
    Map.prototype.onRouteChange = function (event) {
        var _a;
        if (event === 'loading-start') {
            this.state = __assign(__assign({}, this.state), { loadingRoute: true });
            return;
        }
        if (event === 'loading-finished') {
            if (this.routingSource.route) {
                var routeStart = this.routingSource.route[(_a = this.routingSource.start) === null || _a === void 0 ? void 0 : _a.properties.level];
                var textNavigation = this.routeFactory.generateRoute(JSON.stringify(this.routingSource.points), JSON.stringify(this.endPoint));
                this.centerOnRoute(routeStart);
                this.state = __assign(__assign({}, this.state), { loadingRoute: false, textNavigation: textNavigation });
                this.onRouteFoundListener.next({ route: this.routingSource.route, TBTNav: this.defaultOptions.enableTBTNavigation ? textNavigation : null });
            }
            return;
        }
        if (event === 'route-undefined') {
            console.log('route not found');
            this.state = __assign(__assign({}, this.state), { loadingRoute: false });
            this.onRouteFailedListener.next('route not found');
            return;
        }
        var style = this.state.style;
        style.setSource('route', this.routingSource);
        this.state = __assign(__assign({}, this.state), { style: style });
        this.updateMapSource(this.routingSource);
    };
    Map.prototype.onSourceChange = function () {
        this.state = __assign(__assign({}, this.state), { style: this.state.style });
        this.updateMapSource(this.geojsonSource);
        // this.routingSource.routing.setData(this.geojsonSource.collection)
        this.updateCluster();
    };
    Map.prototype.onSyntheticChange = function () {
        this.state.style.setSource('synthetic', this.syntheticSource);
        this.updateMapSource(this.syntheticSource);
    };
    Map.prototype.updateMapSource = function (source) {
        var map = this.map;
        if (map && map.getSource(source.id)) {
            var mapSource = map.getSource(source.id);
            if (mapSource) {
                mapSource.setData(source.data);
            }
        }
    };
    Map.prototype.onStyleSelect = function (style) {
        var map = this.map;
        if (map) {
            this.prepareStyle(style);
            map.setStyle(style.json);
        }
        this.state = __assign(__assign({}, this.state), { style: style });
    };
    Map.prototype.onStyleChange = function (event, data) {
        var map = this.map;
        if (map) {
            if (event === 'overlay-toggled') {
                var overlay = this.state.style.overlay ? 'visible' : 'none';
                map.setLayoutProperty('main-polygon-fill', 'visibility', overlay);
                map.setLayoutProperty('main-polygon-outline', 'visibility', overlay);
            }
            if (event === 'segments-toggled') {
                var segments = this.state.style.segments ? 'visible' : 'none';
                map.setLayoutProperty('main-segment-fill', 'visibility', segments);
                map.setLayoutProperty('main-segment-outline', 'visibility', segments);
            }
            if (event === 'routable-toggled') {
                var routables = this.state.style.segments ? 'visible' : 'none';
                map.setLayoutProperty('main-routable-fill', 'visibility', routables);
                map.setLayoutProperty('main-routable-outline', 'visibility', routables);
            }
            if (event === 'cluster-toggled') {
                var clusters = this.state.style.cluster ? 'visible' : 'none';
                map.setLayoutProperty('clusters-circle', 'visibility', clusters);
            }
        }
        if (event === 'layer-update' && data) {
            var layer_1 = data.layer, changes = data.changes;
            var layoutChanges = changes.filter(function (diff) { return diff.kind === 'E' && diff.path[0] === 'layout'; });
            var paintChanges = changes.filter(function (diff) { return diff.kind === 'E' && diff.path[0] === 'paint'; });
            // tslint:disable-next-line:no-shadowed-variable
            var map_1 = this.map;
            if (map_1) {
                layoutChanges.forEach(function (change) {
                    if (change.kind === 'E') {
                        map_1.setLayoutProperty(layer_1.id, change.path[1], change.rhs);
                    }
                });
                paintChanges.forEach(function (change) {
                    if (change.kind === 'E') {
                        map_1.setPaintProperty(layer_1.id, change.path[1], change.rhs);
                    }
                });
            }
        }
        if (event === 'filter-change') {
            // tslint:disable-next-line:no-shadowed-variable
            var map_2 = this.map;
            this.state.style.getLayers('main').forEach(function (layer) {
                if (map_2.getLayer(layer.id)) {
                    map_2.removeLayer(layer.id);
                }
                // @ts-ignore
                map_2.addLayer(layer);
            });
        }
        // @ts-ignore
        this.map.setStyle(this.state.style);
        this.state = __assign(__assign({}, this.state), { style: this.state.style });
    };
    Map.prototype.onRasterToggle = function (value) {
        this.imageSourceManager.enabled = value;
        var map = this.map;
        if (map) {
            this.imageSourceManager.setLevel(map, this.state.floor.level);
        }
    };
    Map.prototype.updateCluster = function () {
        var _this = this;
        var map = this.map;
        if (map) {
            var data = {
                type: 'FeatureCollection',
                features: this.geojsonSource.data.features
                    .filter(function (f) { return f.isPoint && f.hasLevel(_this.state.floor.level); })
                    .map(function (f) { return f.json; })
            };
            var source = map.getSource('clusters');
            if (source) {
                source.setData(data);
            }
        }
    };
    Map.prototype.onPlaceSelect = function (place) {
        return __awaiter(this, void 0, void 0, function () {
            var floors, state, groundFloor, map;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.state = __assign(__assign({}, this.state), { place: place });
                        return [4 /*yield*/, floors_1.getPlaceFloors(place.id)];
                    case 1:
                        floors = _a.sent();
                        state = { floors: floors.sort(function (a, b) { return a.level - b.level; }) };
                        if (floors.length > 0) {
                            groundFloor = floors.find(function (floor) { return floor.level === 0; });
                            if (groundFloor) {
                                state.floor = groundFloor;
                            }
                            else {
                                state.floor = floors[0];
                            }
                        }
                        this.state = __assign(__assign({}, this.state), state);
                        map = this.map;
                        if (map) {
                            map.flyTo({ center: [place.location.lng, place.location.lat] });
                        }
                        this.onPlaceSelectListener.next(place);
                        this.onFloorSelect(state.floor);
                        return [2 /*return*/];
                }
            });
        });
    };
    Map.prototype.onFloorSelect = function (floor) {
        var _this = this;
        var map = this.map;
        var route = this.routingSource.route && this.routingSource.route[floor.level] ? this.routingSource.route[floor.level] : null;
        if (map) {
            this.state.style.setLevel(floor.level);
            map.setStyle(this.state.style);
            setTimeout(function () {
                __spreadArray(__spreadArray([], _this.state.style.getLayers('main')), _this.state.style.getLayers('route')).forEach(function (layer) {
                    if (map.getLayer(layer.id)) {
                        map.setFilter(layer.id, layer.filter);
                    }
                });
                _this.imageSourceManager.setLevel(map, floor.level);
            });
            if (route) {
                var bbox = turf.bbox(route.geometry);
                // @ts-ignore;
                map.fitBounds(bbox, { padding: 50 });
            }
        }
        this.state = __assign(__assign({}, this.state), { floor: floor, style: this.state.style });
        this.updateCluster();
        this.onFloorSelectListener.next(floor);
    };
    Map.prototype.onRouteUpdate = function (start, finish) {
        this.startPoint = start;
        this.endPoint = finish;
        try {
            this.routingSource.update(start, finish);
        }
        catch (e) {
            console.log('catched', e);
        }
        this.state = __assign(__assign({}, this.state), { style: this.state.style });
    };
    Map.prototype.onRouteCancel = function () {
        this.state = __assign(__assign({}, this.state), { textNavigation: null });
        this.routingSource.cancel();
        this.onRouteCancelListener.next('route cancelled');
    };
    Map.prototype.centerOnPoi = function (poi) {
        if (this.state.floor.level !== parseInt(poi.properties.level, 0)) {
            var floor = this.state.floors.find(function (f) { return f.level === poi.properties.level; });
            if (floor)
                this.onFloorSelect(floor);
        }
        if (this.map) {
            this.map.flyTo({ center: poi.geometry.coordinates });
        }
    };
    Map.prototype.centerOnRoute = function (route) {
        if (route && route.properties) {
            if (this.state.floor.level !== parseInt(route.properties.level, 0)) {
                var floor = this.state.floors.find(function (f) { return f.level === parseInt(route.properties.level, 0); });
                if (floor)
                    this.onFloorSelect(floor);
            }
            if (this.map) {
                var bbox = turf.bbox(route.geometry);
                // @ts-ignore
                this.map.fitBounds(bbox, { padding: 50 });
            }
        }
    };
    Map.prototype.updateImages = function () {
        var _this = this;
        this.state.amenities
            .filter(function (a) { return a.icon; })
            .forEach(function (amenity) {
            _this.map.loadImage(amenity.icon, function (error, image) {
                if (error)
                    throw error;
                _this.map.addImage(amenity.id, image);
            });
        });
    };
    Map.prototype.getUpcomingFloorNumber = function (way) {
        var _this = this;
        if (this.routingSource.lines && this.routingSource.route) {
            var currentRouteIndex = this.routingSource.lines.findIndex(function (route) { return +route.properties.level === _this.state.floor.level; });
            var currentRoute = this.routingSource.lines[currentRouteIndex];
            var nextRouteIndex = way === 'up' ? currentRouteIndex + 1 : currentRouteIndex - 1;
            var nextRoute = this.routingSource.lines[nextRouteIndex];
            // return currentRouteIndex !== -1 && nextRoute ? +nextRoute.properties.level : way === 'up' ? this.state.floor.level + 1 : this.state.floor.level - 1;
            return nextRoute ? +nextRoute.properties.level : this.state.floor.level;
        }
    };
    /**
     *  @memberof Map
     *  @name getMapboxInstance
     *  @returns returns mapbox instance
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapboxInstance();
     */
    Map.prototype.getMapboxInstance = function () {
        return this.map;
    };
    /**
     *  @memberof Map
     *  @name getMapReadyListener
     *  @returns returns map ready listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *  });
     */
    Map.prototype.getMapReadyListener = function () {
        return this.onMapReadyListener.asObservable();
    };
    /**
     * This method will set an active place, load floors etc. Have to be called after map is ready, see getMapReadyListener.
     *  @memberof Map
     *  @name setPlace
     *  @param placeId {string} Id of the place to be set as active on map
     *  @returns active place
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setPlace(myPlaceId);
     *  });
     */
    Map.prototype.setPlace = function (placeId) {
        return __awaiter(this, void 0, void 0, function () {
            var place;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, places_1.getPlaceById(placeId)];
                    case 1:
                        place = _a.sent();
                        return [4 /*yield*/, this.onPlaceSelect(place)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, place];
                }
            });
        });
    };
    /**
     *  @memberof Map
     *  @name getPlaceSelectListener
     *  @returns returns place select listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getPlaceSelectListener().subscribe(place => {
     *    console.log('selected place', place);
     *  });
     */
    Map.prototype.getPlaceSelectListener = function () {
        return this.onPlaceSelectListener.asObservable();
    };
    /**
     * This method will set an active floor based on it's id. Have to be called after map is ready, see getMapReadyListener.
     *  @memberof Map
     *  @name setFloorById
     *  @param floorId {string} Id of the floor to be set as active on map
     *  @returns active floor
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setFloorById(myFloorId);
     *  });
     */
    Map.prototype.setFloorById = function (floorId) {
        var floor = this.state.floors.filter(function (f) { return f.id === floorId; }) ? this.state.floors.filter(function (f) { return f.id === floorId; })[0] : this.state.floor;
        if (floor) {
            this.onFloorSelect(new floor_1.FloorModel(floor));
        }
        return floor;
    };
    /**
     * This method will set an active floor based on it's level. Have to be called after map is ready, see getMapReadyListener.
     *  @memberof Map
     *  @name setFloorByLevel
     *  @param level {number} Level of the floor to be set as active on map
     *  @returns active floor
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setFloorByLevel(0);
     *  });
     */
    Map.prototype.setFloorByLevel = function (level) {
        var floor = this.state.floors.filter(function (f) { return f.level === level; }) ? this.state.floors.filter(function (f) { return f.level === level; })[0] : this.state.floor;
        if (floor) {
            this.onFloorSelect(new floor_1.FloorModel(floor));
        }
        return floor;
    };
    /**
     * This method will set an active floor based on the way of the next floor, e.g if we wanna go up or down. Have to be called after map is ready, see getMapReadyListener.
     *  @memberof Map
     *  @name setFloorByWay
     *  @param way {'up' | 'down'} Way of the next floor to be set as active on map
     *  @returns active floor
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setFloorByWay('up');
     *  });
     */
    Map.prototype.setFloorByWay = function (way) {
        var floor;
        var nextLevel = way === 'up' ? this.state.floor.level + 1 : this.state.floor.level - 1;
        if (this.routingSource.route) {
            nextLevel = this.getUpcomingFloorNumber(way);
        }
        floor = this.state.floors.filter(function (f) { return f.level === nextLevel; }) ? this.state.floors.filter(function (f) { return f.level === nextLevel; })[0] : this.state.floor;
        if (floor) {
            this.onFloorSelect(new floor_1.FloorModel(floor));
        }
        return floor;
    };
    /**
     *  @memberof Map
     *  @name getFloorSelectListener
     *  @returns returns floor select listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getFloorSelectListener().subscribe(floor => {
     *    console.log('selected floor', floor);
     *  });
     */
    Map.prototype.getFloorSelectListener = function () {
        return this.onFloorSelectListener.asObservable();
    };
    /**
     * This method will generate route based on selected features by their ids
     *  @memberof Map
     *  @name findRouteByIds
     *  @param idFrom {string} start feature id
     *  @param idTo {string} finish feature id
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByIds('startId', 'finishId);
     *  });
     */
    Map.prototype.findRouteByIds = function (idFrom, idTo) {
        var fromFeature = this.state.allFeatures.features.find(function (f) { return f.id === idFrom || f.properties.id === idFrom; });
        var toFeature = this.state.allFeatures.features.find(function (f) { return f.id === idTo || f.properties.id === idTo; });
        this.onRouteUpdate(fromFeature, toFeature);
    };
    /**
     * This method will generate route based on selected features by their titles
     *  @memberof Map
     *  @name findRouteByTitle
     *  @param titleFrom {string} start feature title
     *  @param titleTo {string} finish feature title
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByTitle('myFeatureTitle', 'anotherFeatureTitle');
     *  });
     */
    Map.prototype.findRouteByTitle = function (titleFrom, titleTo) {
        var fromFeature = this.state.allFeatures.features.find(function (f) { return f.properties.title === titleFrom; });
        var toFeature = this.state.allFeatures.features.find(function (f) { return f.properties.title === titleTo; });
        this.onRouteUpdate(fromFeature, toFeature);
    };
    /**
     * This method will generate route based on selected features by their titles
     *  @memberof Map
     *  @name findRouteByCoords
     *  @param latFrom {number} start latitude coordinate
     *  @param lngFrom {number} start longitude coordinate
     *  @param levelFrom {number} start level
     *  @param latTo {number} finish latitude coordinate
     *  @param lngTo {number} finish longitude coordinate
     *  @param levelTo {number} finish level
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByCoords(48.606703739771774, 17.833092384506614, 0, 48.60684545080579, 17.833450676669543, 0);
     *  });
     */
    Map.prototype.findRouteByCoords = function (latFrom, lngFrom, levelFrom, latTo, lngTo, levelTo) {
        var fromFeature = turf.feature({ type: 'Point', coordinates: [lngFrom, latFrom] }, { level: levelFrom });
        var toFeature = turf.feature({ type: 'Point', coordinates: [lngTo, latTo] }, { level: levelTo });
        this.onRouteUpdate(fromFeature, toFeature);
    };
    /**
     * This method will cancel generated route
     *  @memberof Map
     *  @name cancelRoute
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.cancelRoute();
     *  });
     */
    Map.prototype.cancelRoute = function () {
        this.onRouteCancel();
    };
    /**
     * This method will return turn by turn text navigation object.
     *  @memberof Map
     *  @name getTBTNav
     *  @return turn by turn text navigation object
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    const TBTNav = map.getTBTNav();
     *  });
     */
    Map.prototype.getTBTNav = function () {
        return this.state.textNavigation;
    };
    /**
     *  @memberof Map
     *  @name getRouteFoundListener
     *  @returns returns route found listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getRouteFoundListener().subscribe(res => {
     *    console.log('route found successfully', res.route);
     *    console.log('turn by turn text navigation output', res.TBTNav);
     *  });
     */
    Map.prototype.getRouteFoundListener = function () {
        return this.onRouteFoundListener.asObservable();
    };
    /**
     *  @memberof Map
     *  @name getRouteFailedListener
     *  @returns returns route fail listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getRouteFailedListener().subscribe(() => {
     *    console.log('route not found');
     *  });
     */
    Map.prototype.getRouteFailedListener = function () {
        return this.onRouteFailedListener.asObservable();
    };
    /**
     *  @memberof Map
     *  @name getRouteCancelListener
     *  @returns returns route cancel listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getRouteCancelListener().subscribe(() => {
     *    console.log('route cancelled);
     *  });
     */
    Map.prototype.getRouteCancelListener = function () {
        return this.onRouteCancelListener.asObservable();
    };
    /**
     * This method will center the map to generated route bounds.
     *  @memberof Map
     *  @name centerToRoute
     *  @return error {string} in case there is no route or {Feature} otherwise
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.centerToRoute();
     *  });
     */
    Map.prototype.centerToRoute = function () {
        var _a, _b;
        if (this.routingSource && this.routingSource.route && this.routingSource.route[(_a = this.routingSource.start) === null || _a === void 0 ? void 0 : _a.properties.level]) {
            var routeStart = this.routingSource.route[(_b = this.routingSource.start) === null || _b === void 0 ? void 0 : _b.properties.level];
            this.centerOnRoute(routeStart);
            return routeStart;
        }
        else {
            throw new Error("Route not found");
        }
    };
    /**
     * This method will center the map to feature coordinates.
     *  @memberof Map
     *  @name centerToFeature
     *  @param featureId {string} feature id
     *  @return error {string} in case there is no route or {Feature} otherwise
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.centerToFeature('featureId');
     *  });
     */
    Map.prototype.centerToFeature = function (featureId) {
        var feature = this.state.allFeatures.features.find(function (f) { return f.id === featureId || f.properties.id === featureId; });
        if (feature) {
            this.centerOnPoi(feature);
            return feature;
        }
        else {
            throw new Error("Feature not found");
        }
    };
    /**
     * Add new feature to map.
     *  @memberof Map
     *  @name addCustomFeature
     *  @param title {string} feature title, required
     *  @param level {number} feature floor level, required
     *  @param lat {number} feature latitude coordinate, required
     *  @param lng {number} feature longitude coordinate, required
     *  @param icon {string} feature icon image in base64 format, optional
     *  @param id {string} feature id, optional, will be autogenerated if not defined
     *  @param placeId {string} feature place_id, optional
     *  @param floorId {string} feature floor_id, optional
     *  @return <Promise>{Feature} newly added feature
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    const myFeature = map.addCustomFeature('myPOI', 0, 48.606703739771774, 17.833092384506614);
     *  });
     */
    Map.prototype.addCustomFeature = function (title, level, lat, lng, icon, id, placeId, floorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.onAddNewFeature(title, +level, +lat, +lng, icon, id, placeId, floorId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Update existing map feature.
     *  @memberof Map
     *  @name updateFeature
     *  @param id {string} feature id
     *  @param title {string} feature title, optional
     *  @param level {number} feature floor level, optional
     *  @param lat {number} feature latitude coordinate, optional
     *  @param lng {number} feature longitude coordinate, optional
     *  @param icon {string} feature icon image in base64 format, optional
     *  @param placeId {string} feature place_id, optional
     *  @param floorId {string} feature floor_id, optional
     *  @return <Promise>{Feature} newly added feature
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    const myFeature = map.updateFeature('poiId', 'myPOI', 0, 48.606703739771774, 17.833092384506614);
     *  });
     */
    Map.prototype.updateFeature = function (id, title, level, lat, lng, icon, placeId, floorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.onUpdateFeature(id, title, level, lat, lng, icon, placeId, floorId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Delete existing map feature.
     *  @memberof Map
     *  @name deleteFeature
     *  @param id {string} feature id
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.deleteFeature('poiId');
     *  });
     */
    Map.prototype.deleteFeature = function (id) {
        return this.onDeleteFeature(id);
    };
    /**
     * This method will return list of custom added points.
     *  @memberof Map
     *  @name getCustomFeaturesList
     *  @return {FeatureCollection} of custom features
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    const features = map.getCustomFeaturesList();
     *  });
     */
    Map.prototype.getCustomFeaturesList = function () {
        return this.state.dynamicFeatures;
    };
    /**
     *  @memberof Map
     *  @name getFeatureAddListener
     *  @returns returns feature add listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getFeatureAddListener().subscribe(feature => {
     *    console.log('feature added', feature);
     *  });
     */
    Map.prototype.getFeatureAddListener = function () {
        return this.onFeatureAddListener.asObservable();
    };
    /**
     *  @memberof Map
     *  @name getFeatureUpdateListener
     *  @returns returns feature update listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getFeatureUpdateListener().subscribe(feature => {
     *    console.log('feature updated', feature);
     *  });
     */
    Map.prototype.getFeatureUpdateListener = function () {
        return this.onFeatureUpdateListener.asObservable();
    };
    /**
     *  @memberof Map
     *  @name getFeatureDeleteListener
     *  @returns returns feature delete listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getFeatureDeleteListener().subscribe(() => {
     *    console.log('feature deleted');
     *  });
     */
    Map.prototype.getFeatureDeleteListener = function () {
        return this.onFeatureDeleteListener.asObservable();
    };
    return Map;
}());
exports.Map = Map;
/* TODO
* - check clusters
* */
