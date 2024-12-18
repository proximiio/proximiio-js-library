import maplibregl, { FillExtrusionLayerSpecification, LngLatLike, Marker, SymbolLayerSpecification } from 'maplibre-gl';
import { axios, optimizeFeatures } from '../../common';
import {
  addFeatures,
  deleteFeatures,
  getAmenities,
  getAmenitiesBundle,
  getFeatures,
  getFeaturesBundle,
} from '../../controllers/geo';
import { PlaceModel } from '../../models/place';
import { FloorModel } from '../../models/floor';
import StyleModel from '../../models/style';
import GeoJSONSource from './sources/geojson_source';
import SyntheticSource from './sources/synthetic_source';
import Feature, { FeatureCollection, Geometry } from '../../models/feature';
import DataSource from './sources/data_source';
import RoutingSource from './sources/routing_source';
import ClusterSource from './sources/cluster_source';
import ImageSourceManager from './sources/image_source_manager';
import { AmenityModel } from '../../models/amenity';
import { filterByAmenity, getBase64FromImage, getImageFromBase64, throttle, uuidv4 } from '../../common';
import {
  chevron,
  pulsingDot,
  person as personIcon,
  floorchangeUpImage,
  floorchangeDownImage,
  popupImage,
  routeStartSvg,
  routeFinishSvg,
} from './icons';
import { LngLatBoundsLike, MapLibreEvent } from 'maplibre-gl';
import { getFloors, getFloorsBundle, getPlaceFloors, getPlaceFloorsBundle } from '../../controllers/floors';
import { getPlaceById, getPlaceByIdBundle, getPlaces, getPlacesBundle } from '../../controllers/places';
import { CustomSubject } from '../../customSubject';
// @ts-ignore
import * as tingle from 'tingle.js/dist/tingle';
import { EDIT_FEATURE_DIALOG, NEW_FEATURE_DIALOG } from './constants';
import { MapboxOptions } from '../../models/mapbox-options';
import { PolygonsLayer, PolygonIconsLayer, PolygonTitlesLayer, PolygonTitlesLineLayer } from './custom-layers';
import PersonModel from '../../models/person';
import bbox from '@turf/bbox';
import length from '@turf/length';
import center from '@turf/center';
import along from '@turf/along';
import lineSplit from '@turf/line-split';
import nearestPoint from '@turf/nearest-point';
import bearing from '@turf/bearing';
import circle from '@turf/circle';
import { isNumber, lineString, point, feature, featureCollection } from '@turf/helpers';
import WayfindingLogger from '../logger/wayfinding';
import { translations } from './i18n';
import { WayfindingConfigModel } from '../../models/wayfinding';
import { KioskModel } from '../../models/kiosk';
import { getStyle, getStyleBundle, getStyles, getStylesBundle } from '../../controllers/style';
import { getKiosks, getKiosksBundle } from '../../controllers/kiosks';
import { Protocol, PMTiles } from 'pmtiles';

export interface State {
  readonly initializing: boolean;
  readonly floor: FloorModel;
  readonly floors: FloorModel[];
  readonly place: PlaceModel;
  readonly places: PlaceModel[];
  readonly kiosks: KioskModel[];
  readonly style: StyleModel;
  readonly styles: StyleModel[];
  readonly amenities: AmenityModel[];
  readonly features: FeatureCollection;
  readonly optimizedFeatures: FeatureCollection;
  readonly dynamicFeatures: FeatureCollection;
  readonly allFeatures: FeatureCollection;
  readonly latitude: number;
  readonly longitude: number;
  readonly zoom?: number;
  readonly loadingRoute: boolean;
  readonly noPlaces: boolean;
  readonly textNavigation: any;
  readonly persons: PersonModel[];
  readonly user;
}

export interface PolygonOptions {
  defaultPolygonColor?: string;
  hoverPolygonColor?: string;
  selectedPolygonColor?: string;
  disabledPolygonColor?: string;
  defaultLabelColor?: string;
  hoverLabelColor?: string;
  selectedLabelColor?: string;
  disabledLabelColor?: string;
  defaultPolygonHeight?: number;
  hoverPolygonHeight?: number;
  selectedPolygonHeight?: number;
  disabledPolygonHeight?: number;
  base?: number;
  opacity?: number;
  removeOriginalPolygonsLayer?: boolean;
  minZoom?: number;
  maxZoom?: number;
  labelMinZoom?: number;
  labelMaxZoom?: number;
  iconMinZoom?: number;
  iconMaxZoom?: number;
  labelFontSize?: (string | number | string[])[] | number | any;
  symbolPlacement?: 'point' | 'line' | 'line-center';
  autoLabelLines?: boolean;
  textFont?: string[];
  adaptiveLabelOpacity?: boolean;
  adaptiveMaxPitch?: number;
  drawRouteUnderPolygons?: boolean;
}

export interface PolygonLayer extends PolygonOptions {
  featureType: string;
  iconImage?: string;
  iconImageDefaultVisible?: boolean;
}

export interface Options {
  bundleUrl?: string;
  selector?: string;
  allowNewFeatureModal?: boolean;
  newFeatureModalEvent?: string;
  enableTBTNavigation?: boolean;
  mapboxOptions?: MapboxOptions;
  zoomIntoPlace?: boolean;
  defaultPlaceId?: string;
  defaultFloorLevel?: number;
  isKiosk?: boolean;
  kioskSettings?: {
    coordinates: [number, number];
    level: number;
    showPoint?: boolean;
    showLabel?: boolean;
    pointColor?: string;
    pointOutline?: boolean;
    labelFont?: string | string[];
  };
  initPolygons?: boolean;
  polygonsOptions?: PolygonOptions;
  polygonLayers?: PolygonLayer[];
  zoomLevel?: number;
  considerVisibilityParam?: boolean;
  fitBoundsPadding?: number | PaddingOptions;
  minFitBoundsDistance?: number;
  showLevelDirectionIcon?: boolean;
  levelDirectionPopupImage?: string;
  levelDirectionOutlineColor?: string;
  showRasterFloorplans?: boolean;
  animatedRoute?: boolean;
  animationLooping?: boolean;
  routeAnimation?: {
    enabled?: boolean;
    type?: 'point' | 'dash' | 'puck';
    looping?: boolean;
    followRoute?: boolean;
    followRouteAngle?: boolean;
    duration?: number;
    durationMultiplier?: number;
    fps?: number;
    pointIconUrl?: string;
    pointIconSize?: number;
    pointIconAsMarker?: boolean;
    pointIconMarkerSize?: number;
    pointColor?: string;
    pointRadius?: number;
    puckColor?: string;
    puckRadius?: number;
    puckHeight?: number;
    lineColor?: string;
    lineOpacity?: number;
    lineWidth?: number;
    minzoom?: number;
    maxzoom?: number;
    iconUseLerp?: boolean;
    iconLerpTolerance?: number;
    cameraUseLerp?: boolean;
    cameraLerpTolerance?: number;
    autoRestart?: boolean;
    dashKeepOriginalRouteLayer?: boolean;
    cityRouteSpeedMultiplier?: number;
    cityPointIconUrl?: string;
    cityRouteMaxDuration?: number;
  };
  useRasterTiles?: boolean;
  rasterTilesOptions?: {
    tilesUrl?: string[];
    tileSize?: number;
    minZoom?: number;
    maxZoom?: number;
    beforeLayer?: string;
    attribution?: string;
    useProxy?: boolean;
    bounds?: [number, number, number, number];
  };
  handleUrlParams?: boolean;
  urlParams?: {
    startFeauture?: string;
    destinationFeature?: string;
    defaultPlace?: string;
  };
  useGpsLocation?: boolean;
  geolocationControlOptions?: {
    autoTrigger?: boolean;
    autoLocate?: boolean;
    position?: 'top-right' | 'top-left' | 'bottom-left' | 'bottom-right';
  };
  language?: string;
  routeColor?: string;
  forceFloorLevel?: number;
  amenityIdProperty?: string;
  routeWithDetails?: boolean;
  blockFeatureClickWhileRouting?: boolean;
  hiddenAmenities?: string[];
  useTimerangeData?: boolean;
  sendAnalytics?: boolean;
  defaultFilter?: {
    key: string;
    value: string;
    hideIconOnly?: boolean;
  };
  featuresMaxBounds?: LngLatBoundsLike;
  localSources?: {
    features?: FeatureCollection;
    amenities?: AmenityModel[];
  };
  autoLevelChange?: boolean;
  pmTilesUrl?: string;
  autoRestartAnimationAfterFloorChange?: boolean;
  poiIconSize?: (string | number | string[])[] | number | any;
  disableUnavailablePois?: boolean;
}

