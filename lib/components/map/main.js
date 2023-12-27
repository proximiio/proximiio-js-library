var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import maplibregl from 'maplibre-gl';
import Repository from '../../controllers/repository';
import Auth from '../../controllers/auth';
import { addFeatures, deleteFeatures } from '../../controllers/geo';
import { PlaceModel } from '../../models/place';
import { FloorModel } from '../../models/floor';
import StyleModel from '../../models/style';
import GeoJSONSource from './sources/geojson_source';
import SyntheticSource from './sources/synthetic_source';
import Feature, { FeatureCollection, Geometry } from '../../models/feature';
import RoutingSource from './sources/routing_source';
import ClusterSource from './sources/cluster_source';
import ImageSourceManager from './sources/image_source_manager';
import { getBase64FromImage, getImageFromBase64, uuidv4 } from '../../common';
import { chevron, pulsingDot, person as personIcon, floorchangeUpImage, floorchangeDownImage, popupImage, } from './icons';
import { getPlaceFloors } from '../../controllers/floors';
import { getPlaceById } from '../../controllers/places';
import { CustomSubject } from '../../customSubject';
// @ts-ignore
import * as tingle from 'tingle.js/dist/tingle';
import { EDIT_FEATURE_DIALOG, NEW_FEATURE_DIALOG } from './constants';
import { PolygonsLayer, PolygonIconsLayer, PolygonTitlesLayer } from './custom-layers';
import PersonModel from '../../models/person';
import bbox from '@turf/bbox';
import length from '@turf/length';
import center from '@turf/center';
import along from '@turf/along';
import lineSplit from '@turf/line-split';
import nearestPoint from '@turf/nearest-point';
import { isNumber, lineString, point, feature, featureCollection } from '@turf/helpers';
import WayfindingLogger from '../logger/wayfinding';
import { translations } from './i18n';
export const globalState = {
    initializing: true,
    floor: new FloorModel({}),
    floors: [],
    place: new PlaceModel({}),
    places: [],
    style: new StyleModel({}),
    styles: [],
    amenities: [],
    features: new FeatureCollection({}),
    dynamicFeatures: new FeatureCollection({}),
    allFeatures: new FeatureCollection({}),
    latitude: 0,
    longitude: 0,
    loadingRoute: false,
    noPlaces: false,
    textNavigation: null,
    persons: [],
    user: null,
};
export class Map {
    constructor(options) {
        this.geojsonSource = new GeoJSONSource(new FeatureCollection({}));
        this.syntheticSource = new SyntheticSource(new FeatureCollection({}));
        this.routingSource = new RoutingSource();
        this.clusterSource = new ClusterSource();
        this.imageSourceManager = new ImageSourceManager();
        this.onMapReadyListener = new CustomSubject();
        this.onPlaceSelectListener = new CustomSubject();
        this.onFloorSelectListener = new CustomSubject();
        this.onRouteFoundListener = new CustomSubject();
        this.onRouteFailedListener = new CustomSubject();
        this.onRouteCancelListener = new CustomSubject();
        this.onFeatureAddListener = new CustomSubject();
        this.onFeatureUpdateListener = new CustomSubject();
        this.onFeatureDeleteListener = new CustomSubject();
        this.onPolygonClickListener = new CustomSubject();
        this.onPoiClickListener = new CustomSubject();
        this.onPersonUpdateListener = new CustomSubject();
        this.onStepSetListener = new CustomSubject();
        this.defaultOptions = {
            selector: 'proximiioMap',
            allowNewFeatureModal: false,
            newFeatureModalEvent: 'click',
            enableTBTNavigation: true,
            zoomIntoPlace: true,
            defaultFloorLevel: 0,
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
                textFont: ['Amiri Bold'],
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
        this.animateRoute = () => {
            var _a;
            if (this.routingSource && this.routingSource.route && this.routingSource.route[`path-part-${this.currentStep}`]) {
                const route = this.routingSource.route[`path-part-${this.currentStep}`] &&
                    ((_a = this.routingSource.route[`path-part-${this.currentStep}`].properties) === null || _a === void 0 ? void 0 : _a.level) === this.state.floor.level
                    ? this.routingSource.route[`path-part-${this.currentStep}`]
                    : lineString(this.routingSource.levelPoints[this.state.floor.level].map((i) => i.geometry.coordinates));
                if (this.defaultOptions.routeAnimation.type === 'point') {
                    clearInterval(this.animationInterval);
                    clearTimeout(this.animationTimeout);
                    const lineDistance = length(route) * 1000;
                    const walkingSpeed = 1.4;
                    const walkingDuration = lineDistance / walkingSpeed;
                    const multiplier = this.defaultOptions.routeAnimation.durationMultiplier;
                    const vizDuration = this.defaultOptions.routeAnimation.duration
                        ? this.defaultOptions.routeAnimation.duration
                        : walkingDuration * (1 / multiplier);
                    const fps = this.defaultOptions.routeAnimation.fps;
                    const frames = Math.round(fps * vizDuration);
                    // console.log(`Route Duration is ${walkingDuration} seconds`);
                    // console.log(`Vizualization Duration is ${vizDuration} seconds`);
                    // console.log(`Total Frames at ${fps}fps is ${frames}`);
                    // divide length and duration by number of frames
                    const routeLength = length(route);
                    const incrementLength = routeLength / frames;
                    const interval = (vizDuration / frames) * 1000;
                    // updateData at the calculated interval
                    let counter = 0;
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
                    this.animationInterval = setInterval(() => {
                        this.updateData(route, incrementLength, counter, frames);
                        if (counter === frames + 1) {
                            clearInterval(this.animationInterval);
                        }
                        else {
                            counter += 1;
                        }
                    }, interval);
                }
                if (this.defaultOptions.routeAnimation.type === 'dash') {
                    const dashArraySequence = [
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
                    this.map.getSource('lineAlong').setData(route);
                    const animateDashArray = (timestamp) => {
                        // Update line-dasharray using the next value in dashArraySequence. The
                        // divisor in the expression `timestamp / 50` controls the animation speed.
                        const newStep = Math.floor((timestamp / 50) % dashArraySequence.length);
                        if (newStep !== this.step) {
                            this.map.setPaintProperty('line-dashed', 'line-dasharray', dashArraySequence[this.step]);
                            this.step = newStep;
                        }
                        // Request the next frame of the animation.
                        requestAnimationFrame(animateDashArray);
                    };
                    requestAnimationFrame(animateDashArray);
                }
            }
        };
        // Cache the initial and final points along the route
        this.updateData = (route, incrementLength, counter, frames) => {
            let animationInProgress = false;
            // console.log(counter, frames);
            // length to visualize for this frame
            const frameLength = incrementLength * counter;
            const previousFrameLength = incrementLength * (counter - 1);
            // calculate where to place the marker
            const pointAlong = along(route, frameLength);
            // cut the line at the point
            const lineAlong = lineSplit(route, pointAlong).features[0];
            /*this.state.style.sources['lineAlong'].data = lineAlong;
            this.state.style.sources['pointAlong'].data = pointAlong;
            this.map.setStyle(this.state.style);*/
            // @ts-ignore
            this.map.getSource('pointAlong').setData(pointAlong);
            // @ts-ignore
            this.map.getSource('lineAlong').setData(lineAlong);
            if (this.defaultOptions.routeAnimation.followRoute && !animationInProgress) {
                animationInProgress = true;
                /*const prevPoint = counter === 0 ? along(route, 0) : along(route, previousFrameLength);
                const currentPoint = along(route, frameLength);
          
                const currentBearing = this.map.getBearing();
                const bearing = prevPoint && currentPoint ? bearing(prevPoint, currentPoint) : currentBearing;
                let newBearing = currentBearing;
          
                if (Math.abs(currentBearing - bearing) >= 6) {
                  newBearing = bearing;
                }*/
                setTimeout(() => {
                    this.map.jumpTo({
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
                if (this.defaultOptions.routeAnimation.looping) {
                    this.animationTimeout = setTimeout(() => {
                        this.animateRoute();
                    }, 2000);
                }
            }
        };
        // fix centering in case of kiosk with defined pitch/bearing/etc. in mapbox options
        if (options.isKiosk && options.mapboxOptions && options.kioskSettings && !options.mapboxOptions.center) {
            options.mapboxOptions.center = options.kioskSettings.coordinates;
        }
        const urlParams = Object.assign(Object.assign({}, this.defaultOptions.urlParams), options.urlParams);
        const polygonsOptions = Object.assign(Object.assign({}, this.defaultOptions.polygonsOptions), options.polygonsOptions);
        const routeAnimation = Object.assign(Object.assign({}, this.defaultOptions.routeAnimation), options.routeAnimation);
        this.defaultOptions = Object.assign(Object.assign({}, this.defaultOptions), options);
        this.defaultOptions.urlParams = urlParams;
        this.defaultOptions.polygonsOptions = polygonsOptions;
        this.defaultOptions.routeAnimation = routeAnimation;
        this.state = globalState;
        if (this.defaultOptions.isKiosk && this.defaultOptions.useGpsLocation) {
            throw new Error(`It's not possible to use both isKiosk and useGpsLocation options as enabled!`);
        }
        // @ts-ignore
        if (maplibregl.getRTLTextPluginStatus() !== 'loaded') {
            // @ts-ignore
            maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js', null, true);
        }
        this.map = new maplibregl.Map(Object.assign(Object.assign({}, this.defaultOptions.mapboxOptions), { container: this.defaultOptions.selector ? this.defaultOptions.selector : 'map' }));
        this.map.on('load', (e) => {
            this.onMapReady(e);
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
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.geojsonSource.on(this.onSourceChange);
            this.syntheticSource.on(this.onSyntheticChange);
            this.routingSource.on(this.onRouteChange);
            yield this.fetch();
        });
    }
    cancelObservers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.geojsonSource.off(this.onSourceChange);
            this.syntheticSource.off(this.onSyntheticChange);
            this.state.style.off(this.onStyleChange);
        });
    }
    fetch() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            let placeParam = null;
            if (this.defaultOptions.handleUrlParams) {
                const urlParams = new URLSearchParams(window.location.search);
                placeParam = urlParams.get(this.defaultOptions.urlParams.defaultPlace);
            }
            const { places, style, styles, features, amenities } = yield Repository.getPackage({
                initPolygons: this.defaultOptions.initPolygons,
                autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
                amenityIdProperty: this.defaultOptions.amenityIdProperty,
                hiddenAmenities: this.defaultOptions.hiddenAmenities,
                useTimerangeData: this.defaultOptions.useTimerangeData,
                filter: this.defaultOptions.defaultFilter,
                featuresMaxBounds: this.defaultOptions.featuresMaxBounds,
            });
            const levelChangers = features.features.filter((f) => f.properties.type === 'elevator' || f.properties.type === 'escalator' || f.properties.type === 'staircase');
            const user = yield Auth.getCurrentUser();
            const defaultPlace = placeParam
                ? places.find((p) => p.id === placeParam || p.name === placeParam)
                : places.find((p) => p.id === this.defaultOptions.defaultPlaceId);
            const place = places.length > 0 ? (defaultPlace ? defaultPlace : places[0]) : new PlaceModel({});
            let centerVar = [place.location.lng, place.location.lat];
            if ((_a = this.defaultOptions.mapboxOptions) === null || _a === void 0 ? void 0 : _a.center) {
                centerVar = this.defaultOptions.mapboxOptions.center;
            }
            if (this.defaultOptions.isKiosk) {
                centerVar = (_b = this.defaultOptions.kioskSettings) === null || _b === void 0 ? void 0 : _b.coordinates;
            }
            if (placeParam) {
                centerVar = [place.location.lng, place.location.lat];
            }
            style.center = centerVar;
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
                const routeLayer = style.layers.find((l) => l.id === 'proximiio-routing-line-remaining');
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
            this.routingSource.routing.setData(new FeatureCollection(features));
            this.prepareStyle(style);
            this.imageSourceManager.enabled = this.defaultOptions.showRasterFloorplans;
            this.imageSourceManager.belowLayer = style.usesPrefixes() ? 'proximiio-floors' : 'floors';
            this.imageSourceManager.initialize();
            this.state = Object.assign(Object.assign({}, this.state), { initializing: false, place,
                places,
                style,
                styles,
                amenities,
                features, allFeatures: new FeatureCollection(features), levelChangers: new FeatureCollection({ features: levelChangers }), latitude: centerVar[1], longitude: centerVar[0], zoom: this.defaultOptions.zoomLevel ? this.defaultOptions.zoomLevel : (_c = this.defaultOptions.mapboxOptions) === null || _c === void 0 ? void 0 : _c.zoom, noPlaces: places.length === 0, user });
            style.on(this.onStyleChange);
            this.map.setStyle(this.state.style);
            this.map.setCenter(centerVar);
            if (this.defaultOptions.allowNewFeatureModal) {
                this.map.on(this.defaultOptions.newFeatureModalEvent ? this.defaultOptions.newFeatureModalEvent : 'dblclick', (e) => {
                    this.featureDialog(e);
                });
            }
        });
    }
    onMapReady(e) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // set paths visible if available
            const map = e.target;
            if (map) {
                (_a = this.state.style) === null || _a === void 0 ? void 0 : _a.togglePaths(true);
                // routing layers
                const routingLayer = map.getLayer('routing-line-completed');
                const usePrefixed = typeof routingLayer === 'undefined' && typeof map.getLayer('proximiio-routing-line-completed') !== 'undefined';
                const shopsLayer = map.getLayer('shops');
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
                // hide start and finish poi icons for generated route source
                const routingSymbolsLayer = map.getLayer('proximiio-routing-symbols');
                if (routingSymbolsLayer) {
                    routingSymbolsLayer.filter.push(['match', ['get', 'type'], ['poi', 'poi-custom'], false, true]);
                    this.state.style.getLayer('proximiio-routing-symbols').filter = routingSymbolsLayer.filter;
                    map.setFilter('proximiio-routing-symbols', routingSymbolsLayer.filter);
                }
                map.setMaxZoom(30);
                const decodedChevron = yield getImageFromBase64(chevron);
                const decodedPersonIcon = yield getImageFromBase64(personIcon);
                const decodedFloorchangeUpImage = yield getImageFromBase64(floorchangeUpImage);
                const decodedFloorchangeDownImage = yield getImageFromBase64(floorchangeDownImage);
                const decodedPopupImage = yield getImageFromBase64(popupImage);
                map.addImage('chevron_right', decodedChevron);
                map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });
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
                yield this.onPlaceSelect(this.state.place, this.defaultOptions.zoomIntoPlace, this.defaultOptions.defaultFloorLevel);
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
                        console.log(`animatedRoute property is deprecated, please use routeAnimation.enabled instead!`);
                    }
                    this.initAnimatedRoute();
                }
                if (this.defaultOptions.hiddenAmenities) {
                    const layers = [
                        'proximiio-pois-icons',
                        'proximiio-pois-labels',
                        'pois-icons',
                        'pois-labels',
                        'poi-custom-icons',
                    ];
                    layers.forEach((layer) => {
                        const l = this.map.getLayer(layer);
                        if (l) {
                            const filters = [...l.filter];
                            filters.push(['!=', ['get', 'hideIcon'], 'hide']);
                            this.state.style.getLayer(layer).filter = filters;
                            this.map.setFilter(layer, filters);
                        }
                    });
                }
                this.initPersonsMap();
                if (!this.defaultOptions.initPolygons) {
                    this.map.on('click', 'proximiio-pois-icons', (ev) => {
                        this.onShopClick(ev);
                    });
                    this.map.on('click', 'proximiio-pois-labels', (ev) => {
                        this.onShopClick(ev);
                    });
                    this.map.on('click', 'pois-icons', (ev) => {
                        this.onShopClick(ev);
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
            }
        });
    }
    onRefetch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.map) {
                console.log('data should be refetched');
                const { features } = yield Repository.getPackage({
                    initPolygons: this.defaultOptions.initPolygons,
                    autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
                    amenityIdProperty: this.defaultOptions.amenityIdProperty,
                    hiddenAmenities: this.defaultOptions.hiddenAmenities,
                    useTimerangeData: this.defaultOptions.useTimerangeData,
                    filter: this.defaultOptions.defaultFilter,
                    featuresMaxBounds: this.defaultOptions.featuresMaxBounds,
                });
                const levelChangers = features.features.filter((f) => f.properties.type === 'elevator' || f.properties.type === 'escalator' || f.properties.type === 'staircase');
                this.state = Object.assign(Object.assign({}, this.state), { features, allFeatures: new FeatureCollection(features), levelChangers: new FeatureCollection({ features: levelChangers }) });
                this.geojsonSource.fetch(this.state.features);
                this.onFeaturesChange();
            }
        });
    }
    initKiosk() {
        if (this.map) {
            this.showStartPoint = false;
            if (this.defaultOptions.kioskSettings) {
                this.startPoint = point(this.defaultOptions.kioskSettings.coordinates, {
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
    }
    onSetKiosk(lat, lng, level) {
        if (this.map && this.defaultOptions.isKiosk) {
            this.defaultOptions.kioskSettings = {
                coordinates: [lng, lat],
                level,
            };
            this.startPoint = point(this.defaultOptions.kioskSettings.coordinates, {
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
    }
    initGeoLocation() {
        if (this.map && this.defaultOptions.useGpsLocation) {
            const geolocate = new maplibregl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true,
                },
                showAccuracyCircle: false,
                trackUserLocation: true,
            });
            this.map.addControl(geolocate, this.defaultOptions.geolocationControlOptions.position);
            if (this.defaultOptions.geolocationControlOptions.autoTrigger) {
                setTimeout(() => {
                    geolocate.trigger();
                }, 300);
            }
            if (this.defaultOptions.geolocationControlOptions.autoLocate === false) {
                setTimeout(() => {
                    // @ts-ignore
                    geolocate._watchState = 'BACKGROUND';
                    // @ts-ignore
                    if (geolocate._geolocateButton) {
                        // @ts-ignore
                        geolocate._geolocateButton.classList.add('maplibregl-ctrl-geolocate-background');
                        // @ts-ignore
                        geolocate._geolocateButton.classList.remove('maplibregl-ctrl-geolocate-active');
                    }
                    // @ts-ignore
                    geolocate.fire(new Event('trackuserlocationend'));
                });
            }
            geolocate.on('geolocate', (data) => {
                this.startPoint = point([data.coords.longitude, data.coords.latitude], {
                    level: this.state.floor.level,
                });
            });
        }
    }
    initDirectionIcon() {
        if (this.map) {
            const levelChangersLayer = this.map.getLayer('proximiio-levelchangers');
            const levelChangersLayerImageSize = this.map.getLayoutProperty('proximiio-levelchangers', 'icon-size');
            const radius = 50;
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
                    'text-font': this.defaultOptions.polygonsOptions.textFont,
                },
                paint: {
                    'text-color': '#fff',
                },
                filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
            }, 'proximiio-polygons-above-paths');
            this.map.on('click', 'proximiio-levelchangers', (ev) => {
                if (this.routingSource.points) {
                    const directionIcon = this.state.style
                        .getSource('direction-icon-source')
                        .data.features.find((f) => f.properties.level === this.state.floor.level);
                    if (directionIcon &&
                        directionIcon.properties &&
                        !isNaN(directionIcon.properties.destinationLevel) &&
                        ev.features[0].properties.id === directionIcon.properties.levelChangerId) {
                        this.setFloorByLevel(directionIcon.properties.destinationLevel);
                        this.setNavStep('next');
                    }
                }
            });
            this.map.on('click', 'direction-popup-layer', (ev) => {
                if (this.routingSource.points) {
                    if (ev.features[0].properties && !isNaN(ev.features[0].properties.destinationLevel)) {
                        this.setFloorByLevel(ev.features[0].properties.destinationLevel);
                        this.setNavStep('next');
                    }
                }
            });
        }
    }
    // Add direction features to the map
    addDirectionFeatures() {
        // Filter the steps in textNavigation state to find level changers
        const levelChangers = this.state.textNavigation.steps
            .filter((i, index, array) => {
            var _a;
            // Get the first part of the direction string
            const direction = i.direction.split('_')[0];
            // Check if the current step is a level changer and has a valid direction
            if (i.levelChangerId && (direction === 'UP' || direction === 'DOWN')) {
                // Set the destination level for the level changer
                i.destinationLevel = array[index + 1] ? (_a = array[index + 1]) === null || _a === void 0 ? void 0 : _a.level : null;
                return i;
            }
        })
            // Map the level changers to feature objects
            .map((levelChanger) => {
            // Find the level changer feature in allFeatures state
            const levelChangerFeature = this.state.allFeatures.features.find((f) => f.id === levelChanger.levelChangerId);
            // Get the first part of the direction string
            const direction = levelChanger.direction.split('_')[0];
            const levelChangerType = levelChanger.direction.split('_')[1];
            const destinationFloor = this.state.floors.filter((f) => f.level === levelChanger.destinationLevel)
                ? this.state.floors.filter((f) => f.level === levelChanger.destinationLevel)[0]
                : this.state.floor;
            // Create a new feature with the desired properties
            return new Feature({
                type: 'Feature',
                geometry: levelChangerFeature.geometry,
                properties: {
                    usecase: 'floor-change-symbol',
                    icon: direction === 'UP' ? 'floorchange-up-image' : 'floorchange-down-image',
                    iconOffset: direction === 'UP' ? [4, -90] : [4, 90],
                    popupImage: 'popup',
                    description: `${translations[this.defaultOptions.language][levelChangerType]} \n ${translations[this.defaultOptions.language][direction]} ${translations[this.defaultOptions.language]['TO_FLOOR']} ${destinationFloor.name ? this.getFloorName(destinationFloor) : levelChanger.destinationLevel}`,
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
    }
    onSetFeaturesHighlight(features, color, radius, blur) {
        const map = this.map;
        const featuresToHiglight = this.state.allFeatures.features.filter((f) => {
            return features.includes(f.id || f.properties.id);
        });
        const poisIconsLayer = this.map.getLayer('proximiio-pois-icons');
        const poisIconsImageSize = this.map.getLayoutProperty('proximiio-pois-icons', 'icon-size');
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
    }
    initAnimatedRoute() {
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
    }
    initRasterTiles() {
        var _a, _b, _c, _d, _e, _f;
        if (this.map) {
            const metadata = this.state.style.metadata;
            this.state.style.addSource('raster-tiles', {
                type: 'raster',
                tiles: ((_a = this.defaultOptions.rasterTilesOptions) === null || _a === void 0 ? void 0 : _a.tilesUrl)
                    ? [`https://api.proximi.fi/imageproxy/source=${this.defaultOptions.rasterTilesOptions.tilesUrl}`]
                    : [`https://api.proximi.fi/imageproxy/source=${metadata['proximiio:raster:tileurl']}`],
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
    }
    initPolygons() {
        if (this.map) {
            const polygonTitlesLayer = new PolygonTitlesLayer(this.defaultOptions.polygonsOptions);
            polygonTitlesLayer.setFilterLevel(this.state.floor.level);
            this.state.style.addLayer(polygonTitlesLayer.json, 'proximiio-paths');
            const polygonIconsLayer = new PolygonIconsLayer(this.defaultOptions.polygonsOptions);
            polygonIconsLayer.setFilterLevel(this.state.floor.level);
            this.state.style.addLayer(polygonIconsLayer.json, 'proximiio-paths');
            const polygonsLayer = new PolygonsLayer(this.defaultOptions.polygonsOptions);
            polygonsLayer.setFilterLevel(this.state.floor.level);
            this.state.style.addLayer(polygonsLayer.json, 'proximiio-paths');
            if (this.state.style.getLayer('proximiio-shop')) {
                if (this.defaultOptions.polygonsOptions.removeOriginalPolygonsLayer) {
                    this.state.style.removeLayer('proximiio-shop');
                }
            }
            this.map.on('click', 'proximiio-pois-icons', (ev) => {
                this.onShopClick(ev);
            });
            this.map.on('mousemove', 'proximiio-pois-icons', (ev) => {
                this.map.getCanvas().style.cursor = 'pointer';
            });
            this.map.on('mouseleave', 'proximiio-pois-icons', (ev) => {
                this.map.getCanvas().style.cursor = '';
            });
            this.map.on('click', 'pois-icons', (ev) => {
                this.onShopClick(ev);
            });
            this.map.on('mousemove', 'pois-icons', (ev) => {
                this.map.getCanvas().style.cursor = 'pointer';
            });
            this.map.on('mouseleave', 'pois-icons', (ev) => {
                this.map.getCanvas().style.cursor = '';
            });
            this.map.on('click', 'shop-custom', (e) => {
                this.onShopClick(e);
            });
            this.map.on('mouseenter', 'shop-custom', () => {
                this.onShopMouseEnter();
            });
            this.map.on('mousemove', 'shop-custom', (e) => {
                this.onShopMouseMove(e);
            });
            this.map.on('mouseleave', 'shop-custom', (e) => {
                this.onShopMouseLeave(e);
            });
        }
    }
    onShopClick(e) {
        if (!this.defaultOptions.blockFeatureClickWhileRouting ||
            (this.defaultOptions.blockFeatureClickWhileRouting && !this.routingSource.route)) {
            if (e.features && e.features[0] && e.features[0].properties) {
                e.features[0].properties._dynamic = e.features[0].properties._dynamic
                    ? JSON.parse(e.features[0].properties._dynamic)
                    : {};
                if (this.defaultOptions.initPolygons) {
                    // @ts-ignore
                    const polygonPoi = this.state.allFeatures.features.find((i) => { var _a; return i.properties.id === ((_a = e.features[0].properties._dynamic) === null || _a === void 0 ? void 0 : _a.poi_id); });
                    const poi = this.state.allFeatures.features.find((i) => {
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
                    const poi = this.state.allFeatures.features.find((i) => i.properties.id === e.features[0].properties.id);
                    this.onPoiClickListener.next(poi);
                }
            }
        }
    }
    handlePolygonSelection(poi) {
        const connectedPolygonId = poi && poi.properties._dynamic ? poi.properties._dynamic.polygon_id : null;
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
            this.selectedPolygon = this.state.allFeatures.features.find((i) => { var _a, _b; return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === connectedPolygonId && ((_b = i.properties._dynamic) === null || _b === void 0 ? void 0 : _b.type) === 'shop-custom'; });
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
    }
    onShopMouseEnter() {
        this.map.getCanvas().style.cursor = 'pointer';
    }
    onShopMouseMove(e) {
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
    }
    onShopMouseLeave(e) {
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
    }
    initUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get(this.defaultOptions.urlParams.startFeauture);
        const destinationParam = urlParams.get(this.defaultOptions.urlParams.destinationFeature);
        const placeParam = urlParams.get(this.defaultOptions.urlParams.defaultPlace);
        const defaultPlace = placeParam
            ? this.state.places.find((p) => { var _a; return p.id === placeParam || ((_a = p.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === (placeParam === null || placeParam === void 0 ? void 0 : placeParam.toLowerCase()); })
            : this.state.place;
        const startFeature = startParam
            ? this.state.allFeatures.features.find((f) => {
                var _a;
                return f.properties.title &&
                    f.properties.place_id === defaultPlace.id &&
                    (f.id === startParam ||
                        f.properties.id === startParam ||
                        ((_a = f.properties.title) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === (startParam === null || startParam === void 0 ? void 0 : startParam.toLowerCase()));
            })
            : this.startPoint;
        const destinationFeature = destinationParam
            ? this.state.allFeatures.features.find((f) => {
                var _a;
                return f.properties.title &&
                    f.properties.place_id === defaultPlace.id &&
                    (f.id === destinationParam ||
                        f.properties.id === destinationParam ||
                        ((_a = f.properties.title) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === (destinationParam === null || destinationParam === void 0 ? void 0 : destinationParam.toLowerCase()));
            })
            : undefined;
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
    }
    featureDialog(e) {
        var _a;
        const features = this.map.queryRenderedFeatures(e.point, {
            layers: ['proximiio-pois-icons', 'proximiio-pois-labels'],
        });
        const edit = features.length > 0;
        const modal = new tingle.modal({
            footer: true,
            stickyFooter: false,
            closeMethods: ['overlay', 'button', 'escape'],
            closeLabel: 'Close',
            onClose: () => {
                modal.destroy();
            },
        });
        // set content
        modal.setContent(edit ? EDIT_FEATURE_DIALOG(e, features[0]) : NEW_FEATURE_DIALOG(e, (_a = this.state.floor) === null || _a === void 0 ? void 0 : _a.level));
        modal.addFooterBtn('Submit', 'tingle-btn tingle-btn--primary', () => __awaiter(this, void 0, void 0, function* () {
            const formData = new FormData(document.querySelector('#modal-form'));
            const data = {
                id: `${formData.get('id')}`,
                title: `${formData.get('title')}`,
                level: formData.get('level'),
                lat: formData.get('lat'),
                lng: formData.get('lng'),
                icon: formData.get('icon').size ? yield getBase64FromImage(formData.get('icon')) : undefined,
            };
            if (data.title && data.level && data.lat && data.lng) {
                if (edit) {
                    yield this.onUpdateFeature(data.id, data.title, +data.level, +data.lat, +data.lng, data.icon);
                }
                else {
                    yield this.onAddNewFeature(data.title, +data.level, +data.lat, +data.lng, data.icon, data.id);
                }
                modal.close();
            }
            else {
                alert('Please fill all the required fields!');
            }
        }));
        if (edit) {
            modal.addFooterBtn('Delete', 'tingle-btn tingle-btn--danger', () => {
                var _a, _b;
                this.onDeleteFeature((_b = (_a = features[0]) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b.id);
                modal.close();
            });
        }
        modal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--default tingle-btn--pull-right', () => {
            modal.close();
        });
        modal.open();
    }
    onAddNewFeature(title, level, lat, lng, icon, id, placeId, floorId, properties, isTemporary = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const featureId = id ? id : uuidv4();
            if (this.state.allFeatures.features.findIndex((f) => f.id === featureId || f.properties.id === featureId) > 0) {
                console.error(`Create feature failed: Feature with id '${featureId}' already exists!`);
                throw new Error(`Create feature failed: Feature with id '${featureId}' already exists!`);
            }
            const featureVar = new Feature({
                type: 'Feature',
                id: featureId,
                geometry: new Geometry({
                    type: 'Point',
                    coordinates: [lng, lat],
                }),
                properties: Object.assign({ type: 'poi', usecase: 'poi', id: featureId, minzoom: 15, visibility: 'visible', amenity: icon ? id : 'default', title,
                    level, images: [icon], place_id: placeId, floor_id: floorId }, properties),
            });
            if (icon && icon.length > 0) {
                const decodedIcon = yield getImageFromBase64(icon);
                this.map.addImage(featureId, decodedIcon);
            }
            if (!isTemporary) {
                this.state.features.features.push(featureVar);
                yield addFeatures({
                    type: 'FeatureCollection',
                    features: [featureVar.json],
                });
            }
            else {
                this.state.dynamicFeatures.features.push(featureVar);
            }
            // this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features];
            this.geojsonSource.create(featureVar);
            // this.onSourceChange();
            // this.routingSource.routing.setData(this.state.allFeatures);
            // this.updateMapSource(this.routingSource);
            this.onFeaturesChange();
            this.onFeatureAddListener.next(featureVar);
            return featureVar;
        });
    }
    onUpdateFeature(id, title, level, lat, lng, icon, placeId, floorId, properties, isTemporary = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const foundFeature = this.state.allFeatures.features.find((f) => f.id === id || f.properties.id === id);
            if (!foundFeature) {
                console.error(`Update feature failed: Feature with id '${id}' has not been found!`);
                throw new Error(`Update feature failed: Feature with id '${id}' has not been found!`);
            }
            const featureVar = new Feature(foundFeature);
            featureVar.geometry.coordinates = [
                lng ? lng : featureVar.geometry.coordinates[0],
                lat ? lat : featureVar.geometry.coordinates[1],
            ];
            featureVar.properties = Object.assign(Object.assign(Object.assign({}, featureVar.properties), { title: title ? title : featureVar.properties.title, level: level ? level : featureVar.properties.level, amenity: icon ? id : featureVar.properties.amenity, images: icon ? [icon] : featureVar.properties.images, place_id: placeId ? placeId : featureVar.properties.place_id, floor_id: floorId ? floorId : featureVar.properties.floor_id }), properties);
            if (icon && icon.length > 0) {
                const decodedIcon = yield getImageFromBase64(icon);
                this.map.addImage(id, decodedIcon);
            }
            if (!isTemporary) {
                const featureIndex = this.state.features.features.findIndex((x) => x.id === featureVar.id || x.properties.id === featureVar.id);
                this.state.features.features[featureIndex] = featureVar;
                yield addFeatures({
                    type: 'FeatureCollection',
                    features: [featureVar.json],
                });
            }
            else {
                const dynamicIndex = this.state.dynamicFeatures.features.findIndex((x) => x.id === featureVar.id || x.properties.id === featureVar.id);
                this.state.dynamicFeatures.features[dynamicIndex] = featureVar;
            }
            // this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features]; // this is not probably updated with non dynamic feature update TODO
            this.geojsonSource.update(featureVar);
            // this.onSourceChange();
            // this.routingSource.routing.setData(this.state.allFeatures);
            // this.updateMapSource(this.routingSource);
            this.onFeaturesChange();
            this.onFeatureUpdateListener.next(featureVar);
            return featureVar;
        });
    }
    onDeleteFeature(id, isTemporary = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const foundFeature = this.state.allFeatures.features.find((f) => f.id === id || f.properties.id === id);
            if (!foundFeature) {
                console.error(`Deleting feature failed: Feature with id '${id}' has not been found!`);
                throw new Error(`Deleting feature failed: Feature with id '${id}' has not been found!`);
            }
            if (!isTemporary) {
                const featureIndex = this.state.features.features.findIndex((x) => x.id === id || x.properties.id === id);
                this.state.features.features.splice(featureIndex, 1);
                yield deleteFeatures({
                    type: 'FeatureCollection',
                    features: [foundFeature],
                });
            }
            else {
                const dynamicIndex = this.state.dynamicFeatures.features.findIndex((x) => x.id === id || x.properties.id === id);
                this.state.dynamicFeatures.features.splice(dynamicIndex, 1);
            }
            // this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features]; // this is not probably updated with non dynamic feature delete TODO
            this.geojsonSource.delete(id);
            // this.onSourceChange();
            // this.routingSource.routing.setData(this.state.allFeatures);
            // this.updateMapSource(this.routingSource);
            this.onFeaturesChange();
            this.onFeatureDeleteListener.next(foundFeature);
        });
    }
    onFeaturesChange() {
        this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features];
        this.geojsonSource.language = this.defaultOptions.language;
        this.geojsonSource.fetch(this.state.features);
        this.onSourceChange();
        this.routingSource.routing.setData(this.state.allFeatures);
        this.updateMapSource(this.routingSource);
    }
    onSetFeatureFilter(query, inverted) {
        const features = this.state.allFeatures.features.filter((f) => f.properties.id === query || f.id === query || f.properties.title === query);
        for (const f of features) {
            if (inverted && this.hiddenFeatures.findIndex((i) => i === f.properties.id) === -1) {
                this.hiddenFeatures.push(f.properties.id);
            }
            else if (!inverted && this.filteredFeatures.findIndex((i) => i === f.properties.id) === -1) {
                this.filteredFeatures.push(f.properties.id);
            }
        }
        this.filterOutFeatures();
    }
    onRemoveFeatureFilter(query, inverted) {
        const features = this.state.allFeatures.features.filter((f) => f.properties.id === query || f.id === query || f.properties.title === query);
        for (const f of features) {
            if (inverted && this.hiddenFeatures.findIndex((i) => i === f.properties.id) !== -1) {
                this.hiddenFeatures.splice(this.hiddenFeatures.findIndex((i) => i === f.properties.id), 1);
            }
            else if (!inverted && this.filteredFeatures.findIndex((i) => i === f.properties.id) !== -1) {
                this.filteredFeatures.splice(this.filteredFeatures.findIndex((i) => i === f.properties.id), 1);
            }
        }
        this.filteredFeatures = this.filteredFeatures.length > 0 ? this.filteredFeatures : [];
        this.hiddenFeatures = this.hiddenFeatures.length > 0 ? this.hiddenFeatures : [];
        this.filterOutFeatures();
    }
    onHidePois() {
        this.hiddenFeatures = this.state.allFeatures.features
            .filter((i) => i.properties.type === 'poi' || i.properties.usecase === 'poi')
            .map((i) => i.properties.id);
        this.filterOutFeatures();
    }
    onResetFeatureFilters() {
        this.filteredFeatures = [];
        this.hiddenFeatures = [];
        this.filterOutFeatures();
    }
    onSetAmenityFilter(amenityId, category, inverted) {
        if (category && inverted) {
            throw new Error(`It's not possible to use both category and inverted options in setAmenityFilter function!`);
        }
        if (category) {
            this.amenityCategories[category].active = true;
            this.amenityCategories[category].activeId = amenityId;
            let amenities = [];
            for (const key in this.amenityCategories) {
                if (this.amenityCategories.hasOwnProperty(key)) {
                    const cat = this.amenityCategories[key];
                    if (cat.active) {
                        amenities = Array.isArray(amenityId)
                            ? amenities.concat(cat.amenities.filter((i) => !cat.activeId.includes(i)))
                            : amenities.concat(cat.amenities.filter((i) => i !== cat.activeId));
                    }
                }
            }
            this.amenityFilters = this.amenityIds.filter((el) => !amenities.includes(el));
        }
        else {
            if (inverted && this.hiddenAmenities.findIndex((i) => i === amenityId) === -1) {
                if (Array.isArray(amenityId)) {
                    this.hiddenAmenities.concat(amenityId);
                }
                else {
                    this.hiddenAmenities.push(amenityId);
                }
                this.filteredAmenities = this.filteredAmenities.filter((i) => i !== amenityId);
            }
            else if (!inverted && this.amenityFilters.findIndex((i) => i === amenityId) === -1) {
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
    }
    onRemoveAmenityFilter(amenityId, category, inverted) {
        if (category && inverted) {
            throw new Error(`It's not possible to use both category and inverted options in removeAmenityFilter function!`);
        }
        if (category &&
            this.amenityCategories[category].active &&
            JSON.stringify(this.amenityCategories[category].activeId) === JSON.stringify(amenityId)) {
            const amenities = Array.isArray(amenityId)
                ? this.amenityCategories[category].amenities.filter((i) => !amenityId.includes(i))
                : this.amenityCategories[category].amenities.filter((i) => i !== amenityId);
            this.amenityFilters = this.amenityFilters.concat(amenities);
            this.amenityCategories[category].active = false;
        }
        else if (!category) {
            if (inverted) {
                this.hiddenAmenities = this.hiddenAmenities.filter((i) => i !== amenityId);
                if (this.filteredAmenities.findIndex((i) => i === amenityId) === -1) {
                    if (Array.isArray(amenityId)) {
                        this.filteredAmenities.concat(amenityId);
                    }
                    else {
                        this.filteredAmenities.push(amenityId);
                    }
                }
            }
            else {
                this.amenityFilters = this.amenityFilters.filter((i) => i !== amenityId);
            }
        }
        this.filteredAmenities = this.amenityFilters.length > 0 ? this.amenityFilters : this.amenityIds;
        this.hiddenAmenities = this.hiddenAmenities.length > 0 ? this.hiddenAmenities : [];
        this.filterOutFeatures();
        this.setActivePolygons(null);
    }
    onResetAmenityFilters() {
        this.amenityFilters = [];
        this.hiddenAmenities = [];
        for (const key in this.amenityCategories) {
            if (this.amenityCategories.hasOwnProperty(key)) {
                this.amenityCategories[key].active = false;
            }
        }
        this.filteredAmenities = this.amenityIds;
        this.filterOutFeatures();
        this.setActivePolygons(null);
    }
    filterOutFeatures() {
        // proximiio-pois-icons, proximiio-pois-labels, 'pois-icons', 'pois-labels'
        const layers = ['proximiio-pois-icons', 'proximiio-pois-labels', 'pois-icons', 'pois-labels'];
        if (this.defaultOptions.initPolygons) {
            layers.push('poi-custom-icons', 'shop-labels');
        }
        layers.forEach((layer) => {
            if (this.map.getLayer(layer)) {
                const l = this.map.getLayer(layer);
                const filters = [...l.filter];
                const amenityFilter = filters.findIndex((f) => f[1][1] && f[1][1][1] === 'amenity');
                const featureFilter = filters.findIndex((f) => f[1][1] === 'id');
                if (this.filteredAmenities.length > 0) {
                    if (amenityFilter !== -1) {
                        filters[amenityFilter] = [
                            'any',
                            ['in', ['get', 'amenity'], ['literal', this.filteredAmenities]],
                            ['in', ['get', 'amenity', ['get', '_dynamic']], ['literal', this.filteredAmenities]],
                        ];
                    }
                    else {
                        filters.push([
                            'any',
                            ['in', ['get', 'amenity'], ['literal', this.filteredAmenities]],
                            ['in', ['get', 'amenity', ['get', '_dynamic']], ['literal', this.filteredAmenities]],
                        ]);
                    }
                }
                if (this.filteredFeatures.length > 0) {
                    if (featureFilter !== -1) {
                        filters[featureFilter] = ['match', ['get', 'id'], this.filteredFeatures, true, false];
                    }
                    else {
                        filters.push(['match', ['get', 'id'], this.filteredFeatures, true, false]);
                    }
                }
                else {
                    if (featureFilter !== -1) {
                        filters.splice(featureFilter, 1);
                    }
                }
                if (this.hiddenFeatures.length > 0) {
                    if (featureFilter !== -1) {
                        filters[featureFilter] = ['match', ['get', 'id'], this.hiddenFeatures, false, true];
                    }
                    else {
                        filters.push(['match', ['get', 'id'], this.hiddenFeatures, false, true]);
                    }
                }
                else {
                    if (featureFilter !== -1) {
                        filters.splice(featureFilter, 1);
                    }
                }
                this.state.style.getLayer(layer).filter = filters;
                this.map.setFilter(layer, filters);
            }
        });
        this.state.style.notify('filter-change');
    }
    setActivePolygons(amenityId) {
        if (this.defaultOptions.initPolygons) {
            const activeFeatures = this.activePolygonsAmenity
                ? this.state.allFeatures.features.filter((f) => {
                    var _a;
                    return (Array.isArray(this.activePolygonsAmenity)
                        ? this.activePolygonsAmenity.includes(f.properties.amenity)
                        : f.properties.amenity === this.activePolygonsAmenity) &&
                        ((_a = f.properties._dynamic) === null || _a === void 0 ? void 0 : _a.polygon_id) &&
                        f.geometry.type === 'Point';
                })
                : [];
            const amenityFeatures = amenityId
                ? this.state.allFeatures.features.filter((f) => {
                    var _a;
                    return (Array.isArray(amenityId)
                        ? amenityId.includes(f.properties.amenity)
                        : f.properties.amenity === amenityId) &&
                        ((_a = f.properties._dynamic) === null || _a === void 0 ? void 0 : _a.polygon_id) &&
                        f.geometry.type === 'Point';
                })
                : [];
            if (activeFeatures.length > 0) {
                for (const f of activeFeatures) {
                    const polygon = this.state.allFeatures.features.find((i) => {
                        var _a, _b, _c;
                        return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === ((_b = f.properties._dynamic) === null || _b === void 0 ? void 0 : _b.polygon_id) &&
                            ((_c = i.properties._dynamic) === null || _c === void 0 ? void 0 : _c.type) === 'shop-custom';
                    });
                    if (polygon) {
                        this.map.setFeatureState({
                            source: 'main',
                            id: polygon.id,
                        }, {
                            active: false,
                        });
                    }
                }
            }
            if (amenityFeatures.length > 0) {
                for (const f of amenityFeatures) {
                    const polygon = this.state.allFeatures.features.find((i) => {
                        var _a, _b, _c;
                        return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === ((_b = f.properties._dynamic) === null || _b === void 0 ? void 0 : _b.polygon_id) &&
                            ((_c = i.properties._dynamic) === null || _c === void 0 ? void 0 : _c.type) === 'shop-custom';
                    });
                    if (polygon) {
                        this.map.setFeatureState({
                            source: 'main',
                            id: polygon.id,
                        }, {
                            active: true,
                        });
                    }
                }
            }
        }
        this.activePolygonsAmenity = amenityId;
    }
    handlePoiVisibility() {
        // proximiio-pois-icons, proximiio-pois-labels, 'pois-icons', 'pois-labels'
        const layers = ['proximiio-pois-icons', 'proximiio-pois-labels', 'pois-icons', 'pois-labels'];
        if (this.defaultOptions.initPolygons) {
            layers.push('poi-custom-icons', 'shop-labels');
        }
        layers.forEach((layer) => {
            if (this.map.getLayer(layer)) {
                setTimeout(() => {
                    const l = this.map.getLayer(layer);
                    if (l) {
                        const filters = [...l.filter];
                        const visibilityFilter = filters.findIndex((f) => f[1][1] === 'visibility');
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
                        this.state.style.getLayer(layer).filter = filters;
                        this.map.setFilter(layer, filters);
                    }
                });
            }
        });
        this.state.style.notify('filter-change');
    }
    onToggleHiddenPois() {
        this.handlePoiVisibility();
    }
    onSetPerson(lat, lng, level, id) {
        const person = new PersonModel({ lat, lng, level, id });
        this.state = Object.assign(Object.assign({}, this.state), { persons: [person] });
        this.initPersonsMap();
    }
    onAddPerson(lat, lng, level, id) {
        const person = new PersonModel({ lat, lng, level, id });
        this.state.persons = [...this.state.persons, person];
        this.initPersonsMap();
    }
    onUpdatePerson(person, lat, lng, level) {
        person.updatePosition({ lat, lng, level });
        this.initPersonsMap();
    }
    initPersonsMap() {
        const map = this.map;
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
        const personsCollection = this.state.persons.map((person) => {
            return point([person.lng, person.lat], {
                level: person.level,
            });
        });
        this.state.style.sources['persons-source'].data = {
            type: 'FeatureCollection',
            features: personsCollection,
        };
        this.onPersonUpdateListener.next(this.state.persons);
    }
    prepareStyle(style) {
        style.setSource('main', this.geojsonSource);
        style.setSource('synthetic', this.syntheticSource);
        style.setSource('route', this.routingSource);
        style.setSource('clusters', this.clusterSource);
        style.setLevel(0);
    }
    onRouteChange(event) {
        return __awaiter(this, void 0, void 0, function* () {
            if (event === 'loading-start') {
                this.state = Object.assign(Object.assign({}, this.state), { loadingRoute: true });
                return;
            }
            if (event === 'loading-finished') {
                if (this.routingSource.route) {
                    this.currentStep = 0;
                    const routeStart = this.routingSource.lines[0];
                    const textNavigation = {
                        steps: this.routingSource.steps,
                        destination: this.endPoint,
                        start: this.startPoint,
                    };
                    this.state = Object.assign(Object.assign({}, this.state), { loadingRoute: false, textNavigation });
                    if (this.defaultOptions.showLevelDirectionIcon) {
                        this.addDirectionFeatures();
                    }
                    if (this.defaultOptions.animatedRoute || this.defaultOptions.routeAnimation.enabled) {
                        if (this.defaultOptions.animatedRoute) {
                            console.log(`animatedRoute property is deprecated, please use routeAnimation.enabled instead!`);
                        }
                        this.animateRoute();
                    }
                    if (this.defaultOptions.forceFloorLevel !== null && this.defaultOptions.forceFloorLevel !== undefined) {
                        this.routingSource.data.features = this.routingSource.data.features.map((f) => {
                            if (f.properties.level !== this.defaultOptions.forceFloorLevel) {
                                f.properties.level = this.defaultOptions.forceFloorLevel;
                            }
                            return f;
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
                    if (this.defaultOptions.sendAnalytics) {
                        const logger = new WayfindingLogger({
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
                            route: this.routingSource.points.map((p) => [
                                p.geometry.coordinates[0],
                                p.geometry.coordinates[1],
                                p.properties.level,
                            ]),
                            rerouted: false,
                        });
                        yield logger.save();
                    }
                }
                return;
            }
            if (event === 'route-undefined') {
                console.log('route not found');
                this.state = Object.assign(Object.assign({}, this.state), { loadingRoute: false });
                this.onRouteFailedListener.next('route not found');
                return;
            }
            const style = this.state.style;
            style.setSource('route', this.routingSource);
            this.state = Object.assign(Object.assign({}, this.state), { style });
            this.updateMapSource(this.routingSource);
        });
    }
    onSourceChange() {
        this.state = Object.assign(Object.assign({}, this.state), { style: this.state.style });
        this.updateMapSource(this.geojsonSource);
        // this.routingSource.routing.setData(this.geojsonSource.collection)
        this.updateCluster();
    }
    onSyntheticChange() {
        this.state.style.setSource('synthetic', this.syntheticSource);
        this.updateMapSource(this.syntheticSource);
    }
    updateMapSource(source) {
        const map = this.map;
        if (map && map.getSource(source.id)) {
            const mapSource = map.getSource(source.id);
            if (mapSource) {
                mapSource.setData(source.data);
            }
        }
    }
    onStyleSelect(style) {
        const map = this.map;
        if (map) {
            this.prepareStyle(style);
            map.setStyle(style.json);
        }
        this.state = Object.assign(Object.assign({}, this.state), { style });
    }
    onStyleChange(event, data) {
        const map = this.map;
        if (map) {
            if (event === 'overlay-toggled') {
                const overlay = this.state.style.overlay ? 'visible' : 'none';
                map.setLayoutProperty('main-polygon-fill', 'visibility', overlay);
                map.setLayoutProperty('main-polygon-outline', 'visibility', overlay);
            }
            if (event === 'segments-toggled') {
                const segments = this.state.style.segments ? 'visible' : 'none';
                map.setLayoutProperty('main-segment-fill', 'visibility', segments);
                map.setLayoutProperty('main-segment-outline', 'visibility', segments);
            }
            if (event === 'routable-toggled') {
                const routables = this.state.style.segments ? 'visible' : 'none';
                map.setLayoutProperty('main-routable-fill', 'visibility', routables);
                map.setLayoutProperty('main-routable-outline', 'visibility', routables);
            }
            if (event === 'cluster-toggled') {
                const clusters = this.state.style.cluster ? 'visible' : 'none';
                map.setLayoutProperty('clusters-circle', 'visibility', clusters);
            }
        }
        if (event === 'layer-update' && data) {
            const { layer, changes } = data;
            const layoutChanges = changes.filter((diff) => diff.kind === 'E' && diff.path[0] === 'layout');
            const paintChanges = changes.filter((diff) => diff.kind === 'E' && diff.path[0] === 'paint');
            // tslint:disable-next-line:no-shadowed-variable
            const map = this.map;
            if (map) {
                layoutChanges.forEach((change) => {
                    if (change.kind === 'E') {
                        map.setLayoutProperty(layer.id, change.path[1], change.rhs);
                    }
                });
                paintChanges.forEach((change) => {
                    if (change.kind === 'E') {
                        map.setPaintProperty(layer.id, change.path[1], change.rhs);
                    }
                });
            }
        }
        if (event === 'filter-change') {
            // tslint:disable-next-line:no-shadowed-variable
            const map = this.map;
            this.state.style.getLayers('main').forEach((layer) => {
                if (map.getLayer(layer.id)) {
                    map.removeLayer(layer.id);
                }
                // @ts-ignore
                map.addLayer(layer);
            });
        }
        // @ts-ignore
        this.map.setStyle(this.state.style);
        this.state = Object.assign(Object.assign({}, this.state), { style: this.state.style });
    }
    onToggleRasterFloorplans() {
        this.imageSourceManager.enabled = !this.imageSourceManager.enabled;
        const map = this.map;
        if (map) {
            this.imageSourceManager.setLevel(map, this.state.floor.level, this.state);
        }
    }
    updateCluster() {
        const map = this.map;
        if (map) {
            const data = {
                type: 'FeatureCollection',
                features: this.geojsonSource.data.features
                    .filter((f) => f.isPoint && f.hasLevel(this.state.floor.level))
                    .map((f) => f.json),
            };
            const source = map.getSource('clusters');
            if (source) {
                source.setData(data);
            }
        }
    }
    onPlaceSelect(place, zoomIntoPlace, floorLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            this.state = Object.assign(Object.assign({}, this.state), { place });
            const floors = yield getPlaceFloors(place.id);
            const state = { floors: floors.sort((a, b) => a.level - b.level) };
            if (floors.length > 0) {
                const defaultFloor = floorLevel
                    ? floors.find((floor) => floor.level === floorLevel)
                    : floors.find((floor) => floor.level === 0);
                if (defaultFloor) {
                    state.floor = defaultFloor;
                }
                else {
                    state.floor = floors[0];
                }
            }
            this.state = Object.assign(Object.assign({}, this.state), state);
            const map = this.map;
            if (map && zoomIntoPlace) {
                map.flyTo({ center: [place.location.lng, place.location.lat] });
            }
            this.onPlaceSelectListener.next(place);
            if (state.floor) {
                this.onFloorSelect(state.floor);
            }
        });
    }
    onFloorSelect(floor) {
        var _a;
        const map = this.map;
        const route = this.routingSource.levelPoints && this.routingSource.levelPoints[floor.level]
            ? this.routingSource.levelPoints[floor.level]
            : null;
        if (map) {
            this.state.style.setLevel(floor.level);
            map.setStyle(this.state.style);
            setTimeout(() => {
                [...this.state.style.getLayers('main'), ...this.state.style.getLayers('route')].forEach((layer) => {
                    if (map.getLayer(layer.id)) {
                        map.setFilter(layer.id, layer.filter);
                    }
                });
                this.imageSourceManager.setLevel(map, floor.level, this.state);
            });
            if (route) {
                const routePoints = this.routingSource.route[`path-part-${this.currentStep}`] &&
                    ((_a = this.routingSource.route[`path-part-${this.currentStep}`].properties) === null || _a === void 0 ? void 0 : _a.level) === floor.level
                    ? this.routingSource.route[`path-part-${this.currentStep}`]
                    : lineString(this.routingSource.levelPoints[floor.level].map((i) => i.geometry.coordinates));
                const lengthInMeters = length(routePoints, { units: 'kilometers' }) * 1000;
                const boundingBox = bbox(routePoints);
                if (lengthInMeters >= this.defaultOptions.minFitBoundsDistance) {
                    // @ts-ignore;
                    map.fitBounds(boundingBox, {
                        padding: this.defaultOptions.fitBoundsPadding,
                        bearing: this.map.getBearing(),
                        pitch: this.map.getPitch(),
                    });
                }
                else {
                    // @ts-ignore
                    this.map.flyTo({ center: center(routePoints).geometry.coordinates });
                }
            }
            if (this.defaultOptions.isKiosk && map.getLayer('my-location-layer')) {
                const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('my-location-layer', filter);
                this.state.style.getLayer('my-location-layer').filter = filter;
            }
            if (this.defaultOptions.useGpsLocation && this.startPoint) {
                this.startPoint.properties = Object.assign(Object.assign({}, this.startPoint.properties), { level: floor.level });
            }
            if (map.getLayer('persons-layer')) {
                const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('persons-layer', filter);
                this.state.style.getLayer('persons-layer').filter = filter;
            }
            if (this.defaultOptions.showLevelDirectionIcon && map.getLayer('direction-halo-layer')) {
                const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('direction-halo-layer', filter);
                this.state.style.getLayer('direction-halo-layer').filter = filter;
                map.setFilter('direction-popup-layer', filter);
                this.state.style.getLayer('direction-popup-layer').filter = filter;
            }
            if (map.getLayer('highlight-icon-layer')) {
                const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('highlight-icon-layer', filter);
                this.state.style.getLayer('highlight-icon-layer').filter = filter;
            }
        }
        this.state = Object.assign(Object.assign({}, this.state), { floor, style: this.state.style });
        if (this.defaultOptions.animatedRoute || (this.defaultOptions.routeAnimation.enabled && route)) {
            if (this.defaultOptions.animatedRoute) {
                console.log(`animatedRoute property is deprecated, please use routeAnimation.enabled instead!`);
            }
            this.animateRoute();
        }
        this.updateCluster();
        this.onFloorSelectListener.next(floor);
    }
    onRouteUpdate(start, finish) {
        this.startPoint = start;
        this.endPoint = finish;
        try {
            if (finish && this.defaultOptions.initPolygons) {
                this.handlePolygonSelection(finish);
            }
            if (finish && this.defaultOptions.animatedRoute) {
                if (this.defaultOptions.animatedRoute) {
                    console.log(`animatedRoute property is deprecated, please use routeAnimation.enabled instead!`);
                }
                clearInterval(this.animationInterval);
            }
            this.routingSource.update(start, finish);
        }
        catch (e) {
            console.log('catched', e);
        }
        this.state = Object.assign(Object.assign({}, this.state), { style: this.state.style });
    }
    onRouteCancel() {
        this.state = Object.assign(Object.assign({}, this.state), { textNavigation: null });
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
                console.log(`animatedRoute property is deprecated, please use routeAnimation.enabled instead!`);
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
    }
    centerOnPoi(poi) {
        if (this.state.floor.level !== parseInt(poi.properties.level, 0)) {
            const floor = this.state.floors.find((f) => f.level === poi.properties.level);
            if (floor)
                this.onFloorSelect(floor);
        }
        if (this.map) {
            this.map.flyTo({ center: poi.geometry.coordinates });
        }
    }
    centerOnRoute(route) {
        var _a;
        if (route && route.properties) {
            if (this.state.floor.level !== +route.properties.level) {
                const floor = this.state.floors.find((f) => f.level === +route.properties.level);
                if (floor)
                    this.onFloorSelect(floor);
            }
            if (this.map) {
                const routePoints = this.routingSource.route[`path-part-${this.currentStep}`] &&
                    ((_a = this.routingSource.route[`path-part-${this.currentStep}`].properties) === null || _a === void 0 ? void 0 : _a.level) === this.state.floor.level
                    ? this.routingSource.route[`path-part-${this.currentStep}`]
                    : lineString(this.routingSource.levelPoints[this.state.floor.level].map((i) => i.geometry.coordinates));
                const lengthInMeters = length(routePoints, { units: 'kilometers' }) * 1000;
                const boundingBox = bbox(routePoints);
                if (lengthInMeters >= this.defaultOptions.minFitBoundsDistance) {
                    // @ts-ignore;
                    this.map.fitBounds(boundingBox, {
                        padding: this.defaultOptions.fitBoundsPadding,
                        bearing: this.map.getBearing(),
                        pitch: this.map.getPitch(),
                    });
                }
                else {
                    // @ts-ignore
                    this.map.flyTo({ center: center(routePoints).geometry.coordinates });
                }
            }
        }
    }
    centerOnCoords(lat, lng, zoom) {
        if (this.map) {
            this.map.flyTo({ center: [lng, lat], zoom: zoom ? zoom : 18 });
        }
    }
    updateImages() {
        this.state.amenities.forEach((amenity) => {
            this.amenityIds.push(amenity.id);
            if (amenity.icon) {
                this.map.loadImage(amenity.icon, (error, image) => {
                    if (error)
                        throw error;
                    this.map.addImage(amenity.id, image);
                });
            }
        });
    }
    getUpcomingFloorNumber(way) {
        if (this.routingSource.lines && this.routingSource.route) {
            const currentRouteIndex = this.routingSource.lines.findIndex((route) => +route.properties.level === this.state.floor.level);
            const currentRoute = this.routingSource.lines[currentRouteIndex];
            const nextRouteIndex = this.routingSource.lines.findIndex((route) => {
                if (way === 'up') {
                    return +route.properties.level > currentRoute.properties.level;
                }
                else {
                    return +route.properties.level < currentRoute.properties.level;
                }
            });
            const nextRoute = this.routingSource.lines[nextRouteIndex];
            // return currentRouteIndex !== -1 && nextRoute ? +nextRoute.properties.level : way === 'up' ? this.state.floor.level + 1 : this.state.floor.level - 1;
            return nextRoute &&
                ((way === 'up' && +nextRoute.properties.level > this.state.floor.level) ||
                    (way === 'down' && +nextRoute.properties.level < this.state.floor.level))
                ? +nextRoute.properties.level
                : this.state.floor.level;
        }
    }
    getClosestFeature(amenityId, fromFeature) {
        let sameLevelfeatures = this.state.allFeatures.features.filter((i) => i.properties.amenity === amenityId &&
            i.geometry.type === 'Point' &&
            i.properties.level === (fromFeature ? fromFeature.properties.level : this.startPoint.properties.level));
        let features = this.state.allFeatures.features.filter((i) => i.properties.amenity === amenityId && i.geometry.type === 'Point');
        if (this.defaultOptions.defaultPlaceId) {
            sameLevelfeatures = sameLevelfeatures.filter((i) => i.properties.place_id === this.defaultOptions.defaultPlaceId);
            features = features.filter((i) => i.properties.place_id === this.defaultOptions.defaultPlaceId);
        }
        const targetPoint = point(fromFeature ? fromFeature.geometry.coordinates : this.startPoint.geometry.coordinates);
        if (sameLevelfeatures.length > 0 || features.length > 0) {
            return nearestPoint(targetPoint, featureCollection(sameLevelfeatures.length > 0 ? sameLevelfeatures : features));
        }
        else {
            return false;
        }
    }
    getFloorName(floor) {
        if (floor.metadata && floor.metadata['title_' + this.defaultOptions.language]) {
            return floor.metadata['title_' + this.defaultOptions.language];
        }
        else {
            return floor.name;
        }
    }
    /**
     *  @memberof Map
     *  @name getMapboxInstance
     *  @returns returns mapbox instance
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapboxInstance();
     */
    getMapboxInstance() {
        return this.map;
    }
    /**
     *  @memberof Map
     *  @name getMapState
     *  @returns returns map state
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapState();
     */
    getMapState() {
        return this.state;
    }
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
    getMapReadyListener() {
        return this.onMapReadyListener;
    }
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
    setLanguage(language) {
        this.defaultOptions.language = language;
        this.onFeaturesChange();
    }
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
    setPlace(placeId, zoomIntoPlace, floorLevel) {
        return __awaiter(this, void 0, void 0, function* () {
            const place = yield getPlaceById(placeId);
            const shouldZoom = typeof zoomIntoPlace !== 'undefined' ? zoomIntoPlace : true;
            yield this.onPlaceSelect(place, shouldZoom, floorLevel);
            return place;
        });
    }
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
    getPlaceSelectListener() {
        return this.onPlaceSelectListener;
    }
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
    setFloorById(floorId) {
        const floor = this.state.floors.filter((f) => f.id === floorId)
            ? this.state.floors.filter((f) => f.id === floorId)[0]
            : this.state.floor;
        if (floor) {
            this.onFloorSelect(new FloorModel(floor));
        }
        return floor;
    }
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
    setFloorByLevel(level) {
        const floor = this.state.floors.filter((f) => f.level === level)
            ? this.state.floors.filter((f) => f.level === level)[0]
            : this.state.floor;
        if (floor) {
            this.onFloorSelect(new FloorModel(floor));
        }
        return floor;
    }
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
    setFloorByWay(way) {
        let floor;
        let nextLevel = way === 'up' ? this.state.floor.level + 1 : this.state.floor.level - 1;
        if (this.routingSource.route) {
            nextLevel = this.getUpcomingFloorNumber(way);
        }
        floor = this.state.floors.filter((f) => f.level === nextLevel)
            ? this.state.floors.filter((f) => f.level === nextLevel)[0]
            : this.state.floor;
        if (floor) {
            this.onFloorSelect(new FloorModel(floor));
        }
        return floor;
    }
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
    getFloorSelectListener() {
        return this.onFloorSelectListener;
    }
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
    findRouteByIds(idTo, idFrom, accessibleRoute, wayfindingConfig) {
        const fromFeature = idFrom
            ? this.state.allFeatures.features.find((f) => f.id === idFrom || f.properties.id === idFrom)
            : this.startPoint;
        const toFeature = this.state.allFeatures.features.find((f) => f.id === idTo || f.properties.id === idTo);
        this.routingSource.toggleAccessible(accessibleRoute);
        if (wayfindingConfig) {
            this.routingSource.setConfig(wayfindingConfig);
        }
        this.onRouteUpdate(fromFeature, toFeature);
    }
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
    findRouteByTitle(titleTo, titleFrom, accessibleRoute, wayfindingConfig) {
        const fromFeature = titleFrom
            ? this.state.allFeatures.features.find((f) => f.properties.title === titleFrom)
            : this.startPoint;
        const toFeature = this.state.allFeatures.features.find((f) => f.properties.title === titleTo);
        this.routingSource.toggleAccessible(accessibleRoute);
        if (wayfindingConfig) {
            this.routingSource.setConfig(wayfindingConfig);
        }
        this.onRouteUpdate(fromFeature, toFeature);
    }
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
    findRouteByCoords(latTo, lngTo, levelTo, latFrom, lngFrom, levelFrom, accessibleRoute, wayfindingConfig) {
        const fromFeature = latFrom && lngFrom && levelFrom
            ? feature({ type: 'Point', coordinates: [lngFrom, latFrom] }, { level: levelFrom })
            : this.startPoint;
        const toFeature = feature({ type: 'Point', coordinates: [lngTo, latTo] }, { level: levelTo });
        this.routingSource.toggleAccessible(accessibleRoute);
        if (wayfindingConfig) {
            this.routingSource.setConfig(wayfindingConfig);
        }
        this.onRouteUpdate(fromFeature, toFeature);
    }
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
    findRouteToNearestFeature(amenityId, idFrom, accessibleRoute, wayfindingConfig) {
        const fromFeature = idFrom
            ? this.state.allFeatures.features.find((f) => f.id === idFrom || f.properties.id === idFrom)
            : this.startPoint;
        const toFeature = this.getClosestFeature(amenityId, fromFeature);
        if (toFeature) {
            this.routingSource.toggleAccessible(accessibleRoute);
            if (wayfindingConfig) {
                this.routingSource.setConfig(wayfindingConfig);
            }
            this.onRouteUpdate(fromFeature, toFeature);
        }
        else {
            throw new Error(`Feature not found`);
        }
    }
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
    cancelRoute() {
        this.onRouteCancel();
    }
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
    setNavStep(step) {
        let newStep = 0;
        if (isNumber(step)) {
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
        if (this.routingSource && this.routingSource.route && this.routingSource.route[`path-part-${newStep}`]) {
            this.currentStep = newStep;
            this.centerOnRoute(this.routingSource.route[`path-part-${newStep}`]);
            this.onStepSetListener.next(this.currentStep);
            return step;
        }
        else {
            console.error(`Route not found`);
        }
    }
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
    getNavStepSetListener() {
        return this.onStepSetListener;
    }
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
    getTBTNav() {
        return this.state.textNavigation;
    }
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
    getRouteFoundListener() {
        return this.onRouteFoundListener;
    }
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
    getRouteFailedListener() {
        return this.onRouteFailedListener;
    }
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
    getRouteCancelListener() {
        return this.onRouteCancelListener;
    }
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
    centerToRoute() {
        if (this.routingSource && this.routingSource.route && this.routingSource.route['path-part-0']) {
            const routeStart = this.routingSource.route['path-part-0'];
            this.centerOnRoute(routeStart);
            return routeStart;
        }
        else {
            throw new Error(`Route not found`);
        }
    }
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
    centerToFeature(featureId) {
        const featureVar = this.state.allFeatures.features.find((f) => f.id === featureId || f.properties.id === featureId);
        if (featureVar) {
            this.centerOnPoi(featureVar);
            return featureVar;
        }
        else {
            throw new Error(`Feature not found`);
        }
    }
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
    centerToCoordinates(lat, lng, zoom) {
        this.centerOnCoords(lat, lng, zoom);
    }
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
    addCustomFeature(title, level, lat, lng, icon, id, placeId, floorId, properties, isTemporary) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.onAddNewFeature(title, +level, +lat, +lng, icon, id, placeId, floorId, properties, isTemporary);
        });
    }
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
    updateFeature(id, title, level, lat, lng, icon, placeId, floorId, properties, isTemporary) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.onUpdateFeature(id, title, level, lat, lng, icon, placeId, floorId, properties, isTemporary);
        });
    }
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
    deleteFeature(id, isTemporary) {
        return this.onDeleteFeature(id, isTemporary);
    }
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
    getCustomFeaturesList() {
        return this.state.dynamicFeatures;
    }
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
    getFeatureAddListener() {
        return this.onFeatureAddListener;
    }
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
    getFeatureUpdateListener() {
        return this.onFeatureUpdateListener;
    }
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
    getFeatureDeleteListener() {
        return this.onFeatureDeleteListener;
    }
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
    setKiosk(lat, lng, level) {
        if (this.defaultOptions.isKiosk) {
            this.onSetKiosk(lat, lng, level);
        }
        else {
            throw new Error(`Map is not initiated as kiosk`);
        }
    }
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
    setBoundsPadding(padding) {
        this.defaultOptions.fitBoundsPadding = padding;
    }
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
    setFiltering(options) {
        if (options) {
            this.defaultOptions.defaultFilter = options;
        }
        else {
            delete this.defaultOptions.defaultFilter;
        }
        this.onRefetch();
    }
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
    setFeatureFilter(query, inverted) {
        this.onSetFeatureFilter(query, inverted);
    }
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
    removeFeatureFilter(query, inverted) {
        this.onRemoveFeatureFilter(query, inverted);
    }
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
    hidePois() {
        this.onHidePois();
    }
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
    resetFeatureFilters() {
        this.onResetFeatureFilters();
    }
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
    setAmenityFilter(amenityId, category, inverted) {
        if (!category || (category && this.amenityCategories[category])) {
            this.onSetAmenityFilter(amenityId, category, inverted);
        }
        else {
            throw new Error(`It seems there is no '${category}' amenities category created, please set category with 'setAmenitiesCategory()' method`);
        }
    }
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
    removeAmenityFilter(amenityId, category, inverted) {
        if (!category || (category && this.amenityCategories[category])) {
            this.onRemoveAmenityFilter(amenityId, category, inverted);
        }
        else {
            throw new Error(`It seems there is no '${category}' amenities category created, please set category with 'setAmenitiesCategory()' method`);
        }
    }
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
    resetAmenityFilters() {
        this.onResetAmenityFilters();
    }
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
    setAmenitiesCategory(id, amenities) {
        this.amenityCategories[id] = {
            amenities,
        };
    }
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
    removeAmenitiesCategory(id) {
        if (this.amenityCategories[id]) {
            delete this.amenityCategories[id];
        }
        else {
            throw new Error(`It seems there is no '${id}' amenities category created, please set category with 'setAmenitiesCategory()' method`);
        }
    }
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
    resetAmenitiesCategory() {
        this.amenityCategories = {};
    }
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
    getPolygonClickListener() {
        return this.onPolygonClickListener;
    }
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
    getPoiClickListener() {
        return this.onPoiClickListener;
    }
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
    setPerson(lat, lng, level, id) {
        this.onSetPerson(lat, lng, level, id);
    }
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
    upsertPerson(lat, lng, level, id) {
        const person = id ? this.state.persons.find((p) => p.id === id) : null;
        if (person) {
            this.onUpdatePerson(person, lat, lng, level);
        }
        else {
            this.onAddPerson(lat, lng, level, id);
        }
    }
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
    getPersonUpdateListener() {
        return this.onPersonUpdateListener;
    }
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
    toggleHiddenPois() {
        this.onToggleHiddenPois();
    }
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
    toggleRasterFloorplans() {
        this.onToggleRasterFloorplans();
    }
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
    setFeaturesHighlight(features, color, radius, blur) {
        this.onSetFeaturesHighlight(features, color, radius, blur);
    }
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
    refetch() {
        this.onRefetch();
    }
}
/* TODO
 * - check clusters
 * */
