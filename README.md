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
npm install https://github.com/proximiio/proximiio-js-library
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
});
```
#### Available Methods

##### Get the mapbpox instance
```
map.getMapboxInstance(); // this will return mapbox instance
```

##### Set active place
This method will set an active place, load floors etc. Have to be called after map is ready, see getMapReadyListener.
```
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

##### Find Route

###### by features id
This method will generate route based on selected features by their ids.
```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.findRouteByIds('startId', 'finishId);
});
```
###### by features title
This method will generate route based on selected features by their titles.
```
map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.findRouteByTitle('myFeatureTitle', 'anotherFeatureTitle');
});
```

###### by coords
This method will generate route based on attached coords.
```
// @param latFrom {number} start latitude coordinate
// @param lngFrom {number} start longitude coordinate
// @param levelFrom {number} start level
// @param latTo {number} finish latitude coordinate
// @param lngTo {number} finish longitude coordinate
// @param levelTo {number} finish level

map.getMapReadyListener().subscribe(ready => {
   console.log('map ready', ready);
   map.findRouteByCoords(48.606703739771774, 17.833092384506614, 0, 48.60684545080579, 17.833450676669543, 0);
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
