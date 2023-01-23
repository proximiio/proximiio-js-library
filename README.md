# Proximi.io JS Library

## Getting work

In case of cloning the repo from GitHub please run `npm install` afterwards.

### Using just in browser

This requires to load js file into script tag of html file.

```
<script src="lib/proximiio.js"></script>
```

### Using in node.js

```
const Proximiio = require('lib/index').default;
```

### Using with modern javascript frameworks (Angular, React)

Install with npm

```
npm install proximiio-js-library
```

and then import into project with

```
import Proximiio from 'proximiio-js-library'
```

## Available methods

#### Log in

You can log in with email and password or with the token.
Successful log in is required for all other afterwards methods so execute this as soon as possible.

###### Log in with email/password

```
// node.js & react/angular
Proximiio.Auth.login('email', 'password')

// browser
Proximiio.default.Auth.login('email', 'password')
```

###### Log in with token

```
// node.js & react/angular
Proximiio.Auth.loginWithToken('token')

// browser
Proximiio.default.Auth.loginWithToken('token')
```

###### Get User Config Data

```
// node.js & react/angular
Proximiio.Auth.getUserConfig()

// browser
Proximiio.default.Auth.getUserConfig()
```

#### Get list of places

```
// node.js & react/angular
Proximiio.Places.getPlaces()

// browser
Proximiio.default.Places.getPlaces()
```

#### Get list of floors

```
// node.js & react/angular
Proximiio.Floors.getFloors()

// browser
Proximiio.default.Floors.getFloors()
```

###### Available arguments for lists

You can pass arguments to list calls for pagination, order, filtering in this order.

```
limit?: number, // total results to return
skip?: number, // how many results to skip from beginning
order?: string, // specify field to order results by e.g 'createdAt'
dir?: string, // direction of results order, could be 'asc' or 'desc'
filterByIndex?: string, // specify field for filtering e.g 'name'
q?: string // query to filter
```

### Map Component

