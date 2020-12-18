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
import { chevron, defaultIcon } from './icons';
import { MapboxEvent } from 'mapbox-gl';
import { getPlaceFloors } from '../../controllers/floors';
import { getPlaceById } from '../../controllers/places';
import { Subject } from 'rxjs';
import * as turf from '@turf/turf';
// @ts-ignore
import * as tingle from "tingle.js/dist/tingle";

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
  readonly latitude: number;
  readonly longitude: number;
  readonly loadingRoute: boolean;
  readonly noPlaces: boolean;
}

interface Options {
  selector: string;
  allowNewFeatures?: boolean;
  newFeatureEvent: string;
}

export class Map {
  private map: mapboxgl.Map;
  private state: State;
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
  private defaultOptions: Options = {
    selector: 'proximiioMap',
    allowNewFeatures: false,
    newFeatureEvent: 'click'
  }
  constructor(options: Options) {
    this.defaultOptions = {...this.defaultOptions, ...options}
    this.state = {
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
      latitude: 60.1669635,
      longitude: 24.9217484,
      loadingRoute: false,
      noPlaces: false
    };

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
      latitude: place.location.lat,
      longitude: place.location.lng,
      noPlaces: places.length === 0
    };
    style.on(this.onStyleChange);
    this.map.setStyle(this.state.style);
    this.map.on('load', (e) => {
      this.onMapReady(e);
    });
    if (this.defaultOptions.allowNewFeatures) {
      this.map.on(this.defaultOptions.newFeatureEvent, (e: MapboxEvent) => {
        this.newFeatureDialog(e)
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

  private newFeatureDialog(e: any) {
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
    modal.setContent(`
      <h1>Modal Header</h1>
      <form name="form" id="modal-form">
        <label>Title*</label>
        <input type="text" name="title" required>
        
        <label>Level*</label>
        <input type="number" name="level" value='${this.state.floor?.level ? this.state.floor.level : 0}' required>
        
        <label>Latitude*</label>
        <input type="number" name="lat" value='${e.lngLat.lat}' required>
        
        <label>Longitude*</label>
        <input type="number" name="lng" value='${e.lngLat.lng}' required>
        
        <label>Icon</label>
        <input type="file" name="icon">
      </form>
    `);

    modal.addFooterBtn('Submit', 'tingle-btn tingle-btn--primary', async () => {
      const id = uuidv4();
      const formData = new FormData((document.querySelector('#modal-form')) as HTMLFormElement)
      const data = {
        title: formData.get('title'),
        level: formData.get('level'),
        lat: formData.get('lat'),
        lng: formData.get('lng'),
        icon: (formData.get('icon') as File).size ? await getBase64FromImage(formData.get('icon') as File) : defaultIcon
      }
      if (data.title && data.level && data.lat && data.lng) {
        const feature = new Feature({
          type: 'Feature',
          id,
          geometry: new Geometry({
            type: 'Point',
            coordinates: [+data.lng!, +data.lat!]
          }),
          properties: {
            type: 'poi',
            usecase: 'poi',
            id,
            minzoom: 15,
            visibility: 'visible',
            amenity: 'default',
            title: data.title,
            level: +data.level!,
            images: [data.icon]
          }
        })
        this.onAddNewFeature(feature);
        modal.close();
      } else {
        alert('Please fill all the required fields!');
      }
    });

    modal.addFooterBtn('Cancel', 'tingle-btn tingle-btn--danger', () => {
      modal.close();
    });

    modal.open();
  }

  private onAddNewFeature(feature: Feature) {
    this.state.dynamicFeatures.features.push(feature)
    this.geojsonSource.create(feature);
    this.onSourceChange();
    const featureCollection = new FeatureCollection({ features: [...this.state.features.features, ...this.state.dynamicFeatures.features] })
    this.routingSource.routing.setData(featureCollection);
    this.updateMapSource(this.routingSource);
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
    const fromFeature = this.state.features.features.find(f => f.id === idFrom || f.properties.id === idFrom) as Feature;
    const toFeature = this.state.features.features.find(f => f.id === idTo || f.properties.id === idTo) as Feature;
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
    const fromFeature = this.state.features.features.find(f => f.properties.title === titleFrom) as Feature;
    const toFeature = this.state.features.features.find(f => f.properties.title === titleTo) as Feature;
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
    const feature = this.state.features.features.find(f => f.id === featureId || f.properties.id === featureId) as Feature;
    if (feature) {
      this.centerOnPoi(feature);
      return feature;
    } else {
      throw new Error(`Feature not found`);
    }
  }
}
