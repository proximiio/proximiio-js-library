import * as mapboxgl from 'mapbox-gl';
import { PlaceModel } from '../../models/place';
import { FloorModel } from '../../models/floor';
import StyleModel from '../../models/style';
import Feature, { FeatureCollection } from '../../models/feature';
import { AmenityModel } from '../../models/amenity';
import { MapboxOptions } from '../../models/mapbox-options';
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
    zoomLevel?: number;
    considerVisibilityParam?: boolean;
    fitBoundsPadding?: number | PaddingOptions;
    minFitBoundsDistance?: number;
    showLevelDirectionIcon?: boolean;
    showRasterFloorplans?: boolean;
    animatedRoute?: boolean;
    useRasterTiles?: boolean;
    rasterTilesOptions?: {
        tilesUrl: string[];
        tileSize?: number;
        minZoom?: number;
        maxZoom?: number;
        beforeLayer?: string;
        attribution?: string;
    };
}
interface PaddingOptions {
    bottom: number;
    left: number;
    right: number;
    top: number;
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
    private onPolygonClickListener;
    private onPoiClickListener;
    private onPersonUpdateListener;
    private defaultOptions;
    private routeFactory;
    private startPoint?;
    private endPoint?;
    private showStartPoint;
    private amenityIds;
    private filteredFeatures;
    private featureFilters;
    private filteredAmenities;
    private amenityFilters;
    private amenityCategories;
    private hoveredPolygon;
    private selectedPolygon;
    constructor(options: Options);
    private initialize;
    private cancelObservers;
    private fetch;
    private onMapReady;
    private initKiosk;
    private onSetKiosk;
    private initDirectionIcon;
    private initAnimatedRoute;
    private initRasterTiles;
    private initPolygons;
    private onShopClick;
    handlePolygonSelection(poi?: Feature): void;
    private onShopMouseEnter;
    private onShopMouseMove;
    private onShopMouseLeave;
    private featureDialog;
    private onAddNewFeature;
    private onUpdateFeature;
    private onDeleteFeature;
    private onFeaturesChange;
    private onSetFeatureFilter;
    private onRemoveFeatureFilter;
    private onResetFeatureFilters;
    private onSetAmenityFilter;
    private onRemoveAmenityFilter;
    private onResetAmenityFilters;
    private filterOutFeatures;
    private activePolygonsAmenity;
    private setActivePolygons;
    private handlePoiVisibility;
    private onToggleHiddenPois;
    private onSetPerson;
    private onAddPerson;
    private onUpdatePerson;
    private initPersonsMap;
    private prepareStyle;
    private onRouteChange;
    private onSourceChange;
    private onSyntheticChange;
    private updateMapSource;
    private onStyleSelect;
    private onStyleChange;
    private onToggleRasterFloorplans;
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
    private addDirectionFeatures;
    private counter;
    private arc;
    private steps;
    private animationInstances;
    private addAnimatedRouteFeatures;
    private animate;
    private cancelAnimation;
    private getClosestFeature;
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
    setPlace(placeId: string, zoomIntoPlace?: boolean, floorLevel?: number): Promise<PlaceModel>;
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
    setFloorById(floorId: string): any;
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
    setFloorByLevel(level: number): any;
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
    setFloorByWay(way: 'up' | 'down'): any;
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
    findRouteByIds(idTo: string, idFrom?: string, accessibleRoute?: boolean): void;
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
    findRouteByTitle(titleTo: string, titleFrom?: string, accessibleRoute?: boolean): void;
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
    findRouteByCoords(latTo: number, lngTo: number, levelTo: number, latFrom?: number, lngFrom?: number, levelFrom?: number, accessibleRoute?: boolean): void;
    /**
     * This method will generate route to nearest amenity feature
     *  @memberof Map
     *  @name findRouteToNearestFeature
     *  @param amenityId {string} amenity id of a nearest feature to look for
     *  @param idFrom {string} start feature id, optional for kiosk
     *  @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.findRouteToNearestFeature('amenityId');
     *  });
     */
    findRouteToNearestFeature(amenityId: string, idFrom?: string, accessibleRoute?: boolean): void;
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
    getCustomFeaturesList(): any;
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
    setKiosk(lat: number, lng: number, level: number): void;
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
    setBoundsPadding(padding: number | PaddingOptions): void;
    /**
     * With this method you can show only defined features, you can send both id or title.
     *  @memberof Map
     *  @name setFeatureFilter
     *  @param query {string} id or title of the feature
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.setFeatureFilter('myfeature');
     *  });
     */
    setFeatureFilter(query: string): void;
    /**
     * Method for removing previously created feature filters.
     *  @memberof Map
     *  @name removeFeatureFilter
     *  @param query {string} id or title of the feature
     *  @example
     *  const map = new Proximiio.Map();
     *  map.getMapReadyListener().subscribe(ready => {
     *    console.log('map ready', ready);
     *    map.removeFeatureFilter('myfeature');
     *  });
     */
    removeFeatureFilter(query: string): void;
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
    resetFeatureFilters(): void;
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
    setAmenityFilter(amenityId: string, category?: string): void;
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
    removeAmenityFilter(amenityId: string, category?: string): void;
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
    resetAmenityFilters(): void;
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
    setAmenitiesCategory(id: string, amenities: string[]): void;
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
    removeAmenitiesCategory(id: string): void;
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
    resetAmenitiesCategory(): void;
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
    getPolygonClickListener(): import("rxjs").Observable<Feature>;
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
    getPoiClickListener(): import("rxjs").Observable<Feature>;
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
    setPerson(lat: number, lng: number, level: number, id?: string | number): void;
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
    upsertPerson(lat: number, lng: number, level: number, id?: string | number): void;
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
    getPersonUpdateListener(): import("rxjs").Observable<PersonModel[]>;
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
    toggleHiddenPois(): void;
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
    toggleRasterFloorplans(): void;
}
export {};
