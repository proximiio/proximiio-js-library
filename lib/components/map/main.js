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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Map = exports.globalState = void 0;
var maplibregl = require("maplibre-gl");
var repository_1 = require("../../controllers/repository");
var auth_1 = require("../../controllers/auth");
var geo_1 = require("../../controllers/geo");
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
var constants_1 = require("./constants");
var custom_layers_1 = require("./custom-layers");
var person_1 = require("../../models/person");
var helpers_1 = require("@turf/helpers");
var wayfinding_1 = require("../logger/wayfinding");
var i18n_1 = require("./i18n");
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
    user: null,
};
var Map = /** @class */ (function () {
    function Map(options) {
        var _this = this;
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
        this.onPoiClickListener = new rxjs_1.Subject();
        this.onPersonUpdateListener = new rxjs_1.Subject();
        this.onStepSetListener = new rxjs_1.Subject();
        this.defaultOptions = {
            selector: 'proximiioMap',
            allowNewFeatureModal: false,
            newFeatureModalEvent: 'click',
            enableTBTNavigation: true,
            zoomIntoPlace: true,
            isKiosk: false,
            initPolygons: false,
            polygonsOptions: {
                defaultPolygonColor: '#dbd7e8',
                hoverPolygonColor: '#a58dfa',
                selectedPolygonColor: '#6945ed',
                defaultLabelColor: '#6945ed',
                hoverLabelColor: '#fff',
                selectedLabelColor: '#fff',
                defaultPolygonHeight: 3,
                hoverPolygonHeight: 3,
                selectedPolygonHeight: 3,
                base: 0,
                opacity: 1,
                removeOriginalPolygonsLayer: true,
                minZoom: 17,
                maxZoom: 24,
                labelFontSize: [
                    'interpolate',
                    ['exponential', 1.75],
                    ['zoom'],
                    18,
                    [
                        'interpolate',
                        ['linear'],
                        ['/', ['get', 'length', ['get', '_dynamic']], ['length', ['get', 'title']]],
                        1,
                        5,
                        5,
                        10,
                        10,
                        20,
                        15,
                        30, // Larger polygon size -> larger text size
                        // Add more stops as needed based on your data range
                    ],
                    22,
                    [
                        'interpolate',
                        ['linear'],
                        ['/', ['get', 'length', ['get', '_dynamic']], ['length', ['get', 'title']]],
                        1,
                        30,
                        5,
                        50,
                        10,
                        60,
                        15,
                        70, // Larger polygon size -> larger text size at higher zoom
                        // Add more stops as needed based on your data range
                    ],
                ],
                symbolPlacement: 'line-center',
                autoLabelLines: true,
            },
            considerVisibilityParam: true,
            fitBoundsPadding: 250,
            minFitBoundsDistance: 15,
            showLevelDirectionIcon: false,
            showRasterFloorplans: false,
            animatedRoute: false,
            animationLooping: true,
            routeAnimation: {
                enabled: false,
                type: 'dash',
                looping: true,
                followRoute: true,
                durationMultiplier: 30,
                fps: 120,
                pointColor: '#1d8a9f',
                pointRadius: 8,
                lineColor: '#6945ed',
                lineWidth: 5,
                lineOpacity: 0.6,
            },
            useRasterTiles: false,
            handleUrlParams: false,
            urlParams: {
                startFeauture: 'startFeature',
                destinationFeature: 'destinationFeature',
                defaultPlace: 'defaultPlace',
            },
            useGpsLocation: false,
            geolocationControlOptions: {
                autoTrigger: true,
                autoLocate: true,
                position: 'top-right',
            },
            language: 'en',
            routeWithDetails: true,
            blockFeatureClickWhileRouting: false,
            useTimerangeData: false,
            sendAnalytics: true,
        };
        this.showStartPoint = false;
        this.amenityIds = [];
        this.filteredFeatures = [];
        this.hiddenFeatures = [];
        this.filteredAmenities = [];
        this.amenityFilters = [];
        this.hiddenAmenities = [];
        this.amenityCategories = {};
        this.currentStep = 0;
        this.step = 0;
        this.animateRoute = function () {
            var _a;
            if (_this.routingSource && _this.routingSource.route && _this.routingSource.route["path-part-".concat(_this.currentStep)]) {
                var route_1 = _this.routingSource.route["path-part-".concat(_this.currentStep)] &&
                    ((_a = _this.routingSource.route["path-part-".concat(_this.currentStep)].properties) === null || _a === void 0 ? void 0 : _a.level) === _this.state.floor.level
                    ? _this.routingSource.route["path-part-".concat(_this.currentStep)]
                    : (0, helpers_1.lineString)(_this.routingSource.levelPoints[_this.state.floor.level].map(function (i) { return i.geometry.coordinates; }));
                if (_this.defaultOptions.routeAnimation.type === 'point') {
                    clearInterval(_this.animationInterval);
                    clearTimeout(_this.animationTimeout);
                    var lineDistance = turf.length(route_1) * 1000;
                    var walkingSpeed = 1.4;
                    var walkingDuration = lineDistance / walkingSpeed;
                    var multiplier = _this.defaultOptions.routeAnimation.durationMultiplier;
                    var vizDuration = _this.defaultOptions.routeAnimation.duration
                        ? _this.defaultOptions.routeAnimation.duration
                        : walkingDuration * (1 / multiplier);
                    var fps = _this.defaultOptions.routeAnimation.fps;
                    var frames_1 = Math.round(fps * vizDuration);
                    // console.log(`Route Duration is ${walkingDuration} seconds`);
                    // console.log(`Vizualization Duration is ${vizDuration} seconds`);
                    // console.log(`Total Frames at ${fps}fps is ${frames}`);
                    // divide length and duration by number of frames
                    var routeLength = turf.length(route_1);
                    var incrementLength_1 = routeLength / frames_1;
                    var interval = (vizDuration / frames_1) * 1000;
                    // updateData at the calculated interval
                    var counter_1 = 0;
                    // let start;
                    /*const animate = (timestamp) => {
                    if (!start) start = timestamp;
                    const progress = timestamp - start;
            
                    if (progress <= vizDuration * 1000) {
                      const frameProgress = progress / (vizDuration * 1000);
                      counter = Math.round(frameProgress * frames);
            
                      this.updateData(route, incrementLength, counter, frames);
            
                      requestAnimationFrame(animate);
                    } else {
                      // Animation completed
                      // Additional logic can be added here if needed
                    }
                  };*/
                    // requestAnimationFrame(animate);
                    _this.animationInterval = setInterval(function () {
                        _this.updateData(route_1, incrementLength_1, counter_1, frames_1);
                        if (counter_1 === frames_1 + 1) {
                            clearInterval(_this.animationInterval);
                        }
                        else {
                            counter_1 += 1;
                        }
                    }, interval);
                }
                if (_this.defaultOptions.routeAnimation.type === 'dash') {
                    var dashArraySequence_1 = [
                        [0, 4, 3],
                        [0.5, 4, 2.5],
                        [1, 4, 2],
                        [1.5, 4, 1.5],
                        [2, 4, 1],
                        [2.5, 4, 0.5],
                        [3, 4, 0],
                        [0, 0.5, 3, 3.5],
                        [0, 1, 3, 3],
                        [0, 1.5, 3, 2.5],
                        [0, 2, 3, 2],
                        [0, 2.5, 3, 1.5],
                        [0, 3, 3, 1],
                        [0, 3.5, 3, 0.5],
                    ];
                    // @ts-ignore
                    _this.map.getSource('lineAlong').setData(route_1);
                    var animateDashArray_1 = function (timestamp) {
                        // Update line-dasharray using the next value in dashArraySequence. The
                        // divisor in the expression `timestamp / 50` controls the animation speed.
                        var newStep = Math.floor((timestamp / 50) % dashArraySequence_1.length);
                        if (newStep !== _this.step) {
                            _this.map.setPaintProperty('line-dashed', 'line-dasharray', dashArraySequence_1[_this.step]);
                            _this.step = newStep;
                        }
                        // Request the next frame of the animation.
                        requestAnimationFrame(animateDashArray_1);
                    };
                    requestAnimationFrame(animateDashArray_1);
                }
            }
        };
        // Cache the initial and final points along the route
        this.updateData = function (route, incrementLength, counter, frames) {
            var animationInProgress = false;
            // console.log(counter, frames);
            // length to visualize for this frame
            var frameLength = incrementLength * counter;
            var previousFrameLength = incrementLength * (counter - 1);
            // calculate where to place the marker
            var pointAlong = turf.along(route, frameLength);
            // cut the line at the point
            var lineAlong = turf.lineSplit(route, pointAlong).features[0];
            /*this.state.style.sources['lineAlong'].data = lineAlong;
            this.state.style.sources['pointAlong'].data = pointAlong;
            this.map.setStyle(this.state.style);*/
            // @ts-ignore
            _this.map.getSource('pointAlong').setData(pointAlong);
            // @ts-ignore
            _this.map.getSource('lineAlong').setData(lineAlong);
            if (_this.defaultOptions.routeAnimation.followRoute && !animationInProgress) {
                animationInProgress = true;
                /*const prevPoint = counter === 0 ? turf.along(route, 0) : turf.along(route, previousFrameLength);
                const currentPoint = turf.along(route, frameLength);
          
                const currentBearing = this.map.getBearing();
                const bearing = prevPoint && currentPoint ? turf.bearing(prevPoint, currentPoint) : currentBearing;
                let newBearing = currentBearing;
          
                if (Math.abs(currentBearing - bearing) >= 6) {
                  newBearing = bearing;
                }*/
                setTimeout(function () {
                    _this.map.jumpTo({
                        center: pointAlong.geometry.coordinates,
                        // bearing: newBearing,
                        // duration: 100,
                        // essential: true,
                    });
                    animationInProgress = false;
                }, 100); // Adjust this timeout for throttling
            }
            // if (counter === 0) map.getSource('startPoint').setData(pointAlong);
            if (counter === frames) {
                // map.getSource('endPoint').setData(pointAlong);
                // @ts-ignore
                /*this.map.getSource('pointAlong').setData({
                  type: 'FeatureCollection',
                  features: [],
                });*/
                if (_this.defaultOptions.routeAnimation.looping) {
                    _this.animationTimeout = setTimeout(function () {
                        _this.animateRoute();
                    }, 2000);
                }
            }
        };
        // fix centering in case of kiosk with defined pitch/bearing/etc. in mapbox options
        if (options.isKiosk && options.mapboxOptions && options.kioskSettings && !options.mapboxOptions.center) {
            options.mapboxOptions.center = options.kioskSettings.coordinates;
        }
        var urlParams = __assign(__assign({}, this.defaultOptions.urlParams), options.urlParams);
        var polygonsOptions = __assign(__assign({}, this.defaultOptions.polygonsOptions), options.polygonsOptions);
        var routeAnimation = __assign(__assign({}, this.defaultOptions.routeAnimation), options.routeAnimation);
        this.defaultOptions = __assign(__assign({}, this.defaultOptions), options);
        this.defaultOptions.urlParams = urlParams;
        this.defaultOptions.polygonsOptions = polygonsOptions;
        this.defaultOptions.routeAnimation = routeAnimation;
        this.state = exports.globalState;
        if (this.defaultOptions.isKiosk && this.defaultOptions.useGpsLocation) {
            throw new Error("It's not possible to use both isKiosk and useGpsLocation options as enabled!");
        }
        // @ts-ignore
        maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js', null, true);
        this.map = new maplibregl.Map(__assign(__assign({}, this.defaultOptions.mapboxOptions), { container: this.defaultOptions.selector ? this.defaultOptions.selector : 'map' }));
        this.map.on('load', function (e) {
            _this.onMapReady(e);
        });
        this.onSourceChange = this.onSourceChange.bind(this);
        this.onSyntheticChange = this.onSyntheticChange.bind(this);
        this.onStyleChange = this.onStyleChange.bind(this);
        this.onStyleSelect = this.onStyleSelect.bind(this);
        this.onRouteUpdate = this.onRouteUpdate.bind(this);
        this.onRouteChange = this.onRouteChange.bind(this);
        this.onRouteCancel = this.onRouteCancel.bind(this);
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
            var placeParam, urlParams, _d, places, style, styles, features, amenities, levelChangers, user, defaultPlace, place, center, routeLayer;
            var _this = this;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        placeParam = null;
                        if (this.defaultOptions.handleUrlParams) {
                            urlParams = new URLSearchParams(window.location.search);
                            placeParam = urlParams.get(this.defaultOptions.urlParams.defaultPlace);
                        }
                        return [4 /*yield*/, repository_1.default.getPackage({
                                initPolygons: this.defaultOptions.initPolygons,
                                autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
                                amenityIdProperty: this.defaultOptions.amenityIdProperty,
                                hiddenAmenities: this.defaultOptions.hiddenAmenities,
                                useTimerangeData: this.defaultOptions.useTimerangeData,
                                filter: this.defaultOptions.defaultFilter,
                                featuresMaxBounds: this.defaultOptions.featuresMaxBounds,
                            })];
                    case 1:
                        _d = _e.sent(), places = _d.places, style = _d.style, styles = _d.styles, features = _d.features, amenities = _d.amenities;
                        levelChangers = features.features.filter(function (f) { return f.properties.type === 'elevator' || f.properties.type === 'escalator' || f.properties.type === 'staircase'; });
                        return [4 /*yield*/, auth_1.default.getCurrentUser()];
                    case 2:
                        user = _e.sent();
                        defaultPlace = placeParam
                            ? places.find(function (p) { return p.id === placeParam || p.name === placeParam; })
                            : places.find(function (p) { return p.id === _this.defaultOptions.defaultPlaceId; });
                        place = places.length > 0 ? (defaultPlace ? defaultPlace : places[0]) : new place_1.PlaceModel({});
                        center = [place.location.lng, place.location.lat];
                        if ((_a = this.defaultOptions.mapboxOptions) === null || _a === void 0 ? void 0 : _a.center) {
                            center = this.defaultOptions.mapboxOptions.center;
                        }
                        if (this.defaultOptions.isKiosk) {
                            center = (_b = this.defaultOptions.kioskSettings) === null || _b === void 0 ? void 0 : _b.coordinates;
                        }
                        if (placeParam) {
                            center = [place.location.lng, place.location.lat];
                        }
                        style.center = center;
                        if (this.defaultOptions.mapboxOptions) {
                            this.defaultOptions.mapboxOptions.center = style.center;
                        }
                        if (this.defaultOptions.zoomLevel) {
                            style.zoom = this.defaultOptions.zoomLevel;
                        }
                        if (this.defaultOptions.language) {
                            this.geojsonSource.language = this.defaultOptions.language;
                        }
                        if (this.defaultOptions.routeColor) {
                            routeLayer = style.layers.find(function (l) { return l.id === 'proximiio-routing-line-remaining'; });
                            if (routeLayer) {
                                routeLayer.paint['line-color'] = this.defaultOptions.routeColor;
                            }
                        }
                        if (this.defaultOptions.forceFloorLevel !== null && this.defaultOptions.forceFloorLevel !== undefined) {
                            this.routingSource.routing.forceFloorLevel = this.defaultOptions.forceFloorLevel;
                        }
                        if (this.defaultOptions.routeWithDetails !== null && this.defaultOptions.routeWithDetails !== undefined) {
                            this.routingSource.routing.routeWithDetails = this.defaultOptions.routeWithDetails;
                        }
                        this.geojsonSource.fetch(features);
                        this.routingSource.routing.setData(new feature_1.FeatureCollection(features));
                        this.prepareStyle(style);
                        this.imageSourceManager.enabled = this.defaultOptions.showRasterFloorplans;
                        this.imageSourceManager.belowLayer = style.usesPrefixes() ? 'proximiio-floors' : 'floors';
                        this.imageSourceManager.initialize();
                        this.state = __assign(__assign({}, this.state), { initializing: false, place: place, places: places, style: style, styles: styles, amenities: amenities, features: features, allFeatures: new feature_1.FeatureCollection(features), levelChangers: new feature_1.FeatureCollection({ features: levelChangers }), latitude: center[1], longitude: center[0], zoom: this.defaultOptions.zoomLevel ? this.defaultOptions.zoomLevel : (_c = this.defaultOptions.mapboxOptions) === null || _c === void 0 ? void 0 : _c.zoom, noPlaces: places.length === 0, user: user });
                        style.on(this.onStyleChange);
                        this.map.setStyle(this.state.style);
                        this.map.setCenter(center);
                        if (this.defaultOptions.allowNewFeatureModal) {
                            this.map.on(this.defaultOptions.newFeatureModalEvent ? this.defaultOptions.newFeatureModalEvent : 'dblclick', function (e) {
                                _this.featureDialog(e);
                            });
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Map.prototype.onMapReady = function (e) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var map, routingLayer, usePrefixed, shopsLayer, routingSymbolsLayer, decodedChevron, decodedPersonIcon, decodedFloorchangeUpImage, decodedFloorchangeDownImage, decodedPopupImage, layers;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        map = e.target;
                        if (!map) return [3 /*break*/, 7];
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
                            routingSymbolsLayer.filter.push(['match', ['get', 'type'], ['poi', 'poi-custom'], false, true]);
                            this.state.style.getLayer('proximiio-routing-symbols').filter = routingSymbolsLayer.filter;
                            map.setFilter('proximiio-routing-symbols', routingSymbolsLayer.filter);
                        }
                        map.setMaxZoom(30);
                        return [4 /*yield*/, (0, common_1.getImageFromBase64)(icons_1.chevron)];
                    case 1:
                        decodedChevron = _c.sent();
                        return [4 /*yield*/, (0, common_1.getImageFromBase64)(icons_1.person)];
                    case 2:
                        decodedPersonIcon = _c.sent();
                        return [4 /*yield*/, (0, common_1.getImageFromBase64)(icons_1.floorchangeUpImage)];
                    case 3:
                        decodedFloorchangeUpImage = _c.sent();
                        return [4 /*yield*/, (0, common_1.getImageFromBase64)(icons_1.floorchangeDownImage)];
                    case 4:
                        decodedFloorchangeDownImage = _c.sent();
                        return [4 /*yield*/, (0, common_1.getImageFromBase64)(icons_1.popupImage)];
                    case 5:
                        decodedPopupImage = _c.sent();
                        map.addImage('chevron_right', decodedChevron);
                        map.addImage('pulsing-dot', icons_1.pulsingDot, { pixelRatio: 2 });
                        map.addImage('person', decodedPersonIcon);
                        map.addImage('floorchange-up-image', decodedFloorchangeUpImage);
                        map.addImage('floorchange-down-image', decodedFloorchangeDownImage);
                        map.addImage('popup', decodedPopupImage, {
                            // @ts-ignore
                            stretchX: [
                                [25, 55],
                                [85, 115],
                            ],
                            stretchY: [[25, 100]],
                            content: [25, 25, 115, 100],
                            pixelRatio: 2,
                        });
                        this.onSourceChange();
                        this.updateMapSource(this.geojsonSource);
                        this.updateMapSource(this.routingSource);
                        this.updateCluster();
                        this.updateImages();
                        this.filteredAmenities = this.amenityIds;
                        this.imageSourceManager.setLevel(map, (_b = this.state.floor) === null || _b === void 0 ? void 0 : _b.level, this.state);
                        return [4 /*yield*/, this.onPlaceSelect(this.state.place, this.defaultOptions.zoomIntoPlace)];
                    case 6:
                        _c.sent();
                        if (this.defaultOptions.useRasterTiles) {
                            this.initRasterTiles();
                        }
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
                        if (this.defaultOptions.animatedRoute || this.defaultOptions.routeAnimation.enabled) {
                            if (this.defaultOptions.animatedRoute) {
                                console.log("animatedRoute property is deprecated, please use routeAnimation.enabled instead!");
                            }
                            this.initAnimatedRoute();
                        }
                        if (this.defaultOptions.hiddenAmenities) {
                            layers = [
                                'proximiio-pois-icons',
                                'proximiio-pois-labels',
                                'pois-icons',
                                'pois-labels',
                                'poi-custom-icons',
                            ];
                            layers.forEach(function (layer) {
                                var l = _this.map.getLayer(layer);
                                if (l) {
                                    var filters = __spreadArray([], l.filter, true);
                                    filters.push(['!=', ['get', 'hideIcon'], 'hide']);
                                    _this.state.style.getLayer(layer).filter = filters;
                                    _this.map.setFilter(layer, filters);
                                }
                            });
                        }
                        this.initPersonsMap();
                        if (!this.defaultOptions.initPolygons) {
                            this.map.on('click', 'proximiio-pois-icons', function (ev) {
                                _this.onShopClick(ev);
                            });
                            this.map.on('click', 'proximiio-pois-labels', function (ev) {
                                _this.onShopClick(ev);
                            });
                            this.map.on('click', 'pois-icons', function (ev) {
                                _this.onShopClick(ev);
                            });
                        }
                        this.onMapReadyListener.next(true);
                        if (this.defaultOptions.useGpsLocation) {
                            this.initGeoLocation();
                        }
                        if (this.defaultOptions.handleUrlParams) {
                            this.initUrlParams();
                        }
                        this.map.setStyle(this.state.style);
                        _c.label = 7;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    Map.prototype.onRefetch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var features, levelChangers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.map) return [3 /*break*/, 2];
                        console.log('data should be refetched');
                        return [4 /*yield*/, repository_1.default.getPackage({
                                initPolygons: this.defaultOptions.initPolygons,
                                autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
                                amenityIdProperty: this.defaultOptions.amenityIdProperty,
                                hiddenAmenities: this.defaultOptions.hiddenAmenities,
                                useTimerangeData: this.defaultOptions.useTimerangeData,
                                filter: this.defaultOptions.defaultFilter,
                                featuresMaxBounds: this.defaultOptions.featuresMaxBounds,
                            })];
                    case 1:
                        features = (_a.sent()).features;
                        levelChangers = features.features.filter(function (f) {
                            return f.properties.type === 'elevator' || f.properties.type === 'escalator' || f.properties.type === 'staircase';
                        });
                        this.state = __assign(__assign({}, this.state), { features: features, allFeatures: new feature_1.FeatureCollection(features), levelChangers: new feature_1.FeatureCollection({ features: levelChangers }) });
                        this.geojsonSource.fetch(this.state.features);
                        this.onFeaturesChange();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
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
    Map.prototype.initGeoLocation = function () {
        var _this = this;
        if (this.map && this.defaultOptions.useGpsLocation) {
            var geolocate_1 = new maplibregl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true,
                },
                showAccuracyCircle: false,
                trackUserLocation: true,
            });
            this.map.addControl(geolocate_1, this.defaultOptions.geolocationControlOptions.position);
            if (this.defaultOptions.geolocationControlOptions.autoTrigger) {
                setTimeout(function () {
                    geolocate_1.trigger();
                }, 300);
            }
            if (this.defaultOptions.geolocationControlOptions.autoLocate === false) {
                setTimeout(function () {
                    // @ts-ignore
                    geolocate_1._watchState = 'BACKGROUND';
                    // @ts-ignore
                    if (geolocate_1._geolocateButton) {
                        // @ts-ignore
                        geolocate_1._geolocateButton.classList.add('maplibregl-ctrl-geolocate-background');
                        // @ts-ignore
                        geolocate_1._geolocateButton.classList.remove('maplibregl-ctrl-geolocate-active');
                    }
                    // @ts-ignore
                    geolocate_1.fire(new Event('trackuserlocationend'));
                });
            }
            geolocate_1.on('geolocate', function (data) {
                _this.startPoint = turf.point([data.coords.longitude, data.coords.latitude], {
                    level: _this.state.floor.level,
                });
            });
        }
    };
    Map.prototype.initDirectionIcon = function () {
        var _this = this;
        if (this.map) {
            var levelChangersLayer = this.map.getLayer('proximiio-levelchangers');
            var levelChangersLayerImageSize = this.map.getLayoutProperty('proximiio-levelchangers', 'icon-size');
            var radius = 50;
            this.state.style.addSource('direction-icon-source', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [],
                },
            });
            this.state.style.addLayer({
                id: 'direction-halo-layer',
                type: 'circle',
                source: 'direction-icon-source',
                minzoom: levelChangersLayer.minzoom,
                maxzoom: levelChangersLayer.maxzoom,
                paint: {
                    'circle-radius': levelChangersLayerImageSize[0] === 'interpolate'
                        ? [
                            levelChangersLayerImageSize[0],
                            levelChangersLayerImageSize[1],
                            levelChangersLayerImageSize[2],
                            levelChangersLayerImageSize[3],
                            levelChangersLayerImageSize[4] * (radius ? radius : 50),
                            levelChangersLayerImageSize[5],
                            levelChangersLayerImageSize[6] * (radius ? radius : 50),
                        ]
                        : radius,
                    'circle-color': '#000',
                },
                filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
            }, 'proximiio-paths-names');
            this.state.style.addLayer({
                id: 'direction-popup-layer',
                type: 'symbol',
                source: 'direction-icon-source',
                minzoom: levelChangersLayer.minzoom,
                maxzoom: levelChangersLayer.maxzoom,
                layout: {
                    'text-field': ['get', 'description'],
                    'icon-text-fit': 'both',
                    'icon-image': ['get', 'popupImage'],
                    'icon-allow-overlap': true,
                    'text-allow-overlap': true,
                    'icon-anchor': 'bottom',
                    'text-anchor': 'bottom',
                    'text-offset': [0, -2.4],
                    'text-font': ['Amiri Bold'],
                },
                paint: {
                    'text-color': '#fff',
                },
                filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
            }, 'proximiio-polygons-above-paths');
            this.map.on('click', 'proximiio-levelchangers', function (ev) {
                if (_this.routingSource.points) {
                    var directionIcon = _this.state.style
                        .getSource('direction-icon-source')
                        .data.features.find(function (f) { return f.properties.level === _this.state.floor.level; });
                    if (directionIcon &&
                        directionIcon.properties &&
                        !isNaN(directionIcon.properties.destinationLevel) &&
                        ev.features[0].properties.id === directionIcon.properties.levelChangerId) {
                        _this.setFloorByLevel(directionIcon.properties.destinationLevel);
                        _this.setNavStep('next');
                    }
                }
            });
            this.map.on('click', 'direction-popup-layer', function (ev) {
                if (_this.routingSource.points) {
                    if (ev.features[0].properties && !isNaN(ev.features[0].properties.destinationLevel)) {
                        _this.setFloorByLevel(ev.features[0].properties.destinationLevel);
                        _this.setNavStep('next');
                    }
                }
            });
        }
    };
    // Add direction features to the map
    Map.prototype.addDirectionFeatures = function () {
        var _this = this;
        // Filter the steps in textNavigation state to find level changers
        var levelChangers = this.state.textNavigation.steps
            .filter(function (i, index, array) {
            var _a;
            // Get the first part of the direction string
            var direction = i.direction.split('_')[0];
            // Check if the current step is a level changer and has a valid direction
            if (i.levelChangerId && (direction === 'UP' || direction === 'DOWN')) {
                // Set the destination level for the level changer
                i.destinationLevel = array[index + 1] ? (_a = array[index + 1]) === null || _a === void 0 ? void 0 : _a.level : null;
                return i;
            }
        })
            // Map the level changers to feature objects
            .map(function (levelChanger) {
            // Find the level changer feature in allFeatures state
            var levelChangerFeature = _this.state.allFeatures.features.find(function (f) { return f.id === levelChanger.levelChangerId; });
            // Get the first part of the direction string
            var direction = levelChanger.direction.split('_')[0];
            var levelChangerType = levelChanger.direction.split('_')[1];
            var destinationFloor = _this.state.floors.filter(function (f) { return f.level === levelChanger.destinationLevel; })
                ? _this.state.floors.filter(function (f) { return f.level === levelChanger.destinationLevel; })[0]
                : _this.state.floor;
            // Create a new feature with the desired properties
            return new feature_1.default({
                type: 'Feature',
                geometry: levelChangerFeature.geometry,
                properties: {
                    usecase: 'floor-change-symbol',
                    icon: direction === 'UP' ? 'floorchange-up-image' : 'floorchange-down-image',
                    iconOffset: direction === 'UP' ? [4, -90] : [4, 90],
                    popupImage: 'popup',
                    description: "".concat(i18n_1.translations[_this.defaultOptions.language][levelChangerType], " \n ").concat(i18n_1.translations[_this.defaultOptions.language][direction], " ").concat(i18n_1.translations[_this.defaultOptions.language]['TO_FLOOR'], " ").concat(destinationFloor.name ? _this.getFloorName(destinationFloor) : levelChanger.destinationLevel),
                    level: levelChanger.level,
                    destinationLevel: levelChanger.destinationLevel,
                    levelChangerId: levelChangerFeature.properties.id,
                },
            });
        });
        // Update the source data for the 'direction-icon-source' layer
        this.state.style.sources['direction-icon-source'].data = {
            type: 'FeatureCollection',
            features: levelChangers,
        };
        // Update the style on the map with the new data
        this.map.setStyle(this.state.style);
    };
    Map.prototype.onSetFeaturesHighlight = function (features, color, radius, blur) {
        var map = this.map;
        var featuresToHiglight = this.state.allFeatures.features.filter(function (f) {
            return features.includes(f.id || f.properties.id);
        });
        var poisIconsLayer = this.map.getLayer('proximiio-pois-icons');
        var poisIconsImageSize = this.map.getLayoutProperty('proximiio-pois-icons', 'icon-size');
        if (map) {
            if (!map.getLayer('highlight-icon-layer')) {
                this.state.style.addLayer({
                    id: 'highlight-icon-layer',
                    type: 'circle',
                    source: 'highlight-icon-source',
                    minzoom: poisIconsLayer.minzoom,
                    maxzoom: poisIconsLayer.maxzoom,
                    paint: {
                        'circle-radius': poisIconsImageSize[0] === 'interpolate'
                            ? [
                                poisIconsImageSize[0],
                                poisIconsImageSize[1],
                                poisIconsImageSize[2],
                                poisIconsImageSize[3],
                                poisIconsImageSize[4] * (radius ? radius : 50),
                                poisIconsImageSize[5],
                                poisIconsImageSize[6] * (radius ? radius : 50),
                            ]
                            : radius,
                        'circle-color': color ? color : '#000',
                        'circle-blur': blur !== null && blur !== undefined ? blur : 0.8,
                    },
                    filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
                }, this.defaultOptions.initPolygons ? 'shop-custom' : 'proximiio-shop');
            }
            if (!map.getSource('highlight-icon-source')) {
                this.state.style.addSource('highlight-icon-source', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [],
                    },
                });
            }
            this.state.style.sources['highlight-icon-source'].data.features = featuresToHiglight ? featuresToHiglight : [];
            this.map.setStyle(this.state.style);
        }
    };
    Map.prototype.initAnimatedRoute = function () {
        if (this.map) {
            if (this.defaultOptions.routeAnimation.type === 'point') {
                this.state.style.addSource('lineAlong', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [],
                    },
                });
                this.state.style.addLayer({
                    id: 'lineAlong',
                    type: 'line',
                    source: 'lineAlong',
                    minzoom: 17,
                    maxzoom: 24,
                    paint: {
                        'line-width': this.defaultOptions.routeAnimation.lineWidth,
                        'line-color': this.defaultOptions.routeAnimation.lineColor,
                        'line-opacity': this.defaultOptions.routeAnimation.lineOpacity,
                    },
                    filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
                }, 'proximiio-routing-line-remaining');
                this.state.style.addSource('pointAlong', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [],
                    },
                });
                this.state.style.addLayer({
                    id: 'pointAlong',
                    type: 'circle',
                    source: 'pointAlong',
                    minzoom: 17,
                    maxzoom: 24,
                    paint: {
                        'circle-color': this.defaultOptions.routeAnimation.pointColor,
                        'circle-radius': this.defaultOptions.routeAnimation.pointRadius,
                    },
                    filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
                }, 'lineAlong');
            }
            if (this.defaultOptions.routeAnimation.type === 'dash') {
                if (this.state.style.getLayer('proximiio-routing-line-remaining')) {
                    this.state.style.removeLayer('proximiio-routing-line-remaining');
                }
                this.state.style.addSource('lineAlong', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [],
                    },
                });
                // add a line layer without line-dasharray defined to fill the gaps in the dashed line
                this.state.style.addLayer({
                    type: 'line',
                    source: 'lineAlong',
                    id: 'line-background',
                    paint: {
                        'line-color': this.defaultOptions.routeAnimation.lineColor,
                        'line-width': this.defaultOptions.routeAnimation.lineWidth,
                        'line-opacity': this.defaultOptions.routeAnimation.lineOpacity,
                    },
                });
                // add a line layer with line-dasharray set to the first value in dashArraySequence
                this.state.style.addLayer({
                    type: 'line',
                    source: 'lineAlong',
                    id: 'line-dashed',
                    paint: {
                        'line-color': this.defaultOptions.routeAnimation.lineColor,
                        'line-width': this.defaultOptions.routeAnimation.lineWidth,
                        'line-dasharray': [0, 4, 3],
                    },
                });
            }
        }
    };
    Map.prototype.initRasterTiles = function () {
        var _a, _b, _c, _d, _e, _f;
        if (this.map) {
            var metadata = this.state.style.metadata;
            this.state.style.addSource('raster-tiles', {
                type: 'raster',
                tiles: ((_a = this.defaultOptions.rasterTilesOptions) === null || _a === void 0 ? void 0 : _a.tilesUrl)
                    ? ["https://api.proximi.fi/imageproxy/source=".concat(this.defaultOptions.rasterTilesOptions.tilesUrl)]
                    : ["https://api.proximi.fi/imageproxy/source=".concat(metadata['proximiio:raster:tileurl'])],
                tileSize: ((_b = this.defaultOptions.rasterTilesOptions) === null || _b === void 0 ? void 0 : _b.tileSize)
                    ? this.defaultOptions.rasterTilesOptions.tileSize
                    : metadata['proximiio:raster:tilesize']
                        ? metadata['proximiio:raster:tilesize']
                        : 256,
                attribution: ((_c = this.defaultOptions.rasterTilesOptions) === null || _c === void 0 ? void 0 : _c.attribution)
                    ? this.defaultOptions.rasterTilesOptions.attribution
                    : metadata['proximiio:raster:attribution']
                        ? metadata['proximiio:raster:attribution']
                        : '',
            });
            this.state.style.addLayer({
                id: 'raster-tiles',
                type: 'raster',
                source: 'raster-tiles',
                minzoom: ((_d = this.defaultOptions.rasterTilesOptions) === null || _d === void 0 ? void 0 : _d.minZoom)
                    ? this.defaultOptions.rasterTilesOptions.minZoom
                    : metadata['proximiio:raster:minzoom']
                        ? metadata['proximiio:raster:minzoom']
                        : 15,
                maxzoom: ((_e = this.defaultOptions.rasterTilesOptions) === null || _e === void 0 ? void 0 : _e.maxZoom)
                    ? this.defaultOptions.rasterTilesOptions.maxZoom
                    : metadata['proximiio:raster:maxzoom']
                        ? metadata['proximiio:raster:maxzoom']
                        : 22,
            }, ((_f = this.defaultOptions.rasterTilesOptions) === null || _f === void 0 ? void 0 : _f.beforeLayer)
                ? this.defaultOptions.rasterTilesOptions.beforeLayer
                : metadata['proximiio:raster:beforelayer']
                    ? metadata['proximiio:raster:beforelayer']
                    : 'osm-country_label-en');
        }
    };
    Map.prototype.initPolygons = function () {
        var _this = this;
        if (this.map) {
            var polygonTitlesLayer = new custom_layers_1.PolygonTitlesLayer(this.defaultOptions.polygonsOptions);
            polygonTitlesLayer.setFilterLevel(this.state.floor.level);
            this.state.style.addLayer(polygonTitlesLayer.json, 'proximiio-paths');
            var polygonIconsLayer = new custom_layers_1.PolygonIconsLayer(this.defaultOptions.polygonsOptions);
            polygonIconsLayer.setFilterLevel(this.state.floor.level);
            this.state.style.addLayer(polygonIconsLayer.json, 'proximiio-paths');
            var polygonsLayer = new custom_layers_1.PolygonsLayer(this.defaultOptions.polygonsOptions);
            polygonsLayer.setFilterLevel(this.state.floor.level);
            this.state.style.addLayer(polygonsLayer.json, 'proximiio-paths');
            if (this.state.style.getLayer('proximiio-shop')) {
                if (this.defaultOptions.polygonsOptions.removeOriginalPolygonsLayer) {
                    this.state.style.removeLayer('proximiio-shop');
                }
            }
            this.map.on('click', 'shop-custom', function (e) {
                _this.onShopClick(e);
            });
            this.map.on('click', 'proximiio-pois-icons', function (ev) {
                _this.onShopClick(ev);
            });
            this.map.on('click', 'pois-icons', function (ev) {
                _this.onShopClick(ev);
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
        if (!this.defaultOptions.blockFeatureClickWhileRouting ||
            (this.defaultOptions.blockFeatureClickWhileRouting && !this.routingSource.route)) {
            if (e.features && e.features[0] && e.features[0].properties) {
                e.features[0].properties._dynamic = e.features[0].properties._dynamic
                    ? JSON.parse(e.features[0].properties._dynamic)
                    : {};
                if (this.defaultOptions.initPolygons) {
                    // @ts-ignore
                    var polygonPoi = this.state.allFeatures.features.find(function (i) { var _a; return i.properties.id === ((_a = e.features[0].properties._dynamic) === null || _a === void 0 ? void 0 : _a.poi_id); });
                    var poi = this.state.allFeatures.features.find(function (i) {
                        var _a, _b;
                        if ((_a = e.features[0].properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) {
                            return i.id === ((_b = e.features[0].properties._dynamic) === null || _b === void 0 ? void 0 : _b.id);
                        }
                        else {
                            return i.properties.id === e.features[0].properties.id;
                        }
                    });
                    if (polygonPoi) {
                        this.handlePolygonSelection(polygonPoi);
                    }
                    this.onPolygonClickListener.next(polygonPoi ? polygonPoi : poi);
                }
                else {
                    // @ts-ignore
                    var poi = this.state.allFeatures.features.find(function (i) { return i.properties.id === e.features[0].properties.id; });
                    this.onPoiClickListener.next(poi);
                }
            }
        }
    };
    Map.prototype.handlePolygonSelection = function (poi) {
        var connectedPolygonId = poi && poi.properties._dynamic ? poi.properties._dynamic.polygon_id : null;
        if (this.selectedPolygon) {
            this.map.setFeatureState({
                source: 'main',
                id: this.selectedPolygon.id,
            }, {
                selected: false,
            });
            if (this.selectedPolygon.properties._dynamic.label_id) {
                this.map.setFeatureState({
                    source: 'main',
                    id: this.selectedPolygon.properties._dynamic.label_id,
                }, {
                    selected: false,
                });
            }
        }
        if (connectedPolygonId) {
            this.selectedPolygon = this.state.allFeatures.features.find(function (i) { var _a, _b; return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === connectedPolygonId && ((_b = i.properties._dynamic) === null || _b === void 0 ? void 0 : _b.type) === 'shop-custom'; });
            if (this.selectedPolygon) {
                this.map.setFeatureState({
                    source: 'main',
                    id: this.selectedPolygon.id,
                }, {
                    selected: true,
                });
                if (this.selectedPolygon.properties._dynamic.label_id) {
                    this.map.setFeatureState({
                        source: 'main',
                        id: this.selectedPolygon.properties._dynamic.label_id,
                    }, {
                        selected: true,
                    });
                }
            }
        }
    };
    Map.prototype.onShopMouseEnter = function () {
        this.map.getCanvas().style.cursor = 'pointer';
    };
    Map.prototype.onShopMouseMove = function (e) {
        if (e.features && e.features.length > 0) {
            e.features[0].properties._dynamic = JSON.parse(e.features[0].properties._dynamic ? e.features[0].properties._dynamic : {});
            if (this.hoveredPolygon) {
                this.map.setFeatureState({
                    source: 'main',
                    id: this.hoveredPolygon.id,
                }, {
                    hover: false,
                });
                if (this.hoveredPolygon.properties._dynamic.label_id) {
                    this.map.setFeatureState({
                        source: 'main',
                        id: this.hoveredPolygon.properties._dynamic.label_id,
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
            if (this.hoveredPolygon.properties._dynamic.label_id) {
                this.map.setFeatureState({
                    source: 'main',
                    id: this.hoveredPolygon.properties._dynamic.label_id,
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
            if (this.hoveredPolygon.properties._dynamic.label_id) {
                this.map.setFeatureState({
                    source: 'main',
                    id: this.hoveredPolygon.properties._dynamic.label_id,
                }, {
                    hover: false,
                });
            }
        }
        this.hoveredPolygon = null;
    };
    Map.prototype.initUrlParams = function () {
        var urlParams = new URLSearchParams(window.location.search);
        var startParam = urlParams.get(this.defaultOptions.urlParams.startFeauture);
        var destinationParam = urlParams.get(this.defaultOptions.urlParams.destinationFeature);
        var placeParam = urlParams.get(this.defaultOptions.urlParams.defaultPlace);
        var defaultPlace = placeParam
            ? this.state.places.find(function (p) { var _a; return p.id === placeParam || ((_a = p.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === (placeParam === null || placeParam === void 0 ? void 0 : placeParam.toLowerCase()); })
            : this.state.place;
        var startFeature = startParam
            ? this.state.allFeatures.features.find(function (f) {
                var _a;
                return f.properties.title &&
                    f.properties.place_id === defaultPlace.id &&
                    (f.id === startParam ||
                        f.properties.id === startParam ||
                        ((_a = f.properties.title) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === (startParam === null || startParam === void 0 ? void 0 : startParam.toLowerCase()));
            })
            : this.startPoint;
        var destinationFeature = this.state.allFeatures.features.find(function (f) {
            var _a;
            return f.properties.title &&
                f.properties.place_id === defaultPlace.id &&
                (f.id === destinationParam ||
                    f.properties.id === destinationParam ||
                    ((_a = f.properties.title) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === (destinationParam === null || destinationParam === void 0 ? void 0 : destinationParam.toLowerCase()));
        });
        if (startFeature && startFeature.id && !destinationFeature) {
            this.centerToFeature(startFeature.id);
            if (this.map && this.defaultOptions.isKiosk) {
                this.setKiosk(startFeature.geometry.coordinates[1], startFeature.geometry.coordinates[0], startFeature.properties.level);
            }
        }
        if (!startFeature && destinationFeature) {
            this.centerToFeature(destinationFeature.id);
        }
        if (startFeature && destinationFeature) {
            this.onRouteUpdate(startFeature, destinationFeature);
        }
    };
    Map.prototype.featureDialog = function (e) {
        var _this = this;
        var _a;
        var features = this.map.queryRenderedFeatures(e.point, {
            layers: ['proximiio-pois-icons', 'proximiio-pois-labels'],
        });
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
        modal.setContent(edit ? (0, constants_1.EDIT_FEATURE_DIALOG)(e, features[0]) : (0, constants_1.NEW_FEATURE_DIALOG)(e, (_a = this.state.floor) === null || _a === void 0 ? void 0 : _a.level));
        modal.addFooterBtn('Submit', 'tingle-btn tingle-btn--primary', function () { return __awaiter(_this, void 0, void 0, function () {
            var formData, data, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        formData = new FormData(document.querySelector('#modal-form'));
                        _b = {
                            id: "".concat(formData.get('id')),
                            title: "".concat(formData.get('title')),
                            level: formData.get('level'),
                            lat: formData.get('lat'),
                            lng: formData.get('lng')
                        };
                        if (!formData.get('icon').size) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, common_1.getBase64FromImage)(formData.get('icon'))];
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
    Map.prototype.onAddNewFeature = function (title, level, lat, lng, icon, id, placeId, floorId, properties, isTemporary) {
        if (isTemporary === void 0) { isTemporary = true; }
        return __awaiter(this, void 0, void 0, function () {
            var featureId, feature, decodedIcon;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        featureId = id ? id : (0, common_1.uuidv4)();
                        if (this.state.allFeatures.features.findIndex(function (f) { return f.id === featureId || f.properties.id === featureId; }) > 0) {
                            console.error("Create feature failed: Feature with id '".concat(featureId, "' already exists!"));
                            throw new Error("Create feature failed: Feature with id '".concat(featureId, "' already exists!"));
                        }
                        feature = new feature_1.default({
                            type: 'Feature',
                            id: featureId,
                            geometry: new feature_1.Geometry({
                                type: 'Point',
                                coordinates: [lng, lat],
                            }),
                            properties: __assign({ type: 'poi', usecase: 'poi', id: featureId, minzoom: 15, visibility: 'visible', amenity: icon ? id : 'default', title: title, level: level, images: [icon], place_id: placeId, floor_id: floorId }, properties),
                        });
                        if (!(icon && icon.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, common_1.getImageFromBase64)(icon)];
                    case 1:
                        decodedIcon = _a.sent();
                        this.map.addImage(featureId, decodedIcon);
                        _a.label = 2;
                    case 2:
                        if (!!isTemporary) return [3 /*break*/, 4];
                        this.state.features.features.push(feature);
                        return [4 /*yield*/, (0, geo_1.addFeatures)({
                                type: 'FeatureCollection',
                                features: [feature.json],
                            })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        this.state.dynamicFeatures.features.push(feature);
                        _a.label = 5;
                    case 5:
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
    Map.prototype.onUpdateFeature = function (id, title, level, lat, lng, icon, placeId, floorId, properties, isTemporary) {
        if (isTemporary === void 0) { isTemporary = true; }
        return __awaiter(this, void 0, void 0, function () {
            var foundFeature, feature, decodedIcon, featureIndex, dynamicIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        foundFeature = this.state.allFeatures.features.find(function (f) { return f.id === id || f.properties.id === id; });
                        if (!foundFeature) {
                            console.error("Update feature failed: Feature with id '".concat(id, "' has not been found!"));
                            throw new Error("Update feature failed: Feature with id '".concat(id, "' has not been found!"));
                        }
                        feature = new feature_1.default(foundFeature);
                        feature.geometry.coordinates = [
                            lng ? lng : feature.geometry.coordinates[0],
                            lat ? lat : feature.geometry.coordinates[1],
                        ];
                        feature.properties = __assign(__assign(__assign({}, feature.properties), { title: title ? title : feature.properties.title, level: level ? level : feature.properties.level, amenity: icon ? id : feature.properties.amenity, images: icon ? [icon] : feature.properties.images, place_id: placeId ? placeId : feature.properties.place_id, floor_id: floorId ? floorId : feature.properties.floor_id }), properties);
                        if (!(icon && icon.length > 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, common_1.getImageFromBase64)(icon)];
                    case 1:
                        decodedIcon = _a.sent();
                        this.map.addImage(id, decodedIcon);
                        _a.label = 2;
                    case 2:
                        if (!!isTemporary) return [3 /*break*/, 4];
                        featureIndex = this.state.features.features.findIndex(function (x) { return x.id === feature.id || x.properties.id === feature.id; });
                        this.state.features.features[featureIndex] = feature;
                        return [4 /*yield*/, (0, geo_1.addFeatures)({
                                type: 'FeatureCollection',
                                features: [feature.json],
                            })];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        dynamicIndex = this.state.dynamicFeatures.features.findIndex(function (x) { return x.id === feature.id || x.properties.id === feature.id; });
                        this.state.dynamicFeatures.features[dynamicIndex] = feature;
                        _a.label = 5;
                    case 5:
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
    Map.prototype.onDeleteFeature = function (id, isTemporary) {
        if (isTemporary === void 0) { isTemporary = true; }
        return __awaiter(this, void 0, void 0, function () {
            var foundFeature, featureIndex, dynamicIndex;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        foundFeature = this.state.allFeatures.features.find(function (f) { return f.id === id || f.properties.id === id; });
                        if (!foundFeature) {
                            console.error("Deleting feature failed: Feature with id '".concat(id, "' has not been found!"));
                            throw new Error("Deleting feature failed: Feature with id '".concat(id, "' has not been found!"));
                        }
                        if (!!isTemporary) return [3 /*break*/, 2];
                        featureIndex = this.state.features.features.findIndex(function (x) { return x.id === id || x.properties.id === id; });
                        this.state.features.features.splice(featureIndex, 1);
                        return [4 /*yield*/, (0, geo_1.deleteFeatures)({
                                type: 'FeatureCollection',
                                features: [foundFeature],
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        dynamicIndex = this.state.dynamicFeatures.features.findIndex(function (x) { return x.id === id || x.properties.id === id; });
                        this.state.dynamicFeatures.features.splice(dynamicIndex, 1);
                        _a.label = 3;
                    case 3:
                        // this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features]; // this is not probably updated with non dynamic feature delete TODO
                        this.geojsonSource.delete(id);
                        // this.onSourceChange();
                        // this.routingSource.routing.setData(this.state.allFeatures);
                        // this.updateMapSource(this.routingSource);
                        this.onFeaturesChange();
                        this.onFeatureDeleteListener.next(foundFeature);
                        return [2 /*return*/];
                }
            });
        });
    };
    Map.prototype.onFeaturesChange = function () {
        this.state.allFeatures.features = __spreadArray(__spreadArray([], this.state.features.features, true), this.state.dynamicFeatures.features, true);
        this.onSourceChange();
        this.routingSource.routing.setData(this.state.allFeatures);
        this.updateMapSource(this.routingSource);
    };
    Map.prototype.onSetFeatureFilter = function (query, inverted) {
        var features = this.state.allFeatures.features.filter(function (f) { return f.properties.id === query || f.id === query || f.properties.title === query; });
        var _loop_1 = function (feature) {
            if (inverted && this_1.hiddenFeatures.findIndex(function (i) { return i === feature.properties.id; }) === -1) {
                this_1.hiddenFeatures.push(feature.properties.id);
            }
            else if (!inverted && this_1.filteredFeatures.findIndex(function (i) { return i === feature.properties.id; }) === -1) {
                this_1.filteredFeatures.push(feature.properties.id);
            }
        };
        var this_1 = this;
        for (var _i = 0, features_1 = features; _i < features_1.length; _i++) {
            var feature = features_1[_i];
            _loop_1(feature);
        }
        this.filterOutFeatures();
    };
    Map.prototype.onRemoveFeatureFilter = function (query, inverted) {
        var features = this.state.allFeatures.features.filter(function (f) { return f.properties.id === query || f.id === query || f.properties.title === query; });
        var _loop_2 = function (feature) {
            if (inverted && this_2.hiddenFeatures.findIndex(function (i) { return i === feature.properties.id; }) !== -1) {
                this_2.hiddenFeatures.splice(this_2.hiddenFeatures.findIndex(function (i) { return i === feature.properties.id; }), 1);
            }
            else if (!inverted && this_2.filteredFeatures.findIndex(function (i) { return i === feature.properties.id; }) !== -1) {
                this_2.filteredFeatures.splice(this_2.filteredFeatures.findIndex(function (i) { return i === feature.properties.id; }), 1);
            }
        };
        var this_2 = this;
        for (var _i = 0, features_2 = features; _i < features_2.length; _i++) {
            var feature = features_2[_i];
            _loop_2(feature);
        }
        this.filteredFeatures = this.filteredFeatures.length > 0 ? this.filteredFeatures : [];
        this.hiddenFeatures = this.hiddenFeatures.length > 0 ? this.hiddenFeatures : [];
        this.filterOutFeatures();
    };
    Map.prototype.onHidePois = function () {
        this.hiddenFeatures = this.state.allFeatures.features
            .filter(function (i) { return i.properties.type === 'poi' || i.properties.usecase === 'poi'; })
            .map(function (i) { return i.properties.id; });
        this.filterOutFeatures();
    };
    Map.prototype.onResetFeatureFilters = function () {
        this.filteredFeatures = [];
        this.hiddenFeatures = [];
        this.filterOutFeatures();
    };
    Map.prototype.onSetAmenityFilter = function (amenityId, category, inverted) {
        if (category && inverted) {
            throw new Error("It's not possible to use both category and inverted options in setAmenityFilter function!");
        }
        if (category) {
            this.amenityCategories[category].active = true;
            this.amenityCategories[category].activeId = amenityId;
            var amenities_1 = [];
            var _loop_3 = function (key) {
                if (this_3.amenityCategories.hasOwnProperty(key)) {
                    var cat_1 = this_3.amenityCategories[key];
                    if (cat_1.active) {
                        amenities_1 = Array.isArray(amenityId)
                            ? amenities_1.concat(cat_1.amenities.filter(function (i) { return !cat_1.activeId.includes(i); }))
                            : amenities_1.concat(cat_1.amenities.filter(function (i) { return i !== cat_1.activeId; }));
                    }
                }
            };
            var this_3 = this;
            for (var key in this.amenityCategories) {
                _loop_3(key);
            }
            this.amenityFilters = this.amenityIds.filter(function (el) { return !amenities_1.includes(el); });
        }
        else {
            if (inverted && this.hiddenAmenities.findIndex(function (i) { return i === amenityId; }) === -1) {
                if (Array.isArray(amenityId)) {
                    this.hiddenAmenities.concat(amenityId);
                }
                else {
                    this.hiddenAmenities.push(amenityId);
                }
                this.filteredAmenities = this.filteredAmenities.filter(function (i) { return i !== amenityId; });
            }
            else if (!inverted && this.amenityFilters.findIndex(function (i) { return i === amenityId; }) === -1) {
                if (Array.isArray(amenityId)) {
                    this.amenityFilters.concat(amenityId);
                }
                else {
                    this.amenityFilters.push(amenityId);
                }
            }
        }
        this.filteredAmenities = this.amenityFilters;
        this.filterOutFeatures();
        if (!inverted)
            this.setActivePolygons(amenityId);
    };
    Map.prototype.onRemoveAmenityFilter = function (amenityId, category, inverted) {
        if (category && inverted) {
            throw new Error("It's not possible to use both category and inverted options in removeAmenityFilter function!");
        }
        if (category &&
            this.amenityCategories[category].active &&
            JSON.stringify(this.amenityCategories[category].activeId) === JSON.stringify(amenityId)) {
            var amenities = Array.isArray(amenityId)
                ? this.amenityCategories[category].amenities.filter(function (i) { return !amenityId.includes(i); })
                : this.amenityCategories[category].amenities.filter(function (i) { return i !== amenityId; });
            this.amenityFilters = this.amenityFilters.concat(amenities);
            this.amenityCategories[category].active = false;
        }
        else if (!category) {
            if (inverted) {
                this.hiddenAmenities = this.hiddenAmenities.filter(function (i) { return i !== amenityId; });
                if (this.filteredAmenities.findIndex(function (i) { return i === amenityId; }) === -1) {
                    if (Array.isArray(amenityId)) {
                        this.filteredAmenities.concat(amenityId);
                    }
                    else {
                        this.filteredAmenities.push(amenityId);
                    }
                }
            }
            else {
                this.amenityFilters = this.amenityFilters.filter(function (i) { return i !== amenityId; });
            }
        }
        this.filteredAmenities = this.amenityFilters.length > 0 ? this.amenityFilters : this.amenityIds;
        this.hiddenAmenities = this.hiddenAmenities.length > 0 ? this.hiddenAmenities : [];
        this.filterOutFeatures();
        this.setActivePolygons(null);
    };
    Map.prototype.onResetAmenityFilters = function () {
        this.amenityFilters = [];
        this.hiddenAmenities = [];
        for (var key in this.amenityCategories) {
            if (this.amenityCategories.hasOwnProperty(key)) {
                this.amenityCategories[key].active = false;
            }
        }
        this.filteredAmenities = this.amenityIds;
        this.filterOutFeatures();
        this.setActivePolygons(null);
    };
    Map.prototype.filterOutFeatures = function () {
        // proximiio-pois-icons, proximiio-pois-labels, 'pois-icons', 'pois-labels'
        var _this = this;
        var layers = ['proximiio-pois-icons', 'proximiio-pois-labels', 'pois-icons', 'pois-labels'];
        if (this.defaultOptions.initPolygons) {
            layers.push('poi-custom-icons', 'shop-labels');
        }
        layers.forEach(function (layer) {
            if (_this.map.getLayer(layer)) {
                var l = _this.map.getLayer(layer);
                var filters = __spreadArray([], l.filter, true);
                var amenityFilter = filters.findIndex(function (f) { return f[1][1] && f[1][1][1] === 'amenity'; });
                var featureFilter = filters.findIndex(function (f) { return f[1][1] === 'id'; });
                if (_this.filteredAmenities.length > 0) {
                    if (amenityFilter !== -1) {
                        filters[amenityFilter] = [
                            'any',
                            ['in', ['get', 'amenity'], ['literal', _this.filteredAmenities]],
                            ['in', ['get', 'amenity', ['get', '_dynamic']], ['literal', _this.filteredAmenities]],
                        ];
                    }
                    else {
                        filters.push([
                            'any',
                            ['in', ['get', 'amenity'], ['literal', _this.filteredAmenities]],
                            ['in', ['get', 'amenity', ['get', '_dynamic']], ['literal', _this.filteredAmenities]],
                        ]);
                    }
                }
                if (_this.filteredFeatures.length > 0) {
                    if (featureFilter !== -1) {
                        filters[featureFilter] = ['match', ['get', 'id'], _this.filteredFeatures, true, false];
                    }
                    else {
                        filters.push(['match', ['get', 'id'], _this.filteredFeatures, true, false]);
                    }
                }
                else {
                    if (featureFilter !== -1) {
                        filters.splice(featureFilter, 1);
                    }
                }
                if (_this.hiddenFeatures.length > 0) {
                    if (featureFilter !== -1) {
                        filters[featureFilter] = ['match', ['get', 'id'], _this.hiddenFeatures, false, true];
                    }
                    else {
                        filters.push(['match', ['get', 'id'], _this.hiddenFeatures, false, true]);
                    }
                }
                else {
                    if (featureFilter !== -1) {
                        filters.splice(featureFilter, 1);
                    }
                }
                _this.state.style.getLayer(layer).filter = filters;
                _this.map.setFilter(layer, filters);
            }
        });
        this.state.style.notify('filter-change');
    };
    Map.prototype.setActivePolygons = function (amenityId) {
        var _this = this;
        if (this.defaultOptions.initPolygons) {
            var activeFeatures = this.activePolygonsAmenity
                ? this.state.allFeatures.features.filter(function (f) {
                    var _a;
                    return (Array.isArray(_this.activePolygonsAmenity)
                        ? _this.activePolygonsAmenity.includes(f.properties.amenity)
                        : f.properties.amenity === _this.activePolygonsAmenity) &&
                        ((_a = f.properties._dynamic) === null || _a === void 0 ? void 0 : _a.polygon_id) &&
                        f.geometry.type === 'Point';
                })
                : [];
            var amenityFeatures = amenityId
                ? this.state.allFeatures.features.filter(function (f) {
                    var _a;
                    return (Array.isArray(amenityId)
                        ? amenityId.includes(f.properties.amenity)
                        : f.properties.amenity === amenityId) &&
                        ((_a = f.properties._dynamic) === null || _a === void 0 ? void 0 : _a.polygon_id) &&
                        f.geometry.type === 'Point';
                })
                : [];
            if (activeFeatures.length > 0) {
                var _loop_4 = function (f) {
                    var polygon = this_4.state.allFeatures.features.find(function (i) {
                        var _a, _b, _c;
                        return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === ((_b = f.properties._dynamic) === null || _b === void 0 ? void 0 : _b.polygon_id) &&
                            ((_c = i.properties._dynamic) === null || _c === void 0 ? void 0 : _c.type) === 'shop-custom';
                    });
                    if (polygon) {
                        this_4.map.setFeatureState({
                            source: 'main',
                            id: polygon.id,
                        }, {
                            active: false,
                        });
                    }
                };
                var this_4 = this;
                for (var _i = 0, activeFeatures_1 = activeFeatures; _i < activeFeatures_1.length; _i++) {
                    var f = activeFeatures_1[_i];
                    _loop_4(f);
                }
            }
            if (amenityFeatures.length > 0) {
                var _loop_5 = function (f) {
                    var polygon = this_5.state.allFeatures.features.find(function (i) {
                        var _a, _b, _c;
                        return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === ((_b = f.properties._dynamic) === null || _b === void 0 ? void 0 : _b.polygon_id) &&
                            ((_c = i.properties._dynamic) === null || _c === void 0 ? void 0 : _c.type) === 'shop-custom';
                    });
                    if (polygon) {
                        this_5.map.setFeatureState({
                            source: 'main',
                            id: polygon.id,
                        }, {
                            active: true,
                        });
                    }
                };
                var this_5 = this;
                for (var _a = 0, amenityFeatures_1 = amenityFeatures; _a < amenityFeatures_1.length; _a++) {
                    var f = amenityFeatures_1[_a];
                    _loop_5(f);
                }
            }
        }
        this.activePolygonsAmenity = amenityId;
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
                    if (l) {
                        var filters = __spreadArray([], l.filter, true);
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
                    }
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
        this.state.persons = __spreadArray(__spreadArray([], this.state.persons, true), [person], false);
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
        return __awaiter(this, void 0, void 0, function () {
            var routeStart, textNavigation, logger, style;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (event === 'loading-start') {
                            this.state = __assign(__assign({}, this.state), { loadingRoute: true });
                            return [2 /*return*/];
                        }
                        if (!(event === 'loading-finished')) return [3 /*break*/, 3];
                        if (!this.routingSource.route) return [3 /*break*/, 2];
                        this.currentStep = 0;
                        routeStart = this.routingSource.lines[0];
                        textNavigation = {
                            steps: this.routingSource.steps,
                            destination: this.endPoint,
                            start: this.startPoint,
                        };
                        this.state = __assign(__assign({}, this.state), { loadingRoute: false, textNavigation: textNavigation });
                        if (this.defaultOptions.showLevelDirectionIcon) {
                            this.addDirectionFeatures();
                        }
                        if (this.defaultOptions.animatedRoute || this.defaultOptions.routeAnimation.enabled) {
                            if (this.defaultOptions.animatedRoute) {
                                console.log("animatedRoute property is deprecated, please use routeAnimation.enabled instead!");
                            }
                            this.animateRoute();
                        }
                        if (this.defaultOptions.forceFloorLevel !== null && this.defaultOptions.forceFloorLevel !== undefined) {
                            this.routingSource.data.features = this.routingSource.data.features.map(function (feature) {
                                if (feature.properties.level !== _this.defaultOptions.forceFloorLevel) {
                                    feature.properties.level = _this.defaultOptions.forceFloorLevel;
                                }
                                return feature;
                            });
                        }
                        // this.focusOnRoute();
                        this.centerOnRoute(routeStart);
                        this.onRouteFoundListener.next({
                            route: this.routingSource.route,
                            TBTNav: this.defaultOptions.enableTBTNavigation ? textNavigation : null,
                            details: this.defaultOptions.routeWithDetails ? this.routingSource.details : null,
                            start: this.startPoint,
                            end: this.endPoint,
                        });
                        if (!this.defaultOptions.sendAnalytics) return [3 /*break*/, 2];
                        logger = new wayfinding_1.default({
                            organization_id: this.state.user.organization.id,
                            organization_name: this.state.user.organization.name,
                            startLngLat: this.routingSource.start.geometry.coordinates,
                            startLevel: this.routingSource.start.properties.level,
                            startSegmentId: this.routingSource.start.id,
                            startSegmentName: this.defaultOptions.isKiosk ? 'kioskPoint' : this.routingSource.start.properties.title,
                            destinationFeatureId: this.routingSource.finish.id,
                            destinationName: this.routingSource.finish.properties.title,
                            destinationLngLat: this.routingSource.finish.geometry.coordinates,
                            destinationLevel: this.routingSource.finish.properties.level,
                            foundPath: this.routingSource.lines.length > 0,
                            optionAvoidBarrier: this.routingSource.routing.wayfinding.configuration.avoidBarriers,
                            optionAvoidElevators: this.routingSource.routing.wayfinding.configuration.avoidElevators,
                            optionAvoidEscalators: this.routingSource.routing.wayfinding.configuration.avoidEscalators,
                            optionAvoidNarrowPaths: this.routingSource.routing.wayfinding.configuration.avoidNarrowPaths,
                            optionAvoidRamps: this.routingSource.routing.wayfinding.configuration.avoidRamps,
                            optionAvoidStaircases: this.routingSource.routing.wayfinding.configuration.avoidStaircases,
                            optionAvoidTicketGates: this.routingSource.routing.wayfinding.configuration.avoidTicketGates,
                            route: this.routingSource.points.map(function (p) { return [
                                p.geometry.coordinates[0],
                                p.geometry.coordinates[1],
                                p.properties.level,
                            ]; }),
                            rerouted: false,
                        });
                        return [4 /*yield*/, logger.save()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                    case 3:
                        if (event === 'route-undefined') {
                            console.log('route not found');
                            this.state = __assign(__assign({}, this.state), { loadingRoute: false });
                            this.onRouteFailedListener.next('route not found');
                            return [2 /*return*/];
                        }
                        style = this.state.style;
                        style.setSource('route', this.routingSource);
                        this.state = __assign(__assign({}, this.state), { style: style });
                        this.updateMapSource(this.routingSource);
                        return [2 /*return*/];
                }
            });
        });
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
    Map.prototype.onToggleRasterFloorplans = function () {
        this.imageSourceManager.enabled = !this.imageSourceManager.enabled;
        var map = this.map;
        if (map) {
            this.imageSourceManager.setLevel(map, this.state.floor.level, this.state);
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
                        return [4 /*yield*/, (0, floors_1.getPlaceFloors)(place.id)];
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
        var _a;
        var map = this.map;
        var route = this.routingSource.levelPoints && this.routingSource.levelPoints[floor.level]
            ? this.routingSource.levelPoints[floor.level]
            : null;
        if (map) {
            this.state.style.setLevel(floor.level);
            map.setStyle(this.state.style);
            setTimeout(function () {
                __spreadArray(__spreadArray([], _this.state.style.getLayers('main'), true), _this.state.style.getLayers('route'), true).forEach(function (layer) {
                    if (map.getLayer(layer.id)) {
                        map.setFilter(layer.id, layer.filter);
                    }
                });
                _this.imageSourceManager.setLevel(map, floor.level, _this.state);
            });
            if (route) {
                var routePoints = this.routingSource.route["path-part-".concat(this.currentStep)] &&
                    ((_a = this.routingSource.route["path-part-".concat(this.currentStep)].properties) === null || _a === void 0 ? void 0 : _a.level) === floor.level
                    ? this.routingSource.route["path-part-".concat(this.currentStep)]
                    : (0, helpers_1.lineString)(this.routingSource.levelPoints[floor.level].map(function (i) { return i.geometry.coordinates; }));
                var lengthInMeters = turf.length(routePoints, { units: 'kilometers' }) * 1000;
                var bbox = turf.bbox(routePoints);
                if (lengthInMeters >= this.defaultOptions.minFitBoundsDistance) {
                    // @ts-ignore;
                    map.fitBounds(bbox, {
                        padding: this.defaultOptions.fitBoundsPadding,
                        bearing: this.map.getBearing(),
                        pitch: this.map.getPitch(),
                    });
                }
                else {
                    // @ts-ignore
                    this.map.flyTo({ center: turf.center(routePoints).geometry.coordinates });
                }
            }
            if (this.defaultOptions.isKiosk && map.getLayer('my-location-layer')) {
                var filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('my-location-layer', filter);
                this.state.style.getLayer('my-location-layer').filter = filter;
            }
            if (this.defaultOptions.useGpsLocation && this.startPoint) {
                this.startPoint.properties = __assign(__assign({}, this.startPoint.properties), { level: floor.level });
            }
            if (map.getLayer('persons-layer')) {
                var filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('persons-layer', filter);
                this.state.style.getLayer('persons-layer').filter = filter;
            }
            if (this.defaultOptions.showLevelDirectionIcon && map.getLayer('direction-halo-layer')) {
                var filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('direction-halo-layer', filter);
                this.state.style.getLayer('direction-halo-layer').filter = filter;
                map.setFilter('direction-popup-layer', filter);
                this.state.style.getLayer('direction-popup-layer').filter = filter;
            }
            if (map.getLayer('highlight-icon-layer')) {
                var filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('highlight-icon-layer', filter);
                this.state.style.getLayer('highlight-icon-layer').filter = filter;
            }
        }
        this.state = __assign(__assign({}, this.state), { floor: floor, style: this.state.style });
        if (this.defaultOptions.animatedRoute || (this.defaultOptions.routeAnimation.enabled && route)) {
            if (this.defaultOptions.animatedRoute) {
                console.log("animatedRoute property is deprecated, please use routeAnimation.enabled instead!");
            }
            this.animateRoute();
        }
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
            if (finish && this.defaultOptions.animatedRoute) {
                if (this.defaultOptions.animatedRoute) {
                    console.log("animatedRoute property is deprecated, please use routeAnimation.enabled instead!");
                }
                clearInterval(this.animationInterval);
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
        if (this.defaultOptions.showLevelDirectionIcon) {
            this.state.style.sources['direction-icon-source'].data = {
                type: 'FeatureCollection',
                features: [],
            };
        }
        if (this.defaultOptions.animatedRoute || this.defaultOptions.routeAnimation.enabled) {
            if (this.defaultOptions.animatedRoute) {
                console.log("animatedRoute property is deprecated, please use routeAnimation.enabled instead!");
            }
            if (this.defaultOptions.routeAnimation.type === 'point') {
                clearInterval(this.animationInterval);
                // @ts-ignore
                this.map.getSource('pointAlong').setData({
                    type: 'FeatureCollection',
                    features: [],
                });
                // @ts-ignore
                this.map.getSource('lineAlong').setData({
                    type: 'FeatureCollection',
                    features: [],
                });
            }
        }
        this.map.setStyle(this.state.style);
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
        var _a;
        if (route && route.properties) {
            if (this.state.floor.level !== +route.properties.level) {
                var floor = this.state.floors.find(function (f) { return f.level === +route.properties.level; });
                if (floor)
                    this.onFloorSelect(floor);
            }
            if (this.map) {
                var routePoints = this.routingSource.route["path-part-".concat(this.currentStep)] &&
                    ((_a = this.routingSource.route["path-part-".concat(this.currentStep)].properties) === null || _a === void 0 ? void 0 : _a.level) === this.state.floor.level
                    ? this.routingSource.route["path-part-".concat(this.currentStep)]
                    : (0, helpers_1.lineString)(this.routingSource.levelPoints[this.state.floor.level].map(function (i) { return i.geometry.coordinates; }));
                var lengthInMeters = turf.length(routePoints, { units: 'kilometers' }) * 1000;
                var bbox = turf.bbox(routePoints);
                if (lengthInMeters >= this.defaultOptions.minFitBoundsDistance) {
                    // @ts-ignore;
                    this.map.fitBounds(bbox, {
                        padding: this.defaultOptions.fitBoundsPadding,
                        bearing: this.map.getBearing(),
                        pitch: this.map.getPitch(),
                    });
                }
                else {
                    // @ts-ignore
                    this.map.flyTo({ center: turf.center(routePoints).geometry.coordinates });
                }
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
        this.state.amenities.forEach(function (amenity) {
            _this.amenityIds.push(amenity.id);
            if (amenity.icon) {
                _this.map.loadImage(amenity.icon, function (error, image) {
                    if (error)
                        throw error;
                    _this.map.addImage(amenity.id, image);
                });
            }
        });
    };
    Map.prototype.getUpcomingFloorNumber = function (way) {
        var _this = this;
        if (this.routingSource.lines && this.routingSource.route) {
            var currentRouteIndex = this.routingSource.lines.findIndex(function (route) { return +route.properties.level === _this.state.floor.level; });
            var currentRoute_1 = this.routingSource.lines[currentRouteIndex];
            var nextRouteIndex = this.routingSource.lines.findIndex(function (route) {
                if (way === 'up') {
                    return +route.properties.level > currentRoute_1.properties.level;
                }
                else {
                    return +route.properties.level < currentRoute_1.properties.level;
                }
            });
            var nextRoute = this.routingSource.lines[nextRouteIndex];
            // return currentRouteIndex !== -1 && nextRoute ? +nextRoute.properties.level : way === 'up' ? this.state.floor.level + 1 : this.state.floor.level - 1;
            return nextRoute &&
                ((way === 'up' && +nextRoute.properties.level > this.state.floor.level) ||
                    (way === 'down' && +nextRoute.properties.level < this.state.floor.level))
                ? +nextRoute.properties.level
                : this.state.floor.level;
        }
    };
    Map.prototype.getClosestFeature = function (amenityId, fromFeature) {
        var _this = this;
        var sameLevelfeatures = this.state.allFeatures.features.filter(function (i) {
            return i.properties.amenity === amenityId &&
                i.geometry.type === 'Point' &&
                i.properties.level === fromFeature.properties.level;
        });
        var features = this.state.allFeatures.features.filter(function (i) { return i.properties.amenity === amenityId && i.geometry.type === 'Point'; });
        if (this.defaultOptions.defaultPlaceId) {
            sameLevelfeatures = sameLevelfeatures.filter(function (i) { return i.properties.place_id === _this.defaultOptions.defaultPlaceId; });
            features = features.filter(function (i) { return i.properties.place_id === _this.defaultOptions.defaultPlaceId; });
        }
        var targetPoint = turf.point(fromFeature.geometry.coordinates);
        if (sameLevelfeatures.length > 0 || features.length > 0) {
            return turf.nearestPoint(targetPoint, turf.featureCollection(sameLevelfeatures.length > 0 ? sameLevelfeatures : features));
        }
        else {
            return false;
        }
    };
    Map.prototype.getFloorName = function (floor) {
        if (floor.metadata && floor.metadata['title_' + this.defaultOptions.language]) {
            return floor.metadata['title_' + this.defaultOptions.language];
        }
        else {
            return floor.name;
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
     *  @name getMapState
     *  @returns returns map state
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapState();
     */
    Map.prototype.getMapState = function () {
        return this.state;
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
     *  @name setLanguage
     *  @param language {string} language code
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setLanguage('en');
     *  });
     */
    Map.prototype.setLanguage = function (language) {
        this.geojsonSource.language = language;
        this.geojsonSource.fetch(this.state.features);
        this.defaultOptions.language = language;
        this.onFeaturesChange();
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
                    case 0: return [4 /*yield*/, (0, places_1.getPlaceById)(placeId)];
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
     *  @param wayfindingConfig {WayfindingConfigModel} wayfinding configuration, optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByIds('finishId, 'startId');
     *  });
     */
    Map.prototype.findRouteByIds = function (idTo, idFrom, accessibleRoute, wayfindingConfig) {
        var fromFeature = idFrom
            ? this.state.allFeatures.features.find(function (f) { return f.id === idFrom || f.properties.id === idFrom; })
            : this.startPoint;
        var toFeature = this.state.allFeatures.features.find(function (f) { return f.id === idTo || f.properties.id === idTo; });
        this.routingSource.toggleAccessible(accessibleRoute);
        if (wayfindingConfig) {
            this.routingSource.setConfig(wayfindingConfig);
        }
        this.onRouteUpdate(fromFeature, toFeature);
    };
    /**
     * This method will generate route based on selected features by their titles
     *  @memberof Map
     *  @name findRouteByTitle
     *  @param titleTo {string} finish feature title
     *  @param titleFrom {string} start feature title, optional for kiosk
     *  @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional
     *  @param wayfindingConfig {WayfindingConfigModel} wayfinding configuration, optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByTitle('myFeatureTitle', 'anotherFeatureTitle');
     *  });
     */
    Map.prototype.findRouteByTitle = function (titleTo, titleFrom, accessibleRoute, wayfindingConfig) {
        var fromFeature = titleFrom
            ? this.state.allFeatures.features.find(function (f) { return f.properties.title === titleFrom; })
            : this.startPoint;
        var toFeature = this.state.allFeatures.features.find(function (f) { return f.properties.title === titleTo; });
        this.routingSource.toggleAccessible(accessibleRoute);
        if (wayfindingConfig) {
            this.routingSource.setConfig(wayfindingConfig);
        }
        this.onRouteUpdate(fromFeature, toFeature);
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
     *  @param wayfindingConfig {WayfindingConfigModel} wayfinding configuration, optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByCoords(48.606703739771774, 17.833092384506614, 0, 48.60684545080579, 17.833450676669543, 0);
     *  });
     */
    Map.prototype.findRouteByCoords = function (latTo, lngTo, levelTo, latFrom, lngFrom, levelFrom, accessibleRoute, wayfindingConfig) {
        var fromFeature = latFrom && lngFrom && levelFrom
            ? turf.feature({ type: 'Point', coordinates: [lngFrom, latFrom] }, { level: levelFrom })
            : this.startPoint;
        var toFeature = turf.feature({ type: 'Point', coordinates: [lngTo, latTo] }, { level: levelTo });
        this.routingSource.toggleAccessible(accessibleRoute);
        if (wayfindingConfig) {
            this.routingSource.setConfig(wayfindingConfig);
        }
        this.onRouteUpdate(fromFeature, toFeature);
    };
    /**
     * This method will generate route to nearest amenity feature
     *  @memberof Map
     *  @name findRouteToNearestFeature
     *  @param amenityId {string} amenity id of a nearest feature to look for
     *  @param idFrom {string} start feature id, optional for kiosk
     *  @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional
     *  @param wayfindingConfig {WayfindingConfigModel} wayfinding configuration, optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteToNearestFeature('amenityId');
     *  });
     */
    Map.prototype.findRouteToNearestFeature = function (amenityId, idFrom, accessibleRoute, wayfindingConfig) {
        var fromFeature = idFrom
            ? this.state.allFeatures.features.find(function (f) { return f.id === idFrom || f.properties.id === idFrom; })
            : this.startPoint;
        var toFeature = this.getClosestFeature(amenityId, fromFeature);
        if (toFeature) {
            this.routingSource.toggleAccessible(accessibleRoute);
            if (wayfindingConfig) {
                this.routingSource.setConfig(wayfindingConfig);
            }
            this.onRouteUpdate(fromFeature, toFeature);
        }
        else {
            throw new Error("Feature not found");
        }
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
     * This method will set the current step for route navigation so map can focus on a proper path part
     *  @memberof Map
     *  @name setNavStep
     *  @param step { number | 'next' | 'previous' } Number of route part to focus on or string next or previous
     *  @returns active step
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setNavStep(0);
     *  });
     */
    Map.prototype.setNavStep = function (step) {
        var newStep = 0;
        if ((0, helpers_1.isNumber)(step)) {
            newStep = +step;
        }
        if (step === 'next') {
            newStep = this.currentStep + 1;
        }
        if (step === 'next' && Object.keys(this.routingSource.route).length - 1 === this.currentStep) {
            newStep = 0;
        }
        if (step === 'previous' && this.currentStep > 0) {
            newStep = this.currentStep - 1;
        }
        if (newStep === this.currentStep) {
            return;
        }
        if (this.routingSource && this.routingSource.route && this.routingSource.route["path-part-".concat(newStep)]) {
            this.currentStep = newStep;
            this.centerOnRoute(this.routingSource.route["path-part-".concat(newStep)]);
            this.onStepSetListener.next(this.currentStep);
            return step;
        }
        else {
            console.error("Route not found");
        }
    };
    /**
     *  @memberof Map
     *  @name getNavStepSetListener
     *  @returns returns step set listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getNavStepSetListener().subscribe(step => {
     *    console.log('new step has been set', step);
     *  });
     */
    Map.prototype.getNavStepSetListener = function () {
        return this.onStepSetListener.asObservable();
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
        if (this.routingSource && this.routingSource.route && this.routingSource.route['path-part-0']) {
            var routeStart = this.routingSource.route['path-part-0'];
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
     *  @param properties {object} feature properties, optional
     *  @param isTemporary {boolean} will add feature just temporary, it's not saved to db, optional, default
     *  @return <Promise>{Feature} newly added feature
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    const myFeature = map.addCustomFeature('myPOI', 0, 48.606703739771774, 17.833092384506614);
     *  });
     */
    Map.prototype.addCustomFeature = function (title, level, lat, lng, icon, id, placeId, floorId, properties, isTemporary) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.onAddNewFeature(title, +level, +lat, +lng, icon, id, placeId, floorId, properties, isTemporary)];
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
     *  @param properties {object} feature properties, optional
     *  @param isTemporary {boolean} will update feature just temporary, it's not saved to db, optional, default
     *  @return <Promise>{Feature} newly added feature
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    const myFeature = map.updateFeature('poiId', 'myPOI', 0, 48.606703739771774, 17.833092384506614);
     *  });
     */
    Map.prototype.updateFeature = function (id, title, level, lat, lng, icon, placeId, floorId, properties, isTemporary) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.onUpdateFeature(id, title, level, lat, lng, icon, placeId, floorId, properties, isTemporary)];
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
     *  @param isTemporary {boolean} will delete feature just temporary, it's not deleted from db, optional, default
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.deleteFeature('poiId');
     *  });
     */
    Map.prototype.deleteFeature = function (id, isTemporary) {
        return this.onDeleteFeature(id, isTemporary);
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
     * This method will set padding for zooming into bounding box of found route
     *  @memberof Map
     *  @name setBoundsPadding
     *  @param padding {number | PaddingOptions} the amount of padding in pixels to add to the given bounds for found route, https://docs.mapbox.com/mapbox-gl-js/api/properties/#paddingoptions
     *  @example
     *  const map = new Proximiio.Map({
     *    fitBoundsPadding: 200
     *  });
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setBoundsPadding(50);
     *  });
     */
    Map.prototype.setBoundsPadding = function (padding) {
        this.defaultOptions.fitBoundsPadding = padding;
    };
    /**
     * With this method you can filter features with any of it's properties, if the property key doesn't exists in the feature properties or it's value is the same as defined in options they will pass the filtering and will be visible on map.
     *  @memberof Map
     *  @name setFiltering
     *  @param options { key: string; value: string } | null, define property key and value to filter features, optional, if null filtering will be disabled.
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setFiltering({ key: 'properties.metadata.exhibition', value: 'food'});
     *  });
     */
    Map.prototype.setFiltering = function (options) {
        if (options) {
            this.defaultOptions.defaultFilter = options;
        }
        else {
            delete this.defaultOptions.defaultFilter;
        }
        this.onRefetch();
    };
    /**
     * With this method you can show only defined features, you can send both id or title, with inverted set to true defined feature will hide instead.
     *  @memberof Map
     *  @name setFeatureFilter
     *  @param query {string} id or title of the feature
     *  @param inverted {boolean} when set to true, defined feature will hide, optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setFeatureFilter('myfeature');
     *  });
     */
    Map.prototype.setFeatureFilter = function (query, inverted) {
        this.onSetFeatureFilter(query, inverted);
    };
    /**
     * Method for removing previously created feature filters.
     *  @memberof Map
     *  @name removeFeatureFilter
     *  @param query {string} id or title of the feature
     *  @param inverted {boolean} have to be set to same value like it was in setFeatureFilter method, optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.removeFeatureFilter('myfeature');
     *  });
     */
    Map.prototype.removeFeatureFilter = function (query, inverted) {
        this.onRemoveFeatureFilter(query, inverted);
    };
    /**
     * With this method you can hide all pois.
     *  @memberof Map
     *  @name hidePois
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.hidePois();
     *  });
     */
    Map.prototype.hidePois = function () {
        this.onHidePois();
    };
    /**
     * Method for removing all active feature filters.
     *  @memberof Map
     *  @name resetFeatureFilters
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.resetFeatureFilters();
     *  });
     */
    Map.prototype.resetFeatureFilters = function () {
        this.onResetFeatureFilters();
    };
    /**
     * You'll be able to show features only for defined amenity id on map with this method, also with defining the category (NOTE: you have to create them before with setAmenitiesCategory() method), filtering will be set only for defined array of amenities in the category. With category set, only one amenity filter can be active at the time, while without the category they stack so multiple amenities can be active. With inverted option set to true, defined amenity features will hide. Category and inverted options can't be defined at the same time.
     *  @memberof Map
     *  @name setAmenityFilter
     *  @param amenityId {string} | {string[]} only features of defined amenityId | amenityIds will be visible
     *  @param category {string} id of the amenities category added via setAmenitiesCategory, optional, if defined filtering will be set only for defined array of amenities in same method
     *  @param inverted {boolean} when set to true, defined amenity features will hide, optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setAmenityFilter('myamenity');
     *    // inverted method
     *    map.setAmenityFilter('myamenity', null, true);
     *  });
     */
    Map.prototype.setAmenityFilter = function (amenityId, category, inverted) {
        if (!category || (category && this.amenityCategories[category])) {
            this.onSetAmenityFilter(amenityId, category, inverted);
        }
        else {
            throw new Error("It seems there is no '".concat(category, "' amenities category created, please set category with 'setAmenitiesCategory()' method"));
        }
    };
    /**
     * Method for removing previously created amenity filters. In case amenity filter has been set with the category parameter, you have to use same param for removing the filter.
     *  @memberof Map
     *  @name removeAmenityFilter
     *  @param amenityId {string | string[]} remove the filter for a defined amenityId | amenityIds
     *  @param category {string} id of the amenities category added via setAmenitiesCategory, optional, if defined filtering will be removed only for defined array of amenities in same method
     *  @param inverted {boolean} have to be set to same value like it was in setAmenityFilter method, optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.removeAmenityFilter('myamenity');
     *    // remove inverted method
     *    map.removeAmenityFilter('myamenity', null, true);
     *  });
     */
    Map.prototype.removeAmenityFilter = function (amenityId, category, inverted) {
        if (!category || (category && this.amenityCategories[category])) {
            this.onRemoveAmenityFilter(amenityId, category, inverted);
        }
        else {
            throw new Error("It seems there is no '".concat(category, "' amenities category created, please set category with 'setAmenitiesCategory()' method"));
        }
    };
    /**
     * Method for removing all active amenity filters.
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
            throw new Error("It seems there is no '".concat(id, "' amenities category created, please set category with 'setAmenitiesCategory()' method"));
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
     *  @memberof Map
     *  @name getPoiClickListener
     *  @returns returns poi click listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getPoiClickListener().subscribe((poi) => {
     *    console.log('poi clicked', poi);
     *  });
     */
    Map.prototype.getPoiClickListener = function () {
        return this.onPoiClickListener.asObservable();
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
    /**
     * Method for toggling raster floorplans visibility
     *  @memberof Map
     *  @name toggleRasterFloorplans
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.toggleRasterFloorplans();
     *  });
     */
    Map.prototype.toggleRasterFloorplans = function () {
        this.onToggleRasterFloorplans();
    };
    /**
     * Method for adding circle layer as a highlight for defined features
     *  @memberof Map
     *  @name setFeaturesHighlight
     *  @param features {string[]} feature id to set highlight on, you can send empty array to remove highlights.
     *  @param color {string} highlight color, optional.
     *  @param radius {number} highlight circle radius, optional.
     *  @param blur {number} blur of the highlight circle, optional.
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setFeaturesHighlight(['featureid']);
     *  });
     */
    Map.prototype.setFeaturesHighlight = function (features, color, radius, blur) {
        this.onSetFeaturesHighlight(features, color, radius, blur);
    };
    /**
     * Method for refetching features data
     *  @memberof Map
     *  @name refetch
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.refetch();
     *  });
     */
    Map.prototype.refetch = function () {
        this.onRefetch();
    };
    return Map;
}());
exports.Map = Map;
/* TODO
 * - check clusters
 * */
