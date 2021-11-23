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
var custom_layers_1 = require("./custom-layers");
var person_1 = require("../../models/person");
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
    latitude: 0,
    longitude: 0,
    loadingRoute: false,
    noPlaces: false,
    textNavigation: null,
    persons: [],
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
        this.onPolygonClickListener = new rxjs_1.Subject();
        this.onPersonUpdateListener = new rxjs_1.Subject();
        this.defaultOptions = {
            selector: 'proximiioMap',
            allowNewFeatureModal: false,
            newFeatureModalEvent: 'click',
            enableTBTNavigation: true,
            zoomIntoPlace: true,
            isKiosk: false,
            initPolygons: false,
            considerVisibilityParam: true,
            fitBoundsPadding: 250,
            showLevelDirectionIcon: false
        };
        this.showStartPoint = false;
        this.amenityIds = [];
        this.filteredAmenities = [];
        this.amenityFilters = [];
        this.amenityCategories = {};
        // fix centering in case of kiosk with defined pitch/bearing/etc. in mapbox options
        if (options.isKiosk && options.mapboxOptions && options.kioskSettings && !options.mapboxOptions.center) {
            options.mapboxOptions.center = options.kioskSettings.coordinates;
        }
        this.defaultOptions = __assign(__assign({}, this.defaultOptions), options);
        this.state = exports.globalState;
        this.onSourceChange = this.onSourceChange.bind(this);
        this.onSyntheticChange = this.onSyntheticChange.bind(this);
        this.onStyleChange = this.onStyleChange.bind(this);
        this.onStyleSelect = this.onStyleSelect.bind(this);
        this.onRouteUpdate = this.onRouteUpdate.bind(this);
        this.onRouteChange = this.onRouteChange.bind(this);
        this.onRouteCancel = this.onRouteCancel.bind(this);
        this.map = new mapboxgl.Map(__assign(__assign({}, this.defaultOptions.mapboxOptions), { container: this.defaultOptions.selector ? this.defaultOptions.selector : 'map' }));
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
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var _d, places, style, styles, features, amenities, defaultPlace, place, center;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, repository_1.default.getPackage(this.defaultOptions.initPolygons)];
                    case 1:
                        _d = _e.sent(), places = _d.places, style = _d.style, styles = _d.styles, features = _d.features, amenities = _d.amenities;
                        defaultPlace = places.find(function (p) { return p.id === _this.defaultOptions.defaultPlaceId; });
                        place = places.length > 0 ? (defaultPlace ? defaultPlace : places[0]) : new place_1.PlaceModel({});
                        center = ((_a = this.defaultOptions.mapboxOptions) === null || _a === void 0 ? void 0 : _a.center)
                            ? this.defaultOptions.mapboxOptions.center
                            : this.defaultOptions.isKiosk
                                ? (_b = this.defaultOptions.kioskSettings) === null || _b === void 0 ? void 0 : _b.coordinates
                                : [place.location.lng, place.location.lat];
                        style.center = center;
                        if (this.defaultOptions.zoomLevel) {
                            style.zoom = this.defaultOptions.zoomLevel;
                        }
                        this.geojsonSource.fetch(features);
                        this.routingSource.routing.setData(new feature_1.FeatureCollection(features));
                        this.prepareStyle(style);
                        this.imageSourceManager.belowLayer = style.usesPrefixes() ? 'proximiio-floors' : 'floors';
                        this.imageSourceManager.initialize();
                        this.state = __assign(__assign({}, this.state), { initializing: false, place: place, places: places, style: style, styles: styles, amenities: amenities, features: features, allFeatures: new feature_1.FeatureCollection(features), latitude: center[1], longitude: center[0], zoom: this.defaultOptions.zoomLevel ? this.defaultOptions.zoomLevel : (_c = this.defaultOptions.mapboxOptions) === null || _c === void 0 ? void 0 : _c.zoom, noPlaces: places.length === 0 });
                        style.on(this.onStyleChange);
                        this.map.setStyle(this.state.style);
                        this.map.on('load', function (e) {
                            _this.onMapReady(e);
                        });
                        if (this.defaultOptions.allowNewFeatureModal) {
                            this.map.on(this.defaultOptions.newFeatureModalEvent ? this.defaultOptions.newFeatureModalEvent : 'dblclick', function (e) {
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
            var map, routingLayer, usePrefixed, shopsLayer, routingSymbolsLayer, decodedChevron, decodedPersonIcon, decodedFloorchangeUpImage, decodedFloorchangeDownImage;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        map = e.target;
                        if (!map) return [3 /*break*/, 6];
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
                        routingSymbolsLayer = map.getLayer('proximiio-routing-symbols');
                        if (routingSymbolsLayer) {
                            routingSymbolsLayer.filter.push(['!=', ['get', 'type'], 'poi-custom']);
                            this.state.style.getLayer('proximiio-routing-symbols').filter = routingSymbolsLayer.filter;
                            map.setFilter('proximiio-routing-symbols', routingSymbolsLayer.filter);
                        }
                        map.setMaxZoom(30);
                        return [4 /*yield*/, common_1.getImageFromBase64(icons_1.chevron)];
                    case 1:
                        decodedChevron = _c.sent();
                        return [4 /*yield*/, common_1.getImageFromBase64(icons_1.person)];
                    case 2:
                        decodedPersonIcon = _c.sent();
                        return [4 /*yield*/, common_1.getImageFromBase64(icons_1.floorchangeUpImage)];
                    case 3:
                        decodedFloorchangeUpImage = _c.sent();
                        return [4 /*yield*/, common_1.getImageFromBase64(icons_1.floorchangeDownImage)];
                    case 4:
                        decodedFloorchangeDownImage = _c.sent();
                        map.addImage('chevron_right', decodedChevron);
                        map.addImage('pulsing-dot', icons_1.pulsingDot, { pixelRatio: 2 });
                        map.addImage('person', decodedPersonIcon);
                        map.addImage('floorchange-up-image', decodedFloorchangeUpImage);
                        map.addImage('floorchange-down-image', decodedFloorchangeDownImage);
                        this.onSourceChange();
                        this.updateMapSource(this.geojsonSource);
                        this.updateMapSource(this.routingSource);
                        this.updateCluster();
                        this.updateImages();
                        this.filteredAmenities = this.amenityIds;
                        this.imageSourceManager.setLevel(map, (_b = this.state.floor) === null || _b === void 0 ? void 0 : _b.level);
                        return [4 /*yield*/, this.onPlaceSelect(this.state.place, this.defaultOptions.zoomIntoPlace)];
                    case 5:
                        _c.sent();
                        if (this.defaultOptions.initPolygons) {
                            this.initPolygons();
                        }
                        if (this.defaultOptions.isKiosk) {
                            this.initKiosk();
                        }
                        if (this.defaultOptions.considerVisibilityParam) {
                            this.handlePoiVisibility();
                        }
                        if (this.defaultOptions.showLevelDirectionIcon) {
                            this.initDirectionIcon();
                        }
                        this.initPersonsMap();
                        this.onMapReadyListener.next(true);
                        _c.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Map.prototype.initKiosk = function () {
        if (this.map) {
            this.showStartPoint = false;
            if (this.defaultOptions.kioskSettings) {
                this.startPoint = turf.point(this.defaultOptions.kioskSettings.coordinates, {
                    level: this.defaultOptions.kioskSettings.level,
                });
                this.showStartPoint = true;
                this.state.style.addSource('my-location', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [this.startPoint],
                    },
                });
                this.state.style.addLayer({
                    id: 'my-location-layer',
                    type: 'symbol',
                    source: 'my-location',
                    layout: {
                        'icon-image': 'pulsing-dot',
                    },
                    filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
                });
                this.map.setStyle(this.state.style);
                this.centerOnPoi(this.startPoint);
            }
        }
    };
    Map.prototype.onSetKiosk = function (lat, lng, level) {
        if (this.map && this.defaultOptions.isKiosk) {
            this.defaultOptions.kioskSettings = {
                coordinates: [lng, lat],
                level: level,
            };
            this.startPoint = turf.point(this.defaultOptions.kioskSettings.coordinates, {
                level: this.defaultOptions.kioskSettings.level,
            });
            this.state.style.sources['my-location'].data = {
                type: 'FeatureCollection',
                features: [this.startPoint],
            };
            this.map.setFilter('my-location-layer', ['all', ['==', ['to-number', ['get', 'level']], level]]);
            this.map.setStyle(this.state.style);
            this.centerOnPoi(this.startPoint);
        }
    };
    Map.prototype.initDirectionIcon = function () {
        if (this.map) {
            this.state.style.addSource('direction-icon-source', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                },
            });
            this.state.style.addLayer({
                id: 'direction-icon-layer',
                type: 'symbol',
                source: 'direction-icon-source',
                minzoom: 17,
                maxzoom: 24,
                layout: {
                    'icon-image': '{icon}',
                    'icon-size': ['interpolate', ['exponential', 0.5], ['zoom'], 17, 0.1, 22, 0.3],
                    'icon-offset': {
                        'type': 'identity',
                        'property': 'iconOffset'
                    },
                    'symbol-placement': 'point',
                    'icon-allow-overlap': true,
                    'text-allow-overlap': false
                },
                filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]]
            });
            this.map.setStyle(this.state.style);
        }
    };
    Map.prototype.initPolygons = function () {
        var _this = this;
        if (this.map) {
            custom_layers_1.PolygonsLayer.setFilterLevel(this.state.floor.level);
            this.state.style.addLayer(custom_layers_1.PolygonsLayer.json);
            custom_layers_1.PolygonIconsLayer.setFilterLevel(this.state.floor.level);
            this.state.style.addLayer(custom_layers_1.PolygonIconsLayer.json);
            custom_layers_1.PolygonTitlesLayer.setFilterLevel(this.state.floor.level);
            this.state.style.addLayer(custom_layers_1.PolygonTitlesLayer.json);
            this.map.setStyle(this.state.style);
            this.map.on('click', 'shop-custom', function (e) {
                _this.onShopClick(e);
            });
            this.map.on('mouseenter', 'shop-custom', function () {
                _this.onShopMouseEnter();
            });
            this.map.on('mousemove', 'shop-custom', function (e) {
                _this.onShopMouseMove(e);
            });
            this.map.on('mouseleave', 'shop-custom', function (e) {
                _this.onShopMouseLeave(e);
            });
        }
    };
    Map.prototype.onShopClick = function (e) {
        if (e.features && e.features[0] && e.features[0].properties) {
            // @ts-ignore
            var poi = this.state.allFeatures.features.find(function (i) { return i.properties.id === e.features[0].properties.poi_id; });
            this.onPolygonClickListener.next(poi);
        }
    };
    Map.prototype.handlePolygonSelection = function (poi) {
        var connectedPolygonId = poi && poi.properties.metadata ? poi.properties.metadata.polygon_id : null;
        if (this.selectedPolygon) {
            this.map.setFeatureState({
                source: 'main',
                id: this.selectedPolygon.id,
            }, {
                selected: false,
            });
            if (this.selectedPolygon.properties.label_id) {
                this.map.setFeatureState({
                    source: 'main',
                    id: this.selectedPolygon.properties.label_id,
                }, {
                    selected: false,
                });
            }
        }
        if (connectedPolygonId) {
            this.selectedPolygon = this.state.allFeatures.features.find(function (i) { return i.properties.id === connectedPolygonId; });
            this.map.setFeatureState({
                source: 'main',
                id: this.selectedPolygon.id,
            }, {
                selected: true,
            });
            if (this.selectedPolygon.properties.label_id) {
                this.map.setFeatureState({
                    source: 'main',
                    id: this.selectedPolygon.properties.label_id,
                }, {
                    selected: true,
                });
            }
        }
    };
    Map.prototype.onShopMouseEnter = function () {
        this.map.getCanvas().style.cursor = 'pointer';
    };
    Map.prototype.onShopMouseMove = function (e) {
        if (e.features && e.features.length > 0) {
            if (this.hoveredPolygon) {
                this.map.setFeatureState({
                    source: 'main',
                    id: this.hoveredPolygon.id,
                }, {
                    hover: false,
                });
                if (this.hoveredPolygon.properties.label_id) {
                    this.map.setFeatureState({
                        source: 'main',
                        id: this.hoveredPolygon.properties.label_id,
                    }, {
                        hover: false,
                    });
                }
            }
            this.hoveredPolygon = e.features[0];
            this.map.setFeatureState({
                source: 'main',
                id: this.hoveredPolygon.id,
            }, {
                hover: true,
            });
            if (this.hoveredPolygon.properties.label_id) {
                this.map.setFeatureState({
                    source: 'main',
                    id: this.hoveredPolygon.properties.label_id,
                }, {
                    hover: true,
                });
            }
        }
    };
    Map.prototype.onShopMouseLeave = function (e) {
        this.map.getCanvas().style.cursor = '';
        if (this.hoveredPolygon) {
            this.map.setFeatureState({
                source: 'main',
                id: this.hoveredPolygon.id,
            }, {
                hover: false,
            });
            if (this.hoveredPolygon.properties.label_id) {
                this.map.setFeatureState({
                    source: 'main',
                    id: this.hoveredPolygon.properties.label_id,
                }, {
                    hover: false,
                });
            }
        }
        this.hoveredPolygon = null;
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
            closeLabel: 'Close',
            onClose: function () {
                modal.destroy();
            },
        });
        // set content
        modal.setContent(edit ? constants_1.EDIT_FEATURE_DIALOG(e, features[0]) : constants_1.NEW_FEATURE_DIALOG(e, (_a = this.state.floor) === null || _a === void 0 ? void 0 : _a.level));
        modal.addFooterBtn('Submit', 'tingle-btn tingle-btn--primary', function () { return __awaiter(_this, void 0, void 0, function () {
            var formData, data, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        formData = new FormData(document.querySelector('#modal-form'));
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
                                coordinates: [lng, lat],
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
                                floor_id: floorId,
                            },
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
                        feature.geometry.coordinates = [
                            lng ? lng : feature.geometry.coordinates[0],
                            lat ? lat : feature.geometry.coordinates[1],
                        ];
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
    Map.prototype.onSetAmenityFilter = function (amenityId, category) {
        if (category) {
            this.amenityCategories[category].active = true;
            this.amenityCategories[category].activeId = amenityId;
            var amenities_1 = [];
            var _loop_1 = function (key) {
                if (this_1.amenityCategories.hasOwnProperty(key)) {
                    var cat_1 = this_1.amenityCategories[key];
                    if (cat_1.active) {
                        amenities_1 = amenities_1.concat(cat_1.amenities.filter(function (i) { return i !== cat_1.activeId; }));
                    }
                }
            };
            var this_1 = this;
            for (var key in this.amenityCategories) {
                _loop_1(key);
            }
            this.amenityFilters = this.amenityIds.filter(function (el) { return !amenities_1.includes(el); });
        }
        else {
            if (this.amenityFilters.findIndex(function (i) { return i === amenityId; }) === -1) {
                this.amenityFilters.push(amenityId);
            }
        }
        this.filteredAmenities = this.amenityFilters;
        this.filterOutFeatures();
    };
    Map.prototype.onRemoveAmenityFilter = function (amenityId, category) {
        if (category &&
            this.amenityCategories[category].active &&
            this.amenityCategories[category].activeId === amenityId) {
            var amenities = this.amenityCategories[category].amenities.filter(function (i) { return i !== amenityId; });
            this.amenityFilters = this.amenityFilters.concat(amenities);
            this.amenityCategories[category].active = false;
        }
        else if (!category) {
            this.amenityFilters = this.amenityFilters.filter(function (i) { return i !== amenityId; });
        }
        this.filteredAmenities = this.amenityFilters.length > 0 ? this.amenityFilters : this.amenityIds;
        this.filterOutFeatures();
    };
    Map.prototype.onResetAmenityFilters = function () {
        this.amenityFilters = [];
        for (var key in this.amenityCategories) {
            if (this.amenityCategories.hasOwnProperty(key)) {
                this.amenityCategories[key].active = false;
            }
        }
        this.filteredAmenities = this.amenityIds;
        this.filterOutFeatures();
    };
    Map.prototype.filterOutFeatures = function () {
        var _this = this;
        // proximiio-pois-icons, proximiio-pois-labels, 'pois-icons', 'pois-labels'
        var layers = ['proximiio-pois-icons', 'proximiio-pois-labels', 'pois-icons', 'pois-labels'];
        if (this.defaultOptions.initPolygons) {
            layers.push('poi-custom-icons', 'shop-labels');
        }
        layers.forEach(function (layer) {
            if (_this.map.getLayer(layer)) {
                setTimeout(function () {
                    var l = _this.map.getLayer(layer);
                    var filters = __spreadArray([], l.filter);
                    var amenityFilter = filters.findIndex(function (f) { return f[1][1] === 'amenity'; });
                    if (amenityFilter !== -1) {
                        filters[amenityFilter] = [
                            'match',
                            ['get', 'amenity'],
                            _this.filteredAmenities ? _this.filteredAmenities : ['undefined'],
                            true,
                            false,
                        ];
                    }
                    else {
                        filters.push([
                            'match',
                            ['get', 'amenity'],
                            _this.filteredAmenities ? _this.filteredAmenities : ['undefined'],
                            true,
                            false,
                        ]);
                    }
                    _this.state.style.getLayer(layer).filter = filters;
                    _this.map.setFilter(layer, filters);
                });
            }
        });
        this.state.style.notify('filter-change');
    };
    Map.prototype.handlePoiVisibility = function () {
        var _this = this;
        // proximiio-pois-icons, proximiio-pois-labels, 'pois-icons', 'pois-labels'
        var layers = ['proximiio-pois-icons', 'proximiio-pois-labels', 'pois-icons', 'pois-labels'];
        if (this.defaultOptions.initPolygons) {
            layers.push('poi-custom-icons', 'shop-labels');
        }
        layers.forEach(function (layer) {
            if (_this.map.getLayer(layer)) {
                setTimeout(function () {
                    var l = _this.map.getLayer(layer);
                    var filters = __spreadArray([], l.filter);
                    var visibilityFilter = filters.findIndex(function (f) { return f[1][1] === 'visibility'; });
                    if (visibilityFilter !== -1) {
                        // toggle pois visibility based on visibility param
                        if (filters[visibilityFilter][0] === '!=') {
                            // show all pois, the visibility params is not considered
                            filters[visibilityFilter] = [
                                'match',
                                ['get', 'visibility'],
                                ['visible', 'hidden', 'undefined'],
                                true,
                                false,
                            ];
                        }
                        else {
                            // hide pois with hidden visibility
                            filters[visibilityFilter] = ['!=', ['get', 'visibility'], 'hidden'];
                        }
                    }
                    else {
                        // add visibility filter
                        filters.push(['!=', ['get', 'visibility'], 'hidden']);
                    }
                    _this.state.style.getLayer(layer).filter = filters;
                    _this.map.setFilter(layer, filters);
                });
            }
        });
        this.state.style.notify('filter-change');
    };
    Map.prototype.onToggleHiddenPois = function () {
        this.handlePoiVisibility();
    };
    Map.prototype.onSetPerson = function (lat, lng, level, id) {
        var person = new person_1.default({ lat: lat, lng: lng, level: level, id: id });
        this.state = __assign(__assign({}, this.state), { persons: [person] });
        this.initPersonsMap();
    };
    Map.prototype.onAddPerson = function (lat, lng, level, id) {
        var person = new person_1.default({ lat: lat, lng: lng, level: level, id: id });
        this.state.persons = __spreadArray(__spreadArray([], this.state.persons), [person]);
        this.initPersonsMap();
    };
    Map.prototype.onUpdatePerson = function (person, lat, lng, level) {
        person.updatePosition({ lat: lat, lng: lng, level: level });
        this.initPersonsMap();
    };
    Map.prototype.initPersonsMap = function () {
        var map = this.map;
        if (!map.getLayer('persons-layer')) {
            this.state.style.addLayer({
                id: 'persons-layer',
                type: 'symbol',
                source: 'persons-source',
                layout: {
                    'icon-image': 'person',
                    'icon-size': ['interpolate', ['exponential', 0.3], ['zoom'], 17, 0.1, 22, 0.3],
                },
                filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
            });
        }
        if (!map.getSource('persons-source')) {
            this.state.style.addSource('persons-source', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [],
                },
            });
        }
        var personsCollection = this.state.persons.map(function (person) {
            return turf.point([person.lng, person.lat], {
                level: person.level,
            });
        });
        this.state.style.sources['persons-source'].data = {
            type: 'FeatureCollection',
            features: personsCollection,
        };
        this.map.setStyle(this.state.style);
        this.onPersonUpdateListener.next(this.state.persons);
    };
    Map.prototype.prepareStyle = function (style) {
        style.setSource('main', this.geojsonSource);
        style.setSource('synthetic', this.syntheticSource);
        style.setSource('route', this.routingSource);
        style.setSource('clusters', this.clusterSource);
        style.setLevel(0);
    };
    Map.prototype.onRouteChange = function (event) {
        var _this = this;
        if (event === 'loading-start') {
            this.state = __assign(__assign({}, this.state), { loadingRoute: true });
            return;
        }
        if (event === 'loading-finished') {
            if (this.routingSource.route) {
                var routeStart = this.routingSource.lines.find(function (l) { var _a; return +l.properties.level === ((_a = _this.routingSource.start) === null || _a === void 0 ? void 0 : _a.properties.level); });
                var textNavigation = this.routeFactory.generateRoute(JSON.stringify(this.routingSource.points), JSON.stringify(this.endPoint));
                this.centerOnRoute(routeStart);
                if (this.defaultOptions.showLevelDirectionIcon) {
                    this.addDirectionFeatures();
                }
                this.state = __assign(__assign({}, this.state), { loadingRoute: false, textNavigation: textNavigation });
                this.onRouteFoundListener.next({
                    route: this.routingSource.route,
                    TBTNav: this.defaultOptions.enableTBTNavigation ? textNavigation : null,
                    start: this.startPoint,
                    end: this.endPoint,
                });
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
                    .map(function (f) { return f.json; }),
            };
            var source = map.getSource('clusters');
            if (source) {
                source.setData(data);
            }
        }
    };
    Map.prototype.onPlaceSelect = function (place, zoomIntoPlace, floorLevel) {
        return __awaiter(this, void 0, void 0, function () {
            var floors, state, defaultFloor, map;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.state = __assign(__assign({}, this.state), { place: place });
                        return [4 /*yield*/, floors_1.getPlaceFloors(place.id)];
                    case 1:
                        floors = _a.sent();
                        state = { floors: floors.sort(function (a, b) { return a.level - b.level; }) };
                        if (floors.length > 0) {
                            defaultFloor = floorLevel
                                ? floors.find(function (floor) { return floor.level === floorLevel; })
                                : floors.find(function (floor) { return floor.level === 0; });
                            if (defaultFloor) {
                                state.floor = defaultFloor;
                            }
                            else {
                                state.floor = floors[0];
                            }
                        }
                        this.state = __assign(__assign({}, this.state), state);
                        map = this.map;
                        if (map && zoomIntoPlace) {
                            map.flyTo({ center: [place.location.lng, place.location.lat] });
                        }
                        this.onPlaceSelectListener.next(place);
                        if (state.floor) {
                            this.onFloorSelect(state.floor);
                        }
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
                map.fitBounds(bbox, { padding: this.defaultOptions.fitBoundsPadding, bearing: this.map.getBearing(), pitch: this.map.getPitch() });
            }
            if (this.defaultOptions.isKiosk && map.getLayer('my-location-layer')) {
                var filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('my-location-layer', filter);
                this.state.style.getLayer('my-location-layer').filter = filter;
            }
            if (map.getLayer('persons-layer')) {
                var filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('persons-layer', filter);
                this.state.style.getLayer('persons-layer').filter = filter;
            }
            if (this.defaultOptions.showLevelDirectionIcon && map.getLayer('direction-icon-layer')) {
                var filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('direction-icon-layer', filter);
                this.state.style.getLayer('direction-icon-layer').filter = filter;
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
            if (finish && this.defaultOptions.initPolygons) {
                this.handlePolygonSelection(finish);
            }
            this.routingSource.update(start, finish);
        }
        catch (e) {
            console.log('catched', e);
        }
        this.state = __assign(__assign({}, this.state), { style: this.state.style });
    };
    Map.prototype.onRouteCancel = function () {
        this.state = __assign(__assign({}, this.state), { textNavigation: null });
        if (this.defaultOptions.initPolygons) {
            this.handlePolygonSelection();
        }
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
            if (this.state.floor.level !== +route.properties.level) {
                var floor = this.state.floors.find(function (f) { return f.level === +route.properties.level; });
                if (floor)
                    this.onFloorSelect(floor);
            }
            if (this.map) {
                var bbox = turf.bbox(route.geometry);
                // @ts-ignore
                this.map.fitBounds(bbox, { padding: this.defaultOptions.fitBoundsPadding, bearing: this.map.getBearing(), pitch: this.map.getPitch() });
            }
        }
    };
    Map.prototype.centerOnCoords = function (lat, lng, zoom) {
        if (this.map) {
            this.map.flyTo({ center: [lng, lat], zoom: zoom ? zoom : 18 });
        }
    };
    Map.prototype.updateImages = function () {
        var _this = this;
        this.state.amenities
            .filter(function (a) { return a.icon; })
            .forEach(function (amenity) {
            _this.amenityIds.push(amenity.id);
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
    Map.prototype.addDirectionFeatures = function () {
        var _this = this;
        var levelChangers = this.routingSource.points
            .filter(function (i) { return i.isLevelChanger; })
            .map(function (i) {
            return new feature_1.default({
                type: 'Feature',
                geometry: i.geometry,
                properties: {
                    usecase: 'floor-change-symbol',
                    icon: _this.routingSource.finish.properties.level > i.properties.level ? 'floorchange-up-image' : 'floorchange-down-image',
                    iconOffset: _this.routingSource.finish.properties.level > i.properties.level ? [4, -90] : [4, 90],
                    level: i.properties.level
                }
            });
        });
        this.state.style.sources['direction-icon-source'].data = {
            type: 'FeatureCollection',
            features: levelChangers,
        };
        this.map.setStyle(this.state.style);
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
     *  @param zoomIntoPlace {boolean} should zoom into active place, optional
     *  @param floorLevel {number} Level of the floor to be set as active on map, optional
     *  @returns active place
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setPlace(myPlaceId);
     *  });
     */
    Map.prototype.setPlace = function (placeId, zoomIntoPlace, floorLevel) {
        return __awaiter(this, void 0, void 0, function () {
            var place, shouldZoom;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, places_1.getPlaceById(placeId)];
                    case 1:
                        place = _a.sent();
                        shouldZoom = typeof zoomIntoPlace !== 'undefined' ? zoomIntoPlace : true;
                        return [4 /*yield*/, this.onPlaceSelect(place, shouldZoom, floorLevel)];
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
        var floor = this.state.floors.filter(function (f) { return f.id === floorId; })
            ? this.state.floors.filter(function (f) { return f.id === floorId; })[0]
            : this.state.floor;
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
        var floor = this.state.floors.filter(function (f) { return f.level === level; })
            ? this.state.floors.filter(function (f) { return f.level === level; })[0]
            : this.state.floor;
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
        floor = this.state.floors.filter(function (f) { return f.level === nextLevel; })
            ? this.state.floors.filter(function (f) { return f.level === nextLevel; })[0]
            : this.state.floor;
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
     *  @param idTo {string} finish feature id
     *  @param idFrom {string} start feature id, optional for kiosk
     *  @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByIds('finishId, 'startId');
     *  });
     */
    Map.prototype.findRouteByIds = function (idTo, idFrom, accessibleRoute) {
        var fromFeature = this.defaultOptions.isKiosk
            ? this.startPoint
            : this.state.allFeatures.features.find(function (f) { return f.id === idFrom || f.properties.id === idFrom; });
        var toFeature = this.state.allFeatures.features.find(function (f) { return f.id === idTo || f.properties.id === idTo; });
        this.routingSource.toggleAccessible(accessibleRoute);
        this.onRouteUpdate(fromFeature, toFeature);
    };
    /**
     * This method will generate route based on selected features by their titles
     *  @memberof Map
     *  @name findRouteByTitle
     *  @param titleTo {string} finish feature title
     *  @param titleFrom {string} start feature title, optional for kiosk
     *  @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByTitle('myFeatureTitle', 'anotherFeatureTitle');
     *  });
     */
    Map.prototype.findRouteByTitle = function (titleTo, titleFrom, accessibleRoute) {
        var fromFeature = this.defaultOptions.isKiosk
            ? this.startPoint
            : this.state.allFeatures.features.find(function (f) { return f.properties.title === titleFrom; });
        var toFeature = this.state.allFeatures.features.find(function (f) { return f.properties.title === titleTo; });
        this.routingSource.toggleAccessible(accessibleRoute);
        this.onRouteUpdate(this.defaultOptions.isKiosk ? this.startPoint : fromFeature, toFeature);
    };
    /**
     * This method will generate route based on selected features by their titles
     *  @memberof Map
     *  @name findRouteByCoords
     *  @param latTo {number} finish latitude coordinate
     *  @param lngTo {number} finish longitude coordinate
     *  @param levelTo {number} finish level
     *  @param latFrom {number} start latitude coordinate, optional for kiosk
     *  @param lngFrom {number} start longitude coordinate, optional for kiosk
     *  @param levelFrom {number} start level, optional for kiosk
     *  @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByCoords(48.606703739771774, 17.833092384506614, 0, 48.60684545080579, 17.833450676669543, 0);
     *  });
     */
    Map.prototype.findRouteByCoords = function (latTo, lngTo, levelTo, latFrom, lngFrom, levelFrom, accessibleRoute) {
        var fromFeature = this.defaultOptions.isKiosk
            ? this.startPoint
            : turf.feature({ type: 'Point', coordinates: [lngFrom, latFrom] }, { level: levelFrom });
        var toFeature = turf.feature({ type: 'Point', coordinates: [lngTo, latTo] }, { level: levelTo });
        this.routingSource.toggleAccessible(accessibleRoute);
        this.onRouteUpdate(this.defaultOptions.isKiosk ? this.startPoint : fromFeature, toFeature);
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
        if (this.routingSource &&
            this.routingSource.route &&
            this.routingSource.route[(_a = this.routingSource.start) === null || _a === void 0 ? void 0 : _a.properties.level]) {
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
     *  @return error {string} in case there is no feature or {Feature} otherwise
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
     * This method will center the map to provided coordinates.
     *  @memberof Map
     *  @name centerToCoordinates
     *  @param lat {number} latitude coordinate, required
     *  @param lng {number} longitude coordinate, required
     *  @param zoom {number} zoom level, optional, 18 as default
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.centerToCoordinates(48.60678469647394, 17.833135351538658, 20);
     *  });
     */
    Map.prototype.centerToCoordinates = function (lat, lng, zoom) {
        this.centerOnCoords(lat, lng, zoom);
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
    /**
     * This method will set new kiosk settings.
     *  @memberof Map
     *  @name setKiosk
     *  @param lat {number} latitude coordinate for kiosk position
     *  @param lng {number} longitude coordinate for kiosk position
     *  @param level {number} floor level for kiosk position
     *  @example
     *  const map = new Proximiio.Map({
     *    isKiosk: true,
     *    kioskSettings: {
     *       coordinates: [17.833135351538658, 48.60678469647394],
     *       level: 0
     *     }
     *  });
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setKiosk(48.606703739771774, 17.833092384506614, 0);
     *  });
     */
    Map.prototype.setKiosk = function (lat, lng, level) {
        if (this.defaultOptions.isKiosk) {
            this.onSetKiosk(lat, lng, level);
        }
        else {
            throw new Error("Map is not initiated as kiosk");
        }
    };
    /**
     * You'll be able to show features only for defined amenity id on map with this method, also with defining the category (NOTE: you have to create them before with setAmenitiesCategory() method), filtering will be set only for defined array of amenities in the category. With category set, only one amenity filter can be active at the time, while without the category they stack so multiple amenities can be active.
     *  @memberof Map
     *  @name setAmenityFilter
     *  @param amenityId {string} only features of defined amenityId will be visible
     *  @param category {string} id of the amenities category added via setAmenitiesCategory, optional, if defined filtering will be set only for defined array of amenities in same method
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setAmenityFilter('myamenity');
     *  });
     */
    Map.prototype.setAmenityFilter = function (amenityId, category) {
        if (!category || (category && this.amenityCategories[category])) {
            this.onSetAmenityFilter(amenityId, category);
        }
        else {
            throw new Error("It seems there is no '" + category + "' amenities category created, please set category with 'setAmenitiesCategory()' method");
        }
    };
    /**
     * Method for removing previously created amenity filters. In case amenity filter has been set with the category parameter, you have to use same param for removing the filter.
     *  @memberof Map
     *  @name removeAmenityFilter
     *  @param amenityId {string} remove the filter for a defined amenityId
     *  @param category {string} id of the amenities category added via setAmenitiesCategory, optional, if defined filtering will be removed only for defined array of amenities in same method
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.removeAmenityFilter('myamenity');
     *  });
     */
    Map.prototype.removeAmenityFilter = function (amenityId, category) {
        if (!category || (category && this.amenityCategories[category])) {
            this.onRemoveAmenityFilter(amenityId, category);
        }
        else {
            throw new Error("It seems there is no '" + category + "' amenities category created, please set category with 'setAmenitiesCategory()' method");
        }
    };
    /**
     * Method for removing all active filters.
     *  @memberof Map
     *  @name resetAmenityFilters
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.resetAmenityFilters();
     *  });
     */
    Map.prototype.resetAmenityFilters = function () {
        this.onResetAmenityFilters();
    };
    /**
     * You can define your own categories of amenities, which you can then use for advanced filtering.
     *  @memberof Map
     *  @name setAmenitiesCategory
     *  @param id {string} category id, have to be used when calling setAmenityFilter() method as second param.
     *  @param amenities {Array of strings} list of the amenities id
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setAmenitiesCategory('shops', ['id1', 'id2']);
     *  });
     */
    Map.prototype.setAmenitiesCategory = function (id, amenities) {
        this.amenityCategories[id] = {
            amenities: amenities,
        };
    };
    /**
     * Method for removing previously created categories.
     *  @memberof Map
     *  @name removeAmenitiesCategory
     *  @param id {string} category id.
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.removeAmenitiesCategory('shops');
     *  });
     */
    Map.prototype.removeAmenitiesCategory = function (id) {
        if (this.amenityCategories[id]) {
            delete this.amenityCategories[id];
        }
        else {
            throw new Error("It seems there is no '" + id + "' amenities category created, please set category with 'setAmenitiesCategory()' method");
        }
    };
    /**
     * Method for removing all active amenity categories.
     *  @memberof Map
     *  @name resetAmenitiesCategory
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.resetAmenitiesCategory();
     *  });
     */
    Map.prototype.resetAmenitiesCategory = function () {
        this.amenityCategories = {};
    };
    /**
     *  @memberof Map
     *  @name getPolygonClickListener
     *  @returns returns polygon click listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getPolygonClickListener().subscribe((poi) => {
     *    console.log('polygon clicked', poi);
     *  });
     */
    Map.prototype.getPolygonClickListener = function () {
        return this.onPolygonClickListener.asObservable();
    };
    /**
     * Method for setting a person icon on a Map, this method is resetting the previous state of all persons added before
     *  @memberof Map
     *  @name setPerson
     *  @param lat {number} latitude coordinate of person.
     *  @param lng {number} longitude coordinate of person.
     *  @param level {number} floor level of person.
     *  @param id {string | number} id of person, optional.
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setPerson(48.606703739771774, 17.833092384506614, 0);
     *  });
     */
    Map.prototype.setPerson = function (lat, lng, level, id) {
        this.onSetPerson(lat, lng, level, id);
    };
    /**
     * Method for add/update person icon on a Map
     *  @memberof Map
     *  @name upsertPerson
     *  @param lat {number} latitude coordinate of person.
     *  @param lng {number} longitude coordinate of person.
     *  @param level {number} floor level of person.
     *  @param id {string | number} id of person, optional.
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.upsertPerson(48.606703739771774, 17.833092384506614, 0, 'person-1');
     *  });
     */
    Map.prototype.upsertPerson = function (lat, lng, level, id) {
        var person = id ? this.state.persons.find(function (p) { return p.id === id; }) : null;
        if (person) {
            this.onUpdatePerson(person, lat, lng, level);
        }
        else {
            this.onAddPerson(lat, lng, level, id);
        }
    };
    /**
     *  @memberof Map
     *  @name getPersonUpdateListener
     *  @returns returns person update listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getPersonUpdateListener().subscribe((personsList) => {
     *    console.log('current persons', personsList);
     *  });
     */
    Map.prototype.getPersonUpdateListener = function () {
        return this.onPersonUpdateListener.asObservable();
    };
    /**
     * Method for toggling hidden pois visibility
     *  @memberof Map
     *  @name toggleHiddenPois
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.toggleHiddenPois();
     *  });
     */
    Map.prototype.toggleHiddenPois = function () {
        this.onToggleHiddenPois();
    };
    return Map;
}());
exports.Map = Map;
/* TODO
 * - check clusters
 * */
