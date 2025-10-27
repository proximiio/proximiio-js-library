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
import { axios, optimizeFeatures, pointInBounds } from '../../common';
import { addFeatures, deleteFeatures, getAmenities, getAmenitiesBundle, getFeatures, getFeaturesBundle, } from '../../controllers/geo';
import { PlaceModel } from '../../models/place';
import { FloorModel } from '../../models/floor';
import StyleModel from '../../models/style';
import GeoJSONSource from './sources/geojson_source';
import SyntheticSource from './sources/synthetic_source';
import Feature, { FeatureCollection, Geometry } from '../../models/feature';
import RoutingSource from './sources/routing_source';
import ClusterSource from './sources/cluster_source';
import ImageSourceManager from './sources/image_source_manager';
import { filterByAmenity, getBase64FromImage, getImageFromBase64, throttle, uuidv4 } from '../../common';
import { chevron, pulsingDot, person as personIcon, floorchangeUpImage, floorchangeDownImage, popupImage, routeStartSvg, routeFinishSvg, createHeadingArrow, staticDot, headingArc, } from './icons';
import { getFloors, getFloorsBundle, getPlaceFloors, getPlaceFloorsBundle } from '../../controllers/floors';
import { getPlaceById, getPlaceByIdBundle, getPlaces, getPlacesBundle } from '../../controllers/places';
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
import lineSlice from '@turf/line-slice';
import nearestPoint from '@turf/nearest-point';
import turfBearing from '@turf/bearing';
import circle from '@turf/circle';
import { isNumber, lineString, point, feature, featureCollection, polygon as turfPolygon, points } from '@turf/helpers';
import WayfindingLogger from '../logger/wayfinding';
import { translations } from './i18n';
import { getStyle, getStyleBundle, getStyles, getStylesBundle } from '../../controllers/style';
import { getKiosks, getKiosksBundle } from '../../controllers/kiosks';
import { Protocol, PMTiles } from 'pmtiles';
import distance from '@turf/distance';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import getCurrentStepIndex from './getCurrentStep';
import { getAds, getAdsBundle } from '../../controllers/ads';
export const globalState = {
    initializing: true,
    floor: new FloorModel({}),
    floors: [],
    allFloors: [],
    place: new PlaceModel({}),
    places: [],
    kiosks: [],
    style: new StyleModel({}),
    styles: [],
    amenities: [],
    features: new FeatureCollection({}),
    optimizedFeatures: new FeatureCollection({}),
    dynamicFeatures: new FeatureCollection({}),
    allFeatures: new FeatureCollection({}),
    latitude: 0,
    longitude: 0,
    loadingRoute: false,
    noPlaces: false,
    textNavigation: null,
    persons: [],
    user: null,
    ads: [],
};
export class Map {
    constructor(options) {
        this.geojsonSource = new GeoJSONSource(new FeatureCollection({}));
        this.syntheticSource = new SyntheticSource(new FeatureCollection({}));
        this.routingSource = new RoutingSource();
        this.clusterSource = new ClusterSource();
        this.imageSourceManager = new ImageSourceManager();
        this.onDataFetchedListener = new CustomSubject();
        this.onMapLoadListener = new CustomSubject();
        this.onMapReadyListener = new CustomSubject();
        this.onMainSourceLoadedListener = new CustomSubject();
        this.onMapFailedListener = new CustomSubject();
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
        this.onStopSetListener = new CustomSubject();
        this.onPositionSetListener = new CustomSubject();
        this.onArrivalListener = new CustomSubject();
        this.defaultOptions = {
            selector: 'proximiioMap',
            allowNewFeatureModal: false,
            newFeatureModalEvent: 'click',
            enableTBTNavigation: true,
            landmarkTBTNavigation: false,
            zoomIntoPlace: true,
            defaultFloorLevel: 0,
            isKiosk: false,
            initPolygons: false,
            polygonsOptions: {
                defaultPolygonColor: '#dbd7e8',
                hoverPolygonColor: '#a58dfa',
                selectedPolygonColor: '#6945ed',
                disabledPolygonColor: '#ccc',
                defaultLabelColor: '#6945ed',
                hoverLabelColor: '#fff',
                selectedLabelColor: '#fff',
                disabledLabelColor: '#8e8e8e',
                defaultPolygonHeight: 3,
                hoverPolygonHeight: 3,
                selectedPolygonHeight: 3,
                disabledPolygonHeight: 3,
                base: 0,
                opacity: 1,
                removeOriginalPolygonsLayer: true,
                minZoom: 17,
                maxZoom: 24,
                labelMinZoom: 17,
                labelMaxZoom: 24,
                iconMinZoom: 17,
                iconMaxZoom: 24,
                labelFontSize: [
                    'interpolate',
                    ['exponential', 1.75],
                    ['zoom'],
                    18,
                    [
                        'interpolate',
                        ['linear'],
                        ['/', ['get', 'length', ['get', '_dynamic']], ['/', ['length', ['get', 'title']], 1.5]],
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
                        ['/', ['get', 'length', ['get', '_dynamic']], ['/', ['length', ['get', 'title']], 1.5]],
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
                textFont: ['Quicksand Bold', 'Noto Sans Arabic Bold'],
                symbolPlacement: 'line-center',
                autoLabelLines: true,
                adaptiveLabelOpacity: false,
                adaptiveMaxPitch: 30,
                drawRouteUnderPolygons: false,
                handleDisabledPolygons: true,
            },
            considerVisibilityParam: true,
            fitBoundsPadding: 250,
            minFitBoundsDistance: 15,
            showLevelDirectionIcon: false,
            levelDirectionPopupImage: popupImage,
            levelDirectionOutlineColor: '#000',
            showRasterFloorplans: false,
            animatedRoute: false,
            animationLooping: true,
            routeAnimation: {
                enabled: false,
                type: 'dash',
                looping: true,
                followRoute: true,
                followRouteAngle: false,
                durationMultiplier: 1,
                fps: 120,
                pointIconSize: 1,
                pointIconMarkerSize: 40,
                pointColor: '#1d8a9f',
                pointRadius: 8,
                lineColor: '#6945ed',
                lineWidth: 5,
                lineOpacity: 0.6,
                minzoom: 17,
                maxzoom: 24,
                iconUseLerp: false,
                iconLerpTolerance: 0.1,
                cameraUseLerp: false,
                cameraLerpTolerance: 0.05,
                autoRestart: true,
                dashKeepOriginalRouteLayer: false,
                cityRouteSpeedMultiplier: 5,
                cityRouteMaxDuration: 5,
                autoStart: true,
                autoContinue: true,
                autoContinueCityRoute: false,
                cityRouteZoom: 15,
                mallRouteZoom: 18,
                mallEntryLevel: 0,
                lineProgress: false,
                showTailSegment: false,
                showCompassDirection: false,
                stepChangeThreshold: 5,
            },
            useRasterTiles: false,
            handleUrlParams: false,
            urlParams: {
                startFeauture: 'startFeature',
                destinationFeature: 'destinationFeature',
                defaultPlace: 'defaultPlace',
                autoRouting: true,
            },
            useGpsLocation: false,
            geolocationControlOptions: {
                autoTrigger: true,
                autoLocate: true,
                position: 'top-right',
                zoom: 17,
            },
            language: 'en',
            routeWithDetails: true,
            blockFeatureClickWhileRouting: false,
            useTimerangeData: false,
            sendAnalytics: true,
            autoLevelChange: false,
            autoRestartAnimationAfterFloorChange: false,
            disableUnavailablePois: false,
            apiPaginate: false,
            bundlePaginate: false,
            customPositionOptions: {
                arrivalThreshold: 3,
                minDistanceToChange: 2,
                aggregatePositionsLimit: 1,
                aggregationResult: 'center',
                animationMinDuration: 300,
                animationMaxDuration: 3000,
                animationDurationPerMeter: 50,
                aggregateFloorChange: true,
                aggregateFloorChangeLimit: 3,
                floorChangeCooldown: 5000,
            },
            // poiIconSize: ['interpolate', ['exponential', 0.5], ['zoom'], 17, 0.1, 22, 0.5],
        };
        this.showStartPoint = false;
        this.amenityIds = [];
        this.filteredFeatures = [];
        this.hiddenFeatures = [];
        this.filteredAmenities = [];
        this.amenityFilters = [];
        this.hiddenAmenities = [];
        this.amenityCategories = {};
        this.selectedPolygons = [];
        this.currentStep = 0;
        this.currentStop = 0;
        this.mainSourceLoaded = false;
        this.pointIconMarker = {};
        this.routeStartMarker = {};
        this.routeFinishMarker = {};
        this.stops = [];
        this.useCustomPosition = false;
        this.customPosition = null;
        this.handleFilterChange = () => {
            // tslint:disable-next-line:no-shadowed-variable
            const map = this.map;
            this.state.style.getLayers('main').forEach((layer) => {
                if (map.getLayer(layer.id)) {
                    map.removeLayer(layer.id);
                }
                // @ts-ignore
                map.addLayer(layer);
            });
            this.updateLayerOpacity();
        };
        // Throttle the event listener
        this.throttledHandleFilterChange = throttle(this.handleFilterChange, 5000); // Adjust the delay as needed
        this.handleControllerError = (err) => {
            this.onMapFailedListener.next({ message: err.message ? err.message : JSON.stringify(err) });
        };
        this.InjectCSS = ({ id, css }) => {
            // Create the css
            const style = document.createElement('style');
            style.id = id;
            style.innerHTML = css;
            const head = document.getElementsByTagName('head')[0];
            head.insertBefore(style, head.firstChild);
        };
        this.createMarkerElement = (className, iconUrl, backgroundSize) => {
            const markerElement = document.createElement('div');
            markerElement.className = className;
            markerElement.style.width = '50px';
            markerElement.style.height = '50px';
            markerElement.style.borderRadius = '50%';
            markerElement.style.backgroundColor = this.defaultOptions.routeAnimation.lineColor || 'black';
            markerElement.style.backgroundImage = `url("${iconUrl}")`;
            markerElement.style.backgroundSize = backgroundSize;
            markerElement.style.backgroundPosition = 'center';
            markerElement.style.backgroundRepeat = 'no-repeat';
            return markerElement;
        };
        this.addMarker = (className, svgIcon, size, coordinates) => {
            const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`;
            const markerElement = this.createMarkerElement(className, iconUrl, size);
            return new maplibregl.Marker({ element: markerElement }).setLngLat(coordinates).addTo(this.map);
        };
        this.addRouteMarkers = () => {
            this.routeStartMarker = this.addMarker('route-start-marker', routeStartSvg, '50%', this.routingSource.points[0].geometry.coordinates);
            this.routeFinishMarker = this.addMarker('route-finish-marker', routeFinishSvg, '30%', this.routingSource.points[this.routingSource.points.length - 1].geometry.coordinates);
        };
        this.removeRouteMarkers = () => {
            if (Object.keys(this.routeStartMarker).length > 0) {
                this.routeStartMarker.remove();
            }
            if (Object.keys(this.routeFinishMarker).length > 0) {
                this.routeFinishMarker.remove();
            }
        };
        this.stopMarkers = [];
        this.addStopMarkers = () => {
            for (const marker of this.stopMarkers) {
                marker.remove();
            }
            for (const [index, stop] of this.stops.entries()) {
                if (stop.properties.level === this.state.floor.level) {
                    const markerElement = document.createElement('div');
                    markerElement.innerHTML = `<p>${index + 1}</p>`;
                    markerElement.className = 'stop-marker';
                    markerElement.style.width = '30px';
                    markerElement.style.height = '30px';
                    markerElement.style.borderRadius = '50%';
                    markerElement.style.backgroundColor = '#fff';
                    const marker = new maplibregl.Marker({ element: markerElement })
                        .setLngLat(stop.geometry.coordinates)
                        .addTo(this.map);
                    this.stopMarkers.push(marker);
                }
            }
            /*this.state.style.addSource('stopMarkers', {
                type: 'geojson',
                data: {
                  type: 'FeatureCollection',
                  features: [],
                },
              });
        
              this.state.style.addLayer(
                {
                  id: 'pointAlong',
                  type: 'circle',
                  source: 'pointAlong',
                  minzoom: this.defaultOptions.routeAnimation.minzoom,
                  maxzoom: this.defaultOptions.routeAnimation.maxzoom,
                  paint: {
                    'circle-color': this.defaultOptions.routeAnimation.pointColor,
                    'circle-radius': this.defaultOptions.routeAnimation.pointRadius,
                  },
                },
                this.defaultOptions.showLevelDirectionIcon ? 'direction-popup-layer' : 'proximiio-polygons-above-paths',
              );*/
        };
        this.removeStopMarkers = () => {
            for (const marker of this.stopMarkers) {
                marker.remove();
            }
            this.stops = [];
        };
        this.getClosestPointOnPath = (f) => {
            const featurePoint = point([f.geometry.coordinates[0], f.geometry.coordinates[1]]);
            const paths = this.state.allFeatures.features.filter((path) => path.properties.class === 'path' && path.properties.level === f.properties.level);
            let minDist = Infinity;
            let closestSegment = null;
            let finalBearing = null;
            let finalPoint = null;
            paths.forEach((line) => {
                const snapped = nearestPointOnLine(line, featurePoint);
                const dist = distance(featurePoint, snapped);
                if (dist < minDist) {
                    minDist = dist;
                    closestSegment = lineString([featurePoint.geometry.coordinates, snapped.geometry.coordinates]);
                    finalBearing = turfBearing(snapped, featurePoint);
                    snapped.id = 'snapped-path-point';
                    snapped.properties.bearing = finalBearing;
                    snapped.properties.level = f.properties.level;
                    finalPoint = snapped;
                }
            });
            this.state.allFeatures.features = [...this.state.allFeatures.features, finalPoint];
            return finalPoint;
        };
        this.startPointPopup = {};
        this.displayPointOnMap = (p) => {
            if (Object.keys(this.startPointPopup).length > 0) {
                this.startPointPopup.remove();
                this.startPointPopup = {};
            }
            if (this.state.style.sources['user-point']) {
                this.state.style.removeSource('user-point');
            }
            if (this.state.style.getLayer('user-point-layer')) {
                this.state.style.removeLayer('user-point-layer');
            }
            this.state.style.addSource('user-point', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [p],
                },
            });
            const startLayer = {
                id: 'user-point-layer',
                type: 'symbol',
                source: 'user-point',
                layout: {
                    'icon-image': 'pulsing-dot',
                },
                filter: ['all', ['==', ['to-number', ['get', 'level']], p.properties.level]],
            };
            this.state.style.addLayer(startLayer);
            this.startPointPopup = new maplibregl.Popup({
                anchor: 'bottom',
                closeOnClick: false,
                className: 'proximiio-startPoint-popup',
                offset: [0, -15],
            })
                .setLngLat(p.geometry.coordinates)
                .setHTML(translations[this.defaultOptions.language].YOU_ARE_HERE)
                .addTo(this.map);
            const css = `
    .proximiio-startPoint-popup.hidden {
      display: none;
    }
    .proximiio-startPoint-popup .maplibregl-popup-close-button {
      display: none;
    }
    .proximiio-startPoint-popup .maplibregl-popup-content {
      font-family: ${this.defaultOptions.kioskSettings.labelFont
                ? this.defaultOptions.kioskSettings.labelFont
                : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'};
      color: white;
      font-size: 16px;
      border-radius: 12px;
      padding: .6rem .8rem;
      font-weight: 500;
      max-width: 100px;
      text-align: center;
      box-shadow: none;
      background-color: ${this.defaultOptions.kioskSettings.pointColor
                ? `rgb(${this.defaultOptions.kioskSettings.pointColor})`
                : 'rgb(189, 82, 255)'};
    }
    .proximiio-startPoint-popup.maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
      border-top-color: ${this.defaultOptions.kioskSettings.pointColor
                ? `rgb(${this.defaultOptions.kioskSettings.pointColor})`
                : 'rgb(189, 82, 255)'};
      margin-top: -1px;
      border-top-width: 25px;
      border-left-width: 15px;
      border-right-width: 15px;
    }
  `;
            if (!document.getElementById('proximiio-startPoint-popup-css')) {
                this.InjectCSS({ id: 'proximiio-startPoint-popup-css', css });
            }
            this.map.setStyle(this.state.style);
        };
        this.removeStartPointOnMap = () => {
            if (Object.keys(this.startPointPopup).length > 0) {
                this.startPointPopup.remove();
                this.startPointPopup = {};
            }
            if (this.state.style.sources['user-point']) {
                this.state.style.removeSource('user-point');
            }
            if (this.state.style.getLayer('user-point-layer')) {
                this.state.style.removeLayer('user-point-layer');
            }
            this.map.setStyle(this.state.style);
            const snappedPathPointIndex = this.state.allFeatures.features.findIndex((f) => f.id === 'snapped-path-point');
            if (snappedPathPointIndex !== -1) {
                this.state.allFeatures.features.splice(snappedPathPointIndex, 1);
            }
        };
        this.previousBearing = undefined;
        this.floorChangeBuffer = [];
        this.lastFloorChangeTimestamp = 0;
        this.customPositionBearing = undefined;
        this.customPositionAnimationFrameId = null;
        this.customPostionAnimationStartTime = null;
        this.customPostionAnimationDuration = 1000;
        /**
         * Method for setting custom position
         *  @memberof Map
         *  @name setCustomPosition
         *  @param coordinates [number, number] coordinates for custom position.
         *  @param level {number} level for custom position.
         *  @param recenter {boolean} center to custom position, default true.
         *  @example
         *  const map = new Proximiio.Map();
         *  map.getMapReadyListener().subscribe(ready => {
         *    console.log('map ready', ready);
         *    map.onSetCustomPosition({ coordinates: [17.833135351538658, 48.60678469647394], level: 0});
         *  });
         */
        this.positionsList = [];
        // fix centering in case of kiosk with defined pitch/bearing/etc. in mapbox options
        if (options.isKiosk && options.mapboxOptions && options.kioskSettings && !options.mapboxOptions.center) {
            options.mapboxOptions.center = options.kioskSettings.coordinates;
        }
        const urlParams = Object.assign(Object.assign({}, this.defaultOptions.urlParams), options.urlParams);
        const polygonsOptions = Object.assign(Object.assign({}, this.defaultOptions.polygonsOptions), options.polygonsOptions);
        const routeAnimation = Object.assign(Object.assign({}, this.defaultOptions.routeAnimation), options.routeAnimation);
        const customPositionOptions = Object.assign(Object.assign({}, this.defaultOptions.customPositionOptions), options.customPositionOptions);
        this.defaultOptions = Object.assign(Object.assign({}, this.defaultOptions), options);
        this.defaultOptions.urlParams = urlParams;
        this.defaultOptions.polygonsOptions = polygonsOptions;
        this.defaultOptions.routeAnimation = routeAnimation;
        this.defaultOptions.customPositionOptions = customPositionOptions;
        this.state = globalState;
        if (this.defaultOptions.isKiosk && this.defaultOptions.useGpsLocation) {
            throw new Error(`It's not possible to use both isKiosk and useGpsLocation options as enabled!`);
        }
        if (!this.defaultOptions.polygonLayers || this.defaultOptions.polygonLayers.length === 0) {
            this.defaultOptions.polygonLayers = [Object.assign(Object.assign({}, this.defaultOptions.polygonsOptions), { featureType: 'shop' })];
        }
        else {
            this.defaultOptions.polygonLayers = this.defaultOptions.polygonLayers.map((layer) => {
                return Object.assign(Object.assign({}, this.defaultOptions.polygonsOptions), layer);
            });
        }
        // @ts-ignore
        maplibregl.setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js', true);
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
            yield this.prepareMap();
        });
    }
    cancelObservers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.geojsonSource.off(this.onSourceChange);
            this.syntheticSource.off(this.onSyntheticChange);
            this.state.style.off(this.onStyleChange);
        });
    }
    prepareMap() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let placeParam = null;
            const useBundle = !!this.defaultOptions.bundleUrl;
            if (this.defaultOptions.handleUrlParams) {
                const urlParams = new URLSearchParams(window.location.search);
                placeParam = urlParams.get(this.defaultOptions.urlParams.defaultPlace);
            }
            const places = useBundle
                ? yield getPlacesBundle({ bundleUrl: this.defaultOptions.bundleUrl }).catch((error) => this.handleControllerError(error))
                : yield getPlaces().catch((error) => this.handleControllerError(error));
            const floors = useBundle
                ? yield getFloorsBundle({ bundleUrl: this.defaultOptions.bundleUrl }).catch((error) => this.handleControllerError(error))
                : yield getFloors().catch((error) => this.handleControllerError(error));
            const style = useBundle
                ? yield getStyleBundle({ bundleUrl: this.defaultOptions.bundleUrl }).catch((error) => this.handleControllerError(error))
                : yield getStyle().catch((error) => this.handleControllerError(error));
            const styles = useBundle
                ? yield getStylesBundle({ bundleUrl: this.defaultOptions.bundleUrl }).catch((error) => this.handleControllerError(error))
                : yield getStyles().catch((error) => this.handleControllerError(error));
            if (places && floors && style) {
                const defaultPlace = placeParam
                    ? places.data.find((p) => p.id === placeParam || p.name === placeParam)
                    : places.data.find((p) => p.id === this.defaultOptions.defaultPlaceId);
                const defaultFloor = defaultPlace &&
                    floors.data.find((f) => f.placeId === defaultPlace.id && f.level === this.defaultOptions.defaultFloorLevel);
                const place = places.data.length > 0 ? (defaultPlace ? defaultPlace : places.data[0]) : new PlaceModel({});
                const floor = defaultPlace && floors.data.length > 0
                    ? defaultFloor
                        ? defaultFloor
                        : floors.data.find((f) => f.placeId === defaultPlace.id)[0]
                    : new FloorModel({});
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
                this.prepareStyle(style);
                this.imageSourceManager.enabled = this.defaultOptions.showRasterFloorplans;
                this.imageSourceManager.belowLayer = style.usesPrefixes() ? 'proximiio-floors' : 'floors';
                this.imageSourceManager.initialize({ floors: floors.data });
                this.state = Object.assign(Object.assign({}, this.state), { place, places: places.data, floor, floors: floors.data, allFloors: floors.data, style,
                    styles, latitude: centerVar[1], longitude: centerVar[0], noPlaces: places.data.length === 0 });
                style.on(this.onStyleChange);
                if (this.defaultOptions.pmTilesUrl) {
                    const protocol = new Protocol();
                    maplibregl.addProtocol('pmtiles', protocol.tile);
                    this.pmTilesInstance = new PMTiles(this.defaultOptions.pmTilesUrl);
                    protocol.add(this.pmTilesInstance);
                }
                this.map = new maplibregl.Map(Object.assign(Object.assign({}, this.defaultOptions.mapboxOptions), { container: this.defaultOptions.selector ? this.defaultOptions.selector : 'map', style: this.state.style }));
                if (this.defaultOptions.useRasterTiles) {
                    this.initRasterTiles();
                }
                this.map.on('load', (e) => __awaiter(this, void 0, void 0, function* () {
                    this.onMapLoadListener.next(true);
                    this.map.setCenter(centerVar);
                    yield this.fetch();
                    yield this.onMapReady(e);
                }));
                this.map.on('error', (e) => {
                    this.onMapFailedListener.next({ message: e.message });
                });
                if (this.defaultOptions.allowNewFeatureModal) {
                    this.map.on(this.defaultOptions.newFeatureModalEvent ? this.defaultOptions.newFeatureModalEvent : 'dblclick', (e) => {
                        this.featureDialog(e);
                    });
                }
            }
        });
    }
    fetch() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const useBundle = !!this.defaultOptions.bundleUrl;
            const features = useBundle
                ? yield getFeaturesBundle({
                    initPolygons: this.defaultOptions.initPolygons,
                    polygonLayers: this.defaultOptions.polygonLayers.map((item) => {
                        var _a, _b;
                        item.autoAssign = (_a = item.autoAssign) !== null && _a !== void 0 ? _a : true;
                        item.initOnLevelchangers = (_b = item.initOnLevelchangers) !== null && _b !== void 0 ? _b : false;
                        return item;
                    }),
                    autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
                    hiddenAmenities: this.defaultOptions.hiddenAmenities,
                    useTimerangeData: this.defaultOptions.useTimerangeData,
                    filter: this.defaultOptions.defaultFilter,
                    bundleUrl: this.defaultOptions.bundleUrl,
                    bundlePaginate: this.defaultOptions.bundlePaginate,
                }).catch((error) => this.handleControllerError(error))
                : yield getFeatures({
                    initPolygons: this.defaultOptions.initPolygons,
                    polygonLayers: this.defaultOptions.polygonLayers.map((item) => {
                        var _a, _b;
                        item.autoAssign = (_a = item.autoAssign) !== null && _a !== void 0 ? _a : true;
                        item.initOnLevelchangers = (_b = item.initOnLevelchangers) !== null && _b !== void 0 ? _b : false;
                        return item;
                    }),
                    autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
                    hiddenAmenities: this.defaultOptions.hiddenAmenities,
                    useTimerangeData: this.defaultOptions.useTimerangeData,
                    filter: this.defaultOptions.defaultFilter,
                    featuresMaxBounds: this.defaultOptions.featuresMaxBounds,
                    localSources: this.defaultOptions.localSources,
                    apiPaginate: this.defaultOptions.apiPaginate,
                }).catch((error) => this.handleControllerError(error));
            const amenities = useBundle
                ? yield getAmenitiesBundle({
                    bundleUrl: this.defaultOptions.bundleUrl,
                    amenityIdProperty: this.defaultOptions.amenityIdProperty,
                }).catch((error) => this.handleControllerError(error))
                : yield getAmenities({
                    amenityIdProperty: this.defaultOptions.amenityIdProperty,
                    localSources: this.defaultOptions.localSources,
                }).catch((error) => this.handleControllerError(error));
            const kiosks = useBundle
                ? yield getKiosksBundle({ bundleUrl: this.defaultOptions.bundleUrl }).catch((error) => this.handleControllerError(error))
                : yield getKiosks().catch((error) => this.handleControllerError(error));
            const ads = useBundle
                ? yield getAdsBundle({ bundleUrl: this.defaultOptions.bundleUrl }).catch((error) => this.handleControllerError(error))
                : yield getAds().catch((error) => this.handleControllerError(error));
            if (features && kiosks && ads) {
                const optimizedFeatures = new FeatureCollection({ features: optimizeFeatures(features.features) });
                const levelChangers = features.features.filter((f) => f.properties.type === 'elevator' || f.properties.type === 'escalator' || f.properties.type === 'staircase');
                if (this.defaultOptions.landmarkTBTNavigation) {
                    this.routingSource.setLandmarkTBT(this.defaultOptions.landmarkTBTNavigation);
                    this.routingSource.setPois(optimizedFeatures.features.filter((f) => f.geometry.coordinates && f.geometry.type === 'Point' && f.properties.type === 'poi'));
                    this.routingSource.setLevelChangers(levelChangers);
                }
                this.geojsonSource.fetch(optimizedFeatures);
                this.routingSource.routing.setData(new FeatureCollection(features));
                this.prepareStyle(this.state.style);
                this.state = Object.assign(Object.assign({}, this.state), { initializing: false, kiosks: kiosks.data, amenities,
                    features, ads: ads.data, optimizedFeatures, allFeatures: new FeatureCollection(features), levelChangers: new FeatureCollection({ features: levelChangers }), zoom: this.defaultOptions.zoomLevel ? this.defaultOptions.zoomLevel : (_a = this.defaultOptions.mapboxOptions) === null || _a === void 0 ? void 0 : _a.zoom });
                this.onDataFetchedListener.next(true);
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
                const decodedPopupImage = yield getImageFromBase64(this.defaultOptions.levelDirectionPopupImage);
                map.addImage('chevron_right', decodedChevron);
                map.addImage('pulsing-dot', pulsingDot({
                    rgbValues: this.defaultOptions.kioskSettings.pointColor,
                    pointOutline: this.defaultOptions.kioskSettings.pointOutline,
                }), { pixelRatio: 2 });
                map.addImage('static-dot', staticDot({
                    rgbValues: this.defaultOptions.kioskSettings.pointColor,
                }), { pixelRatio: 2 });
                map.addImage('heading-arc', headingArc({
                    rgbValues: this.defaultOptions.kioskSettings.pointColor,
                }), { pixelRatio: 2 });
                map.addImage('heading-arrow', createHeadingArrow({ arrowSize: 64 }), { pixelRatio: 2 });
                map.addImage('person', decodedPersonIcon);
                map.addImage('floorchange-up-image', decodedFloorchangeUpImage);
                map.addImage('floorchange-down-image', decodedFloorchangeDownImage);
                map.addImage('popup', decodedPopupImage, {
                    // @ts-ignore
                    stretchX: [[60, 120]],
                    stretchY: [[40, 120]],
                    content: [60, 40, 120, 120],
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
                    if (this.defaultOptions.routeAnimation.pointIconUrl) {
                        try {
                            const response = yield map.loadImage(this.defaultOptions.routeAnimation.pointIconUrl);
                            if (response) {
                                map.addImage('pointIcon', response.data);
                            }
                        }
                        catch (e) {
                            console.log(e);
                        }
                    }
                    if (this.defaultOptions.routeAnimation.cityPointIconUrl) {
                        try {
                            const response = yield map.loadImage(this.defaultOptions.routeAnimation.cityPointIconUrl);
                            if (response) {
                                map.addImage('cityPointIcon', response.data);
                            }
                        }
                        catch (e) {
                            console.log(e);
                        }
                    }
                    this.initAnimatedRoute();
                }
                const layers = ['proximiio-pois-icons', 'proximiio-pois-labels', 'pois-icons', 'pois-labels', 'poi-custom-icons'];
                layers.forEach((layer) => {
                    const l = this.map.getLayer(layer);
                    if (l) {
                        const filters = [...l.filter];
                        filters.push(['any', ['!', ['has', 'available']], ['==', ['get', 'available'], true]]);
                        if (this.defaultOptions.hiddenAmenities) {
                            filters.push(['!=', ['get', 'hideIcon'], 'hide']);
                        }
                        this.state.style.getLayer(layer).filter = filters;
                        this.map.setFilter(layer, filters);
                    }
                });
                /*if (this.defaultOptions.hiddenAmenities) {
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
                      const filters = [...(l.filter as maplibregl.FilterSpecification[])];
          
                      filters.push(['!=', ['get', 'hideIcon'], 'hide']);
          
                      this.state.style.getLayer(layer).filter = filters;
                      this.map.setFilter(layer, filters as maplibregl.FilterSpecification);
                    }
                  });
                }*/
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
                if (this.defaultOptions.poiIconSize) {
                    this.state.style.setIconSize(this.defaultOptions.poiIconSize);
                }
                this.onMapReadyListener.next(true);
                setTimeout(() => {
                    map.on('sourcedata', (ev) => {
                        if (ev.sourceId === 'main' && ev.isSourceLoaded && !this.mainSourceLoaded) {
                            this.mainSourceLoaded = true;
                            this.onMainSourceLoadedListener.next(true);
                        }
                    });
                }, 500);
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
                const useBundle = !!this.defaultOptions.bundleUrl;
                const features = useBundle
                    ? yield getFeaturesBundle({
                        initPolygons: this.defaultOptions.initPolygons,
                        polygonLayers: this.defaultOptions.polygonLayers.map((item) => {
                            var _a, _b;
                            item.autoAssign = (_a = item.autoAssign) !== null && _a !== void 0 ? _a : true;
                            item.initOnLevelchangers = (_b = item.initOnLevelchangers) !== null && _b !== void 0 ? _b : false;
                            return item;
                        }),
                        autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
                        hiddenAmenities: this.defaultOptions.hiddenAmenities,
                        useTimerangeData: this.defaultOptions.useTimerangeData,
                        filter: this.defaultOptions.defaultFilter,
                        bundleUrl: this.defaultOptions.bundleUrl,
                        bundlePaginate: this.defaultOptions.bundlePaginate,
                    })
                    : yield getFeatures({
                        initPolygons: this.defaultOptions.initPolygons,
                        polygonLayers: this.defaultOptions.polygonLayers.map((item) => {
                            var _a, _b;
                            item.autoAssign = (_a = item.autoAssign) !== null && _a !== void 0 ? _a : true;
                            item.initOnLevelchangers = (_b = item.initOnLevelchangers) !== null && _b !== void 0 ? _b : false;
                            return item;
                        }),
                        autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
                        hiddenAmenities: this.defaultOptions.hiddenAmenities,
                        useTimerangeData: this.defaultOptions.useTimerangeData,
                        filter: this.defaultOptions.defaultFilter,
                        featuresMaxBounds: this.defaultOptions.featuresMaxBounds,
                        localSources: this.defaultOptions.localSources,
                        apiPaginate: this.defaultOptions.apiPaginate,
                    }).catch((error) => this.handleControllerError(error));
                if (features) {
                    const optimizedFeatures = new FeatureCollection({ features: optimizeFeatures(features.features) });
                    const levelChangers = features.features.filter((f) => f.properties.type === 'elevator' || f.properties.type === 'escalator' || f.properties.type === 'staircase');
                    this.state = Object.assign(Object.assign({}, this.state), { features,
                        optimizedFeatures, allFeatures: new FeatureCollection(features), levelChangers: new FeatureCollection({ features: levelChangers }) });
                    // this.geojsonSource.fetch(this.state.features);
                    this.onFeaturesChange();
                }
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
                if (this.defaultOptions.kioskSettings.showLabel) {
                    if (this.kioskPopup && Object.keys(this.kioskPopup).length > 0) {
                        this.kioskPopup.setLngLat(this.defaultOptions.kioskSettings.coordinates);
                    }
                    else {
                        this.kioskPopup = new maplibregl.Popup({
                            anchor: 'bottom',
                            closeOnClick: false,
                            className: 'proximiio-kiosk-popup',
                            offset: [0, -15],
                        })
                            .setLngLat(this.defaultOptions.kioskSettings.coordinates)
                            .setHTML(translations[this.defaultOptions.language].YOU_ARE_HERE)
                            .addTo(this.map);
                    }
                    const css = `
            .proximiio-kiosk-popup.hidden {
              display: none;
            }
            .proximiio-kiosk-popup .maplibregl-popup-close-button {
              display: none;
            }
            .proximiio-kiosk-popup .maplibregl-popup-content {
              font-family: ${this.defaultOptions.kioskSettings.labelFont
                        ? this.defaultOptions.kioskSettings.labelFont
                        : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'};
              color: white;
              font-size: 16px;
              border-radius: 12px;
              padding: .6rem .8rem;
              font-weight: 500;
              max-width: 100px;
              text-align: center;
              box-shadow: none;
              background-color: ${this.defaultOptions.kioskSettings.pointColor
                        ? `rgb(${this.defaultOptions.kioskSettings.pointColor})`
                        : 'rgb(189, 82, 255)'};
            }
            .proximiio-kiosk-popup.maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
              border-top-color: ${this.defaultOptions.kioskSettings.pointColor
                        ? `rgb(${this.defaultOptions.kioskSettings.pointColor})`
                        : 'rgb(189, 82, 255)'};
              margin-top: -1px;
              border-top-width: 25px;
              border-left-width: 15px;
              border-right-width: 15px;
            }
          `;
                    if (!document.getElementById('proximiio-kiosk-popup-css')) {
                        this.InjectCSS({ id: 'proximiio-kiosk-popup-css', css });
                    }
                }
                if (this.defaultOptions.kioskSettings.showPoint) {
                    this.showStartPoint = true;
                    this.state.style.addSource('my-location', {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: [this.startPoint],
                        },
                    });
                    const kioskLayer = {
                        id: 'my-location-layer',
                        type: 'symbol',
                        source: 'my-location',
                        layout: {
                            'icon-image': 'pulsing-dot',
                        },
                        filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
                    };
                    this.state.style.addLayer(kioskLayer);
                }
                if (this.defaultOptions.routeAnimation.type === 'puck') {
                    const startPointCircle = circle(this.startPoint.geometry.coordinates, this.defaultOptions.routeAnimation.puckRadius ? this.defaultOptions.routeAnimation.puckRadius : 0.002);
                    const startPointCircleHalo = circle(this.startPoint.geometry.coordinates, this.defaultOptions.routeAnimation.puckRadius
                        ? this.defaultOptions.routeAnimation.puckRadius + 0.001
                        : 0.003);
                    this.state.style.addSource('start-point', {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: [startPointCircle],
                        },
                    });
                    this.state.style.addSource('start-point-halo', {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: [startPointCircleHalo],
                        },
                    });
                    const startPointLayer = {
                        id: 'start-point-layer',
                        type: 'fill-extrusion',
                        source: 'start-point',
                        paint: {
                            'fill-extrusion-height': this.defaultOptions.routeAnimation.puckHeight
                                ? this.defaultOptions.routeAnimation.puckHeight
                                : 1.5,
                            'fill-extrusion-color': this.defaultOptions.routeAnimation.puckColor
                                ? this.defaultOptions.routeAnimation.puckColor
                                : 'rgb(189, 82, 255)',
                        },
                        filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
                    };
                    this.state.style.addLayer(startPointLayer, 'proximiio-routing-line-remaining');
                    const startPointHaloLayer = {
                        id: 'start-point-halo-layer',
                        type: 'fill-extrusion',
                        source: 'start-point-halo',
                        paint: {
                            'fill-extrusion-height': 0,
                            'fill-extrusion-color': this.defaultOptions.routeAnimation.puckColor
                                ? this.defaultOptions.routeAnimation.puckColor
                                : 'rgb(189, 82, 255)',
                            'fill-extrusion-opacity': 0.5,
                        },
                        filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
                    };
                    this.state.style.addLayer(startPointHaloLayer);
                }
                this.centerOnPoi(this.startPoint);
            }
        }
    }
    onSetKiosk(lat, lng, level) {
        if (this.map && this.defaultOptions.isKiosk) {
            this.defaultOptions.kioskSettings = Object.assign(Object.assign({}, this.defaultOptions.kioskSettings), { coordinates: [lng, lat], level });
            this.startPoint = point(this.defaultOptions.kioskSettings.coordinates, {
                level: this.defaultOptions.kioskSettings.level,
            });
            if (this.defaultOptions.kioskSettings.showPoint) {
                this.state.style.sources['my-location'].data = {
                    type: 'FeatureCollection',
                    features: [this.startPoint],
                };
                this.map.setFilter('my-location-layer', ['all', ['==', ['to-number', ['get', 'level']], level]]);
            }
            if (this.defaultOptions.routeAnimation.type === 'puck') {
                const startPointCircle = circle(this.startPoint.geometry.coordinates, this.defaultOptions.routeAnimation.puckRadius ? this.defaultOptions.routeAnimation.puckRadius : 0.002);
                const startPointCircleHalo = circle(this.startPoint.geometry.coordinates, this.defaultOptions.routeAnimation.puckRadius ? this.defaultOptions.routeAnimation.puckRadius + 0.001 : 0.003);
                this.state.style.sources['start-point'].data = {
                    type: 'FeatureCollection',
                    features: [startPointCircle],
                };
                this.state.style.sources['start-point-halo'].data = {
                    type: 'FeatureCollection',
                    features: [startPointCircleHalo],
                };
                this.map.setFilter('start-point-layer', ['all', ['==', ['to-number', ['get', 'level']], level]]);
                this.map.setFilter('start-point-halo-layer', ['all', ['==', ['to-number', ['get', 'level']], level]]);
            }
            if (this.kioskPopup) {
                this.kioskPopup.setLngLat(this.startPoint.geometry.coordinates);
            }
            this.map.setStyle(this.state.style);
            this.centerOnPoi(this.startPoint);
        }
    }
    onStopKiosk() {
        if (this.map && this.defaultOptions.isKiosk) {
            this.defaultOptions.isKiosk = false;
            this.startPoint = undefined;
            if (this.kioskPopup) {
                this.kioskPopup.remove();
                this.kioskPopup = undefined;
            }
            if (document.getElementById('proximiio-kiosk-popup-css')) {
                document.getElementById('proximiio-kiosk-popup-css').remove();
            }
            if (this.state.style.sources['my-location']) {
                this.state.style.removeSource('my-location');
            }
            if (this.state.style.getLayer('my-location-layer')) {
                this.state.style.removeLayer('my-location-layer');
            }
            if (this.state.style.sources['start-point']) {
                this.state.style.removeSource('start-point');
            }
            if (this.state.style.getLayer('start-point-layer')) {
                this.state.style.removeLayer('start-point-layer');
            }
            if (this.state.style.sources['start-point-halo']) {
                this.state.style.removeSource('start-point-halo');
            }
            if (this.state.style.getLayer('start-point-halo-layer')) {
                this.state.style.removeLayer('start-point-halo-layer');
            }
            this.map.setStyle(this.state.style);
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
                fitBoundsOptions: {
                    maxZoom: this.defaultOptions.geolocationControlOptions.zoom,
                },
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
                if (this.defaultOptions.geolocationControlOptions.maxBounds &&
                    !pointInBounds([data.coords.longitude, data.coords.latitude], this.defaultOptions.geolocationControlOptions.maxBounds)) {
                    this.map.stop();
                    return;
                }
                this.startPoint = point([data.coords.longitude, data.coords.latitude], {
                    level: this.state.floor.level,
                });
                this.map.flyTo({
                    center: [data.coords.longitude, data.coords.latitude],
                    zoom: this.defaultOptions.geolocationControlOptions.zoom,
                });
                this.setCustomPosition({
                    coordinates: [data.coords.longitude, data.coords.latitude],
                    level: this.state.floor.level,
                    recenter: false,
                    addPositionIcon: false,
                });
            });
            geolocate.on('trackuserlocationstart', (data) => {
                var _a, _b;
                const position = (_b = (_a = data.target) === null || _a === void 0 ? void 0 : _a._lastKnownPosition) === null || _b === void 0 ? void 0 : _b.coords;
                if (position &&
                    this.defaultOptions.geolocationControlOptions.maxBounds &&
                    !pointInBounds([position.longitude, position.latitude], this.defaultOptions.geolocationControlOptions.maxBounds)) {
                    this.map.stop();
                    return;
                }
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
                    'circle-color': this.defaultOptions.levelDirectionOutlineColor,
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
                    'icon-anchor': 'top-left',
                    'text-anchor': 'top-left',
                    'icon-offset': [2.8, 1.2],
                    'text-offset': [2.8, 1.2 - 2.4],
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
            if (i.direction) {
                // Get the first part of the direction string
                const direction = i.direction.split('_')[0];
                // Check if the current step is a level changer and has a valid direction
                if (i.levelChangerId && (direction === 'UP' || direction === 'DOWN')) {
                    // Set the destination level for the level changer
                    i.destinationLevel = array[index + 1] ? (_a = array[index + 1]) === null || _a === void 0 ? void 0 : _a.level : null;
                    return i;
                }
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
                    description: `${translations[this.defaultOptions.language][levelChangerType]} \n ${translations[this.defaultOptions.language][direction]} ${translations[this.defaultOptions.language]['TO']} ${destinationFloor.name ? this.getFloorName(destinationFloor) : levelChanger.destinationLevel} ${translations[this.defaultOptions.language]['FLOOR']}`,
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
    onSetFeaturesHighlight({ features, color, radius, blur, enlargeIcon, opacity, translate, }) {
        const map = this.map;
        const featuresToHiglight = this.state.allFeatures.features.filter((f) => {
            return features.includes(f.id || f.properties.id);
        });
        const poisIconsLayer = this.map.getLayer('proximiio-pois-icons');
        let poisIconsImageSize = this.map.getLayoutProperty('proximiio-pois-icons', 'icon-size');
        if (map) {
            if (enlargeIcon) {
                if (poisIconsImageSize[0] === 'interpolate') {
                    poisIconsImageSize[4] += 0.15;
                    poisIconsImageSize[6] += 0.15;
                }
                else {
                    poisIconsImageSize += 0.15;
                }
                if (!map.getLayer('enlargened-icon-layer')) {
                    this.map.setLayoutProperty('proximiio-pois-icons', 'icon-ignore-placement', true);
                    this.state.style.addLayer({
                        id: 'enlargened-icon-layer',
                        type: 'symbol',
                        source: 'highlight-icon-source',
                        minzoom: poisIconsLayer.minzoom,
                        maxzoom: poisIconsLayer.maxzoom,
                        layout: {
                            'icon-image': {
                                type: 'identity',
                                property: 'amenity',
                            },
                            'icon-size': poisIconsImageSize,
                            'symbol-placement': 'point',
                            'icon-pitch-alignment': 'viewport',
                            'icon-allow-overlap': true,
                            'icon-ignore-placement': true,
                        },
                        filter: [
                            'all',
                            ['==', ['to-number', ['get', 'level']], this.state.floor.level],
                            [
                                'any',
                                ['all', ['has', 'metadata'], ['has', 'bays', ['get', 'metadata']]],
                                ['!=', ['get', 'hideIcon'], 'hide'],
                            ],
                        ],
                    }, 'proximiio-pois-icons');
                }
            }
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
                        'circle-opacity': opacity !== null && opacity !== undefined ? opacity : 1,
                        'circle-translate': translate ? translate : [0, 0],
                    },
                    filter: [
                        'all',
                        ['==', ['to-number', ['get', 'level']], this.state.floor.level],
                        [
                            'any',
                            ['all', ['has', 'metadata'], ['has', 'bays', ['get', 'metadata']]],
                            ['!=', ['get', 'hideIcon'], 'hide'],
                        ],
                    ],
                }, enlargeIcon ? 'proximiio-pois-icons' : this.defaultOptions.initPolygons ? 'shop-custom' : 'proximiio-shop');
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
            if (this.defaultOptions.routeAnimation.type === 'point' || this.defaultOptions.routeAnimation.type === 'puck') {
                const routingLineLayer = this.state.style.getLayer('proximiio-routing-line-remaining');
                const routingLineSymbolLayer = this.state.style.getLayer('proximiio-routing-line-symbols');
                if (routingLineLayer && this.defaultOptions.polygonsOptions.drawRouteUnderPolygons) {
                    this.state.style.removeLayer('proximiio-routing-line-symbols');
                    this.state.style.addLayer(routingLineSymbolLayer, 'proximiio-paths');
                    this.state.style.removeLayer('proximiio-routing-line-remaining');
                    this.state.style.addLayer(routingLineLayer, 'proximiio-paths');
                }
                if (!this.state.style.getSource('lineAlong')) {
                    this.state.style.addSource('lineAlong', {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: [],
                        },
                    });
                }
                if (!this.state.style.getLayer('lineAlong')) {
                    this.state.style.addLayer({
                        id: 'lineAlong',
                        type: 'line',
                        source: 'lineAlong',
                        minzoom: this.defaultOptions.routeAnimation.minzoom,
                        maxzoom: this.defaultOptions.routeAnimation.maxzoom,
                        paint: {
                            'line-width': this.defaultOptions.routeAnimation.lineWidth,
                            'line-color': this.defaultOptions.routeAnimation.lineProgress
                                ? ['get', 'color']
                                : this.defaultOptions.routeAnimation.lineColor,
                            'line-opacity': this.defaultOptions.routeAnimation.lineOpacity,
                        },
                    }, 'proximiio-routing-line-remaining');
                }
                if (!this.state.style.getSource('pointAlong')) {
                    this.state.style.addSource('pointAlong', {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: [],
                        },
                    });
                }
                if (this.defaultOptions.routeAnimation.pointIconUrl || this.defaultOptions.routeAnimation.cityPointIconUrl) {
                    if (this.defaultOptions.routeAnimation.pointIconAsMarker) {
                        const el = document.createElement('div');
                        el.style.backgroundImage = `url(${this.defaultOptions.routeAnimation.pointIconUrl})`;
                        el.style.backgroundSize = 'cover';
                        el.style.width = `${this.defaultOptions.routeAnimation.pointIconMarkerSize}px`;
                        el.style.height = `${this.defaultOptions.routeAnimation.pointIconMarkerSize}px`;
                        this.pointIconMarker = new maplibregl.Marker({ element: el });
                    }
                    else {
                        this.state.style.addLayer({
                            id: 'pointAlong',
                            type: 'symbol',
                            source: 'pointAlong',
                            minzoom: this.defaultOptions.routeAnimation.minzoom,
                            maxzoom: this.defaultOptions.routeAnimation.maxzoom,
                            layout: {
                                'icon-image': '{pointIcon}',
                                'icon-size': this.defaultOptions.routeAnimation.pointIconSize,
                                'icon-allow-overlap': true,
                            },
                        }, this.defaultOptions.showLevelDirectionIcon ? 'direction-popup-layer' : 'proximiio-polygons-above-paths');
                    }
                }
                else {
                    this.state.style.addLayer({
                        id: 'pointAlong',
                        type: 'circle',
                        source: 'pointAlong',
                        minzoom: this.defaultOptions.routeAnimation.minzoom,
                        maxzoom: this.defaultOptions.routeAnimation.maxzoom,
                        paint: {
                            'circle-color': this.defaultOptions.routeAnimation.pointColor,
                            'circle-radius': this.defaultOptions.routeAnimation.pointRadius,
                        },
                    }, this.defaultOptions.showLevelDirectionIcon ? 'direction-popup-layer' : 'proximiio-polygons-above-paths');
                }
            }
            if (this.defaultOptions.routeAnimation.type === 'dash') {
                if (this.state.style.getLayer('proximiio-routing-line-remaining') &&
                    !this.defaultOptions.routeAnimation.dashKeepOriginalRouteLayer) {
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
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (this.map) {
            const metadata = this.state.style.metadata;
            let tileUrl = ((_a = this.defaultOptions.rasterTilesOptions) === null || _a === void 0 ? void 0 : _a.tilesUrl)
                ? (_b = this.defaultOptions.rasterTilesOptions) === null || _b === void 0 ? void 0 : _b.tilesUrl
                : metadata['proximiio:raster:tileurl'];
            const isLeveled = () => {
                return tileUrl.match(/{LEVEL}/g) !== null;
            };
            if (isLeveled) {
                tileUrl = tileUrl.replace(/{LEVEL}/g, this.state.floor.level.toString());
            }
            if (this.state.style.getLayer('raster-tiles')) {
                this.state.style.removeLayer('raster-tiles');
                this.state.style.removeSource('raster-tiles');
            }
            this.state.style.addSource('raster-tiles', {
                type: 'raster',
                tiles: [
                    `${((_c = this.defaultOptions.rasterTilesOptions) === null || _c === void 0 ? void 0 : _c.useProxy) ? 'https://api.proximi.fi/imageproxy/source=' : ''}${tileUrl}`,
                ],
                tileSize: ((_d = this.defaultOptions.rasterTilesOptions) === null || _d === void 0 ? void 0 : _d.tileSize)
                    ? this.defaultOptions.rasterTilesOptions.tileSize
                    : metadata['proximiio:raster:tilesize']
                        ? metadata['proximiio:raster:tilesize']
                        : 256,
                minzoom: ((_e = this.defaultOptions.rasterTilesOptions) === null || _e === void 0 ? void 0 : _e.minZoom)
                    ? this.defaultOptions.rasterTilesOptions.minZoom
                    : metadata['proximiio:raster:minzoom']
                        ? metadata['proximiio:raster:minzoom']
                        : 15,
                maxzoom: ((_f = this.defaultOptions.rasterTilesOptions) === null || _f === void 0 ? void 0 : _f.maxZoom)
                    ? this.defaultOptions.rasterTilesOptions.maxZoom
                    : metadata['proximiio:raster:maxzoom']
                        ? metadata['proximiio:raster:maxzoom']
                        : 22,
                attribution: ((_g = this.defaultOptions.rasterTilesOptions) === null || _g === void 0 ? void 0 : _g.attribution)
                    ? this.defaultOptions.rasterTilesOptions.attribution
                    : metadata['proximiio:raster:attribution']
                        ? metadata['proximiio:raster:attribution']
                        : '',
                bounds: ((_h = this.defaultOptions.rasterTilesOptions) === null || _h === void 0 ? void 0 : _h.bounds)
                    ? this.defaultOptions.rasterTilesOptions.bounds
                    : metadata['proximiio:raster:bounds']
                        ? metadata['proximiio:raster:bounds']
                        : [-180, -90, 180, 90],
            });
            this.state.style.addLayer({
                id: 'raster-tiles',
                type: 'raster',
                source: 'raster-tiles',
            }, ((_j = this.defaultOptions.rasterTilesOptions) === null || _j === void 0 ? void 0 : _j.beforeLayer)
                ? this.defaultOptions.rasterTilesOptions.beforeLayer
                : metadata['proximiio:raster:beforelayer']
                    ? metadata['proximiio:raster:beforelayer']
                    : 'osm-country_label-en');
            this.map.setStyle(this.state.style);
        }
    }
    onBootPolygons() {
        return __awaiter(this, void 0, void 0, function* () {
            this.defaultOptions.initPolygons = true;
            yield this.onRefetch();
            this.initPolygons();
            this.onFloorSelect(this.state.floor);
        });
    }
    initPolygons() {
        if (this.map) {
            for (const layer of this.defaultOptions.polygonLayers) {
                if (this.state.style.getLayer(`proximiio-${layer.featureType}`)) {
                    if (layer.removeOriginalPolygonsLayer) {
                        this.state.style.removeLayer(`proximiio-${layer.featureType}`);
                    }
                }
                if (this.state.style.getLayer(`proximiio-${layer.featureType.charAt(0).toUpperCase() + layer.featureType.slice(1)}`)) {
                    if (layer.removeOriginalPolygonsLayer) {
                        this.state.style.removeLayer(`proximiio-${layer.featureType.charAt(0).toUpperCase() + layer.featureType.slice(1)}`);
                    }
                }
            }
            this.map.setStyle(this.state.style);
            const uniqueLayerIds = [
                ...new Set(this.defaultOptions.polygonLayers.map((layer) => layer.layerId).filter(Boolean)),
                'polygons',
            ];
            for (const layerId of uniqueLayerIds) {
                if (layerId === 'polygons') {
                    const polygonIconsLayer = new PolygonIconsLayer(this.defaultOptions.polygonsOptions);
                    polygonIconsLayer.setFilterLevel(this.state.floor.level);
                    this.state.style.addLayer(polygonIconsLayer.json, 'proximiio-paths');
                    const polygonTitlesLayer = new PolygonTitlesLayer(this.defaultOptions.polygonsOptions);
                    polygonTitlesLayer.setFilterLevel(this.state.floor.level);
                    this.state.style.addLayer(polygonTitlesLayer.json, 'proximiio-paths');
                    const polygonsLayer = new PolygonsLayer(this.defaultOptions.polygonsOptions);
                    polygonsLayer.setFilterLevel(this.state.floor.level);
                    this.state.style.addLayer(polygonsLayer.json, 'proximiio-paths');
                    this.map.on('click', `polygons-custom`, (e) => {
                        this.onShopClick(e);
                    });
                    this.map.on('mouseenter', `polygons-custom`, (e) => {
                        this.onShopMouseEnter(e);
                    });
                    this.map.on('mousemove', `polygons-custom`, (e) => {
                        if (!this.defaultOptions.blockFeatureClickWhileRouting ||
                            (this.defaultOptions.blockFeatureClickWhileRouting &&
                                !this.routingSource.route &&
                                !this.routingSource.preview &&
                                this.routingSource.navigationType === 'mall')) {
                            this.onShopMouseMove(e);
                        }
                    });
                    this.map.on('mouseleave', `polygons-custom`, (e) => {
                        if (!this.defaultOptions.blockFeatureClickWhileRouting ||
                            (this.defaultOptions.blockFeatureClickWhileRouting &&
                                !this.routingSource.route &&
                                !this.routingSource.preview &&
                                this.routingSource.navigationType === 'mall')) {
                            this.onShopMouseLeave(e);
                        }
                    });
                }
                else {
                    const polygonLayer = this.defaultOptions.polygonLayers.find((layer) => layer.layerId === layerId);
                    if (polygonLayer) {
                        const polygonIconsLayer = new PolygonIconsLayer(polygonLayer);
                        polygonIconsLayer.setFilterLevel(this.state.floor.level);
                        this.state.style.addLayer(polygonIconsLayer.json, 'proximiio-paths');
                        const polygonTitlesLayer = new PolygonTitlesLayer(polygonLayer);
                        polygonTitlesLayer.setFilterLevel(this.state.floor.level);
                        this.state.style.addLayer(polygonTitlesLayer.json, 'proximiio-paths');
                        const polygonsLayer = new PolygonsLayer(polygonLayer);
                        polygonsLayer.setFilterLevel(this.state.floor.level);
                        this.state.style.addLayer(polygonsLayer.json, 'proximiio-paths');
                        this.map.on('click', `${polygonLayer.layerId}-custom`, (e) => {
                            this.onShopClick(e);
                        });
                        this.map.on('mouseenter', `${polygonLayer.layerId}-custom`, (e) => {
                            this.onShopMouseEnter(e);
                        });
                        this.map.on('mousemove', `${polygonLayer.layerId}-custom`, (e) => {
                            if (!this.defaultOptions.blockFeatureClickWhileRouting ||
                                (this.defaultOptions.blockFeatureClickWhileRouting &&
                                    !this.routingSource.route &&
                                    !this.routingSource.preview &&
                                    this.routingSource.navigationType === 'mall')) {
                                this.onShopMouseMove(e);
                            }
                        });
                        this.map.on('mouseleave', `${polygonLayer.layerId}-custom`, (e) => {
                            if (!this.defaultOptions.blockFeatureClickWhileRouting ||
                                (this.defaultOptions.blockFeatureClickWhileRouting &&
                                    !this.routingSource.route &&
                                    !this.routingSource.preview &&
                                    this.routingSource.navigationType === 'mall')) {
                                this.onShopMouseLeave(e);
                            }
                        });
                    }
                }
            }
            /*this.map.on('click', (e) => {
              // Get all features at the clicked point
              const features = this.map.queryRenderedFeatures(e.point);
      
              if (features.length) {
                // Iterate through features to get layer information
                features.forEach((feature) => {
                  console.log('Layer clicked:', feature.layer.id);
                });
      
                // If you only need the first matching layer
                console.log('First layer clicked:', features[0].layer.id);
              } else {
                console.log('No layer clicked.');
              }
            });*/
            // const polygonTitlesLineLayer = new PolygonTitlesLineLayer({ featureType: 'shop' });
            // polygonTitlesLineLayer.setFilterLevel(this.state.floor.level);
            // this.state.style.addLayer(polygonTitlesLineLayer.json, 'proximiio-polygons-above-paths');
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
            if (this.defaultOptions.polygonsOptions.adaptiveLabelOpacity) {
                this.map.on('pitch', () => {
                    this.updateLayerOpacity();
                });
                this.updateLayerOpacity();
            }
        }
    }
    updateLayerOpacity() {
        const pitch = this.map.getPitch();
        const maxPitch = 60;
        const minPitch = this.defaultOptions.polygonsOptions.adaptiveMaxPitch;
        // Calculate opacity based on pitch
        const opacity = pitch >= minPitch ? 0 : 1;
        /*if (pitch >= minPitch) {
          opacity = 0; // Opacity is 0 when pitch is greater than or equal to minPitch
        } else {
          opacity = 1 - pitch / maxPitch; // Linear interpolation between 1 and 0 for pitch < minPitch
        }*/
        /*for (const layer of this.defaultOptions.polygonLayers) {
          if (layer.adaptiveLabelOpacity) {
            if (this.map.getLayer(`${layer.featureType}-labels`)) {
              const l = { ...this.state.style.getLayer(`${layer.featureType}-labels`) };
              l.paint['text-opacity'] = opacity;
              this.map.setPaintProperty(`${layer.featureType}-labels`, 'text-opacity', opacity);
            }
          }
        }*/
        if (this.defaultOptions.polygonsOptions.adaptiveLabelOpacity) {
            if (this.map.getLayer(`polygons-labels`)) {
                const l = Object.assign({}, this.state.style.getLayer(`polygons-labels`));
                l.paint['text-opacity'] = opacity;
                this.map.setPaintProperty(`polygons-labels`, 'text-opacity', opacity);
            }
        }
    }
    onShopClick(e) {
        var _a, _b, _c;
        if (!this.defaultOptions.blockFeatureClickWhileRouting ||
            (this.defaultOptions.blockFeatureClickWhileRouting &&
                !this.routingSource.route &&
                !this.routingSource.preview &&
                this.routingSource.navigationType === 'mall')) {
            if (e.features && e.features[0] && e.features[0].properties) {
                e.features[0].properties._dynamic = e.features[0].properties._dynamic
                    ? JSON.parse(e.features[0].properties._dynamic)
                    : {};
                const currentZoom = e.target.style.z;
                if (e.features[0].properties._dynamic.minZoom && currentZoom < e.features[0].properties._dynamic.minZoom)
                    return;
                if (e.features[0].properties._dynamic.maxZoom && currentZoom > e.features[0].properties._dynamic.maxZoom)
                    return;
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
                    if (polygonPoi ? polygonPoi.properties.available === false : poi.properties.available === false) {
                        if (this.defaultOptions.disableUnavailablePois)
                            return;
                    }
                    if (polygonPoi
                        ? ((_a = polygonPoi.properties.metadata) === null || _a === void 0 ? void 0 : _a.clickable) === 'false'
                        : ((_b = poi.properties.metadata) === null || _b === void 0 ? void 0 : _b.clickable) === 'false') {
                        return;
                    }
                    if (polygonPoi) {
                        this.handlePolygonSelection(polygonPoi);
                    }
                    this.onPolygonClickListener.next(polygonPoi ? polygonPoi : poi);
                }
                else {
                    // @ts-ignore
                    const poi = this.state.allFeatures.features.find((i) => i.properties.id === e.features[0].properties.id);
                    if (this.defaultOptions.disableUnavailablePois && poi.properties.available === false) {
                        return;
                    }
                    if (((_c = poi.properties.metadata) === null || _c === void 0 ? void 0 : _c.clickable) === 'false') {
                        return;
                    }
                    this.onPoiClickListener.next(poi);
                }
            }
        }
    }
    handlePolygonSelection(poi) {
        let features = [];
        if (Array.isArray(poi)) {
            features = poi;
        }
        else {
            features = (poi === null || poi === void 0 ? void 0 : poi.id) ? [poi] : [];
        }
        features = features.filter((f) => f && f.id);
        const featuresIds = features.length === 0 ? [] : features.map((i) => i.id);
        const featuresWithPolygon = this.state.allFeatures.features.filter((f) => { var _a; return ((_a = f.properties._dynamic) === null || _a === void 0 ? void 0 : _a.polygon_id) && f.geometry.type === 'Point' && !featuresIds.includes(f.id); });
        if (this.selectedPolygons.length > 0) {
            for (const polygon of this.selectedPolygons) {
                this.map.setFeatureState({
                    source: 'main',
                    id: polygon.properties.id,
                }, {
                    selected: false,
                });
                if (polygon.properties._dynamic.label_id) {
                    this.map.setFeatureState({
                        source: 'main',
                        id: polygon.properties._dynamic.label_id,
                    }, {
                        selected: false,
                    });
                }
            }
        }
        if (this.defaultOptions.polygonsOptions.handleDisabledPolygons &&
            features.length === 0 &&
            ((Array.isArray(poi) && poi.length === 0) || !poi)) {
            const uniqueLayerIds = [
                ...new Set(this.defaultOptions.polygonLayers.map((layer) => `${layer.layerId}-custom`).filter(Boolean)),
                'polygons-custom',
            ];
            for (const f of featuresWithPolygon) {
                const polygon = this.state.allFeatures.features.find((i) => {
                    var _a, _b, _c;
                    return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === ((_b = f.properties._dynamic) === null || _b === void 0 ? void 0 : _b.polygon_id) &&
                        uniqueLayerIds.includes((_c = i.properties._dynamic) === null || _c === void 0 ? void 0 : _c.type);
                });
                if (polygon) {
                    this.map.setFeatureState({
                        source: 'main',
                        id: polygon.properties.id,
                    }, {
                        disabled: false,
                    });
                    if (polygon.properties._dynamic.label_id) {
                        this.map.setFeatureState({
                            source: 'main',
                            id: polygon.properties._dynamic.label_id,
                        }, {
                            disabled: false,
                        });
                    }
                }
            }
            return;
        }
        this.selectedPolygons = [];
        // If poi is defined, handle it as before
        features.forEach((feat) => {
            const connectedPolygonId = feat && feat.properties._dynamic ? feat.properties._dynamic.polygon_id : null;
            if (connectedPolygonId) {
                const uniqueLayerIds = [
                    ...new Set(this.defaultOptions.polygonLayers.map((layer) => `${layer.layerId}-custom`).filter(Boolean)),
                    'polygons-custom',
                ];
                const selectedPolygon = this.state.allFeatures.features.find((i) => { var _a, _b; return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === connectedPolygonId && uniqueLayerIds.includes((_b = i.properties._dynamic) === null || _b === void 0 ? void 0 : _b.type); });
                if (selectedPolygon) {
                    if (this.defaultOptions.polygonsOptions.handleDisabledPolygons) {
                        for (const f of featuresWithPolygon) {
                            const polygon = this.state.allFeatures.features.find((i) => {
                                var _a, _b, _c;
                                return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === ((_b = f.properties._dynamic) === null || _b === void 0 ? void 0 : _b.polygon_id) &&
                                    uniqueLayerIds.includes((_c = i.properties._dynamic) === null || _c === void 0 ? void 0 : _c.type);
                            });
                            if (polygon) {
                                this.map.setFeatureState({
                                    source: 'main',
                                    id: polygon.properties.id,
                                }, {
                                    disabled: true,
                                });
                                if (polygon.properties._dynamic.label_id) {
                                    this.map.setFeatureState({
                                        source: 'main',
                                        id: polygon.properties._dynamic.label_id,
                                    }, {
                                        disabled: true,
                                    });
                                }
                            }
                        }
                    }
                    this.map.setFeatureState({
                        source: 'main',
                        id: selectedPolygon.properties.id,
                    }, {
                        selected: true,
                    });
                    if (selectedPolygon.properties._dynamic.label_id) {
                        this.map.setFeatureState({
                            source: 'main',
                            id: selectedPolygon.properties._dynamic.label_id,
                        }, {
                            selected: true,
                        });
                    }
                    this.selectedPolygons.push(selectedPolygon);
                }
            }
        });
    }
    onShopMouseEnter(e) {
        if (e.features && e.features[0] && e.features[0].properties) {
            e.features[0].properties._dynamic = e.features[0].properties._dynamic
                ? JSON.parse(e.features[0].properties._dynamic)
                : {};
            const currentZoom = e.target.style.z;
            if (e.features[0].properties._dynamic.minZoom && currentZoom < e.features[0].properties._dynamic.minZoom)
                return;
            if (e.features[0].properties._dynamic.maxZoom && currentZoom > e.features[0].properties._dynamic.maxZoom)
                return;
        }
        this.map.getCanvas().style.cursor = 'pointer';
    }
    onShopMouseMove(e) {
        if (e.features && e.features.length > 0) {
            e.features[0].properties._dynamic = JSON.parse(e.features[0].properties._dynamic ? e.features[0].properties._dynamic : {});
            const currentZoom = e.target.style.z;
            if (e.features[0].properties._dynamic.minZoom && currentZoom < e.features[0].properties._dynamic.minZoom)
                return;
            if (e.features[0].properties._dynamic.maxZoom && currentZoom > e.features[0].properties._dynamic.maxZoom)
                return;
            if (this.hoveredPolygon) {
                this.map.setFeatureState({
                    source: 'main',
                    id: this.hoveredPolygon.properties.id,
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
                id: this.hoveredPolygon.properties.id,
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
        if (e.features && e.features.length > 0) {
            e.features[0].properties._dynamic = JSON.parse(e.features[0].properties._dynamic ? e.features[0].properties._dynamic : {});
            const currentZoom = e.target.style.z;
            if (e.features[0].properties._dynamic.minZoom && currentZoom < e.features[0].properties._dynamic.minZoom)
                return;
            if (e.features[0].properties._dynamic.maxZoom && currentZoom > e.features[0].properties._dynamic.maxZoom)
                return;
        }
        this.map.getCanvas().style.cursor = '';
        if (this.hoveredPolygon) {
            this.map.setFeatureState({
                source: 'main',
                id: this.hoveredPolygon.properties.id,
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
                var _a, _b;
                return f.properties.title &&
                    f.properties.place_id === defaultPlace.id &&
                    (f.id === startParam ||
                        f.properties.id === startParam ||
                        ((_a = f.properties.title) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === (startParam === null || startParam === void 0 ? void 0 : startParam.toLowerCase()) ||
                        ((_b = f.properties.remote_id) === null || _b === void 0 ? void 0 : _b.toString()) === startParam);
            })
            : this.startPoint;
        const destinationFeature = destinationParam
            ? this.state.allFeatures.features.find((f) => {
                var _a, _b;
                return f.properties.title &&
                    f.properties.place_id === defaultPlace.id &&
                    (f.id === destinationParam ||
                        f.properties.id === destinationParam ||
                        ((_a = f.properties.title) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === (destinationParam === null || destinationParam === void 0 ? void 0 : destinationParam.toLowerCase()) ||
                        ((_b = f.properties.remote_id) === null || _b === void 0 ? void 0 : _b.toString()) === destinationParam);
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
            if (this.defaultOptions.urlParams.autoRouting) {
                this.onRouteUpdate({
                    start: startFeature,
                    finish: destinationFeature,
                });
            }
            else {
                this.onRoutePreview({
                    start: startFeature,
                    finish: destinationFeature,
                });
            }
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
                this.amenityIds.push(featureId);
                this.filteredAmenities.push(featureId);
                this.filterOutFeatures();
            }
            if (!isTemporary) {
                this.state.optimizedFeatures.features.push(featureVar);
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
                this.amenityIds.push(id);
                this.filteredAmenities.push(id);
                this.filterOutFeatures();
            }
            if (!isTemporary) {
                const featureIndex = this.state.features.features.findIndex((x) => x.id === featureVar.id || x.properties.id === featureVar.id);
                const optimizedFeatureIndex = this.state.optimizedFeatures.features.findIndex((x) => x.id === featureVar.id || x.properties.id === featureVar.id);
                if (featureIndex)
                    this.state.features.features[featureIndex] = featureVar;
                if (optimizedFeatureIndex)
                    this.state.optimizedFeatures.features[optimizedFeatureIndex] = featureVar;
                yield addFeatures({
                    type: 'FeatureCollection',
                    features: [featureVar.json],
                });
            }
            else {
                const featureIndex = this.state.features.features.findIndex((x) => x.id === featureVar.id || x.properties.id === featureVar.id);
                const optimizedFeatureIndex = this.state.optimizedFeatures.features.findIndex((x) => x.id === featureVar.id || x.properties.id === featureVar.id);
                const dynamicIndex = this.state.dynamicFeatures.features.findIndex((x) => x.id === featureVar.id || x.properties.id === featureVar.id);
                if (featureIndex !== -1)
                    this.state.features.features[featureIndex] = featureVar;
                if (optimizedFeatureIndex !== -1)
                    this.state.optimizedFeatures.features[optimizedFeatureIndex] = featureVar;
                if (dynamicIndex !== -1)
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
                const featureIndex = this.state.optimizedFeatures.features.findIndex((x) => x.id === id || x.properties.id === id);
                this.state.optimizedFeatures.features.splice(featureIndex, 1);
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
        this.geojsonSource.fetch({
            type: 'FeatureCollection',
            features: [...this.state.optimizedFeatures.features, ...this.state.dynamicFeatures.features],
        });
        this.state.style.setSource('main', this.geojsonSource);
        this.onSourceChange();
        this.routingSource.routing.setData(this.state.allFeatures);
        this.updateMapSource(this.routingSource);
    }
    onSetFeatureFilter(query, inverted) {
        const features = this.state.allFeatures.features.filter((f) => {
            var _a, _b;
            const normalizedQuery = query.trim().toLowerCase();
            const normalizedTitle = (_b = (_a = f.properties) === null || _a === void 0 ? void 0 : _a.title) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
            return f.properties.id === query || f.id === query || normalizedQuery === normalizedTitle;
        });
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
        const features = this.state.allFeatures.features.filter((f) => {
            var _a, _b;
            const normalizedQuery = query.trim().toLowerCase();
            const normalizedTitle = (_b = (_a = f.properties) === null || _a === void 0 ? void 0 : _a.title) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
            return f.properties.id === query || f.id === query || normalizedQuery === normalizedTitle;
        });
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
    onHideIcons() {
        this.state.style.hideIconLayers();
        this.state.style.notify('filter-change');
    }
    onShowIcons() {
        this.state.style.showIconLayers();
        this.state.style.notify('filter-change');
    }
    onHideLayer(layerId) {
        this.state.style.hideLayer(layerId);
        this.state.style.notify('filter-change');
    }
    onShowLayer(layerId) {
        this.state.style.showLayer(layerId);
        this.state.style.notify('filter-change');
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
            if (inverted) {
                if (Array.isArray(amenityId)) {
                    if (!amenityId.some((id) => this.amenityFilters.includes(id))) {
                        this.hiddenAmenities.push.apply(this.hiddenAmenities, amenityId);
                    }
                }
                else {
                    if (!this.amenityFilters.includes(amenityId)) {
                        this.hiddenAmenities.push(amenityId);
                    }
                }
                this.filteredAmenities = this.filteredAmenities.filter((i) => i !== amenityId);
            }
            else if (!inverted) {
                if (Array.isArray(amenityId)) {
                    if (!amenityId.some((id) => this.amenityFilters.includes(id))) {
                        this.amenityFilters.push.apply(this.amenityFilters, amenityId);
                    }
                }
                else {
                    if (!this.amenityFilters.includes(amenityId)) {
                        this.amenityFilters.push(amenityId);
                    }
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
            layers.push('poi-custom-icons');
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
        var _a;
        if (this.defaultOptions.initPolygons) {
            const activeFeatures = this.activePolygonsAmenity
                ? filterByAmenity(this.state.allFeatures.features.filter((f) => f.geometry.type === 'Point'), this.activePolygonsAmenity)
                : [];
            const amenityFeatures = amenityId
                ? filterByAmenity(this.state.allFeatures.features.filter((f) => f.geometry.type === 'Point'), amenityId)
                : [];
            /*const activeFeatures = this.activePolygonsAmenity
              ? this.state.allFeatures.features.filter(
                  (f) =>
                    (Array.isArray(this.activePolygonsAmenity)
                      ? this.activePolygonsAmenity.includes(f.properties.amenity)
                      : f.properties.amenity === this.activePolygonsAmenity) && f.geometry.type === 'Point',
                )
              : [];
            const amenityFeatures = amenityId
              ? this.state.allFeatures.features.filter(
                  (f) =>
                    (Array.isArray(amenityId)
                      ? amenityId.includes(f.properties.amenity)
                      : f.properties.amenity === amenityId) && f.geometry.type === 'Point',
                )
              : [];*/
            const featuresWithPolygon = this.state.allFeatures.features.filter((f) => { var _a; return ((_a = f.properties._dynamic) === null || _a === void 0 ? void 0 : _a.polygon_id) && f.geometry.type === 'Point'; });
            const uniqueLayerIds = [
                ...new Set(this.defaultOptions.polygonLayers.map((layer) => `${layer.layerId}-custom`).filter(Boolean)),
                'polygons-custom',
            ];
            if (activeFeatures.length > 0) {
                for (const f of featuresWithPolygon) {
                    const polygon = this.state.allFeatures.features.find((i) => {
                        var _a, _b, _c;
                        return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === ((_b = f.properties._dynamic) === null || _b === void 0 ? void 0 : _b.polygon_id) &&
                            uniqueLayerIds.includes((_c = i.properties._dynamic) === null || _c === void 0 ? void 0 : _c.type);
                    });
                    if (polygon) {
                        this.map.setFeatureState({
                            source: 'main',
                            id: polygon.properties.id,
                        }, {
                            active: false,
                            disabled: false,
                        });
                        if (polygon.properties._dynamic.label_id) {
                            this.map.setFeatureState({
                                source: 'main',
                                id: polygon.properties._dynamic.label_id,
                            }, {
                                active: false,
                                disabled: false,
                            });
                        }
                    }
                }
            }
            if (amenityFeatures.length > 0) {
                for (const f of featuresWithPolygon) {
                    const polygon = this.state.allFeatures.features.find((i) => {
                        var _a, _b, _c;
                        return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === ((_b = f.properties._dynamic) === null || _b === void 0 ? void 0 : _b.polygon_id) &&
                            uniqueLayerIds.includes((_c = i.properties._dynamic) === null || _c === void 0 ? void 0 : _c.type);
                    });
                    if (polygon) {
                        if (((_a = filterByAmenity([f], amenityId)) === null || _a === void 0 ? void 0 : _a.length) > 0) {
                            this.map.setFeatureState({
                                source: 'main',
                                id: polygon.properties.id,
                            }, {
                                active: true,
                            });
                            if (polygon.properties._dynamic.label_id) {
                                this.map.setFeatureState({
                                    source: 'main',
                                    id: polygon.properties._dynamic.label_id,
                                }, {
                                    active: true,
                                });
                            }
                        }
                        else if (this.defaultOptions.polygonsOptions.handleDisabledPolygons) {
                            this.map.setFeatureState({
                                source: 'main',
                                id: polygon.properties.id,
                            }, {
                                disabled: true,
                            });
                            if (polygon.properties._dynamic.label_id) {
                                this.map.setFeatureState({
                                    source: 'main',
                                    id: polygon.properties._dynamic.label_id,
                                }, {
                                    disabled: true,
                                });
                            }
                        }
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
            layers.push('poi-custom-icons');
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
    onEnablePolygonPreventedIcons() {
        // @ts-ignore
        const mainSourceData = this.map.getSource('main')._data;
        mainSourceData.features = mainSourceData.features.map((f) => {
            var _a, _b, _c, _d;
            if (((_b = (_a = f.properties) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.prevent_polygon) === true || ((_d = (_c = f.properties) === null || _c === void 0 ? void 0 : _c.metadata) === null || _d === void 0 ? void 0 : _d.prevent_polygon) === 'true') {
                f.properties.hideIcon = 'hide';
            }
            return f;
        });
        // @ts-ignore
        this.map.getSource('main').setData(mainSourceData);
    }
    onDisablePolygonPreventedIcons() {
        // @ts-ignore
        const mainSourceData = this.map.getSource('main')._data;
        mainSourceData.features = mainSourceData.features.map((f) => {
            var _a, _b, _c, _d;
            if ((this.activePolygonsAmenity === 'nonexisting' || this.activePolygonsAmenity.includes(f.properties.amenity)) &&
                (((_b = (_a = f.properties) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.prevent_polygon) === true || ((_d = (_c = f.properties) === null || _c === void 0 ? void 0 : _c.metadata) === null || _d === void 0 ? void 0 : _d.prevent_polygon) === 'true')) {
                f.properties.hideIcon = 'show';
            }
            return f;
        });
        // @ts-ignore
        this.map.getSource('main').setData(mainSourceData);
    }
    onSetHiddenAmenities(amenities) {
        this.defaultOptions.hiddenAmenities = [...this.defaultOptions.hiddenAmenities, ...amenities];
        this.defaultOptions.hiddenAmenities = [...new Set(this.defaultOptions.hiddenAmenities)];
        // @ts-ignore
        const mainSourceData = this.map.getSource('main')._data;
        mainSourceData.features = mainSourceData.features.map((f) => {
            if (amenities.includes(f.properties.amenity)) {
                f.properties.hideIcon = 'hide';
            }
            return f;
        });
        // @ts-ignore
        this.map.getSource('main').setData(mainSourceData);
    }
    onDisablePolygons() {
        if (this.defaultOptions.polygonsOptions.handleDisabledPolygons) {
            const featuresWithPolygon = this.state.allFeatures.features.filter((f) => { var _a; return ((_a = f.properties._dynamic) === null || _a === void 0 ? void 0 : _a.polygon_id) && f.geometry.type === 'Point'; });
            const uniqueLayerIds = [
                ...new Set(this.defaultOptions.polygonLayers.map((layer) => `${layer.layerId}-custom`).filter(Boolean)),
                'polygons-custom',
            ];
            for (const f of featuresWithPolygon) {
                const polygon = this.state.allFeatures.features.find((i) => {
                    var _a, _b, _c;
                    return ((_a = i.properties._dynamic) === null || _a === void 0 ? void 0 : _a.id) === ((_b = f.properties._dynamic) === null || _b === void 0 ? void 0 : _b.polygon_id) &&
                        uniqueLayerIds.includes((_c = i.properties._dynamic) === null || _c === void 0 ? void 0 : _c.type);
                });
                if (polygon) {
                    this.map.setFeatureState({
                        source: 'main',
                        id: polygon.properties.id,
                    }, {
                        disabled: true,
                    });
                    if (polygon.properties._dynamic.label_id) {
                        this.map.setFeatureState({
                            source: 'main',
                            id: polygon.properties._dynamic.label_id,
                        }, {
                            disabled: true,
                        });
                    }
                }
            }
        }
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
        style.setLevel(this.defaultOptions.defaultFloorLevel);
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
                    this.centerOnRoute(routeStart);
                    this.removeRouteMarkers();
                    if (this.defaultOptions.showLevelDirectionIcon &&
                        (this.routingSource.navigationType === 'mall' || this.routingSource.navigationType === 'combined')) {
                        this.addDirectionFeatures();
                    }
                    if ((this.defaultOptions.animatedRoute || this.defaultOptions.routeAnimation.enabled) &&
                        this.defaultOptions.routeAnimation.autoStart) {
                        if (this.defaultOptions.animatedRoute) {
                            console.log(`animatedRoute property is deprecated, please use routeAnimation.enabled instead!`);
                        }
                        setTimeout(() => {
                            this.animateRoute();
                        }, 1000);
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
                    this.onRouteFoundListener.next({
                        route: this.routingSource.route,
                        TBTNav: this.defaultOptions.enableTBTNavigation ? textNavigation : null,
                        details: this.defaultOptions.routeWithDetails ? this.routingSource.details : null,
                        start: this.startPoint,
                        end: this.endPoint,
                        preview: false,
                    });
                    if (this.defaultOptions.sendAnalytics) {
                        const logger = new WayfindingLogger({
                            // organization_id: this.state.user.organization.id,
                            // organization_name: this.state.user.organization.name,
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
                            navigationType: this.routingSource.navigationType,
                        });
                        yield logger.save();
                    }
                }
                return;
            }
            if (event === 'preview-finished') {
                if (this.routingSource.route) {
                    this.currentStep = 0;
                    const textNavigation = {
                        steps: this.routingSource.steps,
                        destination: this.endPoint,
                        start: this.startPoint,
                    };
                    this.state = Object.assign(Object.assign({}, this.state), { loadingRoute: false, textNavigation });
                    if (this.routingSource.navigationType === 'city') {
                        this.centerOnRoute(this.routingSource.fullPath);
                        this.addRouteMarkers();
                    }
                    if (this.defaultOptions.forceFloorLevel !== null && this.defaultOptions.forceFloorLevel !== undefined) {
                        this.routingSource.data.features = this.routingSource.data.features.map((f) => {
                            if (f.properties.level !== this.defaultOptions.forceFloorLevel) {
                                f.properties.level = this.defaultOptions.forceFloorLevel;
                            }
                            return f;
                        });
                    }
                    this.onRouteFoundListener.next({
                        route: this.routingSource.route,
                        TBTNav: this.defaultOptions.enableTBTNavigation ? textNavigation : null,
                        details: this.defaultOptions.routeWithDetails ? this.routingSource.details : null,
                        start: this.startPoint,
                        end: this.endPoint,
                        preview: true,
                    });
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
            this.handleFilterChange();
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
            const floors = this.defaultOptions.bundleUrl
                ? yield getPlaceFloorsBundle({ placeId: place.id, bundleUrl: this.defaultOptions.bundleUrl }).catch(this.handleControllerError)
                : yield getPlaceFloors(place.id).catch(this.handleControllerError);
            if (floors) {
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
            }
        });
    }
    onFloorSelect(floor) {
        var _a, _b;
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
                if (!this.defaultOptions.routeAnimation.followRoute) {
                    if (lengthInMeters >= this.defaultOptions.minFitBoundsDistance) {
                        // @ts-ignore;
                        map.fitBounds(boundingBox, {
                            padding: this.defaultOptions.fitBoundsPadding,
                            bearing: this.map.getBearing(),
                            pitch: this.map.getPitch(),
                            animate: false,
                        });
                    }
                    else {
                        // @ts-ignore
                        this.map.flyTo({
                            center: center(routePoints).geometry.coordinates,
                            zoom: this.defaultOptions.minFitBoundsDistance < 10 ? 22 : this.map.getZoom(),
                        });
                    }
                }
            }
            if (this.defaultOptions.isKiosk) {
                if (this.defaultOptions.kioskSettings.showPoint && map.getLayer('my-location-layer')) {
                    const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                    map.setFilter('my-location-layer', filter);
                    this.state.style.getLayer('my-location-layer').filter = filter;
                }
                if (this.defaultOptions.routeAnimation.type === 'puck' &&
                    map.getLayer('start-point-layer') &&
                    map.getLayer('start-point-halo-layer')) {
                    const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                    map.setFilter('start-point-layer', filter);
                    this.state.style.getLayer('start-point-layer').filter = filter;
                    map.setFilter('start-point-halo-layer', filter);
                    this.state.style.getLayer('start-point-halo-layer').filter = filter;
                }
                if (this.kioskPopup) {
                    if (floor.level === this.defaultOptions.kioskSettings.level) {
                        this.kioskPopup.removeClassName('hidden');
                    }
                    else {
                        this.kioskPopup.addClassName('hidden');
                    }
                }
            }
            if (this.defaultOptions.useGpsLocation && this.startPoint) {
                this.startPoint.properties = Object.assign(Object.assign({}, this.startPoint.properties), { level: floor.level });
            }
            if (map.getLayer('persons-layer')) {
                const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('persons-layer', filter);
                this.state.style.getLayer('persons-layer').filter = filter;
            }
            if (map.getLayer('user-point-layer')) {
                const snappedPathPoint = this.state.allFeatures.features.find((f) => f.id === 'snapped-path-point');
                const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('user-point-layer', filter);
                this.state.style.getLayer('user-point-layer').filter = filter;
                if (((_b = snappedPathPoint === null || snappedPathPoint === void 0 ? void 0 : snappedPathPoint.properties) === null || _b === void 0 ? void 0 : _b.level) !== undefined && floor.level === snappedPathPoint.properties.level) {
                    this.startPointPopup.removeClassName('hidden');
                }
                else {
                    this.startPointPopup.addClassName('hidden');
                }
            }
            if (map.getLayer('custom-position-point-layer')) {
                const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('custom-position-point-layer', filter);
                this.state.style.getLayer('custom-position-point-layer').filter = filter;
            }
            if (map.getLayer('heading-icon-layer')) {
                const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level], ['has', 'bearing']];
                map.setFilter('heading-icon-layer', filter);
                this.state.style.getLayer('heading-icon-layer').filter = filter;
            }
            if (this.defaultOptions.showLevelDirectionIcon && map.getLayer('direction-halo-layer')) {
                const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
                map.setFilter('direction-halo-layer', filter);
                this.state.style.getLayer('direction-halo-layer').filter = filter;
                map.setFilter('direction-popup-layer', filter);
                this.state.style.getLayer('direction-popup-layer').filter = filter;
            }
            if (map.getLayer('enlargened-icon-layer')) {
                const filter = [
                    'all',
                    ['==', ['to-number', ['get', 'level']], floor.level],
                    [
                        'any',
                        ['all', ['has', 'metadata'], ['has', 'bays', ['get', 'metadata']]],
                        ['!=', ['get', 'hideIcon'], 'hide'],
                    ],
                ];
                map.setFilter('enlargened-icon-layer', filter);
                this.state.style.getLayer('enlargened-icon-layer').filter = filter;
            }
            if (map.getLayer('highlight-icon-layer')) {
                const filter = [
                    'all',
                    ['==', ['to-number', ['get', 'level']], floor.level],
                    [
                        'any',
                        ['all', ['has', 'metadata'], ['has', 'bays', ['get', 'metadata']]],
                        ['!=', ['get', 'hideIcon'], 'hide'],
                    ],
                ];
                map.setFilter('highlight-icon-layer', filter);
                this.state.style.getLayer('highlight-icon-layer').filter = filter;
            }
        }
        this.state = Object.assign(Object.assign({}, this.state), { floor, style: this.state.style });
        if (this.defaultOptions.animatedRoute || (this.defaultOptions.routeAnimation.enabled && route)) {
            if (this.defaultOptions.animatedRoute) {
                console.log(`animatedRoute property is deprecated, please use routeAnimation.enabled instead!`);
            }
            if (this.defaultOptions.routeAnimation.autoRestart && !this.useCustomPosition) {
                this.animateRoute();
            }
        }
        if (this.defaultOptions.useRasterTiles) {
            this.initRasterTiles();
        }
        this.addStopMarkers();
        this.updateCluster();
        this.onFloorSelectListener.next(floor);
    }
    onRouteUpdate({ start, finish, stops, connectingPoint, }) {
        this.startPoint = start;
        this.endPoint = stops ? stops[stops.length - 1] : finish;
        try {
            if (this.defaultOptions.initPolygons) {
                const polygonsToSelect = [finish, start];
                if (stops && stops.length > 0) {
                    polygonsToSelect.push(...stops);
                }
                this.handlePolygonSelection(polygonsToSelect);
            }
            if (finish && this.defaultOptions.animatedRoute) {
                if (this.defaultOptions.animatedRoute) {
                    console.log(`animatedRoute property is deprecated, please use routeAnimation.enabled instead!`);
                }
                cancelAnimationFrame(this.animationFrame);
            }
            this.routingSource.update({ start, finish, stops, language: this.defaultOptions.language, connectingPoint });
        }
        catch (e) {
            console.log('catched', e);
        }
        this.state = Object.assign(Object.assign({}, this.state), { style: this.state.style });
    }
    onRoutePreview({ start, finish, stops, connectingPoint, }) {
        this.startPoint = start;
        this.endPoint = stops ? stops[stops.length - 1] : finish;
        if (this.defaultOptions.initPolygons) {
            const polygonsToSelect = [finish, start];
            if (stops && stops.length > 0) {
                polygonsToSelect.push(...stops);
            }
            this.handlePolygonSelection(polygonsToSelect);
        }
        this.routingSource.update({
            start,
            finish,
            stops,
            preview: true,
            language: this.defaultOptions.language,
            connectingPoint,
        });
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
            if (this.defaultOptions.routeAnimation.type === 'point' || this.defaultOptions.routeAnimation.type === 'puck') {
                cancelAnimationFrame(this.animationFrame);
                if (this.map.getSource('pointAlong')) {
                    // @ts-ignore
                    this.map.getSource('pointAlong').setData({
                        type: 'FeatureCollection',
                        features: [],
                    });
                }
                if (this.map.getSource('lineAlong')) {
                    // @ts-ignore
                    this.map.getSource('lineAlong').setData({
                        type: 'FeatureCollection',
                        features: [],
                    });
                }
                if (this.defaultOptions.routeAnimation.pointIconAsMarker) {
                    this.pointIconMarker.remove();
                }
            }
        }
        this.map.setStyle(this.state.style);
        this.removeRouteMarkers();
        this.removeStopMarkers();
        this.removeStartPointOnMap();
        this.cancelCustomPosition();
        this.routingSource.cancel();
        this.onRouteCancelListener.next('route cancelled');
        this.currentStep = 0;
        this.currentStop = 0;
        this.customPositionBearing = undefined;
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
                if (this.routingSource && route.properties.source === 'cityRoute' && this.routingSource.fullPath) {
                    const routeToCenter = this.routingSource.preview
                        ? this.routingSource.fullPath
                        : this.routingSource.route[`path-part-${this.currentStep}`];
                    const lengthInMeters = length(routeToCenter, { units: 'kilometers' }) * 1000;
                    const boundingBox = bbox(routeToCenter);
                    if (lengthInMeters >= this.defaultOptions.minFitBoundsDistance) {
                        // @ts-ignore;
                        this.map.fitBounds(boundingBox, {
                            padding: this.defaultOptions.fitBoundsPadding,
                            bearing: 0,
                            pitch: this.map.getPitch(),
                            animate: false,
                            maxZoom: 15,
                        });
                    }
                    else {
                        // @ts-ignore
                        this.map.flyTo({
                            center: center(routeToCenter).geometry.coordinates,
                            zoom: this.defaultOptions.minFitBoundsDistance < 10 ? 15 : this.map.getZoom(),
                            bearing: 0,
                        });
                    }
                    return;
                }
                if (this.routingSource &&
                    this.routingSource.route &&
                    this.routingSource.route[`path-part-${this.currentStep}`] &&
                    this.routingSource.levelPoints[this.state.floor.level]) {
                    const routePoints = this.routingSource.route[`path-part-${this.currentStep}`] &&
                        ((_a = this.routingSource.route[`path-part-${this.currentStep}`].properties) === null || _a === void 0 ? void 0 : _a.level) === this.state.floor.level
                        ? this.routingSource.route[`path-part-${this.currentStep}`]
                        : lineString(this.routingSource.levelPoints[this.state.floor.level].map((i) => i.geometry.coordinates));
                    const lengthInMeters = length(routePoints, { units: 'kilometers' }) * 1000;
                    const boundingBox = bbox(routePoints);
                    if (!this.defaultOptions.routeAnimation.followRoute) {
                        if (lengthInMeters >= this.defaultOptions.minFitBoundsDistance) {
                            // @ts-ignore;
                            this.map.fitBounds(boundingBox, {
                                padding: this.defaultOptions.fitBoundsPadding,
                                bearing: this.map.getBearing(),
                                pitch: this.map.getPitch(),
                                animate: false,
                            });
                        }
                        else {
                            // @ts-ignore
                            this.map.flyTo({
                                center: center(routePoints).geometry.coordinates,
                                zoom: this.defaultOptions.minFitBoundsDistance < 10 ? 22 : this.map.getZoom(),
                            });
                        }
                    }
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
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(this.state.amenities.map((amenity) => __awaiter(this, void 0, void 0, function* () {
                this.amenityIds.push(amenity.id);
                if (amenity.icon || amenity.id) {
                    try {
                        const response = yield this.map.loadImage(this.defaultOptions.bundleUrl
                            ? `${this.defaultOptions.bundleUrl}/amenities/${amenity.id}.png`
                            : amenity.icon);
                        if (response) {
                            this.map.addImage(amenity.id, response.data);
                        }
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
            })));
            yield Promise.all(this.state.features.features
                .filter((f) => f.properties.metadata && f.properties.metadata['anchor-logo'] && f.properties.type !== 'poi')
                .map((f) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield this.map.loadImage(this.defaultOptions.bundleUrl
                        ? `${this.defaultOptions.bundleUrl}/images/${f.properties.metadata['anchor-logo']}`
                        : `${f.properties.metadata['anchor-logo']}?token=${axios.defaults.headers.common.Authorization}`);
                    if (response) {
                        this.map.addImage(f.id, response.data);
                    }
                }
                catch (e) {
                    console.log(e);
                }
            })));
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
    lerp(a, b, t) {
        return a + (b - a) * t;
    }
    animateRoute() {
        var _a, _b, _c;
        if (this.routingSource &&
            this.routingSource.route &&
            this.routingSource.route[`path-part-${this.currentStep}`] &&
            this.routingSource.levelPoints[this.state.floor.level] &&
            !this.routingSource.preview &&
            !this.useCustomPosition) {
            const route = this.routingSource.route[`path-part-${this.currentStep}`] &&
                ((_a = this.routingSource.route[`path-part-${this.currentStep}`].properties) === null || _a === void 0 ? void 0 : _a.level) ===
                    (((_b = this.routingSource.route[`path-part-${this.currentStep}`].properties) === null || _b === void 0 ? void 0 : _b.source) === 'cityRoute'
                        ? (_c = this.routingSource.route[`path-part-${this.currentStep}`].properties) === null || _c === void 0 ? void 0 : _c.level
                        : this.state.floor.level)
                ? this.routingSource.route[`path-part-${this.currentStep}`]
                : lineString(this.routingSource.levelPoints[this.state.floor.level].map((i) => i.geometry.coordinates), { level: this.state.floor.level });
            let routeUntilNextStep;
            if (route.properties.source === 'cityRoute' || this.defaultOptions.landmarkTBTNavigation) {
                // Step 1: Determine the current level to filter on
                const level = route.properties.source === 'cityRoute'
                    ? route.properties.level // Use route level if it's a city route
                    : this.state.floor.level; // Otherwise, use the currently selected floor level
                const currentStep = this.currentStep; // Step we want to render path up to
                const lines = this.routingSource.lines; // Array of all path segments (lines with geometry and properties)
                // Step 2: Find the index of the line that matches the current step and level
                const currentIndex = lines.findIndex((p) => p.properties.step === currentStep && p.properties.level === level);
                if (currentIndex === -1) {
                    // If no path segment matches the current step and level, stop processing
                    return;
                }
                // Step 3: Walk backward from the current index to find the start of the most recent continuous segment
                let startIndex = currentIndex;
                for (let i = currentIndex - 1; i >= 0; i--) {
                    const curr = lines[i]; // The line at position i
                    const next = lines[i + 1]; // The line ahead (closer to currentIndex)
                    const isSameLevel = curr.properties.level === level; // Still on the correct level?
                    const isConsecutiveStep = curr.properties.step + 1 === next.properties.step; // Is the step incrementing by 1?
                    if (isSameLevel && isConsecutiveStep) {
                        // Keep moving backward if it's part of the same contiguous segment
                        startIndex = i;
                    }
                    else {
                        // Stop if we hit a different level or a break in step continuity
                        break;
                    }
                }
                // Step 4: Slice out the contiguous segment and extract coordinates
                const routePoints = this.useCustomPosition
                    ? lines
                        .filter((i) => i.properties.level === level)
                        .map((i) => i.geometry.coordinates)
                        .filter(Boolean)
                        .flat()
                    : lines
                        .slice(startIndex, currentIndex + 1) // Get the relevant continuous path segment
                        .map((i) => i.geometry.coordinates) // Extract coordinates
                        .filter(Boolean) // Filter out any undefined/null geometries
                        .flat(); // Flatten if coordinates are arrays of arrays
                if (routePoints.length < 2) {
                    // If the path segment is too short, stop processing
                    return;
                }
                // Step 5: Create a LineString from the filtered path segment
                routeUntilNextStep = lineString(routePoints, {
                    level, // Attach the appropriate level to the LineString metadata
                });
                if (this.useCustomPosition) {
                    const customPositionPoint = point(this.customPosition.coordinates);
                    const snappedPoint = nearestPointOnLine(routeUntilNextStep, customPositionPoint);
                    const snappedPointOnVertex = [...new Set(routePoints)].findIndex((i) => i[0] === snappedPoint.geometry.coordinates[0] && i[1] === snappedPoint.geometry.coordinates[1]);
                    const targetCoord = snappedPoint.geometry.coordinates;
                    const splitterSize = 0.0000002; // small enough not to mess with precision
                    // Create a square polygon around the target point
                    const splitter = turfPolygon([
                        [
                            [targetCoord[0] - splitterSize, targetCoord[1] - splitterSize],
                            [targetCoord[0] + splitterSize, targetCoord[1] - splitterSize],
                            [targetCoord[0] + splitterSize, targetCoord[1] + splitterSize],
                            [targetCoord[0] - splitterSize, targetCoord[1] + splitterSize],
                            [targetCoord[0] - splitterSize, targetCoord[1] - splitterSize], // close the polygon
                        ],
                    ]);
                    const customPathLine = lineSplit(lineString([...new Set(routePoints)], {
                        level,
                    }), snappedPointOnVertex >= 0 ? splitter : snappedPoint).features[0];
                    if (this.defaultOptions.routeAnimation.showTailSegment) {
                        customPathLine.geometry.coordinates.push(this.customPosition.coordinates);
                    }
                    routeUntilNextStep = customPathLine;
                }
            }
            if (this.defaultOptions.routeAnimation.type === 'point' || this.defaultOptions.routeAnimation.type === 'puck') {
                cancelAnimationFrame(this.animationFrame);
                clearTimeout(this.animationTimeout);
                const totalDistance = length(route);
                let baseSpeed = 1000 * 30 * this.defaultOptions.routeAnimation.durationMultiplier; // Animation time in milliseconds per meter
                if (route.properties.source === 'cityRoute') {
                    baseSpeed = baseSpeed / this.defaultOptions.routeAnimation.cityRouteSpeedMultiplier;
                }
                let totalDuration = totalDistance * baseSpeed; // Total animation duration based on route length
                if (route.properties.source === 'cityRoute' &&
                    totalDuration > this.defaultOptions.routeAnimation.cityRouteMaxDuration * 1000) {
                    totalDuration = this.defaultOptions.routeAnimation.cityRouteMaxDuration * 1000;
                }
                let startTime;
                if (!this.useCustomPosition) {
                    this.map.setCenter(route.geometry.coordinates[0]);
                }
                const animate = (currentTime) => {
                    var _a;
                    if (!startTime)
                        startTime = currentTime;
                    const elapsedTime = currentTime - startTime;
                    const t = elapsedTime / totalDuration;
                    if (t >= 1) {
                        if (!this.useCustomPosition) {
                            // Stop the animation if we reached the end
                            if (this.defaultOptions.routeAnimation.looping &&
                                (route.properties.source === 'mallRoute' || this.defaultOptions.routeAnimation.autoContinueCityRoute)) {
                                this.animationTimeout = setTimeout(() => {
                                    this.restartRouteAnimation({ delay: 0, recenter: true });
                                }, 2000);
                            }
                            if (this.defaultOptions.autoLevelChange &&
                                (route.properties.source === 'mallRoute' || this.defaultOptions.routeAnimation.autoContinueCityRoute)) {
                                if (this.routingSource.route && Object.keys(this.routingSource.route).length - 1 === this.currentStep) {
                                    if (this.routingSource.stops && ((_a = this.routingSource.stops) === null || _a === void 0 ? void 0 : _a.length) !== this.currentStop) {
                                        this.setStop('next');
                                    }
                                    return;
                                }
                                setTimeout(() => {
                                    if ((this.defaultOptions.routeAnimation.autoContinue && route.properties.source === 'mallRoute') ||
                                        (this.defaultOptions.routeAnimation.autoContinueCityRoute &&
                                            route.properties.source === 'cityRoute')) {
                                        this.setNavStep('next');
                                    }
                                    if (this.defaultOptions.autoRestartAnimationAfterFloorChange &&
                                        !this.defaultOptions.landmarkTBTNavigation) {
                                        this.restartRouteAnimation({ delay: 0, recenter: true });
                                    }
                                }, 2000);
                            }
                            return;
                        }
                    }
                    // Calculate the current distance along the route
                    const currentDistance = t * totalDistance;
                    // Interpolate the current point along the route
                    const currentPoint = along(route, currentDistance);
                    const routeProgress = (this.currentStep / this.routingSource.steps.length) * 100;
                    // cut the line at the point
                    const lineAlong = lineSplit(route.properties.source === 'cityRoute' || this.defaultOptions.landmarkTBTNavigation
                        ? routeUntilNextStep
                        : route, currentPoint).features[0];
                    if (this.defaultOptions.routeAnimation.lineProgress) {
                        lineAlong.properties.color = routeProgress < 30 ? '#FF4136' : routeProgress < 60 ? '#FF851B' : '#2ECC40';
                    }
                    // Update the point position
                    // @ts-ignore
                    const pointData = this.map.getSource('pointAlong')._data;
                    const currentCoords = pointData.features[0]
                        ? pointData.features[0].geometry.coordinates
                        : currentPoint.geometry.coordinates;
                    const newCoords = currentPoint.geometry.coordinates;
                    pointData.features[0] = point(this.defaultOptions.routeAnimation.iconUseLerp
                        ? [
                            this.lerp(currentCoords[0], newCoords[0], this.defaultOptions.routeAnimation.iconLerpTolerance),
                            this.lerp(currentCoords[1], newCoords[1], this.defaultOptions.routeAnimation.iconLerpTolerance),
                        ]
                        : newCoords);
                    if (!this.useCustomPosition) {
                        if (this.defaultOptions.routeAnimation.type === 'point') {
                            if (this.defaultOptions.routeAnimation.pointIconAsMarker) {
                                this.pointIconMarker.setLngLat(newCoords);
                                this.pointIconMarker.getElement().style.backgroundImage =
                                    route.properties.source === 'cityRoute'
                                        ? `url(${this.defaultOptions.routeAnimation.cityPointIconUrl})`
                                        : `url(${this.defaultOptions.routeAnimation.pointIconUrl})`;
                                this.pointIconMarker.addTo(this.map);
                                // set different icon based on nav type
                            }
                            else {
                                pointData.features[0].properties.pointIcon =
                                    route.properties.source === 'cityRoute' ? 'cityPointIcon' : 'pointIcon';
                                // @ts-ignore
                                this.map.getSource('pointAlong').setData(pointData);
                            }
                        }
                        if (this.defaultOptions.routeAnimation.type === 'puck') {
                            this.map
                                .getSource('start-point')
                                // @ts-ignore
                                .setData(circle(pointData.geometry.coordinates, this.defaultOptions.routeAnimation.puckRadius
                                ? this.defaultOptions.routeAnimation.puckRadius
                                : 0.002, {
                                properties: {
                                    level: this.state.floor.level,
                                },
                            }));
                        }
                    }
                    // @ts-ignore
                    this.map.getSource('lineAlong').setData(lineAlong);
                    if (this.defaultOptions.routeAnimation.followRoute && !this.useCustomPosition) {
                        const cameraCoords = this.map.getCenter().toArray();
                        const targetCoords = currentPoint.geometry.coordinates;
                        const interpolatedCoords = [
                            this.lerp(cameraCoords[0], targetCoords[0], this.defaultOptions.routeAnimation.cameraLerpTolerance),
                            this.lerp(cameraCoords[1], targetCoords[1], this.defaultOptions.routeAnimation.cameraLerpTolerance),
                        ];
                        if (!this.defaultOptions.routeAnimation.followRouteAngle) {
                            if (route.properties.source === 'cityRoute') {
                                this.map.setBearing(0);
                            }
                            this.map.easeTo({
                                center: this.defaultOptions.routeAnimation.cameraUseLerp
                                    ? interpolatedCoords
                                    : targetCoords,
                                duration: 50,
                                easing: (x) => x,
                            });
                        }
                        else {
                            const prevPoint = point(currentCoords);
                            const currentP = point(newCoords);
                            const currentBearing = this.map.getBearing();
                            const nextBearing = prevPoint && currentP ? turfBearing(prevPoint, currentP) : currentBearing;
                            let newBearing = currentBearing;
                            if (Math.abs(currentBearing - nextBearing) >= 6) {
                                newBearing = nextBearing;
                            }
                            setTimeout(() => {
                                this.map.flyTo({
                                    center: targetCoords,
                                    bearing: newBearing,
                                    duration: 200,
                                    essential: true,
                                });
                            }, 100); // Adjust this timeout for throttling
                        }
                    }
                    // Continue the animation
                    this.animationFrame = requestAnimationFrame(animate);
                };
                this.animationFrame = requestAnimationFrame(animate);
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
                setTimeout(() => {
                    this.map
                        .getSource('lineAlong')
                        // @ts-ignore
                        .setData(route.properties.source === 'cityRoute' ? routeUntilNextStep : route);
                });
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
    }
    onRestartRouteAnimation({ delay, recenter }) {
        var _a;
        if (this.routingSource &&
            this.routingSource.route &&
            this.routingSource.route[`path-part-${this.currentStep}`] &&
            this.routingSource.levelPoints[this.state.floor.level]) {
            if (this.defaultOptions.routeAnimation.type === 'point' || this.defaultOptions.routeAnimation.type === 'puck') {
                const route = this.routingSource.route[`path-part-${this.currentStep}`] &&
                    ((_a = this.routingSource.route[`path-part-${this.currentStep}`].properties) === null || _a === void 0 ? void 0 : _a.level) === this.state.floor.level
                    ? this.routingSource.route[`path-part-${this.currentStep}`]
                    : lineString(this.routingSource.levelPoints[this.state.floor.level].map((i) => i.geometry.coordinates), { level: this.state.floor.level });
                cancelAnimationFrame(this.animationFrame);
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
                if (this.defaultOptions.routeAnimation.pointIconAsMarker) {
                    this.pointIconMarker.remove();
                }
                if (recenter) {
                    setTimeout(() => {
                        this.map.jumpTo({
                            center: route.geometry.coordinates[0],
                        });
                    }, 100);
                }
                this.map.setStyle(this.state.style);
            }
            setTimeout(() => {
                this.animateRoute();
            }, delay ? delay : 0);
        }
    }
    onStopRouteAnimation(keepRoute) {
        if (this.defaultOptions.routeAnimation.type === 'point' || this.defaultOptions.routeAnimation.type === 'puck') {
            cancelAnimationFrame(this.animationFrame);
            if (!keepRoute) {
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
                if (this.defaultOptions.routeAnimation.pointIconAsMarker) {
                    this.pointIconMarker.remove();
                }
                this.map.setStyle(this.state.style);
            }
        }
    }
    onJumpToRouteEnd() {
        if (this.defaultOptions.routeAnimation.type === 'point' || this.defaultOptions.routeAnimation.type === 'puck') {
            cancelAnimationFrame(this.animationFrame);
            clearTimeout(this.animationTimeout);
            // @ts-ignore
            const pointData = this.map.getSource('pointAlong')._data;
            const newCoords = this.routingSource.finish.geometry.coordinates;
            pointData.features[0] = point(newCoords);
            if (!this.useCustomPosition) {
                if (this.defaultOptions.routeAnimation.type === 'point') {
                    if (this.defaultOptions.routeAnimation.pointIconAsMarker) {
                        this.pointIconMarker.setLngLat(newCoords);
                    }
                    else {
                        // @ts-ignore
                        this.map.getSource('pointAlong').setData(pointData);
                    }
                }
                if (this.defaultOptions.routeAnimation.type === 'puck') {
                    this.map
                        .getSource('start-point')
                        // @ts-ignore
                        .setData(circle(pointData.geometry.coordinates, this.defaultOptions.routeAnimation.puckRadius ? this.defaultOptions.routeAnimation.puckRadius : 0.002, {
                        properties: {
                            level: this.state.floor.level,
                        },
                    }));
                }
            }
            if (!this.routingSource.preview) {
                // @ts-ignore
                this.map.getSource('lineAlong').setData(this.routingSource.lines[this.routingSource.lines.length - 1]);
            }
        }
    }
    translateLayers() {
        if (this.defaultOptions.isKiosk && this.defaultOptions.kioskSettings.showLabel && this.kioskPopup) {
            this.kioskPopup.setHTML(translations[this.defaultOptions.language].YOU_ARE_HERE);
        }
        if (Object.keys(this.startPointPopup).length > 0) {
            this.startPointPopup.setHTML(translations[this.defaultOptions.language].YOU_ARE_HERE);
        }
        this.state.style.setSource('main', this.geojsonSource);
    }
    getClosestFeature(amenityId, fromFeature, handleDefaultPlace = true) {
        let sameLevelfeatures = this.state.allFeatures.features.filter((i) => i.properties.amenity === amenityId &&
            i.geometry.type === 'Point' &&
            i.properties.level === (fromFeature ? fromFeature.properties.level : this.startPoint.properties.level));
        let features = this.state.allFeatures.features.filter((i) => i.properties.amenity === amenityId && i.geometry.type === 'Point');
        if (this.defaultOptions.defaultPlaceId && handleDefaultPlace) {
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
    setInitialBearing(bearingValue) {
        this.routingSource.setInitialBearing(bearingValue);
    }
    onSetCustomPosition({ coordinates, level, bearing, recenter = true, iconSize = 1.5, directionIconSize = 1.25, followBearing = false, followRouteBearing = false, addPositionIcon = true, }) {
        var _a, _b, _c;
        // Initialize debounce/cooldown tracking
        this.floorChangeBuffer = this.floorChangeBuffer || [];
        this.lastFloorChangeTimestamp = this.lastFloorChangeTimestamp || 0;
        // Push the new level into the buffer
        this.floorChangeBuffer.push(level);
        if (this.floorChangeBuffer.length > 5) {
            this.floorChangeBuffer.shift();
        }
        // Helper to get mode
        const getMostFrequent = (arr) => arr
            .slice()
            .sort((a, b) => arr.filter((v) => v === a).length - arr.filter((v) => v === b).length)
            .pop();
        const now = Date.now();
        const mostFrequentLevel = getMostFrequent(this.floorChangeBuffer);
        const count = this.floorChangeBuffer.filter((lvl) => lvl === mostFrequentLevel).length;
        const FLOOR_CONFIRMATION_THRESHOLD = this.defaultOptions.customPositionOptions.aggregateFloorChangeLimit;
        const FLOOR_CHANGE_COOLDOWN_MS = this.defaultOptions.customPositionOptions.floorChangeCooldown;
        let shouldSwitchFloor = level !== this.state.floor.level && now - this.lastFloorChangeTimestamp > FLOOR_CHANGE_COOLDOWN_MS;
        // && recenter;
        if (this.defaultOptions.customPositionOptions.aggregateFloorChange) {
            shouldSwitchFloor =
                mostFrequentLevel !== this.state.floor.level &&
                    count >= FLOOR_CONFIRMATION_THRESHOLD &&
                    now - this.lastFloorChangeTimestamp > FLOOR_CHANGE_COOLDOWN_MS;
            // && recenter;
        }
        if (shouldSwitchFloor) {
            this.setFloorByLevel(mostFrequentLevel);
            this.lastFloorChangeTimestamp = now;
        }
        const isCurrentVisibleFloor = level === this.state.floor.level;
        const isDebouncedFloor = level === mostFrequentLevel && count >= FLOOR_CONFIRMATION_THRESHOLD;
        if (isCurrentVisibleFloor || isDebouncedFloor) {
            const floor = this.state.floors.find((f) => f.level === level);
            const positionFeature = new Feature({
                type: 'Feature',
                properties: {
                    level,
                    floor_id: floor === null || floor === void 0 ? void 0 : floor.id,
                },
                geometry: {
                    type: 'Point',
                    coordinates,
                },
            });
            this.startPoint = positionFeature;
            this.useCustomPosition = true;
            const from = (_a = this.customPosition) === null || _a === void 0 ? void 0 : _a.coordinates;
            const to = coordinates;
            const fromPoint = from ? point(from) : undefined;
            const toPoint = point(to);
            const movedDistance = from ? distance(fromPoint, toPoint, { units: 'meters' }) : 0;
            if (bearing && (!this.customPositionBearing || followBearing) && recenter) {
                this.customPositionBearing = bearing;
                this.setInitialBearing(bearing);
                setTimeout(() => {
                    this.map.flyTo({
                        bearing,
                        duration: 200,
                        essential: true,
                        padding: this.defaultOptions.fitBoundsPadding,
                    });
                }, 100);
            }
            // do an update for additional position sets
            if (from) {
                if (movedDistance > this.defaultOptions.customPositionOptions.minDistanceToChange) {
                    const userBearing = bearing || turfBearing(fromPoint, toPoint);
                    if (this.previousBearing === undefined || Math.abs(this.previousBearing - userBearing) > 10) {
                        this.previousBearing = userBearing;
                        positionFeature.properties.bearing = userBearing;
                    }
                    if (recenter) {
                        if (userBearing && (!this.customPositionBearing || followBearing)) {
                            this.customPositionBearing = userBearing;
                            this.setInitialBearing(userBearing);
                        }
                        setTimeout(() => {
                            this.map.flyTo({
                                center: coordinates,
                                bearing: followBearing ? userBearing : this.map.getBearing(),
                                duration: 200,
                                essential: true,
                                padding: this.defaultOptions.fitBoundsPadding,
                            });
                        }, 100);
                    }
                    if (bearing) {
                        this.previousBearing = bearing;
                        positionFeature.properties.bearing = bearing;
                    }
                    if (this.state.style.sources['custom-position-point']) {
                        // Animate between positions
                        this.animateCustomPosition({ from, to, level, userBearing: this.previousBearing, followRouteBearing });
                        this.customPosition = { coordinates, level };
                        this.onUpdateFeature('custom-position', undefined, level, coordinates[1], coordinates[0], undefined, undefined, floor === null || floor === void 0 ? void 0 : floor.id);
                    }
                }
            }
            // do initial setup
            if (!this.state.style.sources['custom-position-point']) {
                this.state.style.addSource('custom-position-point', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: [positionFeature],
                    },
                });
                this.state.style.addLayer({
                    id: 'custom-position-point-layer',
                    type: 'symbol',
                    source: 'custom-position-point',
                    layout: {
                        'icon-size': iconSize,
                        'icon-image': 'static-dot',
                        'icon-allow-overlap': true,
                        visibility: addPositionIcon ? 'visible' : 'none',
                    },
                    filter: ['all', ['==', ['to-number', ['get', 'level']], this.state.floor.level]],
                });
                if (this.defaultOptions.routeAnimation.showCompassDirection) {
                    this.state.style.addLayer({
                        id: 'heading-icon-layer',
                        type: 'symbol',
                        source: 'custom-position-point',
                        layout: {
                            'icon-image': 'heading-arc',
                            'icon-size': directionIconSize,
                            'icon-rotate': ['get', 'bearing'],
                            'icon-rotation-alignment': 'map',
                            'icon-allow-overlap': true,
                            visibility: addPositionIcon ? 'visible' : 'none',
                        },
                        filter: [
                            'all',
                            ['==', ['to-number', ['get', 'level']], this.state.floor.level],
                            ['has', 'bearing'], // 👈 Hides arrow if no bearing
                        ],
                    });
                }
                this.onAddNewFeature('Custom position', level, coordinates[1], coordinates[0], undefined, 'custom-position', undefined, floor === null || floor === void 0 ? void 0 : floor.id, { visibility: 'hidden', amenity: 'hidden' });
                this.map.setStyle(this.state.style);
                this.customPosition = { coordinates, level };
            }
            // handle additional events if the moved distance is big enough
            if (movedDistance > this.defaultOptions.customPositionOptions.minDistanceToChange) {
                if (this.routingSource && this.routingSource.route) {
                    const stepIndex = getCurrentStepIndex({
                        userPosition: coordinates,
                        steps: this.routingSource.steps,
                        lastKnownStepIndex: this.currentStep,
                        thresholdMeters: this.defaultOptions.routeAnimation.stepChangeThreshold,
                    });
                    this.setNavStep(stepIndex);
                    if ((_c = (_b = this.routingSource.finish) === null || _b === void 0 ? void 0 : _b.geometry) === null || _c === void 0 ? void 0 : _c.coordinates) {
                        const distanceToFinish = distance(this.routingSource.finish.geometry.coordinates, point(coordinates)) * 1000;
                        if (distanceToFinish <= this.defaultOptions.customPositionOptions.arrivalThreshold) {
                            this.onArrivalListener.next(true);
                        }
                    }
                }
                this.handleCustomRouteProgress(followRouteBearing);
                this.onPositionSetListener.next({
                    coordinates,
                    level,
                });
            }
        }
    }
    onCancelCustomPosition() {
        if (this.useCustomPosition) {
            this.useCustomPosition = false;
            this.customPosition = null;
            this.startPoint = null;
            this.previousBearing = undefined;
            this.customPositionBearing = undefined;
            if (this.state.style.sources['custom-position-point']) {
                this.state.style.removeSource('custom-position-point');
            }
            if (this.state.style.getLayer('custom-position-point-layer')) {
                this.state.style.removeLayer('custom-position-point-layer');
            }
            if (this.state.style.getLayer('heading-icon-layer')) {
                this.state.style.removeLayer('heading-icon-layer');
            }
            this.onDeleteFeature('custom-position');
            this.map.setStyle(this.state.style);
        }
    }
    animateCustomPosition({ from, to, level, userBearing, followRouteBearing, }) {
        // Cancel any ongoing animation
        if (this.customPositionAnimationFrameId !== null) {
            cancelAnimationFrame(this.customPositionAnimationFrameId);
            this.customPositionAnimationFrameId = null;
        }
        // Distance-based duration
        const distMeters = distance(from, to) * 1000;
        const minDuration = this.defaultOptions.customPositionOptions.animationMinDuration;
        const durationPerMeter = this.defaultOptions.customPositionOptions.animationDurationPerMeter;
        const maxDuration = this.defaultOptions.customPositionOptions.animationMaxDuration;
        this.customPostionAnimationDuration = Math.min(maxDuration, Math.max(minDuration, minDuration + distMeters * durationPerMeter));
        const startTime = performance.now();
        this.customPostionAnimationStartTime = startTime;
        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / this.customPostionAnimationDuration, 1);
            // Optional easing function (easeInOutQuad)
            const easedProgress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
            const current = [
                from[0] + (to[0] - from[0]) * easedProgress,
                from[1] + (to[1] - from[1]) * easedProgress,
            ];
            const source = this.map.getSource('custom-position-point');
            if (source) {
                const sourceFeature = this.state.style.sources['custom-position-point'].data.features[0];
                source.setData({
                    type: 'FeatureCollection',
                    features: [
                        {
                            type: 'Feature',
                            properties: { level, bearing: followRouteBearing ? sourceFeature.properties.bearing : userBearing },
                            geometry: {
                                type: 'Point',
                                coordinates: current,
                            },
                        },
                    ],
                });
                sourceFeature.geometry.coordinates = current;
                sourceFeature.properties.level = level;
                if (!followRouteBearing)
                    sourceFeature.properties.bearing = userBearing;
            }
            if (progress < 1) {
                this.customPositionAnimationFrameId = requestAnimationFrame(step);
            }
            else {
                this.customPositionAnimationFrameId = null; // Finished
            }
        };
        this.customPositionAnimationFrameId = requestAnimationFrame(step);
    }
    handleCustomRouteProgress(followRouteBearing) {
        var _a;
        if (((_a = this.routingSource) === null || _a === void 0 ? void 0 : _a.lines) && this.useCustomPosition && this.customPosition.coordinates) {
            const lines = this.routingSource.lines;
            const level = this.state.floor.level;
            const routePoints = lines
                .filter((i) => i.properties.level === level)
                .map((i) => i.geometry.coordinates)
                .filter(Boolean)
                .flat();
            if (routePoints.length < 2) {
                // If the path segment is too short, stop processing
                return;
            }
            const routeLine = lineString(routePoints, {
                level, // Attach the appropriate level to the LineString metadata
            });
            const customPositionPoint = point(this.customPosition.coordinates);
            const snappedPoint = nearestPointOnLine(routeLine, customPositionPoint);
            const routeLineUntilPosition = lineSlice(routePoints[0], snappedPoint, lineString([...new Set(routePoints)], {
                level,
            }));
            if (this.defaultOptions.routeAnimation.showTailSegment) {
                routeLineUntilPosition.geometry.coordinates.push(this.customPosition.coordinates);
            }
            const routeProgress = (this.currentStep / this.routingSource.steps.length) * 100;
            if (this.defaultOptions.routeAnimation.lineProgress) {
                routeLineUntilPosition.properties.color =
                    routeProgress < 30 ? '#FF4136' : routeProgress < 60 ? '#FF851B' : '#2ECC40';
            }
            if (followRouteBearing) {
                const routeBearing = turfBearing(routeLineUntilPosition.geometry.coordinates[routeLineUntilPosition.geometry.coordinates.length - 2], snappedPoint);
                if (this.defaultOptions.routeAnimation.showCompassDirection) {
                    const customPositioFeature = this.state.style.sources['custom-position-point'].data.features[0];
                    customPositioFeature.properties.bearing = routeBearing;
                }
                setTimeout(() => {
                    this.map.flyTo({
                        bearing: routeBearing,
                        duration: 200,
                        essential: true,
                        padding: this.defaultOptions.fitBoundsPadding,
                    });
                }, 500);
            }
            // @ts-ignore
            this.map.getSource('lineAlong').setData(routeLineUntilPosition);
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
     *  @name getDataFetchedListener
     *  @returns returns map data fetched listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getDataFetchedListener().subscribe(fetched => {
     *    console.log('data fetched', fetched);
     *  });
     */
    getDataFetchedListener() {
        return this.onDataFetchedListener;
    }
    /**
     *  @memberof Map
     *  @name getMapLoadListener
     *  @returns returns map load listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapLoadListener().subscribe(loaded => {
     *    console.log('map load', loaded);
     *  });
     */
    getMapLoadListener() {
        return this.onMapLoadListener;
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
     *  @memberof Map
     *  @name getMainSourceLoadedListener
     *  @returns returns main source fully loaded listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMainSourceLoadedListener().subscribe(loaded => {
     *    console.log('map loaded', loaded);
     *  });
     */
    getMainSourceLoadedListener() {
        return this.onMainSourceLoadedListener;
    }
    /**
     *  @memberof Map
     *  @name getMapFailedListener
     *  @returns returns map failed listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapFailedListener().subscribe(error => {
     *    console.log('map failed', error.message);
     *  });
     */
    getMapFailedListener() {
        return this.onMapFailedListener;
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
        this.translateLayers();
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
            const place = this.defaultOptions.bundleUrl
                ? yield getPlaceByIdBundle({ placeId, bundleUrl: this.defaultOptions.bundleUrl })
                : yield getPlaceById(placeId);
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
     * This method will find closest point on the path nearby of defined feature.
     *  @memberof Map
     *  @name findPathPoint
     *  @param featureId {string} ID of the feature to find path point for
     *  @returns closest point
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findPathPoint({featureId: 'featureId'});
     *  });
     */
    findPathPoint({ featureId, displayOnMap = false }) {
        const fromFeature = this.state.allFeatures.features.find((f) => f.id === featureId);
        if (!fromFeature) {
            throw new Error(`Feature with id '${featureId}' does not exist!`);
        }
        const featurePoint = this.getClosestPointOnPath(fromFeature);
        if (featurePoint && displayOnMap) {
            this.displayPointOnMap(featurePoint);
        }
        return featurePoint;
    }
    /**
     * This method will generate route based on selected features by their ids
     *  @memberof Map
     *  @name findRouteByIds
     *  @param idTo {string} finish feature id
     *  @param idFrom {string} start feature id, optional for kiosk
     *  @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional
     *  @param wayfindingConfig {WayfindingConfigModel} wayfinding configuration, optional
     *  @param addToMap {boolean} default true, if set to false route will not be added to map
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByIds('finishId, 'startId');
     *  });
     */
    findRouteByIds(idTo, idFrom, accessibleRoute, wayfindingConfig, addToMap) {
        const fromFeature = idFrom
            ? this.state.allFeatures.features.find((f) => f.id === idFrom || f.properties.id === idFrom)
            : this.startPoint;
        const toFeature = this.state.allFeatures.features.find((f) => f.id === idTo || f.properties.id === idTo);
        this.routingSource.toggleAccessible(accessibleRoute);
        if (wayfindingConfig) {
            this.routingSource.setConfig(wayfindingConfig);
        }
        if (addToMap !== false) {
            this.onRouteUpdate({
                start: fromFeature,
                finish: toFeature,
            });
        }
        else {
            this.onRoutePreview({
                start: fromFeature,
                finish: toFeature,
            });
        }
    }
    /**
     * This method will generate route based on selected features by their titles
     *  @memberof Map
     *  @name findRouteByTitle
     *  @param titleTo {string} finish feature title
     *  @param titleFrom {string} start feature title, optional for kiosk
     *  @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional
     *  @param wayfindingConfig {WayfindingConfigModel} wayfinding configuration, optional
     *  @param addToMap {boolean} default true, if set to false route will not be added to map
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByTitle('myFeatureTitle', 'anotherFeatureTitle');
     *  });
     */
    findRouteByTitle(titleTo, titleFrom, accessibleRoute, wayfindingConfig, addToMap) {
        const fromFeature = titleFrom
            ? this.state.allFeatures.features.find((f) => f.properties.title === titleFrom)
            : this.startPoint;
        const toFeature = this.state.allFeatures.features.find((f) => f.properties.title === titleTo);
        this.routingSource.toggleAccessible(accessibleRoute);
        if (wayfindingConfig) {
            this.routingSource.setConfig(wayfindingConfig);
        }
        if (addToMap !== false) {
            this.onRouteUpdate({
                start: fromFeature,
                finish: toFeature,
            });
        }
        else {
            this.onRoutePreview({
                start: fromFeature,
                finish: toFeature,
            });
        }
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
     *  @param addToMap {boolean} default true, if set to false route will not be added to map
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteByCoords(48.606703739771774, 17.833092384506614, 0, 48.60684545080579, 17.833450676669543, 0);
     *  });
     */
    findRouteByCoords(latTo, lngTo, levelTo, latFrom, lngFrom, levelFrom, accessibleRoute, wayfindingConfig, addToMap) {
        const fromFeature = latFrom && lngFrom && levelFrom
            ? feature({ type: 'Point', coordinates: [lngFrom, latFrom] }, { level: levelFrom })
            : this.startPoint;
        const toFeature = feature({ type: 'Point', coordinates: [lngTo, latTo] }, { level: levelTo });
        this.routingSource.toggleAccessible(accessibleRoute);
        if (wayfindingConfig) {
            this.routingSource.setConfig(wayfindingConfig);
        }
        if (addToMap !== false) {
            this.onRouteUpdate({
                start: fromFeature,
                finish: toFeature,
            });
        }
        else {
            this.onRoutePreview({
                start: fromFeature,
                finish: toFeature,
            });
        }
    }
    /**
     * This method will generate route to nearest amenity feature
     *  @memberof Map
     *  @name findRouteToNearestFeature
     *  @param amenityId {string} amenity id of a nearest feature to look for
     *  @param idFrom {string} start feature id, optional for kiosk
     *  @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional
     *  @param wayfindingConfig {WayfindingConfigModel} wayfinding configuration, optional
     *  @param addToMap {boolean} default true, if set to false route will not be added to map
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteToNearestFeature('amenityId');
     *  });
     */
    findRouteToNearestFeature(amenityId, idFrom, accessibleRoute, wayfindingConfig, addToMap) {
        const fromFeature = idFrom
            ? this.state.allFeatures.features.find((f) => f.id === idFrom || f.properties.id === idFrom)
            : this.startPoint;
        const toFeature = this.getClosestFeature(amenityId, fromFeature);
        if (toFeature) {
            this.routingSource.toggleAccessible(accessibleRoute);
            if (wayfindingConfig) {
                this.routingSource.setConfig(wayfindingConfig);
            }
            if (addToMap !== false) {
                this.onRouteUpdate({
                    start: fromFeature,
                    finish: toFeature,
                });
            }
            else {
                this.onRoutePreview({
                    start: fromFeature,
                    finish: toFeature,
                });
            }
        }
        else {
            throw new Error(`Feature not found`);
        }
    }
    /**
     * This method will generate city route
     *  @memberof Map
     *  @name findCityRoute
     *  @param start {lat: number, lng: number} start coordinates
     *  @param destination {lat: number, lng: number} destination coordinates
     *  @param autoStart {boolean} default true, if set to false route will not start automatically
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findCityRoute({
     *      start: {
     *        lat: 48.606703739771774,
     *        lng: 17.833092384506614
     *      },
     *      destination: {
     *        lat: 48.60684545080579,
     *        lng: 17.833450676669543
     *      }
     *    });
     *  });
     */
    findCityRoute({ start, destination, autoStart = true, }) {
        const startFeature = feature({ type: 'Point', coordinates: [start.lng, start.lat] }, { level: this.defaultOptions.routeAnimation.mallEntryLevel });
        const destinationFeature = feature({ type: 'Point', coordinates: [destination.lng, destination.lat] }, { level: this.defaultOptions.routeAnimation.mallEntryLevel });
        this.routingSource.setNavigationType('city');
        if (autoStart !== false) {
            this.onRouteUpdate({
                start: startFeature,
                finish: destinationFeature,
            });
        }
        else {
            this.onRoutePreview({
                start: startFeature,
                finish: destinationFeature,
            });
        }
    }
    /**
     * This method will generate route based on selected features by their ids
     *  @memberof Map
     *  @name findMultipointRoute
     *  @param start {string} start feature id
     *  @param stops [{string}] array of destination feature ids
     *  @param wayfindingConfig {WayfindingConfigModel} wayfinding configuration, optional
     *  @param autoStart {boolean} default true, if set to false route will not be added to map
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findMultipointRoute({
     *      start: 'startId',
     *      stops: ['stop1Id', 'stop2Id']
     *    });
     *  });
     */
    findMultipointRoute({ start, stops, wayfindingConfig, autoStart = true, }) {
        const fromFeature = start
            ? this.state.allFeatures.features.find((f) => f.id === start || f.properties.id === start)
            : this.startPoint;
        const destinationFeatures = stops.map((id) => {
            return this.state.allFeatures.features.find((f) => f.id === id || f.properties.id === id);
        });
        if (wayfindingConfig) {
            this.routingSource.setConfig(wayfindingConfig);
        }
        this.stops = [fromFeature, ...destinationFeatures];
        this.addStopMarkers();
        if (autoStart !== false) {
            this.onRouteUpdate({
                start: fromFeature,
                stops: destinationFeatures,
            });
        }
        else {
            this.onRoutePreview({
                start: fromFeature,
                stops: destinationFeatures,
            });
        }
    }
    /**
     * This method will generate combined mall/city route
     *  @memberof Map
     *  @name findCombinedRoute
     *  @param start {lat: number, lng: number} | {string} start coordinates / feature id
     *  @param connectingPoint {lat: number, lng: number} connecting point coordinates for mall/city nav
     *  @param destination {lat: number, lng: number} | {string} destination coordinates / feature id
     *  @param autoStart {boolean} default true, if set to false route will not start automatically
     *  @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional
     *  @param wayfindingConfig {WayfindingConfigModel} wayfinding configuration, optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findCombinedRoute({
     *      start: {
     *        lat: 48.606703739771774,
     *        lng: 17.833092384506614
     *      },
     *      connectingPoint: {
     *        lat: 48.60684545080579,
     *        lng: 17.833450676669543
     *      },
     *      destination: 'destinationId'
     *    });
     *  });
     */
    findCombinedRoute({ start, connectingPoint, destination, autoStart = true, accessibleRoute, wayfindingConfig, }) {
        const startFeature = typeof start === 'string' || start instanceof String
            ? this.state.allFeatures.features.find((f) => f.id === start || f.properties.id === start)
            : feature({ type: 'Point', coordinates: [start.lng, start.lat] }, { level: this.defaultOptions.routeAnimation.mallEntryLevel });
        const connectingPointFeature = feature({ type: 'Point', coordinates: [connectingPoint.lng, connectingPoint.lat] }, { level: this.defaultOptions.routeAnimation.mallEntryLevel });
        const destinationFeature = typeof destination === 'string' || destination instanceof String
            ? this.state.allFeatures.features.find((f) => f.id === destination || f.properties.id === destination)
            : feature({ type: 'Point', coordinates: [destination.lng, destination.lat] }, { level: this.defaultOptions.routeAnimation.mallEntryLevel });
        this.routingSource.setNavigationType('combined');
        this.routingSource.toggleAccessible(accessibleRoute);
        if (wayfindingConfig) {
            this.routingSource.setConfig(wayfindingConfig);
        }
        if (autoStart !== false) {
            this.onRouteUpdate({
                start: startFeature,
                connectingPoint: connectingPointFeature,
                finish: destinationFeature,
            });
        }
        else {
            this.onRoutePreview({
                start: startFeature,
                connectingPoint: connectingPointFeature,
                finish: destinationFeature,
            });
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
        var _a, _b, _c, _d;
        let newStep = 0;
        if (isNumber(step)) {
            newStep = +step;
        }
        if (step === 'next') {
            newStep = this.currentStep + 1;
        }
        if (step === 'next' &&
            this.routingSource.route &&
            Object.keys(this.routingSource.route).length - 1 === this.currentStep) {
            newStep = 0;
        }
        if (step === 'previous' && this.currentStep > 0) {
            newStep = this.currentStep - 1;
        }
        if (newStep === this.currentStep) {
            if (this.useCustomPosition) {
                this.animateRoute();
            }
            return;
        }
        if (this.routingSource && this.routingSource.route && this.routingSource.route[`path-part-${newStep}`]) {
            const route = this.routingSource.route[`path-part-${newStep}`];
            const prevRoute = this.routingSource.route[`path-part-${newStep - 1}`];
            const nextRoute = this.routingSource.route[`path-part-${newStep + 1}`];
            this.currentStep = newStep;
            if (route.properties.source === 'cityRoute') {
                this.setFloorByLevel(route.properties.level);
                this.animateRoute();
            }
            else {
                if (this.routingSource.isMultipoint || this.defaultOptions.enableTBTNavigation) {
                    this.animateRoute();
                }
                this.centerOnRoute(this.routingSource.route[`path-part-${newStep}`]);
            }
            if (this.routingSource.navigationType === 'combined' &&
                (route.properties.source !== (prevRoute === null || prevRoute === void 0 ? void 0 : prevRoute.properties.source) ||
                    route.properties.source !== (nextRoute === null || nextRoute === void 0 ? void 0 : nextRoute.properties.source))) {
                this.map.setZoom(route.properties.source === 'cityRoute'
                    ? this.defaultOptions.routeAnimation.cityRouteZoom
                    : this.defaultOptions.routeAnimation.mallRouteZoom);
            }
            this.onStepSetListener.next(this.currentStep);
            if (isNumber((_a = this.routingSource.route[`path-part-${newStep}`].properties) === null || _a === void 0 ? void 0 : _a.stop) &&
                ((_b = this.routingSource.route[`path-part-${newStep}`].properties) === null || _b === void 0 ? void 0 : _b.stop) >= 0 &&
                this.currentStop !== ((_c = this.routingSource.route[`path-part-${newStep}`].properties) === null || _c === void 0 ? void 0 : _c.stop)) {
                this.setStop((_d = this.routingSource.route[`path-part-${newStep}`].properties) === null || _d === void 0 ? void 0 : _d.stop);
            }
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
     * This method will set the current stop for multipoint route navigation so map can focus on a proper path part
     *  @memberof Map
     *  @name setStop
     *  @param stop { number | 'next' | 'previous' } Number of route part to focus on or string next or previous
     *  @returns active stop
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setStop(0);
     *  });
     */
    setStop(stop) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        let newStop = 0;
        if (isNumber(stop)) {
            newStop = +stop;
        }
        if (stop === 'next') {
            newStop = this.currentStop + 1;
        }
        if (stop === 'next' && this.routingSource.stops && this.routingSource.stops.length === this.currentStop) {
            newStop = 0;
        }
        if (stop === 'previous' && this.currentStop > 0) {
            newStop = this.currentStop - 1;
        }
        if (newStop === this.currentStop) {
            return;
        }
        const newStopRoute = (_b = (_a = this.routingSource) === null || _a === void 0 ? void 0 : _a.lines) === null || _b === void 0 ? void 0 : _b.find((i) => i.properties.stop === newStop);
        if (newStopRoute) {
            this.currentStop = newStop;
            this.animateRoute();
            this.centerOnRoute(newStopRoute);
            this.onStopSetListener.next(this.currentStop);
            this.setNavStep(newStopRoute.properties.step);
            return this.currentStop;
        }
        else {
            if (this.routingSource.lines) {
                this.currentStop = newStop;
                this.onStopSetListener.next(this.currentStop);
                if (((_c = this.routingSource.stops) === null || _c === void 0 ? void 0 : _c.length) < newStop) {
                    this.setNavStep((_h = (_g = (_d = this.routingSource) === null || _d === void 0 ? void 0 : _d.lines[((_f = (_e = this.routingSource) === null || _e === void 0 ? void 0 : _e.lines) === null || _f === void 0 ? void 0 : _f.length) - 1]) === null || _g === void 0 ? void 0 : _g.properties) === null || _h === void 0 ? void 0 : _h.step);
                }
                this.onJumpToRouteEnd();
                this.centerToFeature(this.routingSource.finish.id);
                return this.currentStop;
            }
            else {
                console.log('Route not found');
            }
        }
    }
    /**
     *  @memberof Map
     *  @name getStopSetListener
     *  @returns returns stop set listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getStopSetListener().subscribe(stop => {
     *    console.log('new stop has been set', stop);
     *  });
     */
    getStopSetListener() {
        return this.onStopSetListener;
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
     *  map.getFeatureDeleteListener().subscribe(feature => {
     *    console.log('feature deleted', feature);
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
        if (!this.defaultOptions.isKiosk) {
            this.defaultOptions.isKiosk = true;
            this.initKiosk();
        }
        if (this.defaultOptions.isKiosk) {
            this.onSetKiosk(lat, lng, level);
        }
        else {
            throw new Error(`Map is not initiated as kiosk`);
        }
    }
    /**
     * This method will stop kiosk behaviour.
     *  @memberof Map
     *  @name stopKiosk
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
     *    map.stopKiosk();
     *  });
     */
    stopKiosk() {
        if (this.defaultOptions.isKiosk) {
            this.onStopKiosk();
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
     * With this method you can hide all icons.
     *  @memberof Map
     *  @name hideIcons
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.hideIcons();
     *  });
     */
    hideIcons() {
        this.onHideIcons();
    }
    /**
     * With this method you can show all icons.
     *  @memberof Map
     *  @name showIcons
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.showIcons();
     *  });
     */
    showIcons() {
        this.onShowIcons();
    }
    /**
     * With this method you can hide layer.
     *  @memberof Map
     *  @name hideLayer
     *  @param layerId {string} id of the layer
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.hideLayer('proximiio-texts');
     *  });
     */
    hideLayer(layerId) {
        this.onHideLayer(layerId);
    }
    /**
     * With this method you can show layer.
     *  @memberof Map
     *  @name showLayer
     *  @param layerId {string} id of the layer
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.showLayer('proximiio-texts');
     *  });
     */
    showLayer(layerId) {
        this.onShowLayer(layerId);
    }
    /**
     * With this method you can show all icons.
     *  @memberof Map
     *  @name setHiddenAmenities
     *  @param amenities {string[]} amenityIds to assign hideIcon property to features
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setHiddenAmenities(['amenity1', 'amenity2']);
     *  });
     */
    setHiddenAmenities(amenities) {
        this.onSetHiddenAmenities(amenities);
    }
    /**
     * With this method you can enable icons for polygon prevented features.
     *  @memberof Map
     *  @name enablePolygonPreventedIcons
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.enablePolygonPreventedIcons();
     *  });
     */
    enablePolygonPreventedIcons() {
        this.onEnablePolygonPreventedIcons();
    }
    /**
     * With this method you can disable icons for polygon prevented features.
     *  @memberof Map
     *  @name disablePolygonPreventedIcons
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.disablePolygonPreventedIcons();
     *  });
     */
    disablePolygonPreventedIcons() {
        this.onDisablePolygonPreventedIcons();
    }
    /**
     * With this method you can disable all polygons.
     *  @memberof Map
     *  @name disablePolygons
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.disablePolygons();
     *  });
     */
    disablePolygons() {
        this.onDisablePolygons();
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
     *  @param enlargeIcon {boolean} enlarge original icon, optional.
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setFeaturesHighlight(['featureid']);
     *  });
     */
    setFeaturesHighlight(features, color, radius, blur, enlargeIcon, opacity, translate) {
        this.onSetFeaturesHighlight({ features, color, radius, blur, enlargeIcon, opacity, translate });
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
    /**
     * Method for restarting route animation
     *  @memberof Map
     *  @name restartRouteAnimation
     *  @param delay {number} delay the route start.
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.restartRouteAnimation();
     *  });
     */
    restartRouteAnimation({ delay, recenter }) {
        this.onRestartRouteAnimation({ delay, recenter });
    }
    /**
     * Method for stopping route animation
     *  @memberof Map
     *  @name stopRouteAnimation
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.stopRouteAnimation();
     *  });
     */
    stopRouteAnimation(keepRoute) {
        this.onStopRouteAnimation(keepRoute);
    }
    bootPolygons() {
        this.onBootPolygons();
    }
    setCustomPosition({ coordinates, level, bearing, recenter = true, iconSize, directionIconSize, followBearing = false, followRouteBearing = false, addPositionIcon = true, }) {
        this.positionsList.push(coordinates);
        if (this.positionsList.length >= this.defaultOptions.customPositionOptions.aggregatePositionsLimit) {
            const positionPoints = points(this.positionsList);
            let resultPoint = point(this.positionsList[this.positionsList.length - 1]);
            if (this.defaultOptions.customPositionOptions.aggregationResult === 'center' ||
                (this.defaultOptions.customPositionOptions.aggregationResult === 'nearest' && !this.customPosition)) {
                resultPoint = center(positionPoints);
            }
            if (this.defaultOptions.customPositionOptions.aggregationResult === 'nearest' && this.customPosition) {
                resultPoint = nearestPoint(this.customPosition.coordinates, positionPoints);
            }
            this.onSetCustomPosition({
                coordinates: resultPoint.geometry.coordinates,
                level,
                bearing,
                recenter,
                iconSize,
                directionIconSize,
                followBearing,
                followRouteBearing,
                addPositionIcon,
            });
            this.positionsList = [];
        }
    }
    /**
     * Method for setting custom position
     *  @memberof Map
     *  @name getCustomPosition
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.getCustomPosition();
     *  });
     */
    getCustomPosition() {
        if (this.useCustomPosition) {
            return this.customPosition;
        }
        else {
            return null;
        }
    }
    /**
     * Method for setting custom position
     *  @memberof Map
     *  @name cancelCustomPosition
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.cancelCustomPosition();
     *  });
     */
    cancelCustomPosition() {
        this.onCancelCustomPosition();
    }
    /**
     *  @memberof Map
     *  @name getPositionSetListener
     *  @returns returns position set listener
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getPositionSetListener().subscribe({coordinates, level} => {
     *    console.log('custom position set', coordinates, level);
     *  });
     */
    getPositionSetListener() {
        return this.onPositionSetListener;
    }
    /**
     *  @memberof Map
     *  @name getArrivalListener
     *  @returns returns event when custom position reach the destination
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getArrivalListener().subscribe(() => {
     *    console.log('you have reached your destination');
     *  });
     */
    getArrivalListener() {
        return this.onArrivalListener;
    }
    initGpsMode() {
        this.defaultOptions.useGpsLocation = true;
        this.initGeoLocation();
    }
    enableRouteAnimation() {
        this.defaultOptions.routeAnimation.enabled = true;
        this.initAnimatedRoute();
    }
    disableRouteAnimation() {
        this.defaultOptions.routeAnimation.enabled = false;
    }
}
/* TODO
 * - check clusters
 * */
