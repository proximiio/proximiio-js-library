import * as mapboxgl from 'mapbox-gl';
import { PlaceModel } from '../../models/place';
import { FloorModel } from '../../models/floor';
import StyleModel from '../../models/style';
import Feature, { FeatureCollection } from '../../models/feature';
import { AmenityModel } from '../../models/amenity';
import { MapboxOptions } from 'mapbox-gl';
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
}
interface Options {
    selector: string;
    allowNewFeatureModal?: boolean;
    newFeatureModalEvent: string;
    enableTBTNavigation?: boolean;
    mapboxOptions?: MapboxOptions;
    zoomIntoPlace?: boolean;
    defaultPlaceId?: string;
}
export declare const globalState: State;
export declare class Map {
    private map;
    private state;
    private geojsonSource;
    private syntheticSource;
    private routingSource;
    private clusterSource;
    private imageSourceManager;
    private onMapReadyListener;
    private onPlaceSelectListener;
    private onFloorSelectListener;
    private onRouteFoundListener;
    private onRouteFailedListener;
    private onRouteCancelListener;
    private onFeatureAddListener;
    private onFeatureUpdateListener;
    private onFeatureDeleteListener;
    private defaultOptions;
    private routeFactory;
    private startPoint?;
    private endPoint?;
    constructor(options: Options);
    private initialize;
    private cancelObservers;
    private fetch;
    private onMapReady;
    private featureDialog;
    private onAddNewFeature;
    private onUpdateFeature;
    private onDeleteFeature;
    private onFeaturesChange;
    private prepareStyle;
    private onRouteChange;
    private onSourceChange;
    private onSyntheticChange;
    private updateMapSource;
    private onStyleSelect;
    private onStyleChange;
    private onRasterToggle;
    private updateCluster;
    private onPlaceSelect;
    private onFloorSelect;
    private onRouteUpdate;
    private onRouteCancel;
    private centerOnPoi;
    private centerOnRoute;
    private centerOnCoords;
    private updateImages;
    private getUpcomingFloorNumber;
    /**
     *  @memberof Map
     *  @name getMapboxInstance
     *  @returns returns mapbox instance
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapboxInstance();
     */
    getMapboxInstance(): mapboxgl.Map;
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
    getMapReadyListener(): import("rxjs").Observable<boolean>;
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
    setPlace(placeId: string): Promise<PlaceModel>;
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
    getPlaceSelectListener(): import("rxjs").Observable<PlaceModel>;
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
    setFloorById(floorId: string): FloorModel;
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
    setFloorByLevel(level: number): FloorModel;
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
    setFloorByWay(way: 'up' | 'down'): FloorModel;
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
    getFloorSelectListener(): import("rxjs").Observable<FloorModel>;
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
    findRouteByIds(idFrom: string, idTo: string): void;
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
    findRouteByTitle(titleFrom: string, titleTo: string): void;
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
    findRouteByCoords(latFrom: number, lngFrom: number, levelFrom: number, latTo: number, lngTo: number, levelTo: number): void;
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
    cancelRoute(): void;
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
    getTBTNav(): any;
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
    getRouteFoundListener(): import("rxjs").Observable<any>;
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
    getRouteFailedListener(): import("rxjs").Observable<unknown>;
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
    getRouteCancelListener(): import("rxjs").Observable<unknown>;
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
    centerToRoute(): Feature;
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
    centerToFeature(featureId: string): Feature;
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
    centerToCoordinates(lat: number, lng: number, zoom?: number): void;
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
    addCustomFeature(title: string, level: number, lat: number, lng: number, icon?: string, id?: string, placeId?: string, floorId?: string): Promise<Feature>;
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
    updateFeature(id: string, title?: string, level?: number, lat?: number, lng?: number, icon?: string, placeId?: string, floorId?: string): Promise<Feature>;
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
    deleteFeature(id: string): Promise<void>;
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
    getCustomFeaturesList(): FeatureCollection;
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
    getFeatureAddListener(): import("rxjs").Observable<Feature>;
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
    getFeatureUpdateListener(): import("rxjs").Observable<Feature>;
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
    getFeatureDeleteListener(): import("rxjs").Observable<unknown>;
}
export {};
