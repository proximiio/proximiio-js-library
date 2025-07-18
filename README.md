# Proximi.io JS Library

## Getting work

In case of cloning the repo from GitHub please run `npm install` afterwards.

### Using just in browser

This requires to load js file into script tag of html file.

```javascript
<script src="lib/proximiio.js"></script>
```

#### or with cdn link

```javascript
<script src="https://proximiiojs.ams3.cdn.digitaloceanspaces.com/latest/proximiio.js"></script>
```

### Using in node.js

```javascript
const Proximiio = require('lib/index').default;
```

### Using with modern javascript frameworks (Angular, React)

Install with npm

```bash
npm install proximiio-js-library
```

and then import into project with

```javascript
import Proximiio from 'proximiio-js-library';
```

## Available methods

#### Log in

You can log in with email and password or with the token.
Successful log in is required for all other afterwards methods so execute this as soon as possible.

###### Log in with email/password

```javascript
// node.js & react/angular
Proximiio.Auth.login('email', 'password');

// browser
Proximiio.default.Auth.login('email', 'password');
```

###### Log in with token

```javascript
// node.js & react/angular
Proximiio.Auth.loginWithToken('token');

// browser
Proximiio.default.Auth.loginWithToken('token');
```

###### Get User Config Data

```javascript
// node.js & react/angular
Proximiio.Auth.getUserConfig();

// browser
Proximiio.default.Auth.getUserConfig();
```

#### Get list of places

```javascript
// node.js & react/angular
Proximiio.Places.getPlaces();

// browser
Proximiio.default.Places.getPlaces();
```

#### Get list of floors

```javascript
// node.js & react/angular
Proximiio.Floors.getFloors();

// browser
Proximiio.default.Floors.getFloors();
```

###### Available arguments for lists

You can pass arguments to list calls for pagination, order, filtering in this order.

```javascript
limit?: number, // total results to return
skip?: number, // how many results to skip from beginning
order?: string, // specify field to order results by e.g 'createdAt'
dir?: string, // direction of results order, could be 'asc' or 'desc'
filterByIndex?: string, // specify field for filtering e.g 'name'
q?: string // query to filter
```

### Map Component

