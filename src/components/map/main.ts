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
import { chevron } from './icons';
import { MapboxEvent } from 'mapbox-gl';
import { getPlaceFloors } from '../../controllers/floors';
import { getPlaceById } from '../../controllers/places';
import { Subject } from 'rxjs';
import * as turf from '@turf/turf';
// @ts-ignore
import * as tingle from "tingle.js/dist/tingle";
import { EDIT_FEATURE_DIALOG, NEW_FEATURE_DIALOG } from './constants';

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
  readonly loadingRoute: boolean;
  readonly noPlaces: boolean;
}

interface Options {
  selector: string;
  allowNewFeatureModal?: boolean;
  newFeatureModalEvent: string;
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
  latitude: 60.1669635,
  longitude: 24.9217484,
  loadingRoute: false,
  noPlaces: false
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
  private onRouteFoundListener = new Subject();
  private onRouteFailedListener = new Subject();
  private onRouteCancelListener = new Subject();
  private onFeatureAddListener = new Subject<Feature>();
  private onFeatureUpdateListener = new Subject<Feature>();
  private onFeatureDeleteListener = new Subject();
  private defaultOptions: Options = {
    selector: 'proximiioMap',
    allowNewFeatureModal: false,
    newFeatureModalEvent: 'click'
  }
  constructor(options: Options) {
    this.defaultOptions = {...this.defaultOptions, ...options}
    this.state = globalState;

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
    this.initialize()
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
    const { places, style, styles, features, amenities } = await Repository.getPackage();
    const place = places.length > 0 ? places[0] : new PlaceModel({});
    style.center = [place.location.lng, place.location.lat];
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
      latitude: place.location.lat,
      longitude: place.location.lng,
      noPlaces: places.length === 0
    };
    style.on(this.onStyleChange);
    this.map.setStyle(this.state.style);
    this.map.on('load', (e) => {
      this.onMapReady(e);
    });
    if (this.defaultOptions.allowNewFeatureModal) {
      this.map.on(this.defaultOptions.newFeatureModalEvent, (e: MapboxEvent | any) => {
        this.featureDialog(e)
      });
    }
  }

  private async onMapReady(e: MapboxEvent) {
    // set paths visible if available
    const map = e.target;
    if (map) {
      this.state.style?.togglePaths(true);
      // routing layers
      const routingLayer = map.getLayer('routing-line-completed');
      const usePrefixed = typeof routingLayer === 'undefined' && typeof map.getLayer('proximiio-routing-line-completed') !== 'undefined';
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
      map.addImage('chevron_right', decodedChevron as any);
      this.onSourceChange();
      this.updateMapSource(this.geojsonSource);
      this.updateMapSource(this.routingSource);
      this.updateCluster();
      this.updateImages();
      this.imageSourceManager.setLevel(map, this.state.floor?.level);
      await this.onPlaceSelect(this.state.place);
      this.onMapReadyListener.next(true);
    }
  }

  private featureDialog(e: any) {
    const features = this.map.queryRenderedFeatures(e.point, { layers: ['proximiio-pois-icons'] });
    const edit = features.length > 0;
    const modal = new tingle.modal({
      footer: true,
      stickyFooter: false,
      closeMethods: ['overlay', 'button', 'escape'],
      closeLabel: "Close",
      onClose: () => {
        modal.destroy();
      }
    });

    // set content
    modal.setContent(edit ? EDIT_FEATURE_DIALOG(e, features[0]) : NEW_FEATURE_DIALOG(e, this.state.floor?.level));

    modal.addFooterBtn('Submit', 'tingle-btn tingle-btn--primary', async () => {
      const formData = new FormData((document.querySelector('#modal-form')) as HTMLFormElement)
      const data = {
        id: `${formData.get('id')}`,
        title: `${formData.get('title')}`,
        level: formData.get('level'),
        lat: formData.get('lat'),
        lng: formData.get('lng'),
        icon: (formData.get('icon') as File).size ? await getBase64FromImage(formData.get('icon') as File) : undefined
      }
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

  private async onAddNewFeature(title: string, level: number, lat: number, lng: number, icon?: string, id?: string, placeId?: string, floorId?: string) {
    const featureId = id ? id : uuidv4();
    if (this.state.allFeatures.features.findIndex(f => f.id === featureId || f.properties.id === featureId) > 0) {
      console.error(`Create feature failed: Feature with id '${featureId}' already exists!`);
      throw new Error(`Create feature failed: Feature with id '${featureId}' already exists!`);
    }
    const feature = new Feature({
      type: 'Feature',
      id: featureId,
      geometry: new Geometry({
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
        title,
        level,
        images: [icon],
        place_id: placeId,
        floor_id: floorId
      }
    })
    if (icon && icon.length > 0) {
      const decodedIcon = await getImageFromBase64(icon);
      this.map.addImage(featureId, decodedIcon as any);
    }

    this.state.dynamicFeatures.features.push(feature)
    this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features];
    this.geojsonSource.create(feature);
    this.onSourceChange();
    this.routingSource.routing.setData(this.state.allFeatures);
    this.updateMapSource(this.routingSource);
    this.onFeatureAddListener.next(feature);
    return feature;
  }

  private async onUpdateFeature(id: string, title?: string, level?: number, lat?: number, lng?: number, icon?: string, placeId?: string, floorId?: string) {
    const foundFeature = this.state.allFeatures.features.find(f => f.id === id || f.properties.id === id);
    if (!foundFeature) {
      console.error(`Update feature failed: Feature with id '${id}' has not been found!`);
      throw new Error(`Update feature failed: Feature with id '${id}' has not been found!`);
    }
    const feature = new Feature(foundFeature);
    feature.geometry.coordinates = [lng ? lng : feature.geometry.coordinates[0], lat ? lat : feature.geometry.coordinates[1]];
    feature.properties = {
      ...feature.properties,
      title: title ? title : feature.properties.title,
      level: level ? level : feature.properties.level,
      amenity: icon ? id : feature.properties.amenity,
      images: icon ? [icon] :  feature.properties.images,
      place_id: placeId ? placeId : feature.properties.place_id,
      floor_id: floorId ? floorId :  feature.properties.floor_id
    }

    if (icon && icon.length > 0) {
      const decodedIcon = await getImageFromBase64(icon);
      this.map.addImage(id, decodedIcon as any);
    }

    const dynamicIndex = this.state.dynamicFeatures.features.findIndex(x => x.id === feature.id || x.properties.id === feature.id);
    this.state.dynamicFeatures.features[dynamicIndex] = feature;
    this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features]; // this is not probably updated with non dynamic feature update TODO
    this.geojsonSource.update(feature);
    this.onSourceChange();
    this.routingSource.routing.setData(this.state.allFeatures);
    this.updateMapSource(this.routingSource);
    this.onFeatureUpdateListener.next(feature);
    return feature;
  }

  private async onDeleteFeature(id: string) {
    const foundFeature = this.state.allFeatures.features.find(f => f.id === id || f.properties.id === id);
    if (!foundFeature) {
      console.error(`Deleting feature failed: Feature with id '${id}' has not been found!`);
      throw new Error(`Deleting feature failed: Feature with id '${id}' has not been found!`);
    }

    const dynamicIndex = this.state.dynamicFeatures.features.findIndex(x => x.id === id || x.properties.id === id);
    this.state.dynamicFeatures.features.splice(dynamicIndex, 1);
    this.state.allFeatures.features = [...this.state.features.features, ...this.state.dynamicFeatures.features]; // this is not probably updated with non dynamic feature delete TODO
    this.geojsonSource.delete(id);
    this.onSourceChange();
    this.routingSource.routing.setData(this.state.allFeatures);
    this.updateMapSource(this.routingSource);
    this.onFeatureDeleteListener.next();
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
      this.state = {...this.state, loadingRoute: true};
      return;
    }

    if (event === 'loading-finished') {
      if (this.routingSource.route) {
        const routeStart = this.routingSource.route[this.routingSource.start?.properties.level];
        this.centerOnRoute(routeStart);
        this.onRouteFoundListener.next();
      }
      this.state = {...this.state, loadingRoute: false};
      return;
    }

    if (event === 'route-undefined') {
      console.log('route not found');
      this.state = {...this.state, loadingRoute: false};
      this.onRouteFailedListener.next();
      return;
    }

    const style = this.state.style;
    style.setSource('route', this.routingSource);
    this.state = {...this.state, style};

    this.updateMapSource(this.routingSource);
  }

  private onSourceChange() {
    this.state = {
      ...this.state,
      style: this.state.style
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

    this.state = {...this.state, style};
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
      const layoutChanges = (changes as any[]).filter(diff => diff.kind === 'E' && diff.path[0] === 'layout');
      const paintChanges = (changes as any[]).filter(diff => diff.kind === 'E' && diff.path[0] === 'paint');
      // tslint:disable-next-line:no-shadowed-variable
      const map = this.map;
      if (map) {
        layoutChanges.forEach(change => {
          if (change.kind === 'E') {
            map.setLayoutProperty(layer.id, change.path[1], change.rhs);
          }
        });
        paintChanges.forEach(change => {
          if (change.kind === 'E') {
            map.setPaintProperty(layer.id, change.path[1], change.rhs);
          }
        });
      }
    }

    if (event === 'filter-change') {
      // tslint:disable-next-line:no-shadowed-variable
      const map = this.map;
      this.state.style.getLayers('main').forEach(layer => {
        if (map.getLayer(layer.id)) {
          map.removeLayer(layer.id);
        }
        // @ts-ignore
        map.addLayer(layer);
      });
    }
    // @ts-ignore
    this.map.setStyle(this.state.style);
    this.state = {...this.state, style: this.state.style};
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
          .filter(f => f.isPoint && f.hasLevel(this.state.floor.level))
          .map(f => f.json)
      } as FeatureCollection;
      const source = map.getSource('clusters') as any;
      if (source) {
        source.setData(data);
      }
    }
  }

  private async onPlaceSelect(place: PlaceModel) {
    this.state = {...this.state, place};
    const floors = await getPlaceFloors(place.id);
    const state: any = { floors: floors.sort((a, b) => a.level - b.level) };

    if (floors.length > 0) {
      const groundFloor = floors.find(floor => floor.level === 0);
      if (groundFloor) {
        state.floor = groundFloor;
      } else {
        state.floor = floors[0];
      }
    }
    this.state = {...this.state, ...state};
    const map = this.map;
    if (map) {
      map.flyTo({ center: [ place.location.lng, place.location.lat ] });
    }
    this.onPlaceSelectListener.next(place);
    this.onFloorSelect(state.floor);
  }

  private onFloorSelect(floor: FloorModel) {
    const map = this.map;
    const route = this.routingSource.route && this.routingSource.route[floor.level] ? this.routingSource.route[floor.level] : null;
    if (map) {
      this.state.style.setLevel(floor.level);
      map.setStyle(this.state.style);
      setTimeout(() => {
        [...this.state.style.getLayers('main'), ...this.state.style.getLayers('route')].forEach(layer => {
          if (map.getLayer(layer.id)) {
            map.setFilter(layer.id, layer.filter);
          }
        });
        this.imageSourceManager.setLevel(map, floor.level);
      });
      if (route) {
        const bbox = turf.bbox(route.geometry);
        // @ts-ignore;
        map.fitBounds(bbox, { padding: 50 });
      }
    }
    this.state = {...this.state, floor, style: this.state.style};
    this.updateCluster();
    this.onFloorSelectListener.next(floor);
  }

  private onRouteUpdate(start?: Feature, finish?: Feature) {
    try {
      this.routingSource.update(start, finish);
    } catch (e) {
      console.log('catched', e);
    }
    this.state = {...this.state, style: this.state.style};
  }

  private onRouteCancel() {
    this.routingSource.cancel();
    this.onRouteCancelListener.next();
  }

  private centerOnPoi(poi: any) {
    if (this.state.floor.level !== parseInt(poi.properties.level, 0)) {
      const floor = this.state.floors.find(f => f.level === poi.properties.level);
      if (floor) this.onFloorSelect(floor);
    }
    if (this.map) {
      this.map.flyTo({ center: poi.geometry.coordinates });
    }
  }

  private centerOnRoute(route: Feature) {
    if (route && route.properties) {
      if (this.state.floor.level !== parseInt(route.properties.level, 0)) {
        const floor = this.state.floors.find(f => f.level === parseInt(route.properties.level, 0));
        if (floor) this.onFloorSelect(floor);
      }
      if (this.map) {
        const bbox = turf.bbox(route.geometry);
        // @ts-ignore
        this.map.fitBounds(bbox, { padding: 50 });
      }
    }
  }

  private updateImages() {
    this.state.amenities
      .filter(a => a.icon)
      .forEach(amenity => {
        this.map.loadImage(amenity.icon, (error: any, image: any) => {
          if (error) throw error;
          this.map.addImage(amenity.id, image);
        })
      });
  }

  private getUpcomingFloorNumber(way: string) {
    if (this.routingSource.lines && this.routingSource.route) {
      const currentRouteIndex = this.routingSource.lines.findIndex(route => +route.properties.level === this.state.floor.level);
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
   *  @returns active place
   *  @example
   *  const map = new Proximiio.Map();
   *  map.getMapReadyListener().subscribe(ready => {
   *    console.log('map ready', ready);
   *    map.setPlace(myPlaceId);
   *  });
   */
  public async setPlace(placeId: string) {
    const place = await getPlaceById(placeId);
    await this.onPlaceSelect(place);
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
    const floor = this.state.floors.filter(f => f.id === floorId) ? this.state.floors.filter(f => f.id === floorId)[0] : this.state.floor;
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
    const floor = this.state.floors.filter(f => f.level === level) ? this.state.floors.filter(f => f.level === level)[0] : this.state.floor;
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
    floor = this.state.floors.filter(f => f.level === nextLevel) ? this.state.floors.filter(f => f.level === nextLevel)[0] : this.state.floor;
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
   *  @param idFrom {string} start feature id
   *  @param idTo {string} finish feature id
   *  @example
   *  const map = new Proximiio.Map();
   *  map.getMapReadyListener().subscribe(ready => {
   *    console.log('map ready', ready);
   *    map.findRouteByIds('startId', 'finishId);
   *  });
   */
  public findRouteByIds(idFrom: string, idTo: string) {
    const fromFeature = this.state.allFeatures.features.find(f => f.id === idFrom || f.properties.id === idFrom) as Feature;
    const toFeature = this.state.allFeatures.features.find(f => f.id === idTo || f.properties.id === idTo) as Feature;
    this.onRouteUpdate(fromFeature, toFeature);
  }

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
  public findRouteByTitle(titleFrom: string, titleTo: string) {
    const fromFeature = this.state.allFeatures.features.find(f => f.properties.title === titleFrom) as Feature;
    const toFeature = this.state.allFeatures.features.find(f => f.properties.title === titleTo) as Feature;
    this.onRouteUpdate(fromFeature, toFeature);
  }

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
  public findRouteByCoords(latFrom: number, lngFrom: number, levelFrom: number, latTo: number, lngTo: number, levelTo: number) {
    const fromFeature = turf.feature(
      { type: 'Point', coordinates: [lngFrom, latFrom] },
      { level: levelFrom }
    ) as Feature;
    const toFeature = turf.feature(
      { type: 'Point', coordinates: [lngTo, latTo] },
      { level: levelTo }
    ) as Feature;
    this.onRouteUpdate(fromFeature, toFeature);
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
   *  @memberof Map
   *  @name getRouteFoundListener
   *  @returns returns route found listener
   *  @example
   *  const map = new Proximiio.Map();
   *  map.getRouteFoundListener().subscribe(() => {
   *    console.log('route found successfully');
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
    if (this.routingSource && this.routingSource.route &&this.routingSource.route[this.routingSource.start?.properties.level]) {
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
   *  @return error {string} in case there is no route or {Feature} otherwise
   *  @example
   *  const map = new Proximiio.Map();
   *  map.getMapReadyListener().subscribe(ready => {
   *    console.log('map ready', ready);
   *    map.centerToFeature('featureId');
   *  });
   */
  public centerToFeature(featureId: string) {
    const feature = this.state.allFeatures.features.find(f => f.id === featureId || f.properties.id === featureId) as Feature;
    if (feature) {
      this.centerOnPoi(feature);
      return feature;
    } else {
      throw new Error(`Feature not found`);
    }
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
  public async addCustomFeature(title: string, level: number, lat: number, lng: number, icon?: string, id?: string, placeId?: string, floorId?: string) {
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
  public async updateFeature(id: string, title?: string, level?: number, lat?: number, lng?: number, icon?: string, placeId?: string, floorId?: string) {
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
}

/* TODO
* - check clusters
* */