export interface PaddingOptions {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export const globalState: State = {
  initializing: true,
  floor: new FloorModel({}),
  floors: [],
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
};

export class Map {
  private map: maplibregl.Map;
  private state;
  private geojsonSource: GeoJSONSource = new GeoJSONSource(new FeatureCollection({}));
  private syntheticSource: SyntheticSource = new SyntheticSource(new FeatureCollection({}));
  private routingSource: RoutingSource = new RoutingSource();
  private clusterSource: ClusterSource = new ClusterSource();
  private imageSourceManager: ImageSourceManager = new ImageSourceManager();
  private onMapReadyListener = new CustomSubject<boolean>();
  private onMainSourceLoadedListener = new CustomSubject<boolean>();
  private onMapFailedListener = new CustomSubject<boolean>();
  private onPlaceSelectListener = new CustomSubject<PlaceModel>();
  private onFloorSelectListener = new CustomSubject<FloorModel>();
  private onRouteFoundListener = new CustomSubject<any>();
  private onRouteFailedListener = new CustomSubject();
  private onRouteCancelListener = new CustomSubject();
  private onFeatureAddListener = new CustomSubject<Feature>();
  private onFeatureUpdateListener = new CustomSubject<Feature>();
  private onFeatureDeleteListener = new CustomSubject();
  private onPolygonClickListener = new CustomSubject<Feature>();
  private onPoiClickListener = new CustomSubject<Feature>();
  private onPersonUpdateListener = new CustomSubject<PersonModel[]>();
  private onStepSetListener = new CustomSubject<number>();
  private onStopSetListener = new CustomSubject<number>();
  private defaultOptions: Options = {
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
        18, // Zoom level 18
        [
          'interpolate',
          ['linear'],
          ['/', ['get', 'length', ['get', '_dynamic']], ['/', ['length', ['get', 'title']], 1.5]],
          1,
          5, // Smaller polygon size -> smaller text size
          5,
          10, // Medium polygon size -> medium text size
          10,
          20, // Larger polygon size -> larger text size
          15,
          30, // Larger polygon size -> larger text size
          // Add more stops as needed based on your data range
        ],
        22, // Zoom level 22
        [
          'interpolate',
          ['linear'],
          ['/', ['get', 'length', ['get', '_dynamic']], ['/', ['length', ['get', 'title']], 1.5]],
          1,
          30, // Smaller polygon size -> larger text size at higher zoom
          5,
          50, // Medium polygon size -> larger text size at higher zoom
          10,
          60, // Larger polygon size -> larger text size at higher zoom
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
    autoLevelChange: false,
    autoRestartAnimationAfterFloorChange: false,
    disableUnavailablePois: false,
    // poiIconSize: ['interpolate', ['exponential', 0.5], ['zoom'], 17, 0.1, 22, 0.5],
  };
  private routeFactory: any;
  private startPoint?: Feature;
  private endPoint?: Feature;
  private showStartPoint = false;
  private amenityIds: string[] = [];
  private filteredFeatures: string[] = [];
  private hiddenFeatures: string[] = [];
  private filteredAmenities: string[] = [];
  private amenityFilters: string[] = [];
  private hiddenAmenities: string[] = [];
  private amenityCategories: any = {};
  private hoveredPolygon: any;
  private selectedPolygons: Feature[] = [];
  private currentStep = 0;
  private currentStop = 0;
  private kioskPopup: any;
  private mainSourceLoaded = false;
  private pmTilesInstance;
  private pointIconMarker = {} as Marker;
  private routeStartMarker = {} as Marker;
  private routeFinishMarker = {} as Marker;

  constructor(options: Options) {
    // fix centering in case of kiosk with defined pitch/bearing/etc. in mapbox options
    if (options.isKiosk && options.mapboxOptions && options.kioskSettings && !options.mapboxOptions.center) {
      options.mapboxOptions.center = options.kioskSettings.coordinates;
    }

    const urlParams = { ...this.defaultOptions.urlParams, ...options.urlParams };
    const polygonsOptions = { ...this.defaultOptions.polygonsOptions, ...options.polygonsOptions };
    const routeAnimation = { ...this.defaultOptions.routeAnimation, ...options.routeAnimation };
    this.defaultOptions = { ...this.defaultOptions, ...options };
    this.defaultOptions.urlParams = urlParams;
    this.defaultOptions.polygonsOptions = polygonsOptions;
    this.defaultOptions.routeAnimation = routeAnimation;
    this.state = globalState;

    if (this.defaultOptions.isKiosk && this.defaultOptions.useGpsLocation) {
      throw new Error(`It's not possible to use both isKiosk and useGpsLocation options as enabled!`);
    }

    if (!this.defaultOptions.polygonLayers || this.defaultOptions.polygonLayers.length === 0) {
      this.defaultOptions.polygonLayers = [{ ...this.defaultOptions.polygonsOptions, featureType: 'shop' }];
    } else {
      this.defaultOptions.polygonLayers = this.defaultOptions.polygonLayers.map((layer) => {
        return { ...this.defaultOptions.polygonsOptions, ...layer };
      });
    }

    // @ts-ignore
    maplibregl.setRTLTextPlugin(
      'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
      true, // Lazy load the plugin
    );

    this.onSourceChange = this.onSourceChange.bind(this);
    this.onSyntheticChange = this.onSyntheticChange.bind(this);
    this.onStyleChange = this.onStyleChange.bind(this);
    this.onStyleSelect = this.onStyleSelect.bind(this);
    this.onRouteUpdate = this.onRouteUpdate.bind(this);
    this.onRouteChange = this.onRouteChange.bind(this);
    this.onRouteCancel = this.onRouteCancel.bind(this);

    this.initialize();
  }

  private async initialize() {
    this.geojsonSource.on(this.onSourceChange);
    this.syntheticSource.on(this.onSyntheticChange);
    this.routingSource.on(this.onRouteChange);
    await this.fetch();
  }

  private async cancelObservers() {
    this.geojsonSource.off(this.onSourceChange);
    this.syntheticSource.off(this.onSyntheticChange);
    this.state.style.off(this.onStyleChange);
  }

  private async fetch() {
    let placeParam = null;
    const useBundle = !!this.defaultOptions.bundleUrl;

    if (this.defaultOptions.handleUrlParams) {
      const urlParams = new URLSearchParams(window.location.search);
      placeParam = urlParams.get(this.defaultOptions.urlParams.defaultPlace);
    }

    const places = useBundle
      ? await getPlacesBundle({ bundleUrl: this.defaultOptions.bundleUrl }).catch((error) =>
          this.handleControllerError(error),
        )
      : await getPlaces().catch((error) => this.handleControllerError(error));
    const style = useBundle
      ? await getStyleBundle({ bundleUrl: this.defaultOptions.bundleUrl }).catch((error) =>
          this.handleControllerError(error),
        )
      : await getStyle().catch((error) => this.handleControllerError(error));
    const styles = useBundle
      ? await getStylesBundle({ bundleUrl: this.defaultOptions.bundleUrl }).catch((error) =>
          this.handleControllerError(error),
        )
      : await getStyles().catch((error) => this.handleControllerError(error));
    const features = useBundle
      ? await getFeaturesBundle({
          initPolygons: this.defaultOptions.initPolygons,
          polygonFeatureTypes: this.defaultOptions.polygonLayers.map((item) => item.featureType),
          autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
          hiddenAmenities: this.defaultOptions.hiddenAmenities,
          useTimerangeData: this.defaultOptions.useTimerangeData,
          filter: this.defaultOptions.defaultFilter,
          bundleUrl: this.defaultOptions.bundleUrl,
        }).catch((error) => this.handleControllerError(error))
      : await getFeatures({
          initPolygons: this.defaultOptions.initPolygons,
          polygonFeatureTypes: this.defaultOptions.polygonLayers.map((item) => item.featureType),
          autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
          hiddenAmenities: this.defaultOptions.hiddenAmenities,
          useTimerangeData: this.defaultOptions.useTimerangeData,
          filter: this.defaultOptions.defaultFilter,
          featuresMaxBounds: this.defaultOptions.featuresMaxBounds,
          localSources: this.defaultOptions.localSources,
        }).catch((error) => this.handleControllerError(error));
    const amenities = useBundle
      ? await getAmenitiesBundle({
          bundleUrl: this.defaultOptions.bundleUrl,
          amenityIdProperty: this.defaultOptions.amenityIdProperty,
        }).catch((error) => this.handleControllerError(error))
      : await getAmenities({
          amenityIdProperty: this.defaultOptions.amenityIdProperty,
          localSources: this.defaultOptions.localSources,
        }).catch((error) => this.handleControllerError(error));
    const floors = useBundle
      ? await getFloorsBundle({ bundleUrl: this.defaultOptions.bundleUrl }).catch((error) =>
          this.handleControllerError(error),
        )
      : await getFloors().catch((error) => this.handleControllerError(error));
    const kiosks = useBundle
      ? await getKiosksBundle({ bundleUrl: this.defaultOptions.bundleUrl }).catch((error) =>
          this.handleControllerError(error),
        )
      : await getKiosks().catch((error) => this.handleControllerError(error));

    if (places && features && floors && style && kiosks) {
      const optimizedFeatures = new FeatureCollection({ features: optimizeFeatures(features.features) });
      const levelChangers = features.features.filter(
        (f) =>
          f.properties.type === 'elevator' || f.properties.type === 'escalator' || f.properties.type === 'staircase',
      );
      // const user = await Auth.getCurrentUser();
      const defaultPlace = placeParam
        ? places.data.find((p) => p.id === placeParam || p.name === placeParam)
        : places.data.find((p) => p.id === this.defaultOptions.defaultPlaceId);
      const defaultFloor =
        defaultPlace &&
        floors.data.find((f) => f.placeId === defaultPlace.id && f.level === this.defaultOptions.defaultFloorLevel);
      const place = places.data.length > 0 ? (defaultPlace ? defaultPlace : places.data[0]) : new PlaceModel({});
      const floor =
        defaultPlace && floors.data.length > 0
          ? defaultFloor
            ? defaultFloor
            : floors.data.find((f) => f.placeId === defaultPlace.id)[0]
          : new FloorModel({});
      let centerVar: [number, number] = [place.location.lng, place.location.lat];
      if (this.defaultOptions.mapboxOptions?.center) {
        centerVar = this.defaultOptions.mapboxOptions.center as [number, number];
      }
      if (this.defaultOptions.isKiosk) {
        centerVar = this.defaultOptions.kioskSettings?.coordinates;
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
      this.geojsonSource.fetch(optimizedFeatures);
      this.routingSource.routing.setData(new FeatureCollection(features));
      this.prepareStyle(style);
      this.imageSourceManager.enabled = this.defaultOptions.showRasterFloorplans;
      this.imageSourceManager.belowLayer = style.usesPrefixes() ? 'proximiio-floors' : 'floors';
      this.imageSourceManager.initialize({ floors: floors.data });
      this.state = {
        ...this.state,
        initializing: false,
        place,
        places: places.data,
        floor,
        floors: floors.data,
        kiosks: kiosks.data,
        style,
        styles,
        amenities,
        features,
        optimizedFeatures,
        allFeatures: new FeatureCollection(features),
        levelChangers: new FeatureCollection({ features: levelChangers }),
        latitude: centerVar[1],
        longitude: centerVar[0],
        zoom: this.defaultOptions.zoomLevel ? this.defaultOptions.zoomLevel : this.defaultOptions.mapboxOptions?.zoom,
        noPlaces: places.data.length === 0,
        // user,
      };
      style.on(this.onStyleChange);

      if (this.defaultOptions.pmTilesUrl) {
        const protocol = new Protocol();
        maplibregl.addProtocol('pmtiles', protocol.tile);

        this.pmTilesInstance = new PMTiles(this.defaultOptions.pmTilesUrl);
        protocol.add(this.pmTilesInstance);
      }

      this.map = new maplibregl.Map({
        ...(this.defaultOptions.mapboxOptions as MapboxOptions | any),
        container: this.defaultOptions.selector ? this.defaultOptions.selector : 'map',
        style: this.state.style,
      });

      this.map.on('load', async (e) => {
        this.map.setCenter(centerVar);
        await this.onMapReady(e);
      });

      this.map.on('error', (e) => {
        this.onMapFailedListener.next(true);
      });

      if (this.defaultOptions.allowNewFeatureModal) {
        this.map.on(
          this.defaultOptions.newFeatureModalEvent ? this.defaultOptions.newFeatureModalEvent : 'dblclick',
          (e: MapLibreEvent | any) => {
            this.featureDialog(e);
          },
        );
      }
    }
  }

  private async onMapReady(e: MapLibreEvent) {
    // set paths visible if available
    const map = e.target;
    if (map) {
      this.state.style?.togglePaths(true);
      // routing layers
      const routingLayer = map.getLayer('routing-line-completed');
      const usePrefixed =
        typeof routingLayer === 'undefined' && typeof map.getLayer('proximiio-routing-line-completed') !== 'undefined';
      const shopsLayer = map.getLayer('shops');

      if (usePrefixed) {
        map.moveLayer('proximiio-routing-line-completed', 'proximiio-outer_wall');
        map.moveLayer('proximiio-routing-line-remaining', 'proximiio-outer_wall');
        map.moveLayer('proximiio-paths', 'routing-line-completed');
      } else {
        if (routingLayer) {
          if (shopsLayer) {
            map.moveLayer('routing-line-completed', 'proximiio-routing-symbols');
            map.moveLayer('routing-line-remaining', 'proximiio-routing-symbols');
          }
          map.moveLayer('proximiio-paths', 'routing-line-completed');
        }
      }

      // hide start and finish poi icons for generated route source
      const routingSymbolsLayer = map.getLayer('proximiio-routing-symbols') as any;
      if (routingSymbolsLayer) {
        routingSymbolsLayer.filter.push(['match', ['get', 'type'], ['poi', 'poi-custom'], false, true]);
        this.state.style.getLayer('proximiio-routing-symbols').filter = routingSymbolsLayer.filter;
        map.setFilter('proximiio-routing-symbols', routingSymbolsLayer.filter);
      }

      map.setMaxZoom(30);
      const decodedChevron = await getImageFromBase64(chevron);
      const decodedPersonIcon = await getImageFromBase64(personIcon);
      const decodedFloorchangeUpImage = await getImageFromBase64(floorchangeUpImage);
      const decodedFloorchangeDownImage = await getImageFromBase64(floorchangeDownImage);
      const decodedPopupImage = await getImageFromBase64(this.defaultOptions.levelDirectionPopupImage);
      map.addImage('chevron_right', decodedChevron as any);
      map.addImage(
        'pulsing-dot',
        pulsingDot({
          rgbValues: this.defaultOptions.kioskSettings.pointColor,
          pointOutline: this.defaultOptions.kioskSettings.pointOutline,
        }),
        { pixelRatio: 2 },
      );
      map.addImage('person', decodedPersonIcon as any);
      map.addImage('floorchange-up-image', decodedFloorchangeUpImage as any);
      map.addImage('floorchange-down-image', decodedFloorchangeDownImage as any);
      map.addImage('popup', decodedPopupImage as any, {
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
      this.imageSourceManager.setLevel(map, this.state.floor?.level, this.state);
      await this.onPlaceSelect(
        this.state.place,
        this.defaultOptions.zoomIntoPlace,
        this.defaultOptions.defaultFloorLevel,
      );

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
        if (this.defaultOptions.routeAnimation.pointIconUrl) {
          try {
            const response = await map.loadImage(this.defaultOptions.routeAnimation.pointIconUrl);
            if (response) {
              map.addImage('pointIcon', response.data);
            }
          } catch (e) {
            console.log(e);
          }
        }
        if (this.defaultOptions.routeAnimation.cityPointIconUrl) {
          try {
            const response = await map.loadImage(this.defaultOptions.routeAnimation.cityPointIconUrl);
            if (response) {
              map.addImage('cityPointIcon', response.data);
            }
          } catch (e) {
            console.log(e);
          }
        }
        this.initAnimatedRoute();
      }
      const layers = ['proximiio-pois-icons', 'proximiio-pois-labels', 'pois-icons', 'pois-labels', 'poi-custom-icons'];
      layers.forEach((layer) => {
        const l = this.map.getLayer(layer);
        if (l) {
          const filters = [...(l.filter as maplibregl.FilterSpecification[])];

          filters.push(['any', ['!', ['has', 'available']], ['==', ['get', 'available'], true]]);

          if (this.defaultOptions.hiddenAmenities) {
            filters.push(['!=', ['get', 'hideIcon'], 'hide']);
          }

          this.state.style.getLayer(layer).filter = filters;
          this.map.setFilter(layer, filters as maplibregl.FilterSpecification);
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
  }

  private async onRefetch() {
    if (this.map) {
      console.log('data should be refetched');
      const useBundle = !!this.defaultOptions.bundleUrl;
      const features = useBundle
        ? await getFeaturesBundle({
            initPolygons: this.defaultOptions.initPolygons,
            polygonFeatureTypes: this.defaultOptions.polygonLayers.map((item) => item.featureType),
            autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
            hiddenAmenities: this.defaultOptions.hiddenAmenities,
            useTimerangeData: this.defaultOptions.useTimerangeData,
            filter: this.defaultOptions.defaultFilter,
            bundleUrl: this.defaultOptions.bundleUrl,
          })
        : await getFeatures({
            initPolygons: this.defaultOptions.initPolygons,
            polygonFeatureTypes: this.defaultOptions.polygonLayers.map((item) => item.featureType),
            autoLabelLines: this.defaultOptions.polygonsOptions.autoLabelLines,
            hiddenAmenities: this.defaultOptions.hiddenAmenities,
            useTimerangeData: this.defaultOptions.useTimerangeData,
            filter: this.defaultOptions.defaultFilter,
            featuresMaxBounds: this.defaultOptions.featuresMaxBounds,
            localSources: this.defaultOptions.localSources,
          }).catch((error) => this.handleControllerError(error));
      if (features) {
        const optimizedFeatures = new FeatureCollection({ features: optimizeFeatures(features.features) });
        const levelChangers = features.features.filter(
          (f) =>
            f.properties.type === 'elevator' || f.properties.type === 'escalator' || f.properties.type === 'staircase',
        );
        this.state = {
          ...this.state,
          features,
          optimizedFeatures,
          allFeatures: new FeatureCollection(features),
          levelChangers: new FeatureCollection({ features: levelChangers }),
        };
        // this.geojsonSource.fetch(this.state.features);
        this.onFeaturesChange();
      }
    }
  }

  private initKiosk() {
    if (this.map) {
      this.showStartPoint = false;
      if (this.defaultOptions.kioskSettings) {
        this.startPoint = point(this.defaultOptions.kioskSettings.coordinates, {
          level: this.defaultOptions.kioskSettings.level,
        }) as Feature;

        if (this.defaultOptions.kioskSettings.showLabel) {
          if (this.kioskPopup) {
            this.kioskPopup.setLngLat(this.defaultOptions.kioskSettings.coordinates);
          } else {
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
              font-family: ${
                this.defaultOptions.kioskSettings.labelFont
                  ? this.defaultOptions.kioskSettings.labelFont
                  : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
              };
              color: white;
              font-size: 16px;
              border-radius: 12px;
              padding: .6rem .8rem;
              font-weight: 500;
              max-width: 100px;
              text-align: center;
              box-shadow: none;
              background-color: ${
                this.defaultOptions.kioskSettings.pointColor
                  ? `rgb(${this.defaultOptions.kioskSettings.pointColor})`
                  : 'rgb(189, 82, 255)'
              };
            }
            .proximiio-kiosk-popup.maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
              border-top-color: ${
                this.defaultOptions.kioskSettings.pointColor
                  ? `rgb(${this.defaultOptions.kioskSettings.pointColor})`
                  : 'rgb(189, 82, 255)'
              };
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
              features: [this.startPoint as any],
            },
          });
          const kioskLayer: SymbolLayerSpecification = {
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
          const startPointCircle = circle(
            this.startPoint.geometry.coordinates,
            this.defaultOptions.routeAnimation.puckRadius ? this.defaultOptions.routeAnimation.puckRadius : 0.002,
          );
          const startPointCircleHalo = circle(
            this.startPoint.geometry.coordinates,
            this.defaultOptions.routeAnimation.puckRadius
              ? this.defaultOptions.routeAnimation.puckRadius + 0.001
              : 0.003,
          );
          this.state.style.addSource('start-point', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [startPointCircle as any],
            },
          });
          this.state.style.addSource('start-point-halo', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [startPointCircleHalo as any],
            },
          });
          const startPointLayer: FillExtrusionLayerSpecification = {
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

          const startPointHaloLayer: FillExtrusionLayerSpecification = {
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

  private onSetKiosk(lat: number, lng: number, level: number) {
    if (this.map && this.defaultOptions.isKiosk) {
      this.defaultOptions.kioskSettings = {
        ...this.defaultOptions.kioskSettings,
        coordinates: [lng, lat],
        level,
      };

      this.startPoint = point(this.defaultOptions.kioskSettings.coordinates, {
        level: this.defaultOptions.kioskSettings.level,
      }) as Feature;

      if (this.defaultOptions.kioskSettings.showPoint) {
        this.state.style.sources['my-location'].data = {
          type: 'FeatureCollection',
          features: [this.startPoint as any],
        };
        this.map.setFilter('my-location-layer', ['all', ['==', ['to-number', ['get', 'level']], level]]);
      }

      if (this.defaultOptions.routeAnimation.type === 'puck') {
        const startPointCircle = circle(
          this.startPoint.geometry.coordinates,
          this.defaultOptions.routeAnimation.puckRadius ? this.defaultOptions.routeAnimation.puckRadius : 0.002,
        );
        const startPointCircleHalo = circle(
          this.startPoint.geometry.coordinates,
          this.defaultOptions.routeAnimation.puckRadius ? this.defaultOptions.routeAnimation.puckRadius + 0.001 : 0.003,
        );
        this.state.style.sources['start-point'].data = {
          type: 'FeatureCollection',
          features: [startPointCircle as any],
        };
        this.state.style.sources['start-point-halo'].data = {
          type: 'FeatureCollection',
          features: [startPointCircleHalo as any],
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

  private onStopKiosk() {
    if (this.map && this.defaultOptions.isKiosk) {
      this.defaultOptions.isKiosk = false;

      this.startPoint = undefined;

      if (this.kioskPopup) {
        this.kioskPopup.remove();
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

  private initGeoLocation() {
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
        }) as Feature;
      });
    }
  }

  private initDirectionIcon() {
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
      this.state.style.addLayer(
        {
          id: 'direction-halo-layer',
          type: 'circle',
          source: 'direction-icon-source',
          minzoom: levelChangersLayer.minzoom,
          maxzoom: levelChangersLayer.maxzoom,
          paint: {
            'circle-radius':
              levelChangersLayerImageSize[0] === 'interpolate'
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
        },
        'proximiio-paths-names',
      );
      this.state.style.addLayer(
        {
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
        },
        'proximiio-polygons-above-paths',
      );
      this.map.on('click', 'proximiio-levelchangers', (ev) => {
        if (this.routingSource.points) {
          const directionIcon = this.state.style
            .getSource('direction-icon-source')
            .data.features.find((f) => f.properties.level === this.state.floor.level);
          if (
            directionIcon &&
            directionIcon.properties &&
            !isNaN(directionIcon.properties.destinationLevel) &&
            ev.features[0].properties.id === directionIcon.properties.levelChangerId
          ) {
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
  private addDirectionFeatures() {
    // Filter the steps in textNavigation state to find level changers
    const levelChangers = this.state.textNavigation.steps
      .filter((i, index, array) => {
        // Get the first part of the direction string
        const direction = i.direction.split('_')[0];
        // Check if the current step is a level changer and has a valid direction
        if (i.levelChangerId && (direction === 'UP' || direction === 'DOWN')) {
          // Set the destination level for the level changer
          i.destinationLevel = array[index + 1] ? array[index + 1]?.level : null;
          return i;
        }
      })
      // Map the level changers to feature objects
      .map((levelChanger) => {
        // Find the level changer feature in allFeatures state
        const levelChangerFeature = this.state.allFeatures.features.find(
          (f) => f.id === levelChanger.levelChangerId,
        ) as Feature;
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
            description: `${translations[this.defaultOptions.language][levelChangerType]} \n ${
              translations[this.defaultOptions.language][direction]
            } ${translations[this.defaultOptions.language]['TO']} ${
              destinationFloor.name ? this.getFloorName(destinationFloor) : levelChanger.destinationLevel
            } ${translations[this.defaultOptions.language]['FLOOR']}`,
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

  private onSetFeaturesHighlight({
    features,
    color,
    radius,
    blur,
    enlargeIcon,
    opacity,
    translate,
  }: {
    features: string[];
    color?: string;
    radius?: number;
    blur?: number;
    enlargeIcon?: boolean;
    opacity?: number;
    translate?: [number, number];
  }) {
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
        } else {
          poisIconsImageSize += 0.15;
        }

        if (!map.getLayer('enlargened-icon-layer')) {
          this.map.setLayoutProperty('proximiio-pois-icons', 'icon-ignore-placement', true);
          this.state.style.addLayer(
            {
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
            },
            'proximiio-pois-icons',
          );
        }
      }
      if (!map.getLayer('highlight-icon-layer')) {
        this.state.style.addLayer(
          {
            id: 'highlight-icon-layer',
            type: 'circle',
            source: 'highlight-icon-source',
            minzoom: poisIconsLayer.minzoom,
            maxzoom: poisIconsLayer.maxzoom,
            paint: {
              'circle-radius':
                poisIconsImageSize[0] === 'interpolate'
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
          },
          enlargeIcon ? 'proximiio-pois-icons' : this.defaultOptions.initPolygons ? 'shop-custom' : 'proximiio-shop',
        );
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

  private initAnimatedRoute() {
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
        this.state.style.addSource('lineAlong', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        this.state.style.addLayer(
          {
            id: 'lineAlong',
            type: 'line',
            source: 'lineAlong',
            minzoom: this.defaultOptions.routeAnimation.minzoom,
            maxzoom: this.defaultOptions.routeAnimation.maxzoom,
            paint: {
              'line-width': this.defaultOptions.routeAnimation.lineWidth,
              'line-color': this.defaultOptions.routeAnimation.lineColor,
              'line-opacity': this.defaultOptions.routeAnimation.lineOpacity,
            },
          },
          'proximiio-routing-line-remaining',
        );

        this.state.style.addSource('pointAlong', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        if (this.defaultOptions.routeAnimation.pointIconUrl || this.defaultOptions.routeAnimation.cityPointIconUrl) {
          if (this.defaultOptions.routeAnimation.pointIconAsMarker) {
            const el = document.createElement('div');
            el.style.backgroundImage = `url(${this.defaultOptions.routeAnimation.pointIconUrl})`;
            el.style.backgroundSize = 'cover';
            el.style.width = `${this.defaultOptions.routeAnimation.pointIconMarkerSize}px`;
            el.style.height = `${this.defaultOptions.routeAnimation.pointIconMarkerSize}px`;
            this.pointIconMarker = new maplibregl.Marker({ element: el });
          } else {
            this.state.style.addLayer(
              {
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
              },
              this.defaultOptions.showLevelDirectionIcon ? 'direction-popup-layer' : 'proximiio-polygons-above-paths',
            );
          }
        } else {
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
          );
        }
      }
      if (this.defaultOptions.routeAnimation.type === 'dash') {
        if (
          this.state.style.getLayer('proximiio-routing-line-remaining') &&
          !this.defaultOptions.routeAnimation.dashKeepOriginalRouteLayer
        ) {
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

  private initRasterTiles() {
    if (this.map) {
      const metadata = this.state.style.metadata;

      let tileUrl = this.defaultOptions.rasterTilesOptions?.tilesUrl
        ? this.defaultOptions.rasterTilesOptions?.tilesUrl
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
          `${
            this.defaultOptions.rasterTilesOptions?.useProxy ? 'https://api.proximi.fi/imageproxy/source=' : ''
          }${tileUrl}`,
        ],
        tileSize: this.defaultOptions.rasterTilesOptions?.tileSize
          ? this.defaultOptions.rasterTilesOptions.tileSize
          : metadata['proximiio:raster:tilesize']
          ? metadata['proximiio:raster:tilesize']
          : 256,
        minzoom: this.defaultOptions.rasterTilesOptions?.minZoom
          ? this.defaultOptions.rasterTilesOptions.minZoom
          : metadata['proximiio:raster:minzoom']
          ? metadata['proximiio:raster:minzoom']
          : 15,
        maxzoom: this.defaultOptions.rasterTilesOptions?.maxZoom
          ? this.defaultOptions.rasterTilesOptions.maxZoom
          : metadata['proximiio:raster:maxzoom']
          ? metadata['proximiio:raster:maxzoom']
          : 22,
        attribution: this.defaultOptions.rasterTilesOptions?.attribution
          ? this.defaultOptions.rasterTilesOptions.attribution
          : metadata['proximiio:raster:attribution']
          ? metadata['proximiio:raster:attribution']
          : '',
        bounds: this.defaultOptions.rasterTilesOptions?.bounds
          ? this.defaultOptions.rasterTilesOptions.bounds
          : metadata['proximiio:raster:bounds']
          ? metadata['proximiio:raster:bounds']
          : [-180, -90, 180, 90],
      });
      this.state.style.addLayer(
        {
          id: 'raster-tiles',
          type: 'raster',
          source: 'raster-tiles',
        },
        this.defaultOptions.rasterTilesOptions?.beforeLayer
          ? this.defaultOptions.rasterTilesOptions.beforeLayer
          : metadata['proximiio:raster:beforelayer']
          ? metadata['proximiio:raster:beforelayer']
          : 'osm-country_label-en',
      );
      this.map.setStyle(this.state.style);
    }
  }

  private initPolygons() {
    if (this.map) {
      for (const layer of this.defaultOptions.polygonLayers) {
        const polygonIconsLayer = new PolygonIconsLayer(layer);
        polygonIconsLayer.setFilterLevel(this.state.floor.level);
        this.state.style.addLayer(polygonIconsLayer.json, 'proximiio-paths');

        const polygonTitlesLayer = new PolygonTitlesLayer(layer);
        polygonTitlesLayer.setFilterLevel(this.state.floor.level);
        this.state.style.addLayer(polygonTitlesLayer.json, 'proximiio-paths');

        const polygonsLayer = new PolygonsLayer(layer);
        polygonsLayer.setFilterLevel(this.state.floor.level);
        this.state.style.addLayer(polygonsLayer.json, 'proximiio-paths');

        if (this.state.style.getLayer(`proximiio-${layer.featureType}`)) {
          if (layer.removeOriginalPolygonsLayer) {
            this.state.style.removeLayer(`proximiio-${layer.featureType}`);
          }
        }

        this.map.on('click', `${layer.featureType}-custom`, (e) => {
          this.onShopClick(e);
        });
        this.map.on('mouseenter', `${layer.featureType}-custom`, () => {
          this.onShopMouseEnter();
        });
        this.map.on('mousemove', `${layer.featureType}-custom`, (e) => {
          if (
            !this.defaultOptions.blockFeatureClickWhileRouting ||
            (this.defaultOptions.blockFeatureClickWhileRouting &&
              (!this.routingSource.route || this.routingSource.preview))
          ) {
            this.onShopMouseMove(e);
          }
        });
        this.map.on('mouseleave', `${layer.featureType}-custom`, (e) => {
          if (
            !this.defaultOptions.blockFeatureClickWhileRouting ||
            (this.defaultOptions.blockFeatureClickWhileRouting &&
              (!this.routingSource.route || this.routingSource.preview))
          ) {
            this.onShopMouseLeave(e);
          }
        });
      }

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

  private updateLayerOpacity() {
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

    for (const layer of this.defaultOptions.polygonLayers) {
      if (layer.adaptiveLabelOpacity) {
        if (this.map.getLayer(`${layer.featureType}-labels`)) {
          const l = { ...this.state.style.getLayer(`${layer.featureType}-labels`) };
          l.paint['text-opacity'] = opacity;
          this.map.setPaintProperty(`${layer.featureType}-labels`, 'text-opacity', opacity);
        }
      }
    }
  }

  private onShopClick(
    e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] | undefined } & object,
  ) {
    if (
      !this.defaultOptions.blockFeatureClickWhileRouting ||
      (this.defaultOptions.blockFeatureClickWhileRouting && (!this.routingSource.route || this.routingSource.preview))
    ) {
      if (e.features && e.features[0] && e.features[0].properties) {
        e.features[0].properties._dynamic = e.features[0].properties._dynamic
          ? JSON.parse(e.features[0].properties._dynamic)
          : {};
        if (this.defaultOptions.initPolygons) {
          // @ts-ignore
          const polygonPoi = this.state.allFeatures.features.find(
            (i) => i.properties.id === e.features[0].properties._dynamic?.poi_id,
          ) as Feature;
          const poi = this.state.allFeatures.features.find((i) => {
            if (e.features[0].properties._dynamic?.id) {
              return i.id === e.features[0].properties._dynamic?.id;
            } else {
              return i.properties.id === e.features[0].properties.id;
            }
          }) as Feature;
          if (polygonPoi ? polygonPoi.properties.available === false : poi.properties.available === false) {
            if (this.defaultOptions.disableUnavailablePois) return;
          }
          if (polygonPoi) {
            this.handlePolygonSelection(polygonPoi);
          }
          this.onPolygonClickListener.next(polygonPoi ? polygonPoi : poi);
        } else {
          // @ts-ignore
          const poi = this.state.allFeatures.features.find(
            (i) => i.properties.id === e.features[0].properties.id,
          ) as Feature;
          if (this.defaultOptions.disableUnavailablePois && poi.properties.available === false) {
            return;
          }
          this.onPoiClickListener.next(poi);
        }
      }
    }
  }

  handlePolygonSelection(poi?: Feature | (Feature | undefined)[]) {
    let features: Feature[] = [];
    if (Array.isArray(poi)) {
      features = poi;
    } else {
      features = poi?.id ? [poi] : [];
    }
    features = features.filter((f) => f && f.id);
    const featuresIds = features.length === 0 ? [] : features.map((i) => i.id);
    const featuresWithPolygon = this.state.allFeatures.features.filter(
      (f) => f.properties._dynamic?.polygon_id && f.geometry.type === 'Point' && !featuresIds.includes(f.id),
    );

    if (this.selectedPolygons.length > 0) {
      for (const polygon of this.selectedPolygons) {
        this.map.setFeatureState(
          {
            source: 'main',
            id: polygon.properties.id,
          },
          {
            selected: false,
          },
        );
        if (polygon.properties._dynamic.label_id) {
          this.map.setFeatureState(
            {
              source: 'main',
              id: polygon.properties._dynamic.label_id,
            },
            {
              selected: false,
            },
          );
        }
      }
    }

    if (features.length === 0 && ((Array.isArray(poi) && poi.length === 0) || !poi)) {
      for (const f of featuresWithPolygon) {
        const polygon = this.state.allFeatures.features.find(
          (i) =>
            i.properties._dynamic?.id === f.properties._dynamic?.polygon_id &&
            this.defaultOptions.polygonLayers
              .map((layer) => `${layer.featureType}-custom`)
              .includes(i.properties._dynamic?.type),
        );
        if (polygon) {
          this.map.setFeatureState(
            {
              source: 'main',
              id: polygon.properties.id,
            },
            {
              disabled: false,
            },
          );
          if (polygon.properties._dynamic.label_id) {
            this.map.setFeatureState(
              {
                source: 'main',
                id: polygon.properties._dynamic.label_id,
              },
              {
                disabled: false,
              },
            );
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
        const selectedPolygon = this.state.allFeatures.features.find(
          (i) =>
            i.properties._dynamic?.id === connectedPolygonId &&
            this.defaultOptions.polygonLayers
              .map((layer) => `${layer.featureType}-custom`)
              .includes(i.properties._dynamic?.type),
        );
        if (selectedPolygon) {
          for (const f of featuresWithPolygon) {
            const polygon = this.state.allFeatures.features.find(
              (i) =>
                i.properties._dynamic?.id === f.properties._dynamic?.polygon_id &&
                this.defaultOptions.polygonLayers
                  .map((layer) => `${layer.featureType}-custom`)
                  .includes(i.properties._dynamic?.type),
            );
            if (polygon) {
              this.map.setFeatureState(
                {
                  source: 'main',
                  id: polygon.properties.id,
                },
                {
                  disabled: true,
                },
              );
              if (polygon.properties._dynamic.label_id) {
                this.map.setFeatureState(
                  {
                    source: 'main',
                    id: polygon.properties._dynamic.label_id,
                  },
                  {
                    disabled: true,
                  },
                );
              }
            }
          }
          this.map.setFeatureState(
            {
              source: 'main',
              id: selectedPolygon.properties.id,
            },
            {
              selected: true,
            },
          );
          if (selectedPolygon.properties._dynamic.label_id) {
            this.map.setFeatureState(
              {
                source: 'main',
                id: selectedPolygon.properties._dynamic.label_id,
              },
              {
                selected: true,
              },
            );
          }
          this.selectedPolygons.push(selectedPolygon);
        }
      }
    });
  }

  private onShopMouseEnter() {
    this.map.getCanvas().style.cursor = 'pointer';
  }

  private onShopMouseMove(
    e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] | undefined } & object,
  ) {
    if (e.features && e.features.length > 0) {
      e.features[0].properties._dynamic = JSON.parse(
        e.features[0].properties._dynamic ? e.features[0].properties._dynamic : {},
      );
      if (this.hoveredPolygon) {
        this.map.setFeatureState(
          {
            source: 'main',
            id: this.hoveredPolygon.properties.id,
          },
          {
            hover: false,
          },
        );
        if (this.hoveredPolygon.properties._dynamic.label_id) {
          this.map.setFeatureState(
            {
              source: 'main',
              id: this.hoveredPolygon.properties._dynamic.label_id,
            },
            {
              hover: false,
            },
          );
        }
      }
      this.hoveredPolygon = e.features[0];
      this.map.setFeatureState(
        {
          source: 'main',
          id: this.hoveredPolygon.properties.id,
        },
        {
          hover: true,
        },
      );
      if (this.hoveredPolygon.properties._dynamic.label_id) {
        this.map.setFeatureState(
          {
            source: 'main',
            id: this.hoveredPolygon.properties._dynamic.label_id,
          },
          {
            hover: true,
          },
        );
      }
    }
  }

  private onShopMouseLeave(
    e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] | undefined } & object,
  ) {
    this.map.getCanvas().style.cursor = '';
    if (this.hoveredPolygon) {
      this.map.setFeatureState(
        {
          source: 'main',
          id: this.hoveredPolygon.properties.id,
        },
        {
          hover: false,
        },
      );
      if (this.hoveredPolygon.properties._dynamic.label_id) {
        this.map.setFeatureState(
          {
            source: 'main',
            id: this.hoveredPolygon.properties._dynamic.label_id,
          },
          {
            hover: false,
          },
        );
      }
    }
    this.hoveredPolygon = null;
  }

  private initUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get(this.defaultOptions.urlParams.startFeauture);
    const destinationParam = urlParams.get(this.defaultOptions.urlParams.destinationFeature);
    const placeParam = urlParams.get(this.defaultOptions.urlParams.defaultPlace);
    const defaultPlace = placeParam
      ? this.state.places.find((p) => p.id === placeParam || p.name?.toLowerCase() === placeParam?.toLowerCase())
      : this.state.place;
    const startFeature = startParam
      ? (this.state.allFeatures.features.find(
          (f) =>
            f.properties.title &&
            f.properties.place_id === defaultPlace.id &&
            (f.id === startParam ||
              f.properties.id === startParam ||
              f.properties.title?.toLowerCase() === startParam?.toLowerCase() ||
              f.properties.remote_id?.toString() === startParam),
        ) as Feature)
      : this.startPoint;
    const destinationFeature = destinationParam
      ? (this.state.allFeatures.features.find(
          (f) =>
            f.properties.title &&
            f.properties.place_id === defaultPlace.id &&
            (f.id === destinationParam ||
              f.properties.id === destinationParam ||
              f.properties.title?.toLowerCase() === destinationParam?.toLowerCase() ||
              f.properties.remote_id?.toString() === destinationParam),
        ) as Feature)
      : undefined;

    if (startFeature && startFeature.id && !destinationFeature) {
      this.centerToFeature(startFeature.id);
      if (this.map && this.defaultOptions.isKiosk) {
        this.setKiosk(
          startFeature.geometry.coordinates[1],
          startFeature.geometry.coordinates[0],
          startFeature.properties.level,
        );
      }
    }
    if (!startFeature && destinationFeature) {
      this.centerToFeature(destinationFeature.id);
    }
    if (startFeature && destinationFeature) {
      this.onRouteUpdate({
        start: startFeature,
        finish: destinationFeature,
      });
    }
  }

  private featureDialog(e: any) {
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
    modal.setContent(edit ? EDIT_FEATURE_DIALOG(e, features[0]) : NEW_FEATURE_DIALOG(e, this.state.floor?.level));

    modal.addFooterBtn('Submit', 'tingle-btn tingle-btn--primary', async () => {
      const formData = new FormData(document.querySelector('#modal-form') as HTMLFormElement);
      const data = {
        id: `${formData.get('id')}`,
        title: `${formData.get('title')}`,
        level: formData.get('level'),
        lat: formData.get('lat'),
        lng: formData.get('lng'),
        icon: (formData.get('icon') as File).size ? await getBase64FromImage(formData.get('icon') as File) : undefined,
      };
      if (data.title && data.level && data.lat && data.lng) {
        if (edit) {
          await this.onUpdateFeature(data.id, data.title, +data.level!, +data.lat!, +data.lng!, data.icon);
        } else {
          await this.onAddNewFeature(data.title, +data.level!, +data.lat!, +data.lng!, data.icon, data.id);
        }
        modal.close();
      } else {
        alert('Please fill all the required fields!');
      }
    });

    if (edit) {
      modal.addFooterBtn('Delete', 'tingle-btn tingle-btn--danger', () => {
        this.onDeleteFeature(features[0]?.properties?.id);
        modal.close();
      });
    }

    modal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--default tingle-btn--pull-right', () => {
      modal.close();
    });

    modal.open();
  }

  private async onAddNewFeature(
    title: string,
    level: number,
    lat: number,
    lng: number,
    icon?: string,
    id?: string,
    placeId?: string,
    floorId?: string,
    properties?: object,
    isTemporary: boolean = true,
  ) {
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
      properties: {
        type: 'poi',
        usecase: 'poi',
        id: featureId,
        minzoom: 15,
        visibility: 'visible',
        amenity: icon ? id : 'default',
        title,
        level,
        images: [icon],
        place_id: placeId,
        floor_id: floorId,
        ...properties,
      },
    });

    if (icon && icon.length > 0) {
      const decodedIcon = await getImageFromBase64(icon);
      this.map.addImage(featureId, decodedIcon as any);
    }

    if (!isTemporary) {
      this.state.features.features.push(featureVar);
      await addFeatures({
        type: 'FeatureCollection',
        features: [featureVar.json],
      });
    } else {
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
  }

  private async onUpdateFeature(
    id: string,
    title?: string,
    level?: number,
    lat?: number,
    lng?: number,
    icon?: string,
    placeId?: string,
    floorId?: string,
    properties?: object,
    isTemporary: boolean = true,
  ) {
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
    featureVar.properties = {
      ...featureVar.properties,
      title: title ? title : featureVar.properties.title,
      level: level ? level : featureVar.properties.level,
      amenity: icon ? id : featureVar.properties.amenity,
      images: icon ? [icon] : featureVar.properties.images,
      place_id: placeId ? placeId : featureVar.properties.place_id,
      floor_id: floorId ? floorId : featureVar.properties.floor_id,
      ...properties,
    };
    if (icon && icon.length > 0) {
      const decodedIcon = await getImageFromBase64(icon);
      this.map.addImage(id, decodedIcon as any);
    }

    if (!isTemporary) {
      const featureIndex = this.state.features.features.findIndex(
        (x) => x.id === featureVar.id || x.properties.id === featureVar.id,
      );
      this.state.features.features[featureIndex] = featureVar;
      await addFeatures({
        type: 'FeatureCollection',
        features: [featureVar.json],
      });
    } else {
      const featureIndex = this.state.features.features.findIndex(
        (x) => x.id === featureVar.id || x.properties.id === featureVar.id,
      );
      const dynamicIndex = this.state.dynamicFeatures.features.findIndex(
        (x) => x.id === featureVar.id || x.properties.id === featureVar.id,
      );
      if (featureIndex) this.state.features.features[featureIndex] = featureVar;
      if (dynamicIndex) this.state.dynamicFeatures.features[dynamicIndex] = featureVar;
    }

    // this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features]; // this is not probably updated with non dynamic feature update TODO
    this.geojsonSource.update(featureVar);
    // this.onSourceChange();
    // this.routingSource.routing.setData(this.state.allFeatures);
    // this.updateMapSource(this.routingSource);
    this.onFeaturesChange();
    this.onFeatureUpdateListener.next(featureVar);
    return featureVar;
  }

  private async onDeleteFeature(id: string, isTemporary: boolean = true) {
    const foundFeature = this.state.allFeatures.features.find((f) => f.id === id || f.properties.id === id);
    if (!foundFeature) {
      console.error(`Deleting feature failed: Feature with id '${id}' has not been found!`);
      throw new Error(`Deleting feature failed: Feature with id '${id}' has not been found!`);
    }

    if (!isTemporary) {
      const featureIndex = this.state.features.features.findIndex((x) => x.id === id || x.properties.id === id);
      this.state.features.features.splice(featureIndex, 1);
      await deleteFeatures({
        type: 'FeatureCollection',
        features: [foundFeature],
      });
    } else {
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
  }

  private onFeaturesChange() {
    this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features];
    this.geojsonSource.language = this.defaultOptions.language;
    this.geojsonSource.fetch(this.state.optimizedFeatures);
    this.state.style.setSource('main', this.geojsonSource);
    this.onSourceChange();
    this.routingSource.routing.setData(this.state.allFeatures);
    this.updateMapSource(this.routingSource);
  }

  private onSetFeatureFilter(query: string, inverted?: boolean) {
    const features = this.state.allFeatures.features.filter(
      (f) => f.properties.id === query || f.id === query || f.properties.title === query,
    );
    for (const f of features) {
      if (inverted && this.hiddenFeatures.findIndex((i) => i === f.properties.id) === -1) {
        this.hiddenFeatures.push(f.properties.id);
      } else if (!inverted && this.filteredFeatures.findIndex((i) => i === f.properties.id) === -1) {
        this.filteredFeatures.push(f.properties.id);
      }
    }
    this.filterOutFeatures();
  }

  private onRemoveFeatureFilter(query: string, inverted?: boolean) {
    const features = this.state.allFeatures.features.filter(
      (f) => f.properties.id === query || f.id === query || f.properties.title === query,
    );
    for (const f of features) {
      if (inverted && this.hiddenFeatures.findIndex((i) => i === f.properties.id) !== -1) {
        this.hiddenFeatures.splice(
          this.hiddenFeatures.findIndex((i) => i === f.properties.id),
          1,
        );
      } else if (!inverted && this.filteredFeatures.findIndex((i) => i === f.properties.id) !== -1) {
        this.filteredFeatures.splice(
          this.filteredFeatures.findIndex((i) => i === f.properties.id),
          1,
        );
      }
    }
    this.filteredFeatures = this.filteredFeatures.length > 0 ? this.filteredFeatures : [];
    this.hiddenFeatures = this.hiddenFeatures.length > 0 ? this.hiddenFeatures : [];
    this.filterOutFeatures();
  }

  private onHidePois() {
    this.hiddenFeatures = this.state.allFeatures.features
      .filter((i) => i.properties.type === 'poi' || i.properties.usecase === 'poi')
      .map((i) => i.properties.id);
    this.filterOutFeatures();
  }

  private onHideIcons() {
    this.state.style.hideIconLayers();
    this.state.style.notify('filter-change');
  }

  private onShowIcons() {
    this.state.style.showIconLayers();
    this.state.style.notify('filter-change');
  }

  private onResetFeatureFilters() {
    this.filteredFeatures = [];
    this.hiddenFeatures = [];
    this.filterOutFeatures();
  }

  private onSetAmenityFilter(amenityId: string | string[], category?: string, inverted?: boolean) {
    if (category && inverted) {
      throw new Error(`It's not possible to use both category and inverted options in setAmenityFilter function!`);
    }
    if (category) {
      this.amenityCategories[category].active = true;
      this.amenityCategories[category].activeId = amenityId;
      let amenities: string[] = [];
      for (const key in this.amenityCategories) {
        if (this.amenityCategories.hasOwnProperty(key)) {
          const cat = this.amenityCategories[key];
          if (cat.active) {
            amenities = Array.isArray(amenityId)
              ? amenities.concat(cat.amenities.filter((i: string) => !cat.activeId.includes(i)))
              : amenities.concat(cat.amenities.filter((i: string) => i !== cat.activeId));
          }
        }
      }
      this.amenityFilters = this.amenityIds.filter((el) => !amenities.includes(el));
    } else {
      if (inverted) {
        if (Array.isArray(amenityId)) {
          if (!amenityId.some((id) => this.amenityFilters.includes(id))) {
            this.hiddenAmenities.push.apply(this.hiddenAmenities, amenityId);
          }
        } else {
          if (!this.amenityFilters.includes(amenityId)) {
            this.hiddenAmenities.push(amenityId);
          }
        }
        this.filteredAmenities = this.filteredAmenities.filter((i) => i !== amenityId);
      } else if (!inverted) {
        if (Array.isArray(amenityId)) {
          if (!amenityId.some((id) => this.amenityFilters.includes(id))) {
            this.amenityFilters.push.apply(this.amenityFilters, amenityId);
          }
        } else {
          if (!this.amenityFilters.includes(amenityId)) {
            this.amenityFilters.push(amenityId);
          }
        }
      }
    }
    this.filteredAmenities = this.amenityFilters;
    this.filterOutFeatures();
    if (!inverted) this.setActivePolygons(amenityId);
  }

  private onRemoveAmenityFilter(amenityId: string | string[], category?: string, inverted?: boolean) {
    if (category && inverted) {
      throw new Error(`It's not possible to use both category and inverted options in removeAmenityFilter function!`);
    }
    if (
      category &&
      this.amenityCategories[category].active &&
      JSON.stringify(this.amenityCategories[category].activeId) === JSON.stringify(amenityId)
    ) {
      const amenities = Array.isArray(amenityId)
        ? this.amenityCategories[category].amenities.filter((i: string) => !amenityId.includes(i))
        : this.amenityCategories[category].amenities.filter((i: string) => i !== amenityId);
      this.amenityFilters = this.amenityFilters.concat(amenities);
      this.amenityCategories[category].active = false;
    } else if (!category) {
      if (inverted) {
        this.hiddenAmenities = this.hiddenAmenities.filter((i) => i !== amenityId);
        if (this.filteredAmenities.findIndex((i) => i === amenityId) === -1) {
          if (Array.isArray(amenityId)) {
            this.filteredAmenities.concat(amenityId);
          } else {
            this.filteredAmenities.push(amenityId);
          }
        }
      } else {
        this.amenityFilters = this.amenityFilters.filter((i) => i !== amenityId);
      }
    }
    this.filteredAmenities = this.amenityFilters.length > 0 ? this.amenityFilters : this.amenityIds;
    this.hiddenAmenities = this.hiddenAmenities.length > 0 ? this.hiddenAmenities : [];
    this.filterOutFeatures();
    this.setActivePolygons(null);
  }

  private onResetAmenityFilters() {
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

  private filterOutFeatures() {
    // proximiio-pois-icons, proximiio-pois-labels, 'pois-icons', 'pois-labels'

    const layers = ['proximiio-pois-icons', 'proximiio-pois-labels', 'pois-icons', 'pois-labels'];
    if (this.defaultOptions.initPolygons) {
      layers.push('poi-custom-icons');
    }
    layers.forEach((layer) => {
      if (this.map.getLayer(layer)) {
        const l = this.map.getLayer(layer);
        const filters = [...(l.filter as maplibregl.FilterSpecification[])];
        const amenityFilter = filters.findIndex((f) => f[1][1] && f[1][1][1] === 'amenity');
        const featureFilter = filters.findIndex((f) => f[1][1] === 'id');
        if (this.filteredAmenities.length > 0) {
          if (amenityFilter !== -1) {
            filters[amenityFilter] = [
              'any',
              ['in', ['get', 'amenity'], ['literal', this.filteredAmenities]],
              ['in', ['get', 'amenity', ['get', '_dynamic']], ['literal', this.filteredAmenities]],
            ];
          } else {
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
          } else {
            filters.push(['match', ['get', 'id'], this.filteredFeatures, true, false]);
          }
        } else {
          if (featureFilter !== -1) {
            filters.splice(featureFilter, 1);
          }
        }
        if (this.hiddenFeatures.length > 0) {
          if (featureFilter !== -1) {
            filters[featureFilter] = ['match', ['get', 'id'], this.hiddenFeatures, false, true];
          } else {
            filters.push(['match', ['get', 'id'], this.hiddenFeatures, false, true]);
          }
        } else {
          if (featureFilter !== -1) {
            filters.splice(featureFilter, 1);
          }
        }
        this.state.style.getLayer(layer).filter = filters;
        this.map.setFilter(layer, filters as maplibregl.FilterSpecification);
      }
    });
    this.state.style.notify('filter-change');
  }

  private activePolygonsAmenity;
  private setActivePolygons(amenityId: string | null | string[]) {
    if (this.defaultOptions.initPolygons) {
      const activeFeatures = this.activePolygonsAmenity
        ? filterByAmenity(
            this.state.allFeatures.features.filter((f) => f.geometry.type === 'Point'),
            this.activePolygonsAmenity,
          )
        : [];
      const amenityFeatures = amenityId
        ? filterByAmenity(
            this.state.allFeatures.features.filter((f) => f.geometry.type === 'Point'),
            amenityId,
          )
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
      const featuresWithPolygon = this.state.allFeatures.features.filter(
        (f) => f.properties._dynamic?.polygon_id && f.geometry.type === 'Point',
      );
      if (activeFeatures.length > 0) {
        for (const f of featuresWithPolygon) {
          const polygon = this.state.allFeatures.features.find(
            (i) =>
              i.properties._dynamic?.id === f.properties._dynamic?.polygon_id &&
              this.defaultOptions.polygonLayers
                .map((layer) => `${layer.featureType}-custom`)
                .includes(i.properties._dynamic?.type),
          );
          if (polygon) {
            this.map.setFeatureState(
              {
                source: 'main',
                id: polygon.properties.id,
              },
              {
                active: false,
                disabled: false,
              },
            );
            if (polygon.properties._dynamic.label_id) {
              this.map.setFeatureState(
                {
                  source: 'main',
                  id: polygon.properties._dynamic.label_id,
                },
                {
                  active: false,
                  disabled: false,
                },
              );
            }
          }
        }
      }
      if (amenityFeatures.length > 0) {
        for (const f of featuresWithPolygon) {
          const polygon = this.state.allFeatures.features.find(
            (i) =>
              i.properties._dynamic?.id === f.properties._dynamic?.polygon_id &&
              this.defaultOptions.polygonLayers
                .map((layer) => `${layer.featureType}-custom`)
                .includes(i.properties._dynamic?.type),
          );
          if (polygon) {
            if (filterByAmenity([f], amenityId)?.length > 0) {
              this.map.setFeatureState(
                {
                  source: 'main',
                  id: polygon.properties.id,
                },
                {
                  active: true,
                },
              );
              if (polygon.properties._dynamic.label_id) {
                this.map.setFeatureState(
                  {
                    source: 'main',
                    id: polygon.properties._dynamic.label_id,
                  },
                  {
                    active: true,
                  },
                );
              }
            } else {
              this.map.setFeatureState(
                {
                  source: 'main',
                  id: polygon.properties.id,
                },
                {
                  disabled: true,
                },
              );
              if (polygon.properties._dynamic.label_id) {
                this.map.setFeatureState(
                  {
                    source: 'main',
                    id: polygon.properties._dynamic.label_id,
                  },
                  {
                    disabled: true,
                  },
                );
              }
            }
          }
        }
      }
    }
    this.activePolygonsAmenity = amenityId;
  }

  private handlePoiVisibility() {
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
            const filters = [...(l.filter as maplibregl.FilterSpecification[])];
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
              } else {
                // hide pois with hidden visibility
                filters[visibilityFilter] = ['!=', ['get', 'visibility'], 'hidden'];
              }
            } else {
              // add visibility filter
              filters.push(['!=', ['get', 'visibility'], 'hidden']);
            }
            this.state.style.getLayer(layer).filter = filters;
            this.map.setFilter(layer, filters as maplibregl.FilterSpecification);
          }
        });
      }
    });
    this.state.style.notify('filter-change');
  }

  private onToggleHiddenPois() {
    this.handlePoiVisibility();
  }

  private onEnablePolygonPreventedIcons() {
    // @ts-ignore
    const mainSourceData = this.map.getSource('main')._data;
    mainSourceData.features = mainSourceData.features.map((f) => {
      if (f.properties?.metadata?.prevent_polygon === true || f.properties?.metadata?.prevent_polygon === 'true') {
        f.properties.hideIcon = 'hide';
      }
      return f;
    });
    // @ts-ignore
    this.map.getSource('main').setData(mainSourceData);
  }

  private onDisablePolygonPreventedIcons() {
    // @ts-ignore
    const mainSourceData = this.map.getSource('main')._data;
    mainSourceData.features = mainSourceData.features.map((f) => {
      if (
        (this.activePolygonsAmenity === 'nonexisting' || this.activePolygonsAmenity.includes(f.properties.amenity)) &&
        (f.properties?.metadata?.prevent_polygon === true || f.properties?.metadata?.prevent_polygon === 'true')
      ) {
        f.properties.hideIcon = 'show';
      }
      return f;
    });
    // @ts-ignore
    this.map.getSource('main').setData(mainSourceData);
  }

  private onSetHiddenAmenities(amenities: string[]) {
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

  private onDisablePolygons() {
    const featuresWithPolygon = this.state.allFeatures.features.filter(
      (f) => f.properties._dynamic?.polygon_id && f.geometry.type === 'Point',
    );
    for (const f of featuresWithPolygon) {
      const polygon = this.state.allFeatures.features.find(
        (i) =>
          i.properties._dynamic?.id === f.properties._dynamic?.polygon_id &&
          this.defaultOptions.polygonLayers
            .map((layer) => `${layer.featureType}-custom`)
            .includes(i.properties._dynamic?.type),
      );
      if (polygon) {
        this.map.setFeatureState(
          {
            source: 'main',
            id: polygon.properties.id,
          },
          {
            disabled: true,
          },
        );
        if (polygon.properties._dynamic.label_id) {
          this.map.setFeatureState(
            {
              source: 'main',
              id: polygon.properties._dynamic.label_id,
            },
            {
              disabled: true,
            },
          );
        }
      }
    }
  }

  private onSetPerson(lat: number, lng: number, level: number, id?: string | number) {
    const person = new PersonModel({ lat, lng, level, id });
    this.state = { ...this.state, persons: [person] };
    this.initPersonsMap();
  }

  private onAddPerson(lat: number, lng: number, level: number, id?: string | number) {
    const person = new PersonModel({ lat, lng, level, id });
    this.state.persons = [...this.state.persons, person];
    this.initPersonsMap();
  }

  private onUpdatePerson(person: PersonModel, lat: number, lng: number, level: number) {
    person.updatePosition({ lat, lng, level });
    this.initPersonsMap();
  }

  private initPersonsMap() {
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
      }) as Feature;
    });
    this.state.style.sources['persons-source'].data = {
      type: 'FeatureCollection',
      features: personsCollection,
    };
    this.onPersonUpdateListener.next(this.state.persons);
  }

  private prepareStyle(style: StyleModel) {
    style.setSource('main', this.geojsonSource);
    style.setSource('synthetic', this.syntheticSource);
    style.setSource('route', this.routingSource);
    style.setSource('clusters', this.clusterSource);
    style.setLevel(this.defaultOptions.defaultFloorLevel);
  }

  private async onRouteChange(event?: string) {
    if (event === 'loading-start') {
      this.state = { ...this.state, loadingRoute: true };
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
        this.state = { ...this.state, loadingRoute: false, textNavigation };

        this.centerOnRoute(routeStart);
        this.removeRouteMarkers();

        if (this.defaultOptions.showLevelDirectionIcon && this.routingSource.navigationType === 'mall') {
          this.addDirectionFeatures();
        }

        if (this.defaultOptions.animatedRoute || this.defaultOptions.routeAnimation.enabled) {
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
          await logger.save();
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
        this.state = { ...this.state, loadingRoute: false, textNavigation };

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
      this.state = { ...this.state, loadingRoute: false };
      this.onRouteFailedListener.next('route not found');
      return;
    }

    const style = this.state.style;
    style.setSource('route', this.routingSource);
    this.state = { ...this.state, style };

    this.updateMapSource(this.routingSource);
  }

  private onSourceChange() {
    this.state = {
      ...this.state,
      style: this.state.style,
    };
    this.updateMapSource(this.geojsonSource);
    // this.routingSource.routing.setData(this.geojsonSource.collection)
    this.updateCluster();
  }

  private onSyntheticChange() {
    this.state.style.setSource('synthetic', this.syntheticSource);
    this.updateMapSource(this.syntheticSource);
  }

  private updateMapSource(source: DataSource) {
    const map = this.map;
    if (map && map.getSource(source.id)) {
      const mapSource = map.getSource(source.id) as any;
      if (mapSource) {
        mapSource.setData(source.data);
      }
    }
  }

  private onStyleSelect(style: StyleModel) {
    const map = this.map;
    if (map) {
      this.prepareStyle(style);
      map.setStyle(style.json);
    }

    this.state = { ...this.state, style };
  }

  private handleFilterChange = () => {
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
  private throttledHandleFilterChange = throttle(this.handleFilterChange, 5000); // Adjust the delay as needed

  private onStyleChange(event?: string, data?: any) {
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
      const { layer, changes }: any = data;
      const layoutChanges = (changes as any[]).filter((diff) => diff.kind === 'E' && diff.path[0] === 'layout');
      const paintChanges = (changes as any[]).filter((diff) => diff.kind === 'E' && diff.path[0] === 'paint');
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
    this.state = { ...this.state, style: this.state.style };
  }

  private onToggleRasterFloorplans() {
    this.imageSourceManager.enabled = !this.imageSourceManager.enabled;
    const map = this.map;
    if (map) {
      this.imageSourceManager.setLevel(map, this.state.floor.level, this.state);
    }
  }

  private updateCluster() {
    const map = this.map;
    if (map) {
      const data = {
        type: 'FeatureCollection',
        features: this.geojsonSource.data.features
          .filter((f) => f.isPoint && f.hasLevel(this.state.floor.level))
          .map((f) => f.json),
      } as FeatureCollection;
      const source = map.getSource('clusters') as any;
      if (source) {
        source.setData(data);
      }
    }
  }

  private async onPlaceSelect(place: PlaceModel, zoomIntoPlace: boolean | undefined, floorLevel?: number) {
    this.state = { ...this.state, place };
    const floors = this.defaultOptions.bundleUrl
      ? await getPlaceFloorsBundle({ placeId: place.id, bundleUrl: this.defaultOptions.bundleUrl }).catch(
          this.handleControllerError,
        )
      : await getPlaceFloors(place.id).catch(this.handleControllerError);
    if (floors) {
      const state: any = { floors: floors.sort((a, b) => a.level - b.level) };

      if (floors.length > 0) {
        const defaultFloor = floorLevel
          ? floors.find((floor) => floor.level === floorLevel)
          : floors.find((floor) => floor.level === 0);
        if (defaultFloor) {
          state.floor = defaultFloor;
        } else {
          state.floor = floors[0];
        }
      }
      this.state = { ...this.state, ...state };
      const map = this.map;
      if (map && zoomIntoPlace) {
        map.flyTo({ center: [place.location.lng, place.location.lat] });
      }
      this.onPlaceSelectListener.next(place);
      if (state.floor) {
        this.onFloorSelect(state.floor);
      }
    }
  }

  private onFloorSelect(floor: FloorModel) {
    const map = this.map;
    const route =
      this.routingSource.levelPoints && this.routingSource.levelPoints[floor.level]
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
        const routePoints =
          this.routingSource.route[`path-part-${this.currentStep}`] &&
          this.routingSource.route[`path-part-${this.currentStep}`].properties?.level === floor.level
            ? this.routingSource.route[`path-part-${this.currentStep}`]
            : lineString(this.routingSource.levelPoints[floor.level].map((i: any) => i.geometry.coordinates));
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
          } else {
            // @ts-ignore
            this.map.flyTo({
              center: center(routePoints).geometry.coordinates as LngLatLike,
              zoom: this.defaultOptions.minFitBoundsDistance < 10 ? 22 : this.map.getZoom(),
            });
          }
        }
      }
      if (this.defaultOptions.isKiosk) {
        if (this.defaultOptions.kioskSettings.showPoint && map.getLayer('my-location-layer')) {
          const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
          map.setFilter('my-location-layer', filter as maplibregl.FilterSpecification);
          this.state.style.getLayer('my-location-layer').filter = filter;
        }

        if (
          this.defaultOptions.routeAnimation.type === 'puck' &&
          map.getLayer('start-point-layer') &&
          map.getLayer('start-point-halo-layer')
        ) {
          const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
          map.setFilter('start-point-layer', filter as maplibregl.FilterSpecification);
          this.state.style.getLayer('start-point-layer').filter = filter;
          map.setFilter('start-point-halo-layer', filter as maplibregl.FilterSpecification);
          this.state.style.getLayer('start-point-halo-layer').filter = filter;
        }

        if (this.kioskPopup) {
          if (floor.level === this.defaultOptions.kioskSettings.level) {
            this.kioskPopup.removeClassName('hidden');
          } else {
            this.kioskPopup.addClassName('hidden');
          }
        }
      }
      if (this.defaultOptions.useGpsLocation && this.startPoint) {
        this.startPoint.properties = { ...this.startPoint.properties, level: floor.level };
      }
      if (map.getLayer('persons-layer')) {
        const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
        map.setFilter('persons-layer', filter as maplibregl.FilterSpecification);
        this.state.style.getLayer('persons-layer').filter = filter;
      }
      if (this.defaultOptions.showLevelDirectionIcon && map.getLayer('direction-halo-layer')) {
        const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
        map.setFilter('direction-halo-layer', filter as maplibregl.FilterSpecification);
        this.state.style.getLayer('direction-halo-layer').filter = filter;

        map.setFilter('direction-popup-layer', filter as maplibregl.FilterSpecification);
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
        map.setFilter('enlargened-icon-layer', filter as maplibregl.FilterSpecification);
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
        map.setFilter('highlight-icon-layer', filter as maplibregl.FilterSpecification);
        this.state.style.getLayer('highlight-icon-layer').filter = filter;
      }
    }
    this.state = { ...this.state, floor, style: this.state.style };
    if (this.defaultOptions.animatedRoute || (this.defaultOptions.routeAnimation.enabled && route)) {
      if (this.defaultOptions.animatedRoute) {
        console.log(`animatedRoute property is deprecated, please use routeAnimation.enabled instead!`);
      }
      if (this.defaultOptions.routeAnimation.autoRestart) {
        this.animateRoute();
      }
    }
    if (this.defaultOptions.useRasterTiles) {
      this.initRasterTiles();
    }
    this.updateCluster();
    this.onFloorSelectListener.next(floor);
  }