Map is generated using the [Maplibre GL library](https://maplibre.org/maplibre-gl-js/docs/), it's necessary to load it's css file in your html `<head>` tag.

```html
<link href="https://unpkg.com/maplibre-gl/dist/maplibre-gl.css" rel="stylesheet" />
```

To generate map, create div element with id param defined

```html
<div id="proximiioMap"></div>
```

Now you can call

```javascript
// Create a new Proximiio.Map instance
const map = new Proximiio.Map({
   // Optional, id of map container, default 'proximiioMap'
   selector: 'customMap',

   // Optional, if true, you'll be able to add new features via modal dialog, default false
   allowNewFeatureModal: false,

   // Optional, choose which event should open the modal for adding new features
   // (should be map event https://docs.mapbox.com/mapbox-gl-js/api/map/#map-events),
   // default 'click'
   newFeatureModalEvent: 'click',

   // Optional, you'll receive turn-by-turn text navigation object in found route
   // listener response, default: true
   enableTBTNavigation: true,

   // Optional, you can pass mapbox initial options like center or zoom here,
   // all options can be found at https://docs.mapbox.com/mapbox-gl-js/api/map/
   mapboxOptions: {
      // MapboxOptions object
   },

   // Optional, you can specify default place, if not specified the first place found
   // will be used as default
   defaultPlaceId: 'my_place_id',

   // Optional, you can specify default level, if not specified the first floor found
   // will be used as default
   defaultFloorLevel: 0,

   // Optional, the map will center and zoom into the default place location, default: true
   zoomIntoPlace: false,

   // Optional, this will enable kiosk-like behavior for the map
   // (will add dot at specified coordinates in kioskSettings and this point will be
   // set as a starting point for generated routes)
   isKiosk: false,

   // KioskSettings for customization
   kioskSettings: {
      // Coordinates for a kiosk start point
      coordinates: [number, number],

      // Floor level of a kiosk starting point
      level: number,

      // Show/hide 'You are here' label under the kiosk point, default: false, optional
      showLabel: false,

      // RGB color values to customize kiosk point color, default: '189,82,255', optional
      pointColor: '255,91,53'
   },

   // Optional, default: false, if enabled and yours GeoJSON includes required data
   // the map will show defined features as polygons with hover/click effect,
   // you can customize polygon colors for different states via polygonsOptions,
   // only applied to features with type 'shop', to apply to other features
   // see polygonLayers option below
   initPolygons: false,

   // Optional, PolygonsOptions to customize polygons visualization
   polygonsOptions: {
      // Optional, default: '#dbd7e8', default color of the polygons
      defaultPolygonColor: string,

      // Optional, default: '#a58dfa', hover color of the polygons
      hoverPolygonColor: string,

      // Optional, default: '#6945ed', selected color of the polygons
      selectedPolygonColor: string,

      // Optional, default: '#ccc', disabled color of the polygons
      disabkedPolygonColor: string,

      // Optional, default: '#6945ed', default color of the polygon labels
      defaultLabelColor: string,

      // Optional, default: '#fff', hover color of the polygon labels
      hoverLabelColor: string,

      // Optional, default: '#fff', selected color of the polygon labels
      selectedLabelColor: string,

      // Optional, default: '#8e8e8e', disabled color of the polygon labels
      disabledLabelColor: string,

      // Optional, default: 3, default polygon height in meters
      defaultPolygonHeight: number,

      // Optional, default: 3, hover polygon height in meters
      hoverPolygonHeight: number,

      // Optional, default: 3, selected polygon height in meters
      selectedPolygonHeight: number,

      // Optional, default: 3, disabled polygon height in meters
      disabledPolygonHeight: number,

      // Optional, default: 0, default polygon base in meters
      base: number,

      // Optional, default: 1, default polygon opacity
      opacity: number,

      // Optional, default: 17, default polygon minimum zoom visibility
      minZoom: number,

      // Optional, default: 24, default polygon maximum zoom visibility
      maxZoom: number,

      // Optional, default: ['Quicksand Bold', 'Noto Sans Arabic Bold'], define font stack to use for displaying labels,
      // check Available fonts at the bottom
      textFont: string[],

      // Optional, define polygon label font size, default is interpolate
      // expression based on zoom level
      labelFontSize: (string | number | string[])[] | number,

      // Optional, label placement relative to its geometry, default: 'line-center'
      symbolPlacement: 'point' | 'line' | 'line-center',

      // Optional, default: true, if no label-line is defined in the feature metadata,
      // if enabled it's automatically generated based on the longest polygon border
      autoLabelLines: boolean

      // Optional, default: false, when enabled polygon label opacity will decrease with increasing map pitch
      adaptiveLabelOpacity: boolean

      // Optional, default: 30, maximum pitch when polygon label will be visible if `adaptiveLabelOpacity` is enabled
      adaptiveMaxPitch: 30
   },

   // Optional, you can define more features to display as polygons and enable
   // hover/click effect with different formatting, you have to define only
   // featureType all other parameters are as default as polygonsOptions
   // those could be overriden by defining them separately
   polygonLayers: [{
      // polygons behavior will be applied to all features with type 'shop'
      featureType: 'shop'
   }, {
      // polygons behavior will be applied to all features with type 'parking_spot'
      featureType: 'parking_spot',

      // defaultPolygonColor will be overriden by this property
      defaultPolygonColor: '#000000'
   }, {
      // polygons behavior will be applied to all features with type 'anchor-shop'
      featureType: 'anchor-shop',

      // anchor shop images are loaded within map by feature id
      iconImage: '{id}'

      // handle default image visibility
      iconImageDefaultVisible : boolean
   }],

   // Optional, default: true, if enabled all POIs with visibility property defined as 'hidden'
   // will not be visible as default, will be possible to toggle them with toggleHiddenPois() method
   considerVisibilityParam: false,

   // Optional, default 250, number | PaddingOptions, the amount of padding in pixels
   // to add to the given bounds for found route,
   // https://docs.mapbox.com/mapbox-gl-js/api/properties/#paddingoptions
   fitBoundsPadding: 200,

   // Optional, default 15, number, the minimum route length in meters
   // to zoom into its bounds, if length is smaller regular center change will be used
   minFitBoundsDistance: 50,

   // Optional, default: false, if enabled arrow icon will be shown at the level changer
   // indicating direction of level change along the found route
   showLevelDirectionIcon: false,

   // Optional, default: false, if enabled raster floorplans will be visible
   showRasterFloorplans: false,

   // DEPRECATED optional, default: false, EXPERIMENTAL,
   // if enabled animated dot will be displayed along the route
   animatedRoute: false,

   // RouteAnimation for customization
   routeAnimation: {
      // Optional, default: false, if enabled animated dot/line will be displayed along the route
      enabled: false,

      // Optional, default: 'dash', there are two types of route animation
      // 'dash' for dashed line animation
      // and 'point' for moving point along the route
      type: 'dash',

      // Optional, default: true, if enabled animation will be looping
      looping: true,

      // Optional, default: true, if enabled map center will change to follow animation
      followRoute: true,

      // Optional, default: false, if enabled camera will follow route with angle change
      followRouteAngle: false

      // Optional, default: 30, the higher multiplier is animation should be faster
      durationMultiplier: 30,

      // Optional, set the animation duration, will ignore the multiplier,
      // as default animation duration is calculated by average walking speed and route distance
      duration: 10,

      // Optional, default: 120, higher fps = smoother animation
      fps: 60,

      // Optional, you can define icon via url to be displayed on the route instead of circular point
      pointIconUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/201408_cat.png',

      // Optional, default: '1', scales the original size of the icon by the provided factor
      pointIconSize: '1',

      // Optional, default: '#1d8a9f', color of the point animated along the route
      pointColor: '#1d8a9f',

      // Optional, default: 8, radius of the point animated along the route
      pointRadius: 8,

      // Optional, default: 'steelblue', color of the line animated along the route
      lineColor: 'steelblue',

      // Optional, default: 5, width of the line animated along the route
      lineWidth: 5,

      // Optional, default: 0.6, opacity of the line animated along the route
      lineOpacity: 0.6
   },

   // Optional, default: false, this will add raster tile source and layer
   // with defined options from rasterTilesOptions
   useRasterTiles: false,

   // RasterTilesOptions for customization
   rasterTilesOptions: {
      // Mandatory
      tilesUrl: string[],

      // Optional, default: 256
      tileSize: number,

      // Optional, default: 15
      minZoom: number,

      // Optional, default: 22
      maxZoom: number,

      // Optional, default: 'proximiio-shop'
      beforeLayer: string,

      // Optional
      attribution: string
   },

   // Optional, default: false, if enabled you can define place, start and destination features
   // for routing in URL params and library will handle those,
   // you can change param names via urlParams option listed below
   handleUrlParams: false,

   // URLParams for customization
   urlParams: {
      // Optional, default: 'startFeature', library will search for the start feature
      // by its id or title defined within provided param
      startFeature: string,

      // Optional, default: 'destinationFeature', library will search for the destination feature
      // by its id or title defined within provided param
      destinationFeature: string,

      // Optional, default: 'defaultPlace', library will search for the place
      // by its id or title defined within provided param
      defaultPlace: string
   },

   // Optional, default: false, if enabled your location will be detected with geolocation API
   // and used as a starting point for routing
   useGpsLocation: false,

   // GeolocationControlOptions for customization
   geolocationControlOptions: {
      // Optional, default: true, if enabled map will automatically enable geolocation
      autoTrigger: boolean,

      // Optional, default: true, if enabled map will automatically focus on user location
      autoLocate: boolean,

      // Optional, default: 'top-right', position on the map to which the control will be added.
      // Valid values are 'top-left' , 'top-right' , 'bottom-left' , and 'bottom-right'
      position: string
   },

   // Optional, set default map language for POI features
   language: 'en',

   // Optional, define route line color
   routeColor: '#000000',

   // Optional, define floor number if you want to force routes visible for a single level
   forceFloorLevel: 0,

   // Optional, define amenity property to rewrite amenity id with,
   // so POI icons can be initialized by different param
   amenityIdProperty: 'title',

   // Optional, default: true, you'll receive details object (distance and duration of route)
   // in found route listener response
   routeWithDetails: true,

   // Optional, you won't be able to click on any of the POIs while routing after enabling
   blockFeatureClickWhileRouting: false,

   // You can define an array of amenity id's to hide POI labels and icons while polygons remain functional
   hiddenAmenities: string[],

   // If set to true only features inside defined time range in metadata.dateStart and metadata.dateEnd will be shown
   useTimerangeData: false,

   // If enabled we automatically send analytics from routing to our API, default: true
   sendAnalytics: true,

   // If defaultFilter is defined it will look for this key in the feature object
   // if the previous key exists in the feature object, its value will be compared to this value
   // and filtering will be processed in a way that only features with the same value or features with missing property will be visible
   defaultFilter: {
      // Key to look for in the feature object
      key: string,

      // If the key exists in the feature object, its value will be compared to this value
      value: string
   },

   // Only features within defined bounds will be retrieved from API, optional
   // [[topleft lng, lat], [bottomright lng, lat]]
   featuresMaxBounds: [[-73.9876, 40.7661], [-73.9397, 40.8002]]
});
```

#### Initiating with url params

Library can handle some params from url in case you will enable `handleUrlParams` in map constructor. There's nothing else special required, just provide them in browser url like this as default:

`http://your-server/?startFeature=featureIdOrTitle&destinationFeature=featureIdOrTitle&defaultPlace=placeIdOrTitle`

#### Required Data for 3D Polygons

As first there must be a MultiPolygon feature created which will be a polygon itself, it's also nice to have a label-line property in properties set. Label-line is just imaginary line alongside which poi title will be drawn. At last, you have to connect poi to polygon via adding its id to poi metadata like polygon_id property.

Polygon Feature Example:

```json
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

```json
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

```javascript
map.getMapboxInstance(); // this will return mapbox instance
```

##### Set active place

This method will set an active place, load floors etc. Have to be called after map is ready, see getMapReadyListener.

```javascript
// @param placeId {string} Id of the place to be set as active on map
// @param zoomIntoPlace {boolean} should zoom into active place, optional
// @param floorLevel {number} Level of the floor to be set as active on map, optional

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setPlace(myPlaceId);
});
```

##### Set active floor

Have to be called after map is ready, see getMapReadyListener.

###### by id

This method will set an active floor based on it's id.

```javascript
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setFloorById(myFloorId);
});
```

###### by level

This method will set an active floor based on it's level.

```javascript
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setFloorByLevel(0);
});
```

###### by way

This method will set an active floor based on the way of the next floor, e.g if we wanna go up or down.

```javascript
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setFloorByWay('up');
});
```

#### Set new kiosk settings

With this method you can override kiosk coordinates position and it's floor level

```javascript
const map = new Proximiio.Map({
  isKiosk: true,
  kioskSettings: {
    coordinates: [17.833135351538658, 48.60678469647394],
    level: 0,
  },
});
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setKiosk(48.606703739771774, 17.833092384506614, 1);
});
```

#### Set different bounding box padding

This method will set padding for zooming into bounding box of found route

```javascript
const map = new Proximiio.Map({
  fitBoundsPadding: 200,
});
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setBoundsPadding(50);
});
```

##### Find Route

###### by features id

This method will generate route based on selected features by their ids.

```javascript
// @param idTo {string} finish feature id
// @param idFrom {string} start feature id, optional for kiosk
// @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.findRouteByIds('idTo', 'idFrom');
});
```

###### by features title

This method will generate route based on selected features by their titles.

```javascript
// @param titleTo {string} finish feature title
// @param titleFrom {string} start feature title, optional for kiosk
// @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.findRouteByTitle('titleTo', 'titleFrom');
});
```

###### by coords

This method will generate route based on attached coords.

```javascript
// @param latTo {number} finish latitude coordinate
// @param lngTo {number} finish longitude coordinate
// @param levelTo {number} finish level
// @param latFrom {number} start latitude coordinate, optional for kiosk
// @param lngFrom {number} start longitude coordinate, optional for kiosk
// @param levelFrom {number} start level, optional for kiosk
// @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.findRouteByCoords(48.606703739771774, 17.833092384506614, 0, 48.60684545080579, 17.833450676669543, 0);
});
```

###### by coords

This method will generate route based on attached coords.

```javascript
// @param latTo {number} finish latitude coordinate
// @param lngTo {number} finish longitude coordinate
// @param levelTo {number} finish level
// @param latFrom {number} start latitude coordinate, optional for kiosk
// @param lngFrom {number} start longitude coordinate, optional for kiosk
// @param levelFrom {number} start level, optional for kiosk
// @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.findRouteByCoords(48.606703739771774, 17.833092384506614, 0, 48.60684545080579, 17.833450676669543, 0);
});
```

###### by nearest amenity feature

This method will generate route based on nearest amenity feature.

```javascript
// @param amenityId {string} amenity id of a nearest feature to look for
// @param idFrom {string} start feature id, optional for kiosk
// @param accessibleRoute {boolean} if true generated routed will be accessible without stairs, etc., optional

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.findRouteToNearestFeature('amenityId');
});
```

##### Cancel Route

Use this method to cancel generated route.

```javascript
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.cancelRoute();
});
```

##### Set navigation step

Use this method to set the current step for route navigation so map can focus on a proper path part.

```javascript
@param step { number | 'next' | 'previous' } Number of route part to focus on, you can use also strings next and previous

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.setNavStep('next');
});
```

##### Get turn by turn navigation object

Retrieves the turn by turn navigation object.

```javascript
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  const TBTNav = map.getTBTNav();
});
```

##### Center to route

This method will center the map to generated route bounds.

```javascript
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.centerToRoute();
});
```

##### Center to feature

This method will center the map to feature coordinates.

```javascript
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.centerToFeature('featureId');
});
```

##### Center to coordinates

This method will center the map to provided coordinates.

```javascript
// @param lat {number} latitude coordinate, required
// @param lng {number} longitude coordinate, required
// @param zoom {number} zoom level, optional, 18 as default

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.centerToCoordinates(48.60678469647394, 17.833135351538658, 20);
});
```

##### Toggle hidden poi visibility

This method will toggle hidden poi visibility based on the visibility param in poi properties.

```javascript
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.toggleHiddenPois();
});
```

##### Toggle raster floorplans visibility

This method will toggle raster floorplans visibility.

```javascript
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.toggleRasterFloorplans();
});
```

##### Set Features Highlight

Method for adding circle layer as a highlight for defined features.

```javascript
// @param features {string[]} array of feature ids to set highlight on, you can send empty array to remove highlights.
// @param color {string} highlight color, optional, default: '#000'.
// @param radius {number} highlight circle radius, optional, default: 50.
// @param blur {number} blur of the highlight circle, optional, default: 0.8.

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setFeaturesHighlight(['featureid']);
});
```

##### Add New Feature

Add new feature to map.

```javascript
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

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  const myFeature = map.addCustomFeature('myPOI', 0, 48.606703739771774, 17.833092384506614);
});
```

##### Update Feature

Update existing map feature.

```javascript
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

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  const myFeature = map.updateFeature('poiId', 'myPOI', 0, 48.606703739771774, 17.8330923845066);
});
```

##### Delete Feature

Delete existing map feature.

```javascript
// @param id {string} feature id
// @param isTemporary {boolean} will delete feature just temporary, it's not deleted from db, optional, default

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.deleteFeature('poiId');
});
```

##### Get list of added features

Retrieves the list of only newly added features.

```javascript
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  const features = map.getCustomFeaturesList();
});
```

##### Showing Person Icon

###### setPerson()

Method for setting a person icon on a Map, this method is resetting the previous state of all persons added before.

```javascript
// @param lat {number} latitude coordinate of person.
// @param lng {number} longitude coordinate of person.
// @param level {number} floor level of person.
// @param id {string | number} id of person, optional.

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setPerson(48.606703739771774, 17.833092384506614, 0);
});
```

###### upsertPerson()

Method for add/update person icon on a Map.

```javascript
// @param lat {number} latitude coordinate of person.
// @param lng {number} longitude coordinate of person.
// @param level {number} floor level of person.
// @param id {string | number} id of person, optional.

map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.upsertPerson(48.606703739771774, 17.833092384506614, 0, 'person-1');
});
```

##### Map Features Filtering

###### Setting new global filter

With this method you can filter features with any of it's properties, if the property key doesn't exists in the feature properties or it's value is the same as defined in options they will pass the filtering and will be visible on map.

```javascript
// param options { key: string; value: string } | null, define property key and value to filter features, optional, if null filtering will be disabled.

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setFiltering({ key: 'properties.metadata.exhibition', value: 'food' });
});
```

###### Setting new feature filter

With this method you set only defined poi feature to be visible, calling this method multiple times will set another feature to be visible without hiding the previous one, with inverted set to true defined feature will hide instead.

```javascript
// param query {string} id or title of the feature
// param inverted {boolean} when set to true, defined feature will hide, optional

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setFeatureFilter('myfeature');
});
```

###### Removing created feature filter

Method for removing previously created feature filters.

```javascript
// param query {string} id or title of the feature
// param inverted {boolean} have to be set to same value like it was in setFeatureFilter method, optional

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.removeFeatureFilter('myfeature');
});
```

###### Resetting all feature filters

Method for removing all active feature filters.

```javascript
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.resetFeatureFilters();
});
```

###### Hiding all pois features

Method for hiding all pois features on map.

```javascript
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.hidePois();
});
```

###### Hiding all icon layers

Method for hiding all icons on map.

```javascript
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.hideIcons();
});
```

###### Showing all icon layers

Method for show all icons on map.

```javascript
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.showIcons();
});
```

###### Refetching features

Method for refetching all pois features on map.

```javascript
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.refetch();
});
```

###### Setting new amenity filter

You'll be able to show features only for defined amenity id on map with this method, also with defining the category _(NOTE: you have to create them before with [setAmenitiesCategory()](#setting-new-amenities-category) method)_, filtering will be set only for defined array of amenities in the category. With category set, only one amenity filter can be active at the time, while without the category they stack so multiple amenities can be active. With inverted option set to true, defined amenity features will hide. Category and inverted options can't be defined at the same time.

```javascript
// param amenityId {string} only features of defined amenityId will be visible
// param category {string} id of the amenities category added via setAmenitiesCategory, optional, if defined filtering will be set only for defined array of amenities in same method
// param inverted {boolean} when set to true, defined amenity features will hide, optional

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setAmenityFilter('myamenity');
  // inverted method
  map.setAmenityFilter('myamenity', null, true);
});
```

###### Removing created amenity filter

Method for removing previously created amenity filters. In case amenity filter has been set with the category parameter, you have to use same param for removing the filter.

```javascript
// param amenityId {string} remove the filter for a defined amenityId
// param category {string} id of the amenities category added via setAmenitiesCategory, optional, if defined filtering will be removed only for defined array of amenities in same method
// param inverted {boolean} have to be set to same value like it was in setAmenityFilter method, optional

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.removeAmenityFilter('myamenity');
  // remove inverted method
  map.removeAmenityFilter('myamenity', null, true);
});
```

###### Resetting all amenity filters

Method for removing all active amenity filters.

```javascript
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.resetAmenityFilters();
});
```

###### Setting new amenities category

You can define your own categories of amenities, which you can then use for advanced filtering.

```javascript
// param id {string} category id, have to be used when calling setAmenityFilter() method as second param.
// param amenities {Array of strings} list of the amenities id

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.setAmenitiesCategory('shops', ['id1', 'id2']);
});
```

###### Removing amenities category

Method for removing previously created categories.

```javascript
// param id {string} category id.

const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.removeAmenitiesCategory('shops');
});
```

###### Resetting all amenity categories

Method for removing all active amenity categories.

```javascript
const map = new Proximiio.Map();
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
  map.resetAmenitiesCategory();
});
```

#### Available Listeners

##### Listen to map ready event

```javascript
map.getMapReadyListener().subscribe((ready) => {
  console.log('map ready', ready);
});
```

##### Listen to map failed event

```javascript
map.getMapFailedListener().subscribe((failed) => {
  console.log('map failed', failed);
});
```

##### Listen to place select event

```javascript
map.getPlaceSelectListener().subscribe((place) => {
  console.log('selected place', place);
});
```

##### Listen to floor select event

```javascript
map.getFloorSelectListener().subscribe((floor) => {
  console.log('selected floor', floor);
});
```

##### Listen to route found event

```javascript
map.getRouteFoundListener().subscribe((res) => {
  console.log('route found successfully', res.route);
  console.log('turn by turn text navigation output', res.TBTNav);
});
```

##### Listen to route failed event

```javascript
map.getRouteFailedListener().subscribe(() => {
  console.log('route not found');
});
```

##### Listen to route cancel event

```javascript
map.getRouteCancelListener().subscribe(() => {
  console.log('route cancelled');
});
```

##### Listen to step change event

```javascript
map.getNavStepSetListener().subscribe((step) => {
  console.log('step changed', step);
});
```

##### Listen to feature add event

```javascript
map.getFeatureAddListener().subscribe((feature) => {
  console.log('feature added', feature);
});
```

##### Listen to feature update event

```javascript
map.getFeatureUpdateListener().subscribe((feature) => {
  console.log('feature updated', feature);
});
```

##### Listen to feature delete event

```javascript
map.getFeatureDeleteListener().subscribe(() => {
  console.log('feature deleted');
});
```

##### Listen to polygon click event

```javascript
map.getPolygonClickListener().subscribe((poi) => {
  console.log('polygon clicked', poi);
});
```

##### Listen to poi click event

```javascript
map.getPoiClickListener().subscribe((poi) => {
  console.log('poi clicked', poi);
});
```

##### Listen to persons update event

```javascript
map.getPersonUpdateListener().subscribe((personsList) => {
  console.log('current persons', personsList);
});
```

### Select Component

Select component is generated using the [Autocomplete.js](https://tarekraafat.github.io/autoComplete.js) library. Optionally load [css file](assets/proximiio-js-library.css) into your project from assets folder, feel free to fit it to your requirements.

To generate select widget, create input element with id param defined, for styling please assign also class param.

```html
<input id="proximiioSelect" class="proximiio-select" type="text" tabindex="1" />
```

Now you can call

```javascript
// @param dataset { Datasets } predefined proximi.io dataset to search on, could be Places | Floors | Pois
// @param options { AutocompleteOptions } autocomplete.js options, check https://tarekraafat.github.io/autoComplete.js/#/configuration for more info
// @param useApiSearch { boolean } use this option if you want to use api to filter the results, necessary if you have 100+ places | floors.

const select = new Proximiio.Select('Places', {
  placeHolder: 'Pick the place',
  resultItem: { highlight: { render: true } },
});
```

### ImageDetection Component

ImageDetection component is useful for detecting nearby poi from user camera device output. It's using Google Vision Cloud REST API to analyze the image.

```javascript
// @param options
// @param options.gVisionApiKey {string}, required, your Google Vision Cloud Api key
// @param options.pois {SortedPoiItemModel[]}, required, pois list to compare Google Vision results with
// @param options.captureButtonText {string}, optional, capture button text content
// @param options.closeButtonText {string}, optional, close button text content
// @param options.noResultsText {string}, optional, no results from Google Vision text content
// @param options.resultsHeadingText {string}, optional, results heading text content
// @param options.returnResults {number}, optional, number of results to show from comparing function
// @callback return selected poi.

import { ImageDetection } from 'proximiio-js-library';

ImageDetection.init(
  {
    gVisionApiKey: import.meta.env.VITE_WAYFINDING_GVISION_APIKEY,
    pois,
  },
  (item) => {
    const feature = features.find((f) => f.id === item.id);
    if (feature) {
      setRouteStart(feature);
    }
  },
);
```

#### Available Listeners

##### Listen to select event

```javascript
select.getSelectListener().subscribe((place) => {
  console.log('place selected', place);
});
```

## Available fonts

- Amiri Bold
- Amiri Bold Slanted
- Amiri Regular
- Amiri Slanted
- Klokantech Noto Sans Bold
- KlokanTech Noto Sans Bold
- Klokantech Noto Sans CJK Bold
- KlokanTech Noto Sans CJK Bold
- Klokantech Noto Sans CJK Regular
- Klokantech Noto Sans Italic
- KlokanTech Noto Sans Italic
- Klokantech Noto Sans Regular
- KlokanTech Noto Sans Regular
- NeutraText-DemiSCAlt
- Noto Sans Bold
- Noto Sans Bold Italic
- Noto Sans Italic
- Noto Sans Regular
- Noto Sans Arabic Regular
- Noto Sans Arabic Bold
- Open Sans Bold
- Open Sans Italic
- Open Sans Regular
- Open Sans Regular,Arial Unicode MS Regular
- Open Sans Semibold
- Open Sans Semibold Italic
- Quicksand Regular
- Quicksand Bold
- Quicksand Regular,Noto Sans Arabic Regular
- Quicksand Bold,Noto Sans Arabic Bold

## Examples

### Generate route on map with select components

JS

```javascript
// initiate map component
const map = new Proximiio.Map();

// listen to event when map component is loaded
map.getMapReadyListener().subscribe(() => {
  let fromPoi = null;
  let toPoi = null;

  // initiate select component for starting point
  const fromPoiSelect = new Proximiio.Select('Pois', {
    placeHolder: 'Pick the start poi',
    highlight: true,
    selector: '#from-poi-select',
  });

  // listen to event when something is selected
  fromPoiSelect.getSelectListener().subscribe((poi) => {
    fromPoi = poi;
    map.centerToFeature(poi.id); // optional, this will centerize map to selected point
    console.log('from poi selected', poi);
    // generate route in case both start and end points are available
    if (fromPoi && toPoi) {
      map.findRouteByIds(fromPoi.id, toPoi.id);
    }
  });

  // initiate select component for ending point
  const toPoiSelect = new Proximiio.Select('Pois', {
    placeHolder: 'Pick the end poi',
    highlight: true,
    selector: '#to-poi-select',
  });

  // listen to event when something is selected
  toPoiSelect.getSelectListener().subscribe((poi) => {
    toPoi = poi;
    map.centerToFeature(poi.id); // optional, this will centerize map to selected point
    console.log('to poi selected', poi);
    // generate route in case both start and end points are available
    if (fromPoi && toPoi) {
      map.findRouteByIds(fromPoi.id, toPoi.id);
    }
  });
});
```

HTML

```html
<input id="from-poi-select" class="proximiio-select" type="text" tabindex="1" />
<input id="to-poi-select" class="proximiio-select" type="text" tabindex="1" />
```

### Adding new features and updating their positions

We are using some variables and turf to generate static data for demo purposes, you probably want to use your own api for that instead but the core idea of using `map.addCustomFeature()` to add feature to map and `map.updateFeature()` to update them, remains the same.

JS

```javascript
// lets assume you have a list of custom poi features
const customPoiList = [
  {
    id: 'custom-poi-1',
    title: 'Custom Poi',
    level: 0,
  },
  {
    id: 'custom-poi-2',
    title: 'Custom Poi 2',
    level: 0,
  },
  {
    id: 'custom-poi-3',
    title: 'Custom Poi 3',
    level: 0,
  },
  {
    id: 'custom-poi-4',
    title: 'Custom Poi 4',
    level: 0,
  },
  {
    id: 'custom-poi-5',
    title: 'Custom Poi 5',
    level: 0,
  },
];

// initiate map component
const map = new Proximiio.Map();

// listen to event when map component is loaded
map.getMapReadyListener().subscribe((res) => {
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

```html
<div id="proximiioMap" style="height: 500px;"></div>
```

## Build

In case of any changes of library itself (means at `./src` folder), you can rebuild with

```bash
npm run build
```
