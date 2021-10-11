import * as mapboxgl from 'mapbox-gl';
import Repository from '../../controllers/repository';
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
import { getBase64FromImage, getImageFromBase64, uuidv4 } from '../../common';
import { chevron, pulsingDot, person as personIcon } from './icons';
import { MapboxEvent } from 'mapbox-gl';
import { getPlaceFloors } from '../../controllers/floors';
import { getPlaceById } from '../../controllers/places';
import { Subject } from 'rxjs';
import * as turf from '@turf/turf';
// @ts-ignore
import * as tingle from 'tingle.js/dist/tingle';
// @ts-ignore
import * as TBTNav from '../../../assets/tbtnav';
import { EDIT_FEATURE_DIALOG, NEW_FEATURE_DIALOG } from './constants';
import { MapboxOptions } from '../../models/mapbox-options';
import { PolygonIconsLayer, PolygonsLayer, PolygonTitlesLayer } from './custom-layers';
import PersonModel from '../../models/person';

interface State {
  readonly initializing: boolean;
  readonly floor: FloorModel;
  readonly floors: FloorModel[];
  readonly place: PlaceModel;
  readonly places: PlaceModel[];
  readonly style: StyleModel;
  readonly styles: StyleModel[];
  readonly amenities: AmenityModel[];
  readonly features: FeatureCollection;
  readonly dynamicFeatures: FeatureCollection;
  readonly allFeatures: FeatureCollection;
  readonly latitude: number;
  readonly longitude: number;
  readonly zoom?: number;
  readonly loadingRoute: boolean;
  readonly noPlaces: boolean;
  readonly textNavigation: any;
  readonly persons: PersonModel[];
}

interface Options {
  selector?: string;
  allowNewFeatureModal?: boolean;
  newFeatureModalEvent?: string;
  enableTBTNavigation?: boolean;
  mapboxOptions?: MapboxOptions;
  zoomIntoPlace?: boolean;
  defaultPlaceId?: string;
  isKiosk?: boolean;
  kioskSettings?: {
    coordinates: [number, number];
    level: number;
  };
  initPolygons?: boolean;
}

export const globalState: State = {
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
};

export class Map {
  private map: mapboxgl.Map;
  private state;
  private geojsonSource: GeoJSONSource = new GeoJSONSource(new FeatureCollection({}));
  private syntheticSource: SyntheticSource = new SyntheticSource(new FeatureCollection({}));
  private routingSource: RoutingSource = new RoutingSource();
  private clusterSource: ClusterSource = new ClusterSource();
  private imageSourceManager: ImageSourceManager = new ImageSourceManager();
  private onMapReadyListener = new Subject<boolean>();
  private onPlaceSelectListener = new Subject<PlaceModel>();
  private onFloorSelectListener = new Subject<FloorModel>();
  private onRouteFoundListener = new Subject<any>();
  private onRouteFailedListener = new Subject();
  private onRouteCancelListener = new Subject();
  private onFeatureAddListener = new Subject<Feature>();
  private onFeatureUpdateListener = new Subject<Feature>();
  private onFeatureDeleteListener = new Subject();
  private onPolygonClickListener = new Subject<Feature>();
  private onPersonUpdateListener = new Subject<PersonModel[]>();
  private defaultOptions: Options = {
    selector: 'proximiioMap',
    allowNewFeatureModal: false,
    newFeatureModalEvent: 'click',
    enableTBTNavigation: true,
    zoomIntoPlace: true,
    isKiosk: false,
    initPolygons: false,
  };
  private routeFactory: any;
  private startPoint?: Feature;
  private endPoint?: Feature;
  private showStartPoint = false;
  private amenityIds: string[] = [];
  private filteredAmenities: string[] = [];
  private amenityFilters: string[] = [];
  private amenityCategories: any = {};
  private hoveredPolygon: any;
  private selectedPolygon: any;