  private onRouteUpdate({ start, finish, stops }: { start?: Feature; finish?: Feature; stops?: Feature[] }) {
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
      this.routingSource.update({ start, finish, stops, language: this.defaultOptions.language });
    } catch (e) {
      console.log('catched', e);
    }
    this.state = { ...this.state, style: this.state.style };
  }

  private onRoutePreview({ start, finish, stops }: { start?: Feature; finish?: Feature; stops?: Feature[] }) {
    this.startPoint = start;
    this.endPoint = stops ? stops[stops.length - 1] : finish;
    if (this.defaultOptions.initPolygons) {
      const polygonsToSelect = [finish, start];
      if (stops && stops.length > 0) {
        polygonsToSelect.push(...stops);
      }
      this.handlePolygonSelection(polygonsToSelect);
    }
    this.routingSource.update({ start, finish, stops, preview: true, language: this.defaultOptions.language });
  }

  private onRouteCancel() {
    this.state = { ...this.state, textNavigation: null };
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
    this.routingSource.cancel();
    this.onRouteCancelListener.next('route cancelled');
  }

  private centerOnPoi(poi: any) {
    if (this.state.floor.level !== parseInt(poi.properties.level, 0)) {
      const floor = this.state.floors.find((f) => f.level === poi.properties.level);
      if (floor) this.onFloorSelect(floor);
    }
    if (this.map) {
      this.map.flyTo({ center: poi.geometry.coordinates });
    }
  }

