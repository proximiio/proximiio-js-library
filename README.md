# Proximi.io JS Library

## Getting work

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
Install with npm and then import with
```
import Proximiio from 'proximiio-js-library/lib/index'
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
    allowNewFeatures: false, // optional, if true, you'll be able to add new features via modal dialog, default false
    newFeatureEvent: 'click' // optional, choose which event should open the modal for adding new features (should be map event https://docs.mapbox.com/mapbox-gl-js/api/map/#map-events), default 'click'
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
map.getRouteFoundListener().subscribe(() => {
   console.log('route found successfully');
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

### Select Component

Select component is generated using the [Autocomplete.js](https://tarekraafat.github.io/autoComplete.js) library. Optionally load [css file](assets/proximiio-js-library.css) into your project from assets folder, feel free to fit it to your requirements.

To generate select widget, create input element with id param defined, for styling please assign also class param.
```
<input id="proximiioSelect" class="proximiio-select" type="text" tabIndex="1"/>
```
Now you can call 
```
// @param dataset { Datasets } predefined proximi.io dataset to search on, could be Places | Floors | Pois
// @param options { AutocompleteOptions } autocomplete.js options, check https://tarekraafat.github.io/autoComplete.js/#/?id=api-configuration for more info
// @param useApiSearch { boolean } use this option if you want to use api to filter the results, necessary if you have 100+ places | floors.

const select = new Proximiio.Select('Places', { placeHolder: 'Pick the place', highlight: true });
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