  constructor(options: Options) {
    // fix centering in case of kiosk with defined pitch/bearing/etc. in mapbox options
    if (options.isKiosk && options.mapboxOptions && options.kioskSettings && !options.mapboxOptions.center) {
      options.mapboxOptions.center = options.kioskSettings.coordinates;
    }

    this.defaultOptions = { ...this.defaultOptions, ...options };
    this.state = globalState;

    this.onSourceChange = this.onSourceChange.bind(this);
    this.onSyntheticChange = this.onSyntheticChange.bind(this);
    this.onStyleChange = this.onStyleChange.bind(this);
    this.onStyleSelect = this.onStyleSelect.bind(this);
    this.onRouteUpdate = this.onRouteUpdate.bind(this);
    this.onRouteChange = this.onRouteChange.bind(this);
    this.onRouteCancel = this.onRouteCancel.bind(this);

    this.map = new mapboxgl.Map({
      ...this.defaultOptions.mapboxOptions,
      container: this.defaultOptions.selector ? this.defaultOptions.selector : 'map',
    });
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
    const { places, style, styles, features, amenities } = await Repository.getPackage(
      this.defaultOptions.initPolygons,
    );
    const defaultPlace = places.find((p) => p.id === this.defaultOptions.defaultPlaceId);
    const place = places.length > 0 ? (defaultPlace ? defaultPlace : places[0]) : new PlaceModel({});
    const center = this.defaultOptions.mapboxOptions?.center
      ? (this.defaultOptions.mapboxOptions.center as any)
      : this.defaultOptions.isKiosk
      ? this.defaultOptions.kioskSettings?.coordinates
      : [place.location.lng, place.location.lat];
    style.center = center;
    this.geojsonSource.fetch(features);
    this.routingSource.routing.setData(new FeatureCollection(features));
    this.prepareStyle(style);
    this.imageSourceManager.belowLayer = style.usesPrefixes() ? 'proximiio-floors' : 'floors';
    this.imageSourceManager.initialize();
    this.state = {
      ...this.state,
      initializing: false,
      place,
      places,
      style,
      styles,
      amenities,
      features,
      allFeatures: new FeatureCollection(features),
      latitude: center[1],
      longitude: center[0],
      zoom: this.defaultOptions.mapboxOptions?.zoom,
      noPlaces: places.length === 0,
    };
    style.on(this.onStyleChange);
    this.map.setStyle(this.state.style);
    this.map.on('load', (e) => {
      this.onMapReady(e);
    });
    if (this.defaultOptions.allowNewFeatureModal) {
      this.map.on(
        this.defaultOptions.newFeatureModalEvent ? this.defaultOptions.newFeatureModalEvent : 'dblclick',
        (e: MapboxEvent | any) => {
          this.featureDialog(e);
        },
      );
    }
    if (this.defaultOptions.enableTBTNavigation) {
      this.routeFactory = new TBTNav.RouteFactory(JSON.stringify(this.state.allFeatures.features), 'en');
    }
  }