  private centerOnRoute(route: Feature) {
    if (route && route.properties) {
      if (this.state.floor.level !== +route.properties.level) {
        const floor = this.state.floors.find((f) => f.level === +route.properties.level);
        if (floor) this.onFloorSelect(floor);
      }
      if (this.map) {
        if (this.routingSource && this.routingSource.navigationType === 'city' && this.routingSource.fullPath) {
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
          } else {
            // @ts-ignore
            this.map.flyTo({
              center: center(routeToCenter).geometry.coordinates as LngLatLike,
              zoom: this.defaultOptions.minFitBoundsDistance < 10 ? 15 : this.map.getZoom(),
              bearing: 0,
            });
          }
          return;
        }
        if (
          this.routingSource &&
          this.routingSource.route &&
          this.routingSource.route[`path-part-${this.currentStep}`] &&
          this.routingSource.levelPoints[this.state.floor.level]
        ) {
          const routePoints =
            this.routingSource.route[`path-part-${this.currentStep}`] &&
            this.routingSource.route[`path-part-${this.currentStep}`].properties?.level === this.state.floor.level
              ? this.routingSource.route[`path-part-${this.currentStep}`]
              : lineString(
                  this.routingSource.levelPoints[this.state.floor.level].map((i: any) => i.geometry.coordinates),
                );
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
            } else {
              // @ts-ignore
              this.map.flyTo({
                center: center(routePoints).geometry.coordinates as LngLatLike,
                zoom: this.defaultOptions.minFitBoundsDistance < 10 ? 22 : this.map.getZoom(),
              });
            }
          }
        }
      }
    }
  }

  private centerOnCoords(lat: number, lng: number, zoom?: number) {
    if (this.map) {
      this.map.flyTo({ center: [lng, lat], zoom: zoom ? zoom : 18 });
    }
  }

  private async updateImages() {
    await Promise.all(
      this.state.amenities.map(async (amenity) => {
        this.amenityIds.push(amenity.id);
        if (amenity.icon || amenity.id) {
          try {
            const response = await this.map.loadImage(
              this.defaultOptions.bundleUrl
                ? `${this.defaultOptions.bundleUrl}/amenities/${amenity.id}.png`
                : amenity.icon,
            );
            if (response) {
              this.map.addImage(amenity.id, response.data);
            }
          } catch (e) {
            console.log(e);
          }
        }
      }),
    );

    await Promise.all(
      this.state.features.features
        .filter((f) => f.properties.metadata && f.properties.metadata['anchor-logo'] && f.properties.type !== 'poi')
        .map(async (f) => {
          try {
            const response = await this.map.loadImage(
              this.defaultOptions.bundleUrl
                ? `${this.defaultOptions.bundleUrl}/images/${f.properties.metadata['anchor-logo']}`
                : `${f.properties.metadata['anchor-logo']}?token=${axios.defaults.headers.common.Authorization}`,
            );
            if (response) {
              this.map.addImage(f.id, response.data);
            }
          } catch (e) {
            console.log(e);
          }
        }),
    );
  }

  private getUpcomingFloorNumber(way: string) {
    if (this.routingSource.lines && this.routingSource.route) {
      const currentRouteIndex = this.routingSource.lines.findIndex(
        (route) => +route.properties.level === this.state.floor.level,
      );
      const currentRoute = this.routingSource.lines[currentRouteIndex];
      const nextRouteIndex = this.routingSource.lines.findIndex((route) => {
        if (way === 'up') {
          return +route.properties.level > currentRoute.properties.level;
        } else {
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

  private animationFrame;
  private animationTimeout;
  private step;
  private lerp(a, b, t) {
    return a + (b - a) * t;
  }
  private animateRoute() {
    if (
      this.routingSource &&
      this.routingSource.route &&
      this.routingSource.route[`path-part-${this.currentStep}`] &&
      this.routingSource.levelPoints[this.state.floor.level] &&
      !this.routingSource.preview
    ) {
      const route =
        this.routingSource.route[`path-part-${this.currentStep}`] &&
        this.routingSource.route[`path-part-${this.currentStep}`].properties?.level === this.state.floor.level
          ? this.routingSource.route[`path-part-${this.currentStep}`]
          : lineString(
              this.routingSource.levelPoints[this.state.floor.level].map((i: any) => i.geometry.coordinates),
              { level: this.state.floor.level },
            );
      let routeUntilNextStep;
      if (this.routingSource.navigationType === 'city') {
        const routePoints = this.routingSource.lines
          .map((i: any, index: number) => {
            if (index > this.currentStep) {
              return null;
            } else {
              return i.geometry.coordinates;
            }
          })
          .filter((i) => i)
          .flat(1);
        routeUntilNextStep = lineString(routePoints, { level: this.state.floor.level });
      }
      if (this.defaultOptions.routeAnimation.type === 'point' || this.defaultOptions.routeAnimation.type === 'puck') {
        cancelAnimationFrame(this.animationFrame);
        clearTimeout(this.animationTimeout);
        const totalDistance = length(route);
        let baseSpeed = 1000 * 30 * this.defaultOptions.routeAnimation.durationMultiplier; // Animation time in milliseconds per meter

        if (this.routingSource.navigationType === 'city') {
          baseSpeed = baseSpeed / this.defaultOptions.routeAnimation.cityRouteSpeedMultiplier;
        }

        let totalDuration = totalDistance * baseSpeed; // Total animation duration based on route length

        if (
          this.routingSource.navigationType === 'city' &&
          totalDuration > this.defaultOptions.routeAnimation.cityRouteMaxDuration * 1000
        ) {
          totalDuration = this.defaultOptions.routeAnimation.cityRouteMaxDuration * 1000;
        }

        let startTime;

        this.map.setCenter(route.geometry.coordinates[0] as LngLatLike);

        const animate = (currentTime) => {
          if (!startTime) startTime = currentTime;
          const elapsedTime = currentTime - startTime;

          const t = elapsedTime / totalDuration;

          if (t >= 1) {
            // Stop the animation if we reached the end
            if (this.defaultOptions.routeAnimation.looping && this.routingSource.navigationType === 'mall') {
              this.animationTimeout = setTimeout(() => {
                this.restartRouteAnimation({ delay: 0, recenter: true });
              }, 2000);
            }
            if (this.defaultOptions.autoLevelChange && this.routingSource.navigationType === 'mall') {
              if (this.routingSource.route && Object.keys(this.routingSource.route).length - 1 === this.currentStep) {
                if (this.routingSource.stops.length !== this.currentStop) {
                  this.setStop('next');
                }
                return;
              }
              setTimeout(() => {
                this.setNavStep('next');
                if (this.defaultOptions.autoRestartAnimationAfterFloorChange) {
                  this.restartRouteAnimation({ delay: 0, recenter: true });
                }
              }, 2000);
            }
            return;
          }

          // Calculate the current distance along the route
          const currentDistance = t * totalDistance;

          // Interpolate the current point along the route
          const currentPoint = along(route, currentDistance);

          // cut the line at the point
          const lineAlong = lineSplit(
            this.routingSource.navigationType === 'city' ? routeUntilNextStep : route,
            currentPoint,
          ).features[0];

          // Update the point position
          // @ts-ignore
          const pointData = this.map.getSource('pointAlong')._data;
          const currentCoords = pointData.features[0]
            ? pointData.features[0].geometry.coordinates
            : currentPoint.geometry.coordinates;
          const newCoords = currentPoint.geometry.coordinates;
          pointData.features[0] = point(
            this.defaultOptions.routeAnimation.iconUseLerp
              ? [
                  this.lerp(currentCoords[0], newCoords[0], this.defaultOptions.routeAnimation.iconLerpTolerance),
                  this.lerp(currentCoords[1], newCoords[1], this.defaultOptions.routeAnimation.iconLerpTolerance),
                ]
              : newCoords,
          );

          if (this.defaultOptions.routeAnimation.type === 'point') {
            if (this.defaultOptions.routeAnimation.pointIconAsMarker) {
              this.pointIconMarker.setLngLat(newCoords as [number, number]);
              this.pointIconMarker.getElement().style.backgroundImage =
                this.routingSource.navigationType === 'city'
                  ? `url(${this.defaultOptions.routeAnimation.cityPointIconUrl})`
                  : `url(${this.defaultOptions.routeAnimation.pointIconUrl})`;
              this.pointIconMarker.addTo(this.map);
              // set different icon based on nav type
            } else {
              pointData.features[0].properties.pointIcon =
                this.routingSource.navigationType === 'city' ? 'cityPointIcon' : 'pointIcon';
              // @ts-ignore
              this.map.getSource('pointAlong').setData(pointData);
            }
          }

          if (this.defaultOptions.routeAnimation.type === 'puck') {
            this.map
              .getSource('start-point')
              // @ts-ignore
              .setData(
                circle(
                  pointData.geometry.coordinates,
                  this.defaultOptions.routeAnimation.puckRadius ? this.defaultOptions.routeAnimation.puckRadius : 0.002,
                  {
                    properties: {
                      level: this.state.floor.level,
                    },
                  },
                ),
              );
          }

          // @ts-ignore
          this.map.getSource('lineAlong').setData(lineAlong);

          if (this.defaultOptions.routeAnimation.followRoute) {
            const cameraCoords = this.map.getCenter().toArray();
            const targetCoords = currentPoint.geometry.coordinates;
            const interpolatedCoords = [
              this.lerp(cameraCoords[0], targetCoords[0], this.defaultOptions.routeAnimation.cameraLerpTolerance),
              this.lerp(cameraCoords[1], targetCoords[1], this.defaultOptions.routeAnimation.cameraLerpTolerance),
            ];
            if (!this.defaultOptions.routeAnimation.followRouteAngle) {
              if (this.routingSource.navigationType === 'city') {
                this.map.setBearing(0);
              }
              this.map.easeTo({
                center: this.defaultOptions.routeAnimation.cameraUseLerp
                  ? (interpolatedCoords as [number, number])
                  : (targetCoords as [number, number]),
                duration: 50,
                easing: (x) => x,
              });
            } else {
              const prevPoint = point(currentCoords);
              const currentP = point(newCoords);

              const currentBearing = this.map.getBearing();
              const nextBearing = prevPoint && currentP ? bearing(prevPoint, currentP) : currentBearing;
              let newBearing = currentBearing;

              if (Math.abs(currentBearing - nextBearing) >= 6) {
                newBearing = nextBearing;
              }

              setTimeout(() => {
                this.map.flyTo({
                  center: targetCoords as [number, number],
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
            .setData(this.routingSource.navigationType === 'city' ? routeUntilNextStep : route);
        });

        const animateDashArray = (timestamp: number) => {
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

  private onRestartRouteAnimation({ delay, recenter }: { delay: number; recenter?: boolean }) {
    if (
      this.routingSource &&
      this.routingSource.route &&
      this.routingSource.route[`path-part-${this.currentStep}`] &&
      this.routingSource.levelPoints[this.state.floor.level]
    ) {
      if (this.defaultOptions.routeAnimation.type === 'point' || this.defaultOptions.routeAnimation.type === 'puck') {
        const route =
          this.routingSource.route[`path-part-${this.currentStep}`] &&
          this.routingSource.route[`path-part-${this.currentStep}`].properties?.level === this.state.floor.level
            ? this.routingSource.route[`path-part-${this.currentStep}`]
            : lineString(
                this.routingSource.levelPoints[this.state.floor.level].map((i: any) => i.geometry.coordinates),
                { level: this.state.floor.level },
              );

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
              center: route.geometry.coordinates[0] as [number, number],
            });
          }, 100);
        }

        this.map.setStyle(this.state.style);
      }
      setTimeout(
        () => {
          this.animateRoute();
        },
        delay ? delay : 0,
      );
    }
  }

  private onStopRouteAnimation(keepRoute?: boolean) {
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

  private onJumpToRouteEnd() {
    if (this.defaultOptions.routeAnimation.type === 'point' || this.defaultOptions.routeAnimation.type === 'puck') {
      cancelAnimationFrame(this.animationFrame);
      clearTimeout(this.animationTimeout);

      // @ts-ignore
      const pointData = this.map.getSource('pointAlong')._data;
      const newCoords = this.routingSource.finish.geometry.coordinates;
      pointData.features[0] = point(newCoords);

      if (this.defaultOptions.routeAnimation.type === 'point') {
        if (this.defaultOptions.routeAnimation.pointIconAsMarker) {
          this.pointIconMarker.setLngLat(newCoords as [number, number]);
        } else {
          // @ts-ignore
          this.map.getSource('pointAlong').setData(pointData);
        }
      }

      if (this.defaultOptions.routeAnimation.type === 'puck') {
        this.map
          .getSource('start-point')
          // @ts-ignore
          .setData(
            circle(
              pointData.geometry.coordinates,
              this.defaultOptions.routeAnimation.puckRadius ? this.defaultOptions.routeAnimation.puckRadius : 0.002,
              {
                properties: {
                  level: this.state.floor.level,
                },
              },
            ),
          );
      }

      // @ts-ignore
      this.map.getSource('lineAlong').setData(this.routingSource.lines[this.routingSource.lines.length - 1]);
    }
  }

  private translateLayers() {
    if (this.defaultOptions.isKiosk && this.defaultOptions.kioskSettings.showLabel && this.kioskPopup) {
      this.kioskPopup.setHTML(translations[this.defaultOptions.language].YOU_ARE_HERE);
    }
    this.state.style.setSource('main', this.geojsonSource);
  }

  public getClosestFeature(amenityId: string, fromFeature?: Feature) {
    let sameLevelfeatures = this.state.allFeatures.features.filter(
      (i) =>
        i.properties.amenity === amenityId &&
        i.geometry.type === 'Point' &&
        i.properties.level === (fromFeature ? fromFeature.properties.level : this.startPoint.properties.level),
    );
    let features = this.state.allFeatures.features.filter(
      (i) => i.properties.amenity === amenityId && i.geometry.type === 'Point',
    );
    if (this.defaultOptions.defaultPlaceId) {
      sameLevelfeatures = sameLevelfeatures.filter((i) => i.properties.place_id === this.defaultOptions.defaultPlaceId);
      features = features.filter((i) => i.properties.place_id === this.defaultOptions.defaultPlaceId);
    }
    const targetPoint = point(fromFeature ? fromFeature.geometry.coordinates : this.startPoint.geometry.coordinates);
    if (sameLevelfeatures.length > 0 || features.length > 0) {
      return nearestPoint(
        targetPoint,
        featureCollection(sameLevelfeatures.length > 0 ? sameLevelfeatures : features),
      ) as Feature;
    } else {
      return false;
    }
  }

  public getFloorName(floor: FloorModel) {
    if (floor.metadata && floor.metadata['title_' + this.defaultOptions.language]) {
      return floor.metadata['title_' + this.defaultOptions.language];
    } else {
      return floor.name;
    }
  }

  private handleControllerError = (err) => {
    this.onMapFailedListener.next(true);
  };

  private InjectCSS = ({ id, css }: { id: string; css: string }) => {
    // Create the css
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = css;

    const head = document.getElementsByTagName('head')[0];
    head.insertBefore(style, head.firstChild);
  };

  private createMarkerElement = (className: string, iconUrl: string, backgroundSize: string) => {
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

  private addMarker = (className: string, svgIcon: string, size: string, coordinates: [number, number]) => {
    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`;
    const markerElement = this.createMarkerElement(className, iconUrl, size);
    return new maplibregl.Marker({ element: markerElement }).setLngLat(coordinates).addTo(this.map);
  };

  private addRouteMarkers = () => {
    this.routeStartMarker = this.addMarker(
      'route-start-marker',
      routeStartSvg,
      '50%',
      this.routingSource.points[0].geometry.coordinates as [number, number],
    );

    this.routeFinishMarker = this.addMarker(
      'route-finish-marker',
      routeFinishSvg,
      '30%',
      this.routingSource.points[this.routingSource.points.length - 1].geometry.coordinates as [number, number],
    );
  };

  private removeRouteMarkers = () => {
    if (Object.keys(this.routeStartMarker).length > 0) {
      this.routeStartMarker.remove();
    }
    if (Object.keys(this.routeFinishMarker).length > 0) {
      this.routeFinishMarker.remove();
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
  public getMapboxInstance() {
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
  public getMapState() {
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
  public getMapReadyListener() {
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
  public getMainSourceLoadedListener() {
    return this.onMainSourceLoadedListener;
  }

  /**
   *  @memberof Map
   *  @name getMapFailedListener
   *  @returns returns map failed listener
   *  @example
   *  const map = new Proximiio.Map();
   *  map.getMapFailedListener().subscribe(failed => {
   *    console.log('map failed', failed);
   *  });
   */
  public getMapFailedListener() {
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
  public setLanguage(language: string) {
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
  public async setPlace(placeId: string, zoomIntoPlace?: boolean, floorLevel?: number) {
    const place = this.defaultOptions.bundleUrl
      ? await getPlaceByIdBundle({ placeId, bundleUrl: this.defaultOptions.bundleUrl })
      : await getPlaceById(placeId);
    const shouldZoom = typeof zoomIntoPlace !== 'undefined' ? zoomIntoPlace : true;
    await this.onPlaceSelect(place, shouldZoom, floorLevel);
    return place;
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
  public getPlaceSelectListener() {
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
  public setFloorById(floorId: string) {
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
  public setFloorByLevel(level: number) {
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
  public setFloorByWay(way: 'up' | 'down') {
    let floor;
    let nextLevel: number | undefined = way === 'up' ? this.state.floor.level + 1 : this.state.floor.level - 1;
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
  public getFloorSelectListener() {
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
   *  @param addToMap {boolean} default true, if set to false route will not be added to map
   *  @example
   *  const map = new Proximiio.Map();
   *  map.getMapReadyListener().subscribe(ready => {
   *    console.log('map ready', ready);
   *    map.findRouteByIds('finishId, 'startId');
   *  });
   */
  public findRouteByIds(
    idTo: string,
    idFrom?: string,
    accessibleRoute?: boolean,
    wayfindingConfig?: WayfindingConfigModel,
    addToMap?: boolean,
  ) {
    const fromFeature = idFrom
      ? (this.state.allFeatures.features.find((f) => f.id === idFrom || f.properties.id === idFrom) as Feature)
      : this.startPoint;
    const toFeature = this.state.allFeatures.features.find((f) => f.id === idTo || f.properties.id === idTo) as Feature;
    this.routingSource.toggleAccessible(accessibleRoute);
    if (wayfindingConfig) {
      this.routingSource.setConfig(wayfindingConfig);
    }
    if (addToMap !== false) {
      this.onRouteUpdate({
        start: fromFeature,
        finish: toFeature,
      });
    } else {
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
  public findRouteByTitle(
    titleTo: string,
    titleFrom?: string,
    accessibleRoute?: boolean,
    wayfindingConfig?: WayfindingConfigModel,
    addToMap?: boolean,
  ) {
    const fromFeature = titleFrom
      ? (this.state.allFeatures.features.find((f) => f.properties.title === titleFrom) as Feature)
      : this.startPoint;
    const toFeature = this.state.allFeatures.features.find((f) => f.properties.title === titleTo) as Feature;
    this.routingSource.toggleAccessible(accessibleRoute);
    if (wayfindingConfig) {
      this.routingSource.setConfig(wayfindingConfig);
    }
    if (addToMap !== false) {
      this.onRouteUpdate({
        start: fromFeature,
        finish: toFeature,
      });
    } else {
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
  public findRouteByCoords(
    latTo: number,
    lngTo: number,
    levelTo: number,
    latFrom?: number,
    lngFrom?: number,
    levelFrom?: number,
    accessibleRoute?: boolean,
    wayfindingConfig?: WayfindingConfigModel,
    addToMap?: boolean,
  ) {
    const fromFeature =
      latFrom && lngFrom && levelFrom
        ? (feature({ type: 'Point', coordinates: [lngFrom, latFrom] }, { level: levelFrom }) as Feature)
        : this.startPoint;
    const toFeature = feature({ type: 'Point', coordinates: [lngTo, latTo] }, { level: levelTo }) as Feature;
    this.routingSource.toggleAccessible(accessibleRoute);
    if (wayfindingConfig) {
      this.routingSource.setConfig(wayfindingConfig);
    }
    if (addToMap !== false) {
      this.onRouteUpdate({
        start: fromFeature,
        finish: toFeature,
      });
    } else {
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
  public findRouteToNearestFeature(
    amenityId: string,
    idFrom?: string,
    accessibleRoute?: boolean,
    wayfindingConfig?: WayfindingConfigModel,
    addToMap?: boolean,
  ) {
    const fromFeature = idFrom
      ? (this.state.allFeatures.features.find((f) => f.id === idFrom || f.properties.id === idFrom) as Feature)
      : this.startPoint;
    const toFeature: Feature | boolean = this.getClosestFeature(amenityId, fromFeature);
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
      } else {
        this.onRoutePreview({
          start: fromFeature,
          finish: toFeature,
        });
      }
    } else {
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
  public findCityRoute({
    start,
    destination,
    autoStart = true,
  }: {
    start: {
      lat: number;
      lng: number;
    };
    destination: {
      lat: number;
      lng: number;
    };
    autoStart?: boolean;
  }) {
    const startFeature = feature({ type: 'Point', coordinates: [start.lng, start.lat] }, { level: 0 }) as Feature;
    const destinationFeature = feature(
      { type: 'Point', coordinates: [destination.lng, destination.lat] },
      { level: 0 },
    ) as Feature;
    this.routingSource.setNavigationType('city');
    if (autoStart !== false) {
      this.onRouteUpdate({
        start: startFeature,
        finish: destinationFeature,
      });
    } else {
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
  public findMultipointRoute({
    start,
    stops,
    wayfindingConfig,
    autoStart = true,
  }: {
    start: string;
    stops: string[];
    wayfindingConfig?: WayfindingConfigModel;
    autoStart?: boolean;
  }) {
    const fromFeature = start
      ? (this.state.allFeatures.features.find((f) => f.id === start || f.properties.id === start) as Feature)
      : this.startPoint;
    const destinationFeatures = stops.map((id) => {
      return this.state.allFeatures.features.find((f) => f.id === id || f.properties.id === id) as Feature;
    }) as Feature[];
    if (wayfindingConfig) {
      this.routingSource.setConfig(wayfindingConfig);
    }
    if (autoStart !== false) {
      this.onRouteUpdate({
        start: fromFeature,
        stops: destinationFeatures,
      });
    } else {
      this.onRoutePreview({
        start: fromFeature,
        stops: destinationFeatures,
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
  public cancelRoute() {
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
  public setNavStep(step: number | 'next' | 'previous') {
    let newStep = 0;
    if (isNumber(step)) {
      newStep = +step;
    }
    if (step === 'next') {
      newStep = this.currentStep + 1;
    }
    if (
      step === 'next' &&
      this.routingSource.route &&
      Object.keys(this.routingSource.route).length - 1 === this.currentStep
    ) {
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
      if (this.routingSource.navigationType === 'city') {
        this.animateRoute();
      } else {
        if (this.routingSource.isMultipoint) {
          this.animateRoute();
        }
        this.centerOnRoute(this.routingSource.route[`path-part-${newStep}`]);
      }
      this.onStepSetListener.next(this.currentStep);
      if (
        isNumber(this.routingSource.route[`path-part-${newStep}`].properties?.stop) &&
        this.routingSource.route[`path-part-${newStep}`].properties?.stop >= 0
      ) {
        this.setStop(this.routingSource.route[`path-part-${newStep}`].properties?.stop);
      }
      return step;
    } else {
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
  public getNavStepSetListener() {
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
  public setStop(stop: number | 'next' | 'previous') {
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
    const newStopRoute: Feature = this.routingSource?.lines?.find((i: any) => i.properties.stop === newStop);

    if (newStopRoute) {
      this.currentStop = newStop;
      this.animateRoute();
      this.centerOnRoute(newStopRoute);
      this.onStopSetListener.next(this.currentStop);
      this.setNavStep(newStopRoute.properties.step);
      return this.currentStop;
    } else {
      this.currentStop = newStop;
      this.onStopSetListener.next(this.currentStop);
      this.setNavStep(this.routingSource?.lines[this.routingSource?.lines?.length - 1]?.properties?.step);
      this.onJumpToRouteEnd();
      this.centerToFeature(this.routingSource.finish.id);
      return this.currentStop;
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
  public getStopSetListener() {
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
  public getTBTNav() {
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
  public getRouteFoundListener() {
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
  public getRouteFailedListener() {
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
  public getRouteCancelListener() {
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
  public centerToRoute() {
    if (this.routingSource && this.routingSource.route && this.routingSource.route['path-part-0']) {
      const routeStart = this.routingSource.route['path-part-0'] as Feature;
      this.centerOnRoute(routeStart);
      return routeStart;
    } else {
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
  public centerToFeature(featureId: string) {
    const featureVar = this.state.allFeatures.features.find(
      (f) => f.id === featureId || f.properties.id === featureId,
    ) as Feature;
    if (featureVar) {
      this.centerOnPoi(featureVar);
      return featureVar;
    } else {
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
  public centerToCoordinates(lat: number, lng: number, zoom?: number) {
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
  public async addCustomFeature(
    title: string,
    level: number,
    lat: number,
    lng: number,
    icon?: string,
    id?: string,
    placeId?: string,
    floorId?: string,
    properties?: object,
    isTemporary?: boolean,
  ) {
    return await this.onAddNewFeature(title, +level, +lat, +lng, icon, id, placeId, floorId, properties, isTemporary);
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
  public async updateFeature(
    id: string,
    title?: string,
    level?: number,
    lat?: number,
    lng?: number,
    icon?: string,
    placeId?: string,
    floorId?: string,
    properties?: object,
    isTemporary?: boolean,
  ) {
    return await this.onUpdateFeature(id, title, level, lat, lng, icon, placeId, floorId, properties, isTemporary);
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
  public deleteFeature(id: string, isTemporary?: boolean) {
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
  public getCustomFeaturesList() {
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
  public getFeatureAddListener() {
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
  public getFeatureUpdateListener() {
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
  public getFeatureDeleteListener() {
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
  public setKiosk(lat: number, lng: number, level: number) {
    if (this.defaultOptions.isKiosk) {
      this.onSetKiosk(lat, lng, level);
    } else {
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
  public stopKiosk() {
    if (this.defaultOptions.isKiosk) {
      this.onStopKiosk();
    } else {
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
  public setBoundsPadding(padding: number | PaddingOptions) {
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
  public setFiltering(options: { key: string; value: string; hideIconOnly?: boolean } | null) {
    if (options) {
      this.defaultOptions.defaultFilter = options;
    } else {
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
  public setFeatureFilter(query: string, inverted?: boolean) {
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
  public removeFeatureFilter(query: string, inverted?: boolean) {
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
  public hidePois() {
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
  public hideIcons() {
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
  public showIcons() {
    this.onShowIcons();
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
  public setHiddenAmenities(amenities: string[]) {
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
  public enablePolygonPreventedIcons() {
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
  public disablePolygonPreventedIcons() {
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
  public disablePolygons() {
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
  public resetFeatureFilters() {
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
  public setAmenityFilter(amenityId: string | string[], category?: string, inverted?: boolean) {
    if (!category || (category && this.amenityCategories[category])) {
      this.onSetAmenityFilter(amenityId, category, inverted);
    } else {
      throw new Error(
        `It seems there is no '${category}' amenities category created, please set category with 'setAmenitiesCategory()' method`,
      );
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
  public removeAmenityFilter(amenityId: string | string[], category?: string, inverted?: boolean) {
    if (!category || (category && this.amenityCategories[category])) {
      this.onRemoveAmenityFilter(amenityId, category, inverted);
    } else {
      throw new Error(
        `It seems there is no '${category}' amenities category created, please set category with 'setAmenitiesCategory()' method`,
      );
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
  public resetAmenityFilters() {
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
  public setAmenitiesCategory(id: string, amenities: string[]) {
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
  public removeAmenitiesCategory(id: string) {
    if (this.amenityCategories[id]) {
      delete this.amenityCategories[id];
    } else {
      throw new Error(
        `It seems there is no '${id}' amenities category created, please set category with 'setAmenitiesCategory()' method`,
      );
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
  public resetAmenitiesCategory() {
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
  public getPolygonClickListener() {
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
  public getPoiClickListener() {
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
  public setPerson(lat: number, lng: number, level: number, id?: string | number) {
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
  public upsertPerson(lat: number, lng: number, level: number, id?: string | number) {
    const person = id ? this.state.persons.find((p) => p.id === id) : null;
    if (person) {
      this.onUpdatePerson(person, lat, lng, level);
    } else {
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
  public getPersonUpdateListener() {
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
  public toggleHiddenPois() {
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
  public toggleRasterFloorplans() {
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
  public setFeaturesHighlight(
    features: string[],
    color?: string,
    radius?: number,
    blur?: number,
    enlargeIcon?: boolean,
    opacity?: number,
    translate?: [number, number],
  ) {
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
  public refetch() {
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
  public restartRouteAnimation({ delay, recenter }: { delay: number; recenter?: boolean }) {
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
  public stopRouteAnimation(keepRoute?: boolean) {
    this.onStopRouteAnimation(keepRoute);
  }
}
/* TODO
 * - check clusters
 * */