Map is generated using the [Mapbox GL library](https://docs.mapbox.com/mapbox-gl-js/api/map/), it's necessary to load it's css file in your html `<head>` tag.

```
<link href='https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.css' rel='stylesheet' />
```

To generate map, create div element with id param defined

```
<div id="proximiioMap"></div>
```

Now you can call

```
const map = new Proximiio.Map({
   selector: 'customMap', // optional, id of map container, default 'proximiioMap'
   allowNewFeatureModal: false, // optional, if true, you'll be able to add new features via modal dialog, default false
   newFeatureModalEvent: 'click', // optional, choose which event should open the modal for adding new features (should be map event https://docs.mapbox.com/mapbox-gl-js/api/map/#map-events), default 'click'
   enableTBTNavigation: true, // optional, you'll receive turn-by-turn text navigation object in found route listener response, default: true
   mapboxOptions: { MapboxOptions }, // optional, you can pass mapbox initial options like center or zoom here, all options can be found at https://docs.mapbox.com/mapbox-gl-js/api/map/
   defaultPlaceId: 'my_place_id', // optional, you can specify default place, if not specified the first place found will be used as default
   zoomIntoPlace: false // optional, the map will center and zoom into the default place location, default: true
   isKiosk: false, // optional, this will enable kiosk like behavior for the map (will add dot at spiecified coordinates in kioskSettings and this point will be set as a starting point for generated routes)
   kioskSettings: {
      coordinates: [number, number], // coordinates for a kiosk start point
      level: number // floor level of a kiosk starting point
    },
   initPolygons: false, // optional, default: false, if enabled and yours geojson includes required data the map will show defined features as polygons with hover/click effect, you can customize polygon colors for different states via polygonsOptions
   polygonsOptions: {
      defaultPolygonColor: string; // optional, default: '#dbd7e8', default color of the polygons
      hoverPolygonColor: string; // optional, default: '#a58dfa', hover color of the polygons
      selectedPolygonColor: string; // optional, default: '#6945ed', selected color of the polygons
      defaultLabelColor: string; // optional, default: '#6945ed', default color of the polygon labels
      hoverLabelColor: string; // optional, default: '#fff', hover color of the polygon labels
      selectedLabelColor: string; // optional, default: '#fff', selected color of the polygon labels
      defaultPolygonHeight: number; // optional, default: 3, default polygon height in meters
      hoverPolygonHeight: number; // optional, default: 3, hover polygon height in meters
      selectedPolygonHeight: number; // optional, default: 3, selected polygon height in meters
      base: number; // optional, default: 0, default polygon base in meters
      opacity: number; // optional, default: 1, default polygon opacity
      minZoom: number; // optional, default: 17, default polygon minimum zoom visibility
      maxZoom: number; // optional, default: 24, default polygon maximum zoom visibility
   }
   considerVisibilityParam: false, // optional, default: true, if enabled all pois with visibility property defined as 'hidden' will not be visible as default, will be possible to toggle them with toggleHiddenPois() method
   fitBoundsPadding: 200, // optional, default 250, number | PaddingOptions, the amount of padding in pixels to add to the given bounds for found route, https://docs.mapbox.com/mapbox-gl-js/api/properties/#paddingoptions
   minFitBoundsDistance: 50, // optional, default 15, number, the minimum route length in meters to zoom into it's bounds, if length is smaller regular center change will be used
   showLevelDirectionIcon: false // optional, default: false, if enabled arrow icon will be shown at the levelchanger indicating direction of level change along the found route,
   showRasterFloorplans: false // optional, default: false, if enabled raster floorplans will be visible,
   animatedRoute: false // optional, default: false, EXPERIMENTAL, if enabled animated dot will be displayed along the route,
   useRasterTiles: false, // optional, default: false, this will add raster tile source and layer with defined options from rasterTilesOptions
   rasterTilesOptions: {
      tilesUrl: string[], // mandatory
      tileSize: number, // optional, default: 256,
      minZoom: number, // optional, default: 15,
      maxZoom: number, // optional, default: 22,
      beforeLayer: string, // optional, default: 'proximiio-shop',
      attribution: string, // optional
   },
   handleUrlParams: false, // optional, default: false, if enabled you can define place, start and destination features for routing in url params and library will handle those, you can change param names via urlParams option listed below
   urlParams: {
      startFeature: string, // optional, default: 'startFeature', library will search for the start feature by it's id or title defined within provided param
      destinationFeature: string, // optional, default: 'destinationFeature', library will search for the destination feature by it's id or title defined within provided param
      defaultPlace: string, // optional, default: 'defaultPlace', library will search for the place by it's id or title defined within provided param
   },
   useGpsLocation: false, // optional, default: false, if enabled your location will be detected with geolocation API and used as a starting point for routing
   geolocationControlOptions: {
      autoTrigger: boolean, // optional, default: true, if enabled map will automatically enable geolocation
      autoLocate: boolean, // optional, default: true, if enabled map will automatically focus on user location
      position: string, // optional, default: 'top-right', position on the map to which the control will be added. Valid values are 'top-left' , 'top-right' , 'bottom-left' , and 'bottom-right'
   },
   language: 'en', // optional, set default map language for poi features
   routeColor: '#000000', // optional, define route line color
   forceFloorLevel: 0, // optional, define floor number if you want to force routes visible for single level
   amenityIdProperty: 'title', // optional, define amenity property to rewrite amenity id with, so poi icons can be initialized by different param
   routeWithDetails: true, // optional, you'll receive details object (distance and duration of route) in found route listener response, default: true
});
```

#### Initiating with url params

Library can handle some params from url in case you will enable `handleUrlParams` in map constructor. There's nothing else special required, just provide them in browser url like this as default:

`http://your-server/?startFeature=featureIdOrTitle&destinationFeature=featureIdOrTitle&defaultPlace=placeIdOrTitle`

#### Required Data for 3D Polygons

As first there must be a MultiPolygon feature created which will be a polygon itself, it's also nice to have a label-line property in properties set. Label-line is just imaginary line alongside which poi title will be drawn. At last, you have to connect poi to polygon via adding its id to poi metadata like polygon_id property.

Polygon Feature Example:

```
{
    "type": "Feature",
    "geometry": {
        "type": "MultiPolygon",
        "coordinates": coordinates of all corner points
    },
    "properties": {
        "id": "my-poi-polygon-id",
        "label-line": [
            [
                longitude,
                latitude
            ],
            [
                longitude,
                latitude
            ]
        ],
        ...
    }
}
```

POI Feature Example:

```
{
    "type": "Feature",
    "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
    },
    "properties": {
        "usecase": "poi",
        "type": "poi",
        "id": "my-poi-id",
        ...
        "metadata": {
            "polygon_id": "my-poi-polygon-id",
            ...
        }
    }
}
```

#### Available Methods

##### Get the mapbpox instance

```
map.getMapboxInstance(); // this will return mapbox instance
```

##### Set active place

This method will set an active place, load floors etc. Have to be called after map is ready, see getMapReadyListener.

```
// @param placeId {string} Id of the place to be set as active on map
// @param zoomIntoPlace {boolean} should zoom into active place, optional
// @param floorLevel {number} Level of the floor to be set as active on map, optional

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.setPlace(myPlaceId);
});
```

##### Set active floor

Have to be called after map is ready, see getMapReadyListener.

###### by id

This method will set an active floor based on it's id.

```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.setFloorById(myFloorId);
});
```

###### by level

This method will set an active floor based on it's level.

```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.setFloorByLevel(0);
});
```

###### by way

This method will set an active floor based on the way of the next floor, e.g if we wanna go up or down.

```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.setFloorByWay('up');
});
```

#### Set new kiosk settings

With this method you can override kiosk coordinates position and it's floor level

```
const map = new Proximiio.Map({
    isKiosk: true,
    kioskSettings: {
        coordinates: [17.833135351538658, 48.60678469647394],
        level: 0
    }
});
map.getMapReadyListener().subscribe(ready => {
    console.log('map ready', ready);
    map.setKiosk(48.606703739771774, 17.833092384506614, 1);
});
```

#### Set different bounding box padding

This method will set padding for zooming into bounding box of found route

```
const map = new Proximiio.Map({
    fitBoundsPadding: 200
});
map.getMapReadyListener().subscribe(ready => {
    console.log('map ready', ready);
    map.setBoundsPadding(50);
});
```

##### Find Route

###### by features id

This method will generate route based on selected features by their ids.

```
// @param idTo {string} finish feature id
// @param idFrom {string} start feature id, optional for kiosk
// @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.findRouteByIds('idTo', 'idFrom');
});
```

###### by features title

This method will generate route based on selected features by their titles.

```
// @param titleTo {string} finish feature title
// @param titleFrom {string} start feature title, optional for kiosk
// @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.findRouteByTitle('titleTo', 'titleFrom');
});
```

###### by coords

This method will generate route based on attached coords.

```
// @param latTo {number} finish latitude coordinate
// @param lngTo {number} finish longitude coordinate
// @param levelTo {number} finish level
// @param latFrom {number} start latitude coordinate, optional for kiosk
// @param lngFrom {number} start longitude coordinate, optional for kiosk
// @param levelFrom {number} start level, optional for kiosk
// @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.findRouteByCoords(48.606703739771774, 17.833092384506614, 0, 48.60684545080579, 17.833450676669543, 0);
});
```

###### by coords

This method will generate route based on attached coords.

```
// @param latTo {number} finish latitude coordinate
// @param lngTo {number} finish longitude coordinate
// @param levelTo {number} finish level
// @param latFrom {number} start latitude coordinate, optional for kiosk
// @param lngFrom {number} start longitude coordinate, optional for kiosk
// @param levelFrom {number} start level, optional for kiosk
// @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.findRouteByCoords(48.606703739771774, 17.833092384506614, 0, 48.60684545080579, 17.833450676669543, 0);
});
```

###### by nearest amenity feature

This method will generate route based on nearest amenity feature.

```
// @param amenityId {string} amenity id of a nearest feature to look for
// @param idFrom {string} start feature id, optional for kiosk
// @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.findRouteToNearestFeature('amenityId');
});
```

##### Cancel Route

Use this method to cancel generated route.

```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.cancelRoute();
});
```

##### Get turn by turn navigation object

Retrieves the turn by turn navigation object.

```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   const TBTNav = map.getTBTNav();
});
```

##### Center to route

This method will center the map to generated route bounds.

```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.centerToRoute();
});
```

##### Center to feature

This method will center the map to feature coordinates.

```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.centerToFeature('featureId');
});
```

##### Center to coordinates

This method will center the map to provided coordinates.

```
// @param lat {number} latitude coordinate, required
// @param lng {number} longitude coordinate, required
// @param zoom {number} zoom level, optional, 18 as default

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.centerToCoordinates(48.60678469647394, 17.833135351538658, 20);
});
```

##### Toggle hidden poi visibility

This method will toggle hidden poi visibility based on the visibility param in poi properties.

```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.toggleHiddenPois();
});
```

##### Toggle raster floorplans visibility

This method will toggle raster floorplans visibility.

```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.toggleRasterFloorplans();
});
```

##### Set Features Highlight

Method for adding circle layer as a highlight for defined features.

```
// @param features {string[]} array of feature ids to set highlight on, you can send empty array to remove highlights.
// @param color {string} highlight color, optional, default: '#000'.
// @param radius {number} highlight circle radius, optional, default: 50.
// @param blur {number} blur of the highlight circle, optional, default: 0.8.

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.setFeaturesHighlight(['featureid']);
});
```

##### Add New Feature

Add new feature to map.

```
// @param title {string} feature title, required
// @param level {number} feature floor level, required
// @param lat {number} feature latitude coordinate, required
// @param lng {number} feature longitude coordinate, required
// @param icon {string} feature icon image in base64 format, optional
// @param id {string} feature id, optional, will be autogenerated if not defined
// @param placeId {string} feature place_id, optional
// @param floorId {string} feature floor_id, optional
// @param properties {object} feature properties, optional
// @param isTemporary {boolean} will add feature just temporary, it's not saved to db, optional, default
// @return <Promise>{Feature} newly added feature

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   const myFeature = map.addCustomFeature('myPOI', 0, 48.606703739771774, 17.833092384506614);
});
```

##### Update Feature

Update existing map feature.

```
// @param id {string} feature id
// @param title {string} feature title, optional
// @param level {number} feature floor level, optional
// @param lat {number} feature latitude coordinate, optional
// @param lng {number} feature longitude coordinate, optional
// @param icon {string} feature icon image in base64 format, optional
// @param placeId {string} feature place_id, optional
// @param floorId {string} feature floor_id, optional
// @param properties {object} feature properties, optional
// @param isTemporary {boolean} will update feature just temporary, it's not saved to db, optional, default
// @return <Promise>{Feature} newly added feature

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   const myFeature = map.updateFeature('poiId', 'myPOI', 0, 48.606703739771774, 17.8330923845066);
});
```

##### Delete Feature

Delete existing map feature.

```
// @param id {string} feature id
// @param isTemporary {boolean} will delete feature just temporary, it's not deleted from db, optional, default

map.getMapReadyListener().subscribe(ready => {
  console.log('map ready', ready);
  map.deleteFeature('poiId');
});
```

##### Get list of added features

Retrieves the list of only newly added features.

```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   const features = map.getCustomFeaturesList();
});
```

##### Showing Person Icon

###### setPerson()

Method for setting a person icon on a Map, this method is resetting the previous state of all persons added before.

```
// @param lat {number} latitude coordinate of person.
// @param lng {number} longitude coordinate of person.
// @param level {number} floor level of person.
// @param id {string | number} id of person, optional.

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.setPerson(48.606703739771774, 17.833092384506614, 0);
});
```

###### upsertPerson()

Method for add/update person icon on a Map.

```
// @param lat {number} latitude coordinate of person.
// @param lng {number} longitude coordinate of person.
// @param level {number} floor level of person.
// @param id {string | number} id of person, optional.

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.upsertPerson(48.606703739771774, 17.833092384506614, 0, 'person-1');
});
```

##### Map Features Filtering

###### Setting new feature filter

With this method you set only defined poi feature to be visible, calling this method multiple times will set another feature to be visible without hiding the previous one, with inverted set to true defined feature will hide instead.

```
// param query {string} id or title of the feature
// param inverted {boolean} when set to true, defined feature will hide, optional

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe(ready => {
    console.log('map ready', ready);
    map.setFeatureFilter('myfeature');
});
```

###### Removing created feature filter

Method for removing previously created feature filters.

```
// param query {string} id or title of the feature
// param inverted {boolean} have to be set to same value like it was in setFeatureFilter method, optional

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe(ready => {
    console.log('map ready', ready);
    map.removeFeatureFilter('myfeature');
});
```

###### Resetting all feature filters

Method for removing all active feature filters.

```
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe(ready => {
    console.log('map ready', ready);
    map.resetFeatureFilters();
});
```

###### Hiding all pois features

Method for hiding all pois features on map.

```
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe(ready => {
    console.log('map ready', ready);
    map.hidePois();
});
```

###### Refetching features

Method for refetching all pois features on map.

```
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe(ready => {
    console.log('map ready', ready);
    map.refetch();
});
```

###### Setting new amenity filter

You'll be able to show features only for defined amenity id on map with this method, also with defining the category _(NOTE: you have to create them before with [setAmenitiesCategory()](#setting-new-amenities-category) method)_, filtering will be set only for defined array of amenities in the category. With category set, only one amenity filter can be active at the time, while without the category they stack so multiple amenities can be active. With inverted option set to true, defined amenity features will hide. Category and inverted options can't be defined at the same time.

```
// param amenityId {string} only features of defined amenityId will be visible
// param category {string} id of the amenities category added via setAmenitiesCategory, optional, if defined filtering will be set only for defined array of amenities in same method
// param inverted {boolean} when set to true, defined amenity features will hide, optional

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.setAmenityFilter('myamenity');
   // inverted method
   map.setAmenityFilter('myamenity', null, true);
});
```

###### Removing created amenity filter

Method for removing previously created amenity filters. In case amenity filter has been set with the category parameter, you have to use same param for removing the filter.

```
// param amenityId {string} remove the filter for a defined amenityId
// param category {string} id of the amenities category added via setAmenitiesCategory, optional, if defined filtering will be removed only for defined array of amenities in same method
// param inverted {boolean} have to be set to same value like it was in setAmenityFilter method, optional

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.removeAmenityFilter('myamenity');
   // remove inverted method
   map.removeAmenityFilter('myamenity', null, true);
});
```

###### Resetting all amenity filters

Method for removing all active amenity filters.

```
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.resetAmenityFilters();
});
```

###### Setting new amenities category

You can define your own categories of amenities, which you can then use for advanced filtering.

```
// param id {string} category id, have to be used when calling setAmenityFilter() method as second param.
// param amenities {Array of strings} list of the amenities id

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.setAmenitiesCategory('shops', ['id1', 'id2']);
});
```

###### Removing amenities category

Method for removing previously created categories.

```
// param id {string} category id.

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.removeAmenitiesCategory('shops');
});
```

###### Resetting all amenity categories

Method for removing all active amenity categories.

```
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.resetAmenitiesCategory();
});
```

#### Available Listeners

##### Listen to map ready event

```
map.getMapReadyListener().subscribe(ready => {
  console.log('map ready', ready);
});
```

##### Listen to place select event

```
map.getPlaceSelectListener().subscribe(place => {
   console.log('selected place', place);
});
```

##### Listen to floor select event

```
map.getFloorSelectListener().subscribe(floor => {
   console.log('selected floor', floor);
});
```

##### Listen to route found event

```
map.getRouteFoundListener().subscribe(res => {
   console.log('route found successfully', res.route);
   console.log('turn by turn text navigation output', res.TBTNav);
});
```

##### Listen to route failed event

```
map.getRouteFailedListener().subscribe(() => {
   console.log('route not found');
});
```

##### Listen to route cancel event

```
map.getRouteCancelListener().subscribe(() => {
   console.log('route cancelled);
});
```

##### Listen to feature add event

```
map.getFeatureAddListener().subscribe(feature => {
   console.log('feature added', feature);
});
```

##### Listen to feature update event

```
map.getFeatureUpdateListener().subscribe(feature => {
   console.log('feature updated', feature);
});
```

##### Listen to feature delete event

```
map.getFeatureDeleteListener().subscribe(() => {
   console.log('feature deleted');
});
```

##### Listen to polygon click event

```
map.getPolygonClickListener().subscribe((poi) => {
   console.log('polygon clicked', poi);
});
```

##### Listen to poi click event

```
map.getPoiClickListener().subscribe((poi) => {
   console.log('poi clicked', poi);
});
```

##### Listen to persons update event

```
map.getPersonUpdateListener().subscribe((personsList) => {
   console.log('current persons', personsList);
});
```

### Select Component

Select component is generated using the [Autocomplete.js](https://tarekraafat.github.io/autoComplete.js) library. Optionally load [css file](assets/proximiio-js-library.css) into your project from assets folder, feel free to fit it to your requirements.

To generate select widget, create input element with id param defined, for styling please assign also class param.

```
<input id="proximiioSelect" class="proximiio-select" type="text" tabIndex="1"/>
```

Now you can call

```
// @param dataset { Datasets } predefined proximi.io dataset to search on, could be Places | Floors | Pois
// @param options { AutocompleteOptions } autocomplete.js options, check https://tarekraafat.github.io/autoComplete.js/#/configuration for more info
// @param useApiSearch { boolean } use this option if you want to use api to filter the results, necessary if you have 100+ places | floors.

const select = new Proximiio.Select('Places', { placeHolder: 'Pick the place', resultItem: { highlight: { render: true } } });
```

#### Available Listeners

##### Listen to select event

```
select.getSelectListener().subscribe(place => {
  console.log('place selected', place);
});
```

## Examples

### Generate route on map with select components

JS

```
// initiate map component
const map = new Proximiio.Map();

// listen to event when map component is loaded
map.getMapReadyListener().subscribe(() => {
    let fromPoi = null;
    let toPoi = null;

    // initiate select component for starting point
    const fromPoiSelect = new Proximiio.Select('Pois', { placeHolder: 'Pick the start poi', highlight: true, selector: '#from-poi-select' });

    // listen to event when something is selected
    fromPoiSelect.getSelectListener().subscribe(poi => {
      fromPoi = poi;
      map.centerToFeature(poi.id); // optional, this will centerize map to selected point
      console.log('from poi selected', poi);
      // generate route in case both start and end points are available
      if (fromPoi && toPoi) {
        map.findRouteByIds(fromPoi.id, toPoi.id);
      }
    })

    // initiate select component for ending point
    const toPoiSelect = new Proximiio.Select('Pois', { placeHolder: 'Pick the end poi', highlight: true, selector: '#to-poi-select' });

    // listen to event when something is selected
    toPoiSelect.getSelectListener().subscribe(poi => {
      toPoi = poi;
      map.centerToFeature(poi.id); // optional, this will centerize map to selected point
      console.log('to poi selected', poi);
      // generate route in case both start and end points are available
      if (fromPoi && toPoi) {
        map.findRouteByIds(fromPoi.id, toPoi.id);
      }
    })
})
```

HTML

```
<input id="from-poi-select" class="proximiio-select" type="text" tabIndex="1"/>
<input id="to-poi-select" class="proximiio-select" type="text" tabIndex="1"/>
```

### Adding new features and updating their positions

We are using some variables and turf to generate static data for demo purposes, you probably want to use your own api for that instead but the core idea of using `map.addCustomFeature()` to add feature to map and `map.updateFeature()` to update them, remains the same.

JS

```
// lets assume you have a list of custom poi features
const customPoiList = [{
  id: 'custom-poi-1',
  title: 'Custom Poi',
  level: 0
}, {
  id: 'custom-poi-2',
  title: 'Custom Poi 2',
  level: 0
}, {
  id: 'custom-poi-3',
  title: 'Custom Poi 3',
  level: 0
}, {
  id: 'custom-poi-4',
  title: 'Custom Poi 4',
  level: 0
}, {
  id: 'custom-poi-5',
  title: 'Custom Poi 5',
  level: 0
}];

// initiate map component
const map = new Proximiio.Map();

// listen to event when map component is loaded
map.getMapReadyListener().subscribe(res => {
  console.log('map ready', res);

  // get current mapbox instance bounds
  let bounds = map.getMapboxInstance().getBounds();

  // loop for each point of our features list
  for (let poi of customPoiList) {
    // for demo purposes we use turf to get random position based on the current map bounds
    const position = turf.randomPosition([bounds._ne.lng, bounds._ne.lat, bounds._sw.lng, bounds._sw.lat]);

    // finally add feature to map
    map.addCustomFeature(poi.title, poi.level, position[1], position[0], '', poi.id);
  }

  // setting interval to update position each 5 seconds
  setInterval(() => {
    // again loop through the list of features
    for (let poi of customPoiList) {
      // use turf to get new random position
      const position = turf.randomPosition([bounds._ne.lng, bounds._ne.lat, bounds._sw.lng, bounds._sw.lat]);

      // update the feature position
      map.updateFeature(poi.id, poi.title, poi.level, position[1], position[0]);
    }
  }, 5000);
});
```

HTML

```
<div id="proximiioMap" style="height: 500px;"></div>
```

## Build

In case of any changes of library itself (means at `./src` folder), you can rebuild with

```
npm run build
```