  private async onMapReady(e: MapboxEvent) {
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
      map.setMaxZoom(30);
      const decodedChevron = await getImageFromBase64(chevron);
      const decodedPersonIcon = await getImageFromBase64(personIcon);
      map.addImage('chevron_right', decodedChevron as any);
      map.addImage('pulsing-dot', pulsingDot, { pixelRatio: 2 });
      map.addImage('person', decodedPersonIcon as any);
      this.onSourceChange();
      this.updateMapSource(this.geojsonSource);
      this.updateMapSource(this.routingSource);
      this.updateCluster();
      this.updateImages();
      this.filteredAmenities = this.amenityIds;
      this.imageSourceManager.setLevel(map, this.state.floor?.level);
      await this.onPlaceSelect(this.state.place, this.defaultOptions.zoomIntoPlace);
      if (this.defaultOptions.initPolygons) {
        this.initPolygons();
      }
      if (this.defaultOptions.isKiosk) {
        this.initKiosk();
      }
      this.initPersonsMap();
      this.onMapReadyListener.next(true);
    }
  }

  private initKiosk() {
    if (this.map) {
      this.showStartPoint = false;
      if (this.defaultOptions.kioskSettings) {
        this.startPoint = turf.point(this.defaultOptions.kioskSettings.coordinates, {
          level: this.defaultOptions.kioskSettings.level,
        }) as Feature;
        this.showStartPoint = true;
        this.state.style.addSource('my-location', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [this.startPoint as any],
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
  }

  private onSetKiosk(lat: number, lng: number, level: number) {
    if (this.map && this.defaultOptions.isKiosk) {
      this.defaultOptions.kioskSettings = {
        coordinates: [lng, lat],
        level,
      };
      this.startPoint = turf.point(this.defaultOptions.kioskSettings.coordinates, {
        level: this.defaultOptions.kioskSettings.level,
      }) as Feature;
      this.state.style.sources['my-location'].data = {
        type: 'FeatureCollection',
        features: [this.startPoint as any],
      };
      this.map.setFilter('my-location-layer', ['all', ['==', ['to-number', ['get', 'level']], level]]);
      this.map.setStyle(this.state.style);
      this.centerOnPoi(this.startPoint);
    }
  }

  private initPolygons() {
    if (this.map) {
      PolygonsLayer.setFilterLevel(this.state.floor.level);
      this.state.style.addLayer(PolygonsLayer.json);

      PolygonIconsLayer.setFilterLevel(this.state.floor.level);
      this.state.style.addLayer(PolygonIconsLayer.json);

      PolygonTitlesLayer.setFilterLevel(this.state.floor.level);
      this.state.style.addLayer(PolygonTitlesLayer.json);

      this.map.setStyle(this.state.style);

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

  private onShopClick(
    e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] | undefined } & mapboxgl.EventData,
  ) {
    if (e.features && e.features[0] && e.features[0].properties) {
      // @ts-ignore
      const poi = this.state.allFeatures.features.find(
        (i) => i.properties.id === e.features[0].properties.poi_id,
      ) as Feature;
      this.onPolygonClickListener.next(poi);
    }
  }

  handlePolygonSelection(poi?: Feature) {
    const connectedPolygonId = poi && poi.properties.metadata ? poi.properties.metadata.polygon_id : null;
    if (this.selectedPolygon) {
      this.map.setFeatureState(
        {
          source: 'main',
          id: this.selectedPolygon.id,
        },
        {
          selected: false,
        },
      );
      if (this.selectedPolygon.properties.label_id) {
        this.map.setFeatureState(
          {
            source: 'main',
            id: this.selectedPolygon.properties.label_id,
          },
          {
            selected: false,
          },
        );
      }
    }
    if (connectedPolygonId) {
      this.selectedPolygon = this.state.allFeatures.features.find((i) => i.properties.id === connectedPolygonId);
      this.map.setFeatureState(
        {
          source: 'main',
          id: this.selectedPolygon.id,
        },
        {
          selected: true,
        },
      );
      if (this.selectedPolygon.properties.label_id) {
        this.map.setFeatureState(
          {
            source: 'main',
            id: this.selectedPolygon.properties.label_id,
          },
          {
            selected: true,
          },
        );
      }
    }
  }

  private onShopMouseEnter() {
    this.map.getCanvas().style.cursor = 'pointer';
  }

  private onShopMouseMove(
    e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] | undefined } & mapboxgl.EventData,
  ) {
    if (e.features && e.features.length > 0) {
      if (this.hoveredPolygon) {
        this.map.setFeatureState(
          {
            source: 'main',
            id: this.hoveredPolygon.id,
          },
          {
            hover: false,
          },
        );
        if (this.hoveredPolygon.properties.label_id) {
          this.map.setFeatureState(
            {
              source: 'main',
              id: this.hoveredPolygon.properties.label_id,
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
          id: this.hoveredPolygon.id,
        },
        {
          hover: true,
        },
      );
      if (this.hoveredPolygon.properties.label_id) {
        this.map.setFeatureState(
          {
            source: 'main',
            id: this.hoveredPolygon.properties.label_id,
          },
          {
            hover: true,
          },
        );
      }
    }
  }

  private onShopMouseLeave(
    e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] | undefined } & mapboxgl.EventData,
  ) {
    this.map.getCanvas().style.cursor = '';
    if (this.hoveredPolygon) {
      this.map.setFeatureState(
        {
          source: 'main',
          id: this.hoveredPolygon.id,
        },
        {
          hover: false,
        },
      );
      if (this.hoveredPolygon.properties.label_id) {
        this.map.setFeatureState(
          {
            source: 'main',
            id: this.hoveredPolygon.properties.label_id,
          },
          {
            hover: false,
          },
        );
      }
    }
    this.hoveredPolygon = null;
  }

  private featureDialog(e: any) {
    const features = this.map.queryRenderedFeatures(e.point, { layers: ['proximiio-pois-icons'] });
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
  ) {
    const featureId = id ? id : uuidv4();
    if (this.state.allFeatures.features.findIndex((f) => f.id === featureId || f.properties.id === featureId) > 0) {
      console.error(`Create feature failed: Feature with id '${featureId}' already exists!`);
      throw new Error(`Create feature failed: Feature with id '${featureId}' already exists!`);
    }
    const feature = new Feature({
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
      },
    });
    if (icon && icon.length > 0) {
      const decodedIcon = await getImageFromBase64(icon);
      this.map.addImage(featureId, decodedIcon as any);
    }

    this.state.dynamicFeatures.features.push(feature);
    // this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features];
    this.geojsonSource.create(feature);
    // this.onSourceChange();
    // this.routingSource.routing.setData(this.state.allFeatures);
    // this.updateMapSource(this.routingSource);
    this.onFeaturesChange();
    this.onFeatureAddListener.next(feature);
    return feature;
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
  ) {
    const foundFeature = this.state.allFeatures.features.find((f) => f.id === id || f.properties.id === id);
    if (!foundFeature) {
      console.error(`Update feature failed: Feature with id '${id}' has not been found!`);
      throw new Error(`Update feature failed: Feature with id '${id}' has not been found!`);
    }
    const feature = new Feature(foundFeature);
    feature.geometry.coordinates = [
      lng ? lng : feature.geometry.coordinates[0],
      lat ? lat : feature.geometry.coordinates[1],
    ];
    feature.properties = {
      ...feature.properties,
      title: title ? title : feature.properties.title,
      level: level ? level : feature.properties.level,
      amenity: icon ? id : feature.properties.amenity,
      images: icon ? [icon] : feature.properties.images,
      place_id: placeId ? placeId : feature.properties.place_id,
      floor_id: floorId ? floorId : feature.properties.floor_id,
    };

    if (icon && icon.length > 0) {
      const decodedIcon = await getImageFromBase64(icon);
      this.map.addImage(id, decodedIcon as any);
    }

    const dynamicIndex = this.state.dynamicFeatures.features.findIndex(
      (x) => x.id === feature.id || x.properties.id === feature.id,
    );
    this.state.dynamicFeatures.features[dynamicIndex] = feature;
    // this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features]; // this is not probably updated with non dynamic feature update TODO
    this.geojsonSource.update(feature);
    // this.onSourceChange();
    // this.routingSource.routing.setData(this.state.allFeatures);
    // this.updateMapSource(this.routingSource);
    this.onFeaturesChange();
    this.onFeatureUpdateListener.next(feature);
    return feature;
  }

  private async onDeleteFeature(id: string) {
    const foundFeature = this.state.allFeatures.features.find((f) => f.id === id || f.properties.id === id);
    if (!foundFeature) {
      console.error(`Deleting feature failed: Feature with id '${id}' has not been found!`);
      throw new Error(`Deleting feature failed: Feature with id '${id}' has not been found!`);
    }

    const dynamicIndex = this.state.dynamicFeatures.features.findIndex((x) => x.id === id || x.properties.id === id);
    this.state.dynamicFeatures.features.splice(dynamicIndex, 1);
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
    this.onSourceChange();
    this.routingSource.routing.setData(this.state.allFeatures);
    this.updateMapSource(this.routingSource);
    if (this.defaultOptions.enableTBTNavigation) {
      this.routeFactory = new TBTNav.RouteFactory(JSON.stringify(this.state.allFeatures.features), 'en');
    }
  }

  private onSetAmenityFilter(amenityId: string, category?: string) {
    if (category) {
      this.amenityCategories[category].active = true;
      this.amenityCategories[category].activeId = amenityId;
      let amenities: string[] = [];
      for (const key in this.amenityCategories) {
        if (this.amenityCategories.hasOwnProperty(key)) {
          const cat = this.amenityCategories[key];
          if (cat.active) {
            amenities = amenities.concat(cat.amenities.filter((i: string) => i !== cat.activeId));
          }
        }
      }
      this.amenityFilters = this.amenityIds.filter((el) => !amenities.includes(el));
    } else {
      if (this.amenityFilters.findIndex((i) => i === amenityId) === -1) {
        this.amenityFilters.push(amenityId);
      }
    }
    this.filteredAmenities = this.amenityFilters;
    this.filterOutFeatures();
  }

  private onRemoveAmenityFilter(amenityId: string, category?: string) {
    if (
      category &&
      this.amenityCategories[category].active &&
      this.amenityCategories[category].activeId === amenityId
    ) {
      const amenities = this.amenityCategories[category].amenities.filter((i: string) => i !== amenityId);
      this.amenityFilters = this.amenityFilters.concat(amenities);
      this.amenityCategories[category].active = false;
    } else if (!category) {
      this.amenityFilters = this.amenityFilters.filter((i) => i !== amenityId);
    }
    this.filteredAmenities = this.amenityFilters.length > 0 ? this.amenityFilters : this.amenityIds;
    this.filterOutFeatures();
  }

  private onResetAmenityFilters() {
    this.amenityFilters = [];
    for (const key in this.amenityCategories) {
      if (this.amenityCategories.hasOwnProperty(key)) {
        this.amenityCategories[key].active = false;
      }
    }
    this.filteredAmenities = this.amenityIds;
    this.filterOutFeatures();
  }

  private filterOutFeatures() {
    // proximiio-pois-icons, proximiio-pois-labels
    const layers = ['proximiio-pois-icons', 'proximiio-pois-labels'];
    if (this.defaultOptions.initPolygons) {
      layers.push('poi-custom-icons', 'shop-labels');
    }
    layers.forEach((layer) => {
      if (this.map.getLayer(layer)) {
        setTimeout(() => {
          const l = this.map.getLayer(layer) as any;
          const filters = [...l.filter];
          const amenityFilter = filters.findIndex((f) => f[1][1] === 'amenity');
          if (amenityFilter !== -1) {
            filters[amenityFilter] = [
              'match',
              ['get', 'amenity'],
              this.filteredAmenities ? this.filteredAmenities : ['undefined'],
              true,
              false,
            ];
          } else {
            filters.push([
              'match',
              ['get', 'amenity'],
              this.filteredAmenities ? this.filteredAmenities : ['undefined'],
              true,
              false,
            ]);
          }
          this.state.style.getLayer(layer).filter = filters;
          this.map.setFilter(layer, filters);
        });
      }
    });
    this.state.style.notify('filter-change');
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
      return turf.point([person.lng, person.lat], {
        level: person.level,
      }) as Feature;
    });
    this.state.style.sources['persons-source'].data = {
      type: 'FeatureCollection',
      features: personsCollection,
    };
    this.map.setStyle(this.state.style);
    this.onPersonUpdateListener.next(this.state.persons);
  }

  private prepareStyle(style: StyleModel) {
    style.setSource('main', this.geojsonSource);
    style.setSource('synthetic', this.syntheticSource);
    style.setSource('route', this.routingSource);
    style.setSource('clusters', this.clusterSource);
    style.setLevel(0);
  }

  private onRouteChange(event?: string) {
    if (event === 'loading-start') {
      this.state = { ...this.state, loadingRoute: true };
      return;
    }

    if (event === 'loading-finished') {
      if (this.routingSource.route) {
        const routeStart = this.routingSource.lines.find(
          (l) => +l.properties.level === this.routingSource.start?.properties.level,
        );
        const textNavigation = this.routeFactory.generateRoute(
          JSON.stringify(this.routingSource.points),
          JSON.stringify(this.endPoint),
        );
        this.centerOnRoute(routeStart);
        this.state = { ...this.state, loadingRoute: false, textNavigation };
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
    this.state = { ...this.state, style: this.state.style };
  }

  private onRasterToggle(value: boolean) {
    this.imageSourceManager.enabled = value;
    const map = this.map;
    if (map) {
      this.imageSourceManager.setLevel(map, this.state.floor.level);
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
    const floors = await getPlaceFloors(place.id);
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

  private onFloorSelect(floor: FloorModel) {
    const map = this.map;
    const route =
      this.routingSource.route && this.routingSource.route[floor.level] ? this.routingSource.route[floor.level] : null;
    if (map) {
      this.state.style.setLevel(floor.level);
      map.setStyle(this.state.style);
      setTimeout(() => {
        [...this.state.style.getLayers('main'), ...this.state.style.getLayers('route')].forEach((layer) => {
          if (map.getLayer(layer.id)) {
            map.setFilter(layer.id, layer.filter);
          }
        });
        this.imageSourceManager.setLevel(map, floor.level);
      });
      if (route) {
        const bbox = turf.bbox(route.geometry);
        // @ts-ignore;
        map.fitBounds(bbox, { padding: 250, bearing: this.map.getBearing(), pitch: this.map.getPitch() });
      }
      if (this.defaultOptions.isKiosk && map.getLayer('my-location-layer')) {
        const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
        map.setFilter('my-location-layer', filter);
        this.state.style.getLayer('my-location-layer').filter = filter;
      }
      if (map.getLayer('persons-layer')) {
        const filter = ['all', ['==', ['to-number', ['get', 'level']], floor.level]];
        map.setFilter('persons-layer', filter);
        this.state.style.getLayer('persons-layer').filter = filter;
      }
    }
    this.state = { ...this.state, floor, style: this.state.style };
    this.updateCluster();
    this.onFloorSelectListener.next(floor);
  }

  private onRouteUpdate(start?: Feature, finish?: Feature) {
    this.startPoint = start;
    this.endPoint = finish;
    try {
      if (finish && this.defaultOptions.initPolygons) {
        this.handlePolygonSelection(finish);
      }
      this.routingSource.update(start, finish);
    } catch (e) {
      console.log('catched', e);
    }
    this.state = { ...this.state, style: this.state.style };
  }

  private onRouteCancel() {
    this.state = { ...this.state, textNavigation: null };
    if (this.defaultOptions.initPolygons) {
      this.handlePolygonSelection();
    }
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
        const bbox = turf.bbox(route.geometry);
        // @ts-ignore
        this.map.fitBounds(bbox, { padding: 250, bearing: this.map.getBearing(), pitch: this.map.getPitch() });
      }
    }
  }

  private centerOnCoords(lat: number, lng: number, zoom?: number) {
    if (this.map) {
      this.map.flyTo({ center: [lng, lat], zoom: zoom ? zoom : 18 });
    }
  }

  private updateImages() {
    this.state.amenities
      .filter((a) => a.icon)
      .forEach((amenity) => {
        this.amenityIds.push(amenity.id);
        this.map.loadImage(amenity.icon, (error: any, image: any) => {
          if (error) throw error;
          this.map.addImage(amenity.id, image);
        });
      });
  }

  private getUpcomingFloorNumber(way: string) {
    if (this.routingSource.lines && this.routingSource.route) {
      const currentRouteIndex = this.routingSource.lines.findIndex(
        (route) => +route.properties.level === this.state.floor.level,
      );
      const currentRoute = this.routingSource.lines[currentRouteIndex];
      const nextRouteIndex = way === 'up' ? currentRouteIndex + 1 : currentRouteIndex - 1;
      const nextRoute = this.routingSource.lines[nextRouteIndex];
      // return currentRouteIndex !== -1 && nextRoute ? +nextRoute.properties.level : way === 'up' ? this.state.floor.level + 1 : this.state.floor.level - 1;
      return nextRoute ? +nextRoute.properties.level : this.state.floor.level;
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
  public getMapboxInstance() {
    return this.map;
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
    return this.onMapReadyListener.asObservable();
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
    const place = await getPlaceById(placeId);
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
    return this.onPlaceSelectListener.asObservable();
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
    return this.onFloorSelectListener.asObservable();
  }

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
  public findRouteByIds(idTo: string, idFrom?: string, accessibleRoute?: boolean) {
    const fromFeature = this.defaultOptions.isKiosk
      ? this.startPoint
      : (this.state.allFeatures.features.find((f) => f.id === idFrom || f.properties.id === idFrom) as Feature);
    const toFeature = this.state.allFeatures.features.find((f) => f.id === idTo || f.properties.id === idTo) as Feature;
    this.routingSource.toggleAccessible(accessibleRoute);
    this.onRouteUpdate(fromFeature, toFeature);
  }

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
  public findRouteByTitle(titleTo: string, titleFrom?: string, accessibleRoute?: boolean) {
    const fromFeature = this.defaultOptions.isKiosk
      ? this.startPoint
      : (this.state.allFeatures.features.find((f) => f.properties.title === titleFrom) as Feature);
    const toFeature = this.state.allFeatures.features.find((f) => f.properties.title === titleTo) as Feature;
    this.routingSource.toggleAccessible(accessibleRoute);
    this.onRouteUpdate(this.defaultOptions.isKiosk ? this.startPoint : fromFeature, toFeature);
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
  ) {
    const fromFeature = this.defaultOptions.isKiosk
      ? this.startPoint
      : (turf.feature({ type: 'Point', coordinates: [lngFrom, latFrom] }, { level: levelFrom }) as Feature);
    const toFeature = turf.feature({ type: 'Point', coordinates: [lngTo, latTo] }, { level: levelTo }) as Feature;
    this.routingSource.toggleAccessible(accessibleRoute);
    this.onRouteUpdate(this.defaultOptions.isKiosk ? this.startPoint : fromFeature, toFeature);
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
    return this.onRouteFoundListener.asObservable();
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
    return this.onRouteFailedListener.asObservable();
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
    return this.onRouteCancelListener.asObservable();
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
    if (
      this.routingSource &&
      this.routingSource.route &&
      this.routingSource.route[this.routingSource.start?.properties.level]
    ) {
      const routeStart = this.routingSource.route[this.routingSource.start?.properties.level] as Feature;
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
    const feature = this.state.allFeatures.features.find(
      (f) => f.id === featureId || f.properties.id === featureId,
    ) as Feature;
    if (feature) {
      this.centerOnPoi(feature);
      return feature;
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
  ) {
    return await this.onAddNewFeature(title, +level, +lat, +lng, icon, id, placeId, floorId);
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
  ) {
    return await this.onUpdateFeature(id, title, level, lat, lng, icon, placeId, floorId);
  }

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
  public deleteFeature(id: string) {
    return this.onDeleteFeature(id);
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
    return this.onFeatureAddListener.asObservable();
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
    return this.onFeatureUpdateListener.asObservable();
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
    return this.onFeatureDeleteListener.asObservable();
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
  public setAmenityFilter(amenityId: string, category?: string) {
    if (!category || (category && this.amenityCategories[category])) {
      this.onSetAmenityFilter(amenityId, category);
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
   *  @param amenityId {string} remove the filter for a defined amenityId
   *  @param category {string} id of the amenities category added via setAmenitiesCategory, optional, if defined filtering will be removed only for defined array of amenities in same method
   *  @example
   *  const map = new Proximiio.Map();
   *  map.getMapReadyListener().subscribe(ready => {
   *    console.log('map ready', ready);
   *    map.removeAmenityFilter('myamenity');
   *  });
   */
  public removeAmenityFilter(amenityId: string, category?: string) {
    if (!category || (category && this.amenityCategories[category])) {
      this.onRemoveAmenityFilter(amenityId, category);
    } else {
      throw new Error(
        `It seems there is no '${category}' amenities category created, please set category with 'setAmenitiesCategory()' method`,
      );
    }
  }

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
    return this.onPolygonClickListener.asObservable();
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
    return this.onPersonUpdateListener.asObservable();
  }
}

/* TODO
 * - check clusters
 * */
