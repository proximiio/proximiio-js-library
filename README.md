# Proximi.io JS Library

JavaScript library for [Proximi.io](https://proximi.io) – indoor maps, wayfinding and data access.

- [Installation](#installation)
- [Quick start](#quick-start)
- [Authentication](#authentication)
- [Places and floors](#places-and-floors)
- [Map component](#map-component)
  - [Setup](#setup)
  - [Options](#options)
  - [Methods](#methods)
  - [Listeners](#listeners)
  - [Styling the route](#styling-the-route)
  - [URL params](#url-params)
  - [3D polygons data](#3d-polygons-data)
- [Select component](#select-component)
- [ImageDetection component](#imagedetection-component)
- [Available fonts](#available-fonts)
- [Examples](#examples)
- [Development](#development)

## Installation

### npm (React, Angular, Vue, …)

```bash
npm install proximiio-js-library
```

```javascript
import Proximiio from 'proximiio-js-library';
```

### Browser

Load the script from the CDN or from the `lib` folder of this repository.

```html
<script src="https://proximiiojs.ams3.cdn.digitaloceanspaces.com/latest/proximiio.js"></script>
<!-- or -->
<script src="lib/proximiio.js"></script>
```

> In the browser build the library is exposed as `Proximiio.default`, e.g. `Proximiio.default.Auth.login(...)`. All other examples in this document use the module syntax `Proximiio.Auth.login(...)`.

### node.js

```javascript
const Proximiio = require('lib/index').default;
```

## Quick start

```html
<link href="https://unpkg.com/maplibre-gl/dist/maplibre-gl.css" rel="stylesheet" />
<div id="proximiioMap"></div>
```

```javascript
import Proximiio from 'proximiio-js-library';

await Proximiio.Auth.loginWithToken('YOUR_TOKEN');

const map = new Proximiio.Map({
  defaultPlaceId: 'my_place_id',
  defaultFloorLevel: 0,
});

map.getMapReadyListener().subscribe(() => {
  map.findRouteByIds('destinationFeatureId', 'startFeatureId');
});
```

## Authentication

A successful log in is required before calling any other method, so run it as soon as possible.

```javascript
// with email and password
Proximiio.Auth.login('email', 'password');

// with token, verifies the token and loads the current user
Proximiio.Auth.loginWithToken('token');

// with token, only sets the token for following requests without verifying it
Proximiio.Auth.setToken('token');

// get config data of the logged in user
Proximiio.Auth.getUserConfig();
```

## Places and floors

```javascript
Proximiio.Places.getPlaces();
Proximiio.Floors.getFloors();
```

Both list calls accept these optional arguments, in this order:

| Argument        | Type     | Description                                   |
| --------------- | -------- | --------------------------------------------- |
| `limit`         | `number` | total results to return                       |
| `skip`          | `number` | how many results to skip from the beginning   |
| `order`         | `string` | field to order results by, e.g. `'createdAt'` |
| `dir`           | `string` | order direction, `'asc'` or `'desc'`          |
| `filterByIndex` | `string` | field used for filtering, e.g. `'name'`       |
| `q`             | `string` | query to filter by                            |

## Map component

### Setup

The map is rendered with [MapLibre GL](https://maplibre.org/maplibre-gl-js/docs/), load its css in your `<head>`:

```html
<link href="https://unpkg.com/maplibre-gl/dist/maplibre-gl.css" rel="stylesheet" />
```

Create a container element and a map instance:

```html
<div id="proximiioMap"></div>
```

```javascript
const map = new Proximiio.Map({
  // options, see below, all of them are optional
});
```

### Options

- [General](#general)
- [Data](#data)
- [POIs](#pois)
- [Kiosk](#kiosk)
- [Routing](#routing)
- [Route animation](#route-animation)
- [Custom position](#custom-position)
- [Polygons](#polygons)
- [Raster tiles and floorplans](#raster-tiles-and-floorplans)
- [Geolocation](#geolocation)
- [URL params handling](#url-params-handling)
- [Adding features via modal](#adding-features-via-modal)
- [Deprecated](#deprecated)

#### General

| Option                 | Type                       | Default           | Description                                                                                                                                             |
| ---------------------- | -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `selector`             | `string`                   | `'proximiioMap'`  | id of the map container                                                                                                                                 |
| `mapboxOptions`        | `object`                   |                   | MapLibre map options like `center` or `zoom`, see [map options](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/)                  |
| `defaultPlaceId`       | `string`                   | first place found | place shown on load                                                                                                                                     |
| `defaultFloorLevel`    | `number`                   | `0`               | floor level shown on load                                                                                                                               |
| `zoomIntoPlace`        | `boolean`                  | `true`            | center and zoom into the default place location                                                                                                         |
| `zoomLevel`            | `number`                   |                   | initial zoom level, overrides the zoom defined in the style and in `mapboxOptions`                                                                      |
| `language`             | `string`                   | `'en'`            | language of POI titles and UI texts, can be changed later with [`setLanguage()`](#map-instance)                                                         |
| `fitBoundsPadding`     | `number \| PaddingOptions` | `250`             | padding in pixels added to the bounds of a found route, see [PaddingOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PaddingOptions/) |
| `minFitBoundsDistance` | `number`                   | `15`              | minimum route length in meters to zoom into its bounds, shorter routes only change the map center                                                       |
| `showPaths`            | `boolean`                  | `false`           | show routing paths on the map                                                                                                                           |
| `pmTilesUrl`           | `string`                   |                   | url of a [PMTiles](https://docs.protomaps.com/pmtiles/) archive, registers the `pmtiles://` protocol so the style can use it as a source                |

#### Data

| Option              | Type                                                           | Default | Description                                                                                                                                                                                                                                      |
| ------------------- | -------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apiPaginate`       | `boolean`                                                      | `false` | fetch map features from the API with a parallel request queue                                                                                                                                                                                    |
| `bundleUrl`         | `string`                                                       |         | fetch map data from this url instead of the API                                                                                                                                                                                                  |
| `bundlePaginate`    | `boolean`                                                      | `false` | fetch map features from `bundleUrl` with a parallel request queue                                                                                                                                                                                |
| `localSources`      | `{ features?: FeatureCollection, amenities?: AmenityModel[] }` |         | use these features and amenities instead of fetching them, a source is used only when it isn't empty                                                                                                                                             |
| `featuresMaxBounds` | `[[lng, lat], [lng, lat]]`                                     |         | only features within these bounds (top left, bottom right) are fetched, e.g. `[[-73.9876, 40.7661], [-73.9397, 40.8002]]`                                                                                                                        |
| `useTimerangeData`  | `boolean`                                                      | `false` | show only features within the time range defined in `metadata.dateStart` and `metadata.dateEnd`                                                                                                                                                  |
| `defaultFilter`     | `{ key: string, value: string, hideIconOnly?: boolean }`       |         | when a feature contains `key`, it's visible only if its value equals `value`, features without the key are always visible; with `hideIconOnly` non-matching features stay on the map with a hidden icon; see also [`setFiltering()`](#filtering) |

#### POIs

| Option                    | Type                   | Default | Description                                                                                                  |
| ------------------------- | ---------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `considerVisibilityParam` | `boolean`              | `true`  | POIs with `visibility: 'hidden'` property are hidden, toggle them with [`toggleHiddenPois()`](#style)        |
| `hiddenAmenities`         | `string[]`             |         | amenity ids whose POI labels and icons are hidden, polygons stay functional                                  |
| `amenityIdProperty`       | `string`               |         | feature property used as amenity id, so POI icons can be initialized by a different param, e.g. `'title'`    |
| `poiIconSize`             | `number \| expression` |         | `icon-size` of the POI icons layer, e.g. `['interpolate', ['exponential', 0.5], ['zoom'], 17, 0.1, 22, 0.5]` |
| `disableUnavailablePois`  | `boolean`              | `false` | POIs with `available: false` property can't be clicked                                                       |

#### Kiosk

Kiosk mode adds a point at the kiosk coordinates and uses it as the start of every route.

| Option          | Type      | Default | Description         |
| --------------- | --------- | ------- | ------------------- |
| `isKiosk`       | `boolean` | `false` | enable kiosk mode   |
| `kioskSettings` | `object`  |         | see the table below |

`kioskSettings`

| Option         | Type                 | Default        | Description                               |
| -------------- | -------------------- | -------------- | ----------------------------------------- |
| `coordinates`  | `[number, number]`   |                | kiosk point coordinates `[lng, lat]`      |
| `level`        | `number`             |                | floor level of the kiosk point            |
| `showPoint`    | `boolean`            |                | show the kiosk point on the map           |
| `pointColor`   | `string`             | `'189,82,255'` | RGB values of the point color             |
| `pointOutline` | `boolean`            |                | draw an outline around the point          |
| `showLabel`    | `boolean`            | `false`        | show 'You are here' label under the point |
| `labelFont`    | `string \| string[]` | system fonts   | css `font-family` of the label            |
| `parkingKiosk` | `boolean`            |                | parking kiosk, polygons can't be clicked  |

Kiosk position can be changed later with [`setKiosk()`](#kiosk-and-camera).

#### Routing

| Option                          | Type                      | Default  | Description                                                                                                                                                                                                               |
| ------------------------------- | ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stepsNavigation`               | `string`                  | `'full'` | turn-by-turn navigation returned in the route found listener, one of `'disabled'`, `'simple'`, `'simple-levelChangers'`, `'full'`, `'full-levelChangers'`, `'landmark'`, `'landmark-levelChangers'`                       |
| `routeWithDetails`              | `boolean`                 | `true`   | include details (distance and duration) in the route found listener response                                                                                                                                              |
| `routeColor`                    | `string`                  |          | route line color, see [Styling the route](#styling-the-route)                                                                                                                                                             |
| `routeGradient`                 | `ExpressionSpecification` |          | route line gradient, overrides `routeColor`, see [Styling the route](#styling-the-route)                                                                                                                                  |
| `showLevelDirectionIcon`        | `boolean`                 | `false`  | show an arrow at level changers indicating the direction of the level change                                                                                                                                              |
| `levelDirectionPopupImage`      | `string`                  | built-in | base64 image of the level direction popup                                                                                                                                                                                 |
| `levelDirectionOutlineColor`    | `string`                  | `'#000'` | outline color of the level direction icon                                                                                                                                                                                 |
| `forceFloorLevel`               | `number`                  |          | show the whole route on this single level                                                                                                                                                                                 |
| `blockFeatureClickWhileRouting` | `boolean`                 | `false`  | disable clicking on POIs while a route is shown                                                                                                                                                                           |
| `useWorkingHours`               | `boolean`                 | `false`  | avoid paths closed according to their working hours (`properties._workingHoursEnabled` + `properties.workingHours`), evaluated against the device local time; paths with `properties.available: false` are always avoided |
| `excludeClosedPois`             | `boolean`                 | `false`  | together with `useWorkingHours`, refuse routes to destination POIs that are currently closed                                                                                                                              |
| `sendAnalytics`                 | `boolean`                 | `true`   | send routing analytics to the Proximi.io API                                                                                                                                                                              |

#### Route animation

| Option                                 | Type      | Default | Description                                                                                                                       |
| -------------------------------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `routeAnimation`                       | `object`  |         | see the table below                                                                                                               |
| `autoLevelChange`                      | `boolean` | `false` | when the animation of a route part ends, continue to the next part (e.g. the next floor) after `routeAnimation.autoContinueDelay` |
| `autoRestartAnimationAfterFloorChange` | `boolean` | `false` | restart the animation after continuing to the next route part                                                                     |

`routeAnimation`

General

| Option               | Type      | Default  | Description                                                                                                     |
| -------------------- | --------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| `enabled`            | `boolean` | `false`  | animate the route                                                                                               |
| `type`               | `string`  | `'dash'` | `'dash'` dashed line animation, `'point'` point moving along the route, `'puck'` 3D puck moving along the route |
| `autoStart`          | `boolean` | `true`   | start the animation when a route is found                                                                       |
| `autoRestart`        | `boolean` | `true`   | restart the animation after a floor change                                                                      |
| `looping`            | `boolean` | `true`   | loop the animation                                                                                              |
| `durationMultiplier` | `number`  | `1`      | animation duration per meter is multiplied by this value, higher value = slower animation                       |
| `duration`           | `number`  |          | fixed animation duration of each route part in seconds, overrides `durationMultiplier` (`'point'` and `'puck'`) |
| `fps`                | `number`  | `120`    | maximum number of animation updates per second (`'point'` and `'puck'`)                                         |
| `minzoom`            | `number`  | `17`     | minimum zoom level the animation is visible at                                                                  |
| `maxzoom`            | `number`  | `24`     | maximum zoom level the animation is visible at                                                                  |

Camera

| Option                | Type      | Default | Description                                                              |
| --------------------- | --------- | ------- | ------------------------------------------------------------------------ |
| `followRoute`         | `boolean` | `true`  | move the map center along with the animation                             |
| `followRouteAngle`    | `boolean` | `false` | rotate the camera along with the route                                   |
| `cameraUseLerp`       | `boolean` | `false` | smooth camera movement with linear interpolation                         |
| `cameraLerpTolerance` | `number`  | `0.05`  | interpolation factor of the camera movement, lower = smoother but slower |

Point and puck

| Option                | Type      | Default               | Description                                               |
| --------------------- | --------- | --------------------- | --------------------------------------------------------- |
| `pointColor`          | `string`  | `'#1d8a9f'`           | color of the animated point                               |
| `pointRadius`         | `number`  | `8`                   | radius of the animated point                              |
| `pointIconUrl`        | `string`  |                       | url of an icon displayed instead of the circle point      |
| `pointIconSize`       | `number`  | `1`                   | scale factor of the icon                                  |
| `pointIconAsMarker`   | `boolean` |                       | render the icon as a HTML marker instead of a map layer   |
| `pointIconMarkerSize` | `number`  | `40`                  | marker size in pixels when `pointIconAsMarker` is enabled |
| `iconUseLerp`         | `boolean` | `false`               | smooth icon movement with linear interpolation            |
| `iconLerpTolerance`   | `number`  | `0.1`                 | interpolation factor of the icon movement                 |
| `puckColor`           | `string`  | `'rgb(189, 82, 255)'` | color of the puck                                         |
| `puckRadius`          | `number`  | `0.002`               | radius of the puck in kilometers                          |
| `puckHeight`          | `number`  | `1.5`                 | height of the puck in meters                              |

Line

| Option                       | Type      | Default     | Description                                                                      |
| ---------------------------- | --------- | ----------- | -------------------------------------------------------------------------------- |
| `lineColor`                  | `string`  | `'#6945ed'` | color of the animated line                                                       |
| `lineWidth`                  | `number`  | `5`         | width of the animated line                                                       |
| `lineOpacity`                | `number`  | `0.6`       | opacity of the animated line                                                     |
| `lineProgress`               | `boolean` | `false`     | color the line by route progress: red below 30 %, orange below 60 %, green above |
| `dashKeepOriginalRouteLayer` | `boolean` | `false`     | keep the original route line under the dash animation                            |
| `showTailSegment`            | `boolean` | `false`     | with a custom position, connect the route line to the current position           |

Steps

| Option                  | Type      | Default | Description                                                                                 |
| ----------------------- | --------- | ------- | ------------------------------------------------------------------------------------------- |
| `autoContinue`          | `boolean` | `true`  | automatically continue to the next step                                                     |
| `autoContinueCityRoute` | `boolean` | `false` | automatically continue to the next step of a city route                                     |
| `autoContinueDelay`     | `number`  | `2000`  | delay in milliseconds before continuing to the next step                                    |
| `stepChangeThreshold`   | `number`  | `5`     | with a custom position, distance in meters from a step at which it becomes the current step |
| `stepChangeOnlyForward` | `boolean` | `false` | with a custom position, steps can only move forward                                         |
| `showCompassDirection`  | `boolean` | `false` | show the heading direction icon at the custom position                                      |

City and combined routes

| Option                     | Type     | Default | Description                                                          |
| -------------------------- | -------- | ------- | -------------------------------------------------------------------- |
| `cityPointIconUrl`         | `string` |         | icon displayed on city route parts instead of `pointIconUrl`         |
| `cityRouteSpeedMultiplier` | `number` | `5`     | city route animation is this many times faster                       |
| `cityRouteMaxDuration`     | `number` | `5`     | maximum duration of a city route animation in seconds                |
| `cityRouteZoom`            | `number` | `15`    | zoom level when switching to a city route part                       |
| `mallRouteZoom`            | `number` | `18`    | zoom level when switching to a mall route part                       |
| `mallEntryLevel`           | `number` | `0`     | floor level assigned to coordinates used in city and combined routes |

#### Custom position

Options for positions set with [`setCustomPosition()`](#custom-position-1), e.g. from your own positioning system.

| Option                  | Type     | Default | Description         |
| ----------------------- | -------- | ------- | ------------------- |
| `customPositionOptions` | `object` |         | see the table below |

`customPositionOptions`

| Option                           | Type                                     | Default           | Description                                                                                          |
| -------------------------------- | ---------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| `arrivalThreshold`               | `number`                                 | `3`               | distance in meters from the destination at which [`getArrivalListener()`](#listeners) emits          |
| `minDistanceToChange`            | `number`                                 | `2`               | minimum movement in meters to update the position, `0` updates on every change                       |
| `aggregatePositionsLimit`        | `number`                                 | `0`               | number of positions collected before one aggregated position is applied                              |
| `aggregationResult`              | `'center' \| 'nearest'`                  | `'center'`        | aggregated position is the center of collected positions, or the one nearest to the current position |
| `disableAggregationWhileRouting` | `boolean`                                | `false`           | apply every position immediately while a route is shown                                              |
| `aggregateFloorChange`           | `boolean`                                | `true`            | change floor only after the new level is reported `aggregateFloorChangeLimit` times                  |
| `aggregateFloorChangeLimit`      | `number`                                 | `3`               | number of reports required to change floor                                                           |
| `floorChangeCooldown`            | `number`                                 | `5000`            | minimum time in milliseconds between floor changes                                                   |
| `snappingRule`                   | `'always' \| 'while-routing' \| 'never'` | `'while-routing'` | when the position snaps to the route line (while routing) or to the nearest path (always)            |
| `snapDistanceLimit`              | `number`                                 | `5`               | maximum snapping distance in meters, `0` disables snapping                                           |
| `enableAnimation`                | `boolean`                                | `true`            | animate the position icon between positions                                                          |
| `animationMinDuration`           | `number`                                 | `300`             | minimum animation duration in milliseconds                                                           |
| `animationMaxDuration`           | `number`                                 | `3000`            | maximum animation duration in milliseconds                                                           |
| `animationDurationPerMeter`      | `number`                                 | `50`              | animation duration added per meter of movement                                                       |

#### Polygons

Features can be displayed as 3D polygons with hover and click effects, see [3D polygons data](#3d-polygons-data) for the required data.

| Option            | Type       | Default | Description                                                                                                              |
| ----------------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `initPolygons`    | `boolean`  | `false` | enable polygons, applied to features of type `'shop'`, use `polygonLayers` for other types                               |
| `polygonsOptions` | `object`   |         | default look and behavior of polygons, see the tables below                                                              |
| `polygonLayers`   | `object[]` |         | feature types displayed as polygons, each item accepts all `polygonsOptions` properties plus the ones in the table below |

Polygons have these states: _default_, _hover_, _selected_, _active_ (the POI matches an active [amenity filter](#amenity-filters), falls back to _hover_ values when not set) and _disabled_ (another polygon is selected, see `handleDisabledPolygons`).

`polygonsOptions` – colors and height

| Option                  | Type     | Default     | Description                  |
| ----------------------- | -------- | ----------- | ---------------------------- |
| `defaultPolygonColor`   | `string` | `'#dbd7e8'` | polygon color                |
| `hoverPolygonColor`     | `string` | `'#a58dfa'` | polygon color on hover       |
| `selectedPolygonColor`  | `string` | `'#6945ed'` | polygon color when selected  |
| `activePolygonColor`    | `string` |             | polygon color when active    |
| `disabledPolygonColor`  | `string` | `'#ccc'`    | polygon color when disabled  |
| `defaultLabelColor`     | `string` | `'#6945ed'` | label color                  |
| `hoverLabelColor`       | `string` | `'#fff'`    | label color on hover         |
| `selectedLabelColor`    | `string` | `'#fff'`    | label color when selected    |
| `activeLabelColor`      | `string` |             | label color when active      |
| `disabledLabelColor`    | `string` | `'#8e8e8e'` | label color when disabled    |
| `defaultPolygonHeight`  | `number` | `3`         | polygon height in meters     |
| `hoverPolygonHeight`    | `number` | `3`         | polygon height on hover      |
| `selectedPolygonHeight` | `number` | `3`         | polygon height when selected |
| `activePolygonHeight`   | `number` |             | polygon height when active   |
| `disabledPolygonHeight` | `number` | `3`         | polygon height when disabled |
| `base`                  | `number` | `0`         | polygon base in meters       |
| `opacity`               | `number` | `1`         | polygon opacity              |

`polygonsOptions` – zoom

| Option         | Type     | Default | Description                    |
| -------------- | -------- | ------- | ------------------------------ |
| `minZoom`      | `number` | `17`    | minimum zoom level of polygons |
| `maxZoom`      | `number` | `24`    | maximum zoom level of polygons |
| `labelMinZoom` | `number` | `17`    | minimum zoom level of labels   |
| `labelMaxZoom` | `number` | `24`    | maximum zoom level of labels   |
| `iconMinZoom`  | `number` | `17`    | minimum zoom level of icons    |
| `iconMaxZoom`  | `number` | `24`    | maximum zoom level of icons    |

`polygonsOptions` – labels and icons

Most label options map to MapLibre [symbol layer](https://maplibre.org/maplibre-style-spec/layers/#symbol) properties.

| Option                    | Type                                                | Default                                       | Description                                                                                           |
| ------------------------- | --------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `textFont`                | `string[]`                                          | `['Quicksand Bold', 'Noto Sans Arabic Bold']` | label font stack, see [Available fonts](#available-fonts)                                             |
| `labelFontSize`           | `number \| expression`                              | interpolated by zoom and polygon size         | label font size                                                                                       |
| `labelHaloColor`          | `string`                                            | `'#000000'`                                   | `text-halo-color`                                                                                     |
| `labelHaloWidth`          | `number`                                            | `0`                                           | `text-halo-width`                                                                                     |
| `labelHaloBlur`           | `number`                                            | `0`                                           | `text-halo-blur`                                                                                      |
| `labelMaxWidth`           | `number`                                            | `7`                                           | `text-max-width`                                                                                      |
| `labelLineHeight`         | `number`                                            | `1.2`                                         | `text-line-height`                                                                                    |
| `labelLetterSpacing`      | `number`                                            | `0.005`                                       | `text-letter-spacing`                                                                                 |
| `labelAnchor`             | `string`                                            | `'center'`                                    | `text-anchor`, e.g. `'center'`, `'top'`, `'bottom-left'`                                              |
| `labelAllowOverlap`       | `boolean`                                           | `true`                                        | `text-allow-overlap`                                                                                  |
| `labelIgnorePlacement`    | `boolean`                                           | `true`                                        | `text-ignore-placement`                                                                               |
| `labelRotationAlignment`  | `'map' \| 'viewport' \| 'viewport-glyph' \| 'auto'` | `'auto'`                                      | `text-rotation-alignment` and `icon-rotation-alignment`                                               |
| `symbolPlacement`         | `'point' \| 'line' \| 'line-center'`                | `'line-center'`                               | label placement relative to its geometry                                                              |
| `iconPlacement`           | `'point' \| 'line' \| 'line-center'`                | `'line-center'`                               | icon placement relative to its geometry                                                               |
| `autoLabelLines`          | `boolean`                                           | `true`                                        | generate a label line from the longest polygon border when `label-line` is not defined in the feature |
| `adaptiveLabelOpacity`    | `boolean`                                           | `false`                                       | decrease label opacity with increasing map pitch                                                      |
| `adaptiveMaxPitch`        | `number`                                            | `30`                                          | maximum pitch at which labels are visible when `adaptiveLabelOpacity` is enabled                      |
| `iconImage`               | `string \| expression`                              | `['get', 'id']`                               | `icon-image` of polygon icons, e.g. `'{amenity}'`                                                     |
| `iconImageDefaultVisible` | `boolean`                                           | `true`                                        | show the polygon icon by default, when `false` it's visible only on hover, selected or active         |

`polygonsOptions` – behavior

| Option                        | Type       | Default | Description                                                                                 |
| ----------------------------- | ---------- | ------- | ------------------------------------------------------------------------------------------- |
| `removeOriginalPolygonsLayer` | `boolean`  | `true`  | remove the original `proximiio-<featureType>` style layer                                   |
| `handleDisabledPolygons`      | `boolean`  | `true`  | switch other polygons to the disabled state when a polygon is selected                      |
| `drawRouteUnderPolygons`      | `boolean`  | `false` | draw the route line under polygons, applies with route animation type `'point'` or `'puck'` |
| `bufferDistance`              | `number`   |         | grow (positive) or shrink (negative) polygons of `typesToScale` by this distance in meters  |
| `typesToScale`                | `string[]` |         | feature types scaled by `bufferDistance`                                                    |

`polygonLayers` item

| Option                | Type      | Default      | Description                                                                                          |
| --------------------- | --------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `featureType`         | `string`  |              | **required**, feature type displayed as polygons                                                     |
| `layerId`             | `string`  | `'polygons'` | prefix of the created layers (`<layerId>-custom`, `<layerId>-labels`, `<layerId>-icons`)             |
| `autoAssign`          | `boolean` | `true`       | connect POIs located inside a polygon automatically, when `false` only `metadata.polygon_id` is used |
| `initOnLevelchangers` | `boolean` | `false`      | connect level changer POIs to polygons too                                                           |

```javascript
polygonLayers: [
  // default polygonsOptions applied to features of type 'shop'
  { featureType: 'shop' },

  // custom color for features of type 'parking_spot'
  { featureType: 'parking_spot', defaultPolygonColor: '#000000' },

  // separate layers for anchor shops, icons visible only on interaction
  { featureType: 'anchor-shop', layerId: 'anchors', iconImageDefaultVisible: false },
],
```

#### Raster tiles and floorplans

| Option                 | Type      | Default | Description                                                        |
| ---------------------- | --------- | ------- | ------------------------------------------------------------------ |
| `useRasterTiles`       | `boolean` | `false` | add a raster tile source and layer defined by `rasterTilesOptions` |
| `rasterTilesOptions`   | `object`  |         | see the table below                                                |
| `showRasterFloorplans` | `boolean` | `false` | show raster floorplans                                             |

`rasterTilesOptions`

| Option        | Type                         | Default                                  | Description                                   |
| ------------- | ---------------------------- | ---------------------------------------- | --------------------------------------------- |
| `tilesUrl`    | `string[]`                   |                                          | **required**, tile urls                       |
| `tileSize`    | `number`                     | `256`                                    |                                               |
| `minZoom`     | `number`                     | `15`                                     |                                               |
| `maxZoom`     | `number`                     | `22`                                     |                                               |
| `bounds`      | `[west, south, east, north]` | style metadata or `[-180, -90, 180, 90]` | area the tiles are loaded for                 |
| `beforeLayer` | `string`                     | `'proximiio-shop'`                       | layer id the raster layer is inserted before  |
| `attribution` | `string`                     |                                          |                                               |
| `useProxy`    | `boolean`                    |                                          | load tiles through the Proximi.io image proxy |

#### Geolocation

| Option                      | Type      | Default | Description                                                               |
| --------------------------- | --------- | ------- | ------------------------------------------------------------------------- |
| `useGpsLocation`            | `boolean` | `false` | detect user location with the geolocation API and use it as a route start |
| `geolocationControlOptions` | `object`  |         | see the table below                                                       |

`geolocationControlOptions`

| Option        | Type               | Default       | Description                                                                        |
| ------------- | ------------------ | ------------- | ---------------------------------------------------------------------------------- |
| `autoTrigger` | `boolean`          | `true`        | enable geolocation automatically                                                   |
| `autoLocate`  | `boolean`          | `true`        | focus the map on the user location automatically                                   |
| `position`    | `string`           | `'top-right'` | control position, `'top-left'`, `'top-right'`, `'bottom-left'` or `'bottom-right'` |
| `zoom`        | `number`           | `17`          | zoom level when focusing the user location                                         |
| `maxBounds`   | `LngLatBoundsLike` |               | locations outside these bounds are ignored                                         |

#### URL params handling

| Option            | Type      | Default | Description                                                                      |
| ----------------- | --------- | ------- | -------------------------------------------------------------------------------- |
| `handleUrlParams` | `boolean` | `false` | read place, start and destination from URL params, see [URL params](#url-params) |
| `urlParams`       | `object`  |         | see the table below                                                              |

`urlParams`

| Option               | Type      | Default                | Description                                                         |
| -------------------- | --------- | ---------------------- | ------------------------------------------------------------------- |
| `startFeature`       | `string`  | `'startFeature'`       | name of the param with id or title of the start feature             |
| `destinationFeature` | `string`  | `'destinationFeature'` | name of the param with id or title of the destination feature       |
| `defaultPlace`       | `string`  | `'defaultPlace'`       | name of the param with id or title of the place                     |
| `autoRouting`        | `boolean` | `true`                 | find the route automatically when start and destination are defined |

#### Adding features via modal

| Option                 | Type      | Default   | Description                                                                                     |
| ---------------------- | --------- | --------- | ----------------------------------------------------------------------------------------------- |
| `allowNewFeatureModal` | `boolean` | `false`   | allow adding new features via a modal dialog                                                    |
| `newFeatureModalEvent` | `string`  | `'click'` | [map event](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#events) opening the modal |

#### Deprecated

| Option                    | Use instead              |
| ------------------------- | ------------------------ |
| `animatedRoute`           | `routeAnimation.enabled` |
| `enableTBTNavigation`     | `stepsNavigation`        |
| `landmarkTBTNavigation`   | `stepsNavigation`        |
| `animationLooping`        | `routeAnimation.looping` |
| `urlParams.startFeauture` | `urlParams.startFeature` |

| Method                           | Use instead                   |
| -------------------------------- | ----------------------------- |
| `enablePolygonPreventedIcons()`  | `hidePolygonPreventedIcons()` |
| `disablePolygonPreventedIcons()` | `showPolygonPreventedIcons()` |

### Methods

Methods have to be called after the map is ready. For brevity the examples below omit the wrapper:

```javascript
map.getMapReadyListener().subscribe(() => {
  // call methods here
});
```

- [Map instance](#map-instance)
- [Places and floors](#places-and-floors-1)
- [Kiosk and camera](#kiosk-and-camera)
- [Routing](#routing-1)
- [Route animation](#route-animation-1)
- [Custom position](#custom-position-1)
- [Style](#style)
- [Polygons](#polygons-1)
- [Features](#features)
- [Persons](#persons)
- [Filtering](#filtering)

#### Map instance

```javascript
map.getMapboxInstance(); // MapLibre map instance
map.getMapState(); // current internal state of the map

// change language of POI titles and UI texts
map.setLanguage('de');
```

#### Places and floors

```javascript
// set active place and load its floors
// @param placeId {string}
// @param zoomIntoPlace {boolean} optional, zoom into the place
// @param floorLevel {number} optional, floor level to show
// @return Promise<PlaceModel>
await map.setPlace('placeId');

// set active floor by its id
map.setFloorById('floorId');

// set active floor by its level
map.setFloorByLevel(0);

// set active floor by direction, 'up' or 'down'
map.setFloorByWay('up');

// floor name in the current language (metadata.title_<language>), falls back to floor.name
// @param floor {FloorModel}
map.getFloorName(floor);
```

#### Kiosk and camera

```javascript
// change kiosk position, turns kiosk mode on when it's off
// @param lat {number}, lng {number}, level {number}
// @param parkingKiosk {boolean} optional, polygons can't be clicked
// @param useAsRouteStart {boolean} optional, default true, use the kiosk as the start of routes
map.setKiosk({ lat: 48.606703739771774, lng: 17.833092384506614, level: 1 });
map.setKiosk(48.606703739771774, 17.833092384506614, 1); // positional arguments still work

// stop kiosk mode
map.stopKiosk();

// change padding used when zooming into a found route
// @param padding {number | PaddingOptions}
map.setBoundsPadding(50);

// center the map to the route bounds
map.centerToRoute();

// center the map to a feature, throws when the feature doesn't exist
// @return Feature
map.centerToFeature('featureId');

// center the map to coordinates
// @param lat {number}, lng {number}
// @param zoom {number} optional, default 18
map.centerToCoordinates(48.60678469647394, 17.833135351538658, 20);
```

#### Routing

`findRouteByIds`, `findRouteByTitle`, `findRouteByCoords` and `findRouteToNearestFeature` share these optional trailing parameters:

| Parameter          | Type                    | Default | Description                                                    |
| ------------------ | ----------------------- | ------- | -------------------------------------------------------------- |
| `accessibleRoute`  | `boolean`               |         | avoid stairs, escalators etc.                                  |
| `wayfindingConfig` | `WayfindingConfigModel` |         | what the route avoids, see the table below                     |
| `addToMap`         | `boolean`               | `true`  | when `false` the route is only calculated (preview), not shown |

The start parameters are optional in kiosk mode.

`WayfindingConfigModel`

| Property              | Type      |
| --------------------- | --------- |
| `avoidElevators`      | `boolean` |
| `avoidEscalators`     | `boolean` |
| `avoidStaircases`     | `boolean` |
| `avoidRamps`          | `boolean` |
| `avoidNarrowPaths`    | `boolean` |
| `avoidRevolvingDoors` | `boolean` |
| `avoidTicketGates`    | `boolean` |
| `avoidBarriers`       | `boolean` |
| `avoidHills`          | `boolean` |

```javascript
// by feature ids
// @param idTo {string}, idFrom {string}, accessibleRoute, wayfindingConfig, addToMap
map.findRouteByIds('idTo', 'idFrom');
map.findRouteByIds('idTo', 'idFrom', false, { avoidStaircases: true, avoidEscalators: true });

// by feature titles
// @param titleTo {string}, titleFrom {string}, accessibleRoute, wayfindingConfig, addToMap
map.findRouteByTitle('titleTo', 'titleFrom');

// by coordinates
// @param latTo {number}, lngTo {number}, levelTo {number},
//        latFrom {number}, lngFrom {number}, levelFrom {number}, accessibleRoute, wayfindingConfig, addToMap
map.findRouteByCoords(48.606703739771774, 17.833092384506614, 0, 48.60684545080579, 17.833450676669543, 0);

// to the nearest feature of an amenity, same level features are preferred
// @param amenityId {string}, idFrom {string}, accessibleRoute, wayfindingConfig, addToMap
map.findRouteToNearestFeature('amenityId');

// route through multiple stops
// @param start {string} start feature id
// @param stops {string[]} feature ids of the stops, the last one is the destination
// @param wayfindingConfig {WayfindingConfigModel} optional
// @param autoStart {boolean} optional, default true, when false the route is only calculated
map.findMultipointRoute({ start: 'startId', stops: ['stop1Id', 'stop2Id'] });

// outdoor city route between coordinates
// @param start {lat, lng}, destination {lat, lng}
// @param autoStart {boolean} optional, default true
map.findCityRoute({
  start: { lat: 48.606703739771774, lng: 17.833092384506614 },
  destination: { lat: 48.60684545080579, lng: 17.833450676669543 },
});

// combined city and mall route
// @param start {lat, lng} | {string} coordinates or feature id
// @param connectingPoint {lat, lng} point where city and mall navigation meet, e.g. an entrance
// @param destination {lat, lng} | {string} coordinates or feature id
// @param autoStart {boolean}, accessibleRoute {boolean}, wayfindingConfig {WayfindingConfigModel} optional
map.findCombinedRoute({
  start: { lat: 48.606703739771774, lng: 17.833092384506614 },
  connectingPoint: { lat: 48.60684545080579, lng: 17.833450676669543 },
  destination: 'destinationId',
});

// closest point on the routing paths to a feature
// @param featureId {string}
// @param displayOnMap {boolean} optional, default false
// @return Feature
map.findPathPoint({ featureId: 'featureId', displayOnMap: true });

// nearest feature of an amenity, same level features are preferred
// @param amenityId {string}
// @param fromFeature {Feature} optional, default route start
// @param handleDefaultPlace {boolean} optional, default true, search only in defaultPlaceId
// @return Feature | false
map.getClosestFeature('amenityId');

// cancel the route
map.cancelRoute();

// focus a part of the route
// @param step {number | 'next' | 'previous'}
map.setNavStep('next');

// focus a stop of a multipoint route
// @param stop {number | 'next' | 'previous'}
map.setStop('next');

// turn-by-turn navigation object
const TBTNav = map.getTBTNav();

// initial bearing used to generate turn-by-turn directions of the first step
// @param bearing {number}
map.setInitialBearing(90);
```

#### Route animation

See [route animation options](#route-animation).

```javascript
// enable / disable route animation
map.enableRouteAnimation();
map.disableRouteAnimation();

// restart the animation of the current step
// @param delay {number} delay in milliseconds
// @param recenter {boolean} optional, center the map to the route
map.restartRouteAnimation({ delay: 0, recenter: true });

// stop the animation
// @param keepRoute {boolean} optional, keep the animated route on the map
map.stopRouteAnimation();
```

#### Custom position

Show a position from your own positioning system, see [custom position options](#custom-position).

```javascript
// set position
// @param coordinates {[lng, lat]}, level {number}
// @param recenter {boolean} optional, default true, center the map to the position
// @param iconSize {number} optional, default 1.5
// @param directionIconSize {number} optional, default 1.25
// @param followRouteBearing {boolean} optional, default false, rotate the direction icon along the route
// @param addPositionIcon {boolean} optional, default true, show the position icon
// @param floorChangeRule {'always' | 'never' | 'onInit'} optional, default 'always', when the map switches to the position floor
map.setCustomPosition({ coordinates: [17.833135351538658, 48.60678469647394], level: 0 });

// set heading of the position icon
// @param heading {number} angle in degrees
// @param followBearing {boolean} optional, default false
map.setCustomPositionHeading({ heading: 20 });

// current position, null when not set
map.getCustomPosition();

// remove the position
map.cancelCustomPosition();

// use browser geolocation as the position source
map.initGpsMode();
```

#### Style

##### Apply persistent style changes

Changes made directly on the MapLibre instance (e.g. `setPaintProperty`) are lost whenever the library refreshes the style, for example on floor change or route update. `applyStyle` keeps them until reset.

- calls are merged, `null` as a property value restores the original value of that property
- layers that are not in the style yet get the changes once they are added
- filters are not supported as they are managed by the library

```javascript
// @param overrides.layers {object} paint and layout properties by layer id
// @param overrides.sources {object} source options by source id
map.applyStyle({
  layers: {
    'proximiio-routing-line-remaining': {
      paint: { 'line-color': '#ff0000', 'line-width': 12 },
      layout: { 'line-cap': 'round' },
    },
  },
});

// restore the original line-width only
map.applyStyle({ layers: { 'proximiio-routing-line-remaining': { paint: { 'line-width': null } } } });
```

##### Reset style changes

```javascript
// @param options {object} optional, layer and source ids to reset, everything is reset when omitted
map.resetStyle({ layers: ['proximiio-routing-line-remaining'], sources: ['route'] });
map.resetStyle();
```

##### Other

```javascript
// highlight features with a circle, send an empty array to remove highlights
// @param features {string[]} feature ids
// @param color {string} optional, default '#000'
// @param radius {number} optional, default 50
// @param blur {number} optional, default 0.8
// @param enlargeIcon {boolean} optional, enlarge the icon of highlighted features
// @param opacity {number} optional, default 1
// @param translate {[number, number]} optional, default [0, 0], circle offset in pixels
map.setFeaturesHighlight(['featureId'], '#6945ed', 40, 0.5, true);

// hide / show a layer
map.hideLayer('proximiio-texts');
map.showLayer('proximiio-texts');

// hide / show all icons
map.hideIcons();
map.showIcons();

// hide icons of amenities, added to the hiddenAmenities option
map.setHiddenAmenities(['amenity1', 'amenity2']);

// toggle POIs with visibility: 'hidden' property
map.toggleHiddenPois();

// toggle raster floorplans
map.toggleRasterFloorplans();
```

#### Polygons

See [polygon options](#polygons).

```javascript
// enable polygons at runtime, refetches features
map.bootPolygons();

// switch all polygons to the disabled state, requires handleDisabledPolygons
map.disablePolygons();

// icons of POIs with metadata.prevent_polygon (POIs inside a polygon that aren't connected to it),
// when an amenity filter is active only icons of the filtered amenities are shown
map.hidePolygonPreventedIcons();
map.showPolygonPreventedIcons();
```

#### Features

`isTemporary` (default `true`) means the change is only applied on the map and not saved to the database. All methods accept either an options object or positional arguments in the listed order.

```javascript
// add a feature
// @param title {string}, level {number}, lat {number}, lng {number} required
// @param icon {string} optional, base64 image
// @param id {string} optional, autogenerated when omitted
// @param placeId {string}, floorId {string}, properties {object}, isTemporary {boolean} optional
// @return Promise<Feature>
const feature = await map.addCustomFeature({
  title: 'myPOI',
  level: 0,
  lat: 48.606703739771774,
  lng: 17.833092384506614,
});

// update a feature
// @param id {string} required, all other params as in addCustomFeature are optional
// @return Promise<Feature>
await map.updateFeature({ id: 'poiId', title: 'myPOI', level: 0, lat: 48.606703739771774, lng: 17.8330923845066 });

// update multiple features
await map.updateFeatures({
  features: [
    { id: 'poiId', lat: 48.606703739771774, lng: 17.8330923845066 },
    { id: 'poiId 2', lat: 48.606705739771774, lng: 17.8330933845066 },
  ],
});

// delete a feature
// @param id {string}, isTemporary {boolean} optional
map.deleteFeature('poiId');

// list of added features
const features = map.getCustomFeaturesList();

// refetch all features
map.refetch();
```

#### Persons

```javascript
// set a person icon, removes all previously added persons
// @param lat {number}, lng {number}, level {number}, id {string | number} optional
map.setPerson(48.606703739771774, 17.833092384506614, 0);

// add or update a person icon
map.upsertPerson(48.606703739771774, 17.833092384506614, 0, 'person-1');
```

#### Filtering

##### Global filter

Features whose property `key` equals `value`, or which don't contain `key` at all, stay visible. With `hideIconOnly` the other features stay on the map with a hidden icon. Pass `null` to disable filtering.

```javascript
// @param options {{ key: string, value: string, hideIconOnly?: boolean } | null}
map.setFiltering({ key: 'properties.metadata.exhibition', value: 'food' });
map.setFiltering(null);
```

##### Feature filters

`setFeatureFilter` shows only the defined feature, multiple calls add more visible features. With `inverted` set to `true` the feature is hidden instead.

```javascript
// @param query {string} feature id or title
// @param inverted {boolean} optional
map.setFeatureFilter('myfeature');

// remove a filter, inverted has to match the value used in setFeatureFilter
map.removeFeatureFilter('myfeature');

// remove all feature filters
map.resetFeatureFilters();

// hide all POIs
map.hidePois();
```

##### Amenity filters

`setAmenityFilter` shows only features of the defined amenity. Without a category, filters stack so multiple amenities can be active. With a category (see below), only one amenity of that category can be active at a time. With `inverted` set to `true` the amenity features are hidden instead. `category` and `inverted` can't be combined. Polygons of matching POIs switch to the _active_ state.

```javascript
// @param amenityId {string | string[]}
// @param category {string} optional, id of a category created by setAmenitiesCategory
// @param inverted {boolean} optional
map.setAmenityFilter('myamenity');
map.setAmenityFilter('myamenity', null, true);

// remove a filter, category and inverted have to match the values used in setAmenityFilter
map.removeAmenityFilter('myamenity');
map.removeAmenityFilter('myamenity', null, true);

// remove all amenity filters
map.resetAmenityFilters();
```

##### Amenity categories

```javascript
// create a category
// @param id {string} category id, used as the second param of setAmenityFilter
// @param amenities {string[]} amenity ids
map.setAmenitiesCategory('shops', ['id1', 'id2']);

// remove a category
map.removeAmenitiesCategory('shops');

// remove all categories
map.resetAmenitiesCategory();
```

### Listeners

All listeners are subscribed the same way:

```javascript
map.getRouteFoundListener().subscribe((res) => {
  console.log('route found', res.route);
  console.log('turn by turn navigation', res.TBTNav);
});
```

| Listener                        | Emits                                                         |
| ------------------------------- | ------------------------------------------------------------- |
| `getDataFetchedListener()`      | `true` when map data is fetched                               |
| `getMapLoadListener()`          | `true` when the MapLibre map is loaded                        |
| `getMapReadyListener()`         | `true` when the map is ready, call methods after this         |
| `getMainSourceLoadedListener()` | `true` when the main features source is fully loaded          |
| `getMapFailedListener()`        | `{ message }` when the map failed to load                     |
| `getPlaceSelectListener()`      | selected place                                                |
| `getFloorSelectListener()`      | selected floor                                                |
| `getRouteFoundListener()`       | `{ route, TBTNav, details, start, end, preview }`             |
| `getRouteFailedListener()`      | when a route was not found                                    |
| `getRouteCancelListener()`      | when a route was cancelled                                    |
| `getNavStepSetListener()`       | new navigation step                                           |
| `getStopSetListener()`          | new stop of a multipoint route                                |
| `getFeatureAddListener()`       | added feature                                                 |
| `getFeatureUpdateListener()`    | updated feature or features                                   |
| `getFeatureDeleteListener()`    | when a feature was deleted                                    |
| `getPolygonClickListener()`     | clicked polygon POI                                           |
| `getPoiClickListener()`         | clicked POI                                                   |
| `getPersonUpdateListener()`     | current list of persons                                       |
| `getPositionSetListener()`      | `{ coordinates, level }` when a custom position is applied    |
| `getArrivalListener()`          | `true` when the custom position reaches the route destination |

### Styling the route

The route line is drawn by the `proximiio-routing-line-remaining` layer. There are three ways to change its look.

**Single color** with the `routeColor` option:

```javascript
new Proximiio.Map({ routeColor: '#ff0000' });
```

**Gradient** with the `routeGradient` option. It's a MapLibre [line-gradient](https://maplibre.org/maplibre-style-spec/layers/#line-gradient) expression where `['line-progress']` goes from `0` (route start) to `1` (destination). Routes spanning multiple floors are drawn as one line per floor, so each floor shows the full gradient.

```javascript
new Proximiio.Map({
  routeGradient: ['interpolate', ['linear'], ['line-progress'], 0, '#6c6ff5', 0.5, '#a35bd6', 1, '#e5485a'],
});
```

In TypeScript, when the gradient is defined in a separate variable, type it explicitly, otherwise it's inferred as a plain array:

```typescript
import type { ExpressionSpecification } from 'maplibre-gl';

const ROUTE_GRADIENT: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['line-progress'],
  0,
  '#6c6ff5',
  1,
  '#e5485a',
];
```

**Any paint or layout property** at runtime with [`applyStyle()`](#style). A gradient requires `lineMetrics` on the route source:

```javascript
map.applyStyle({
  layers: {
    'proximiio-routing-line-remaining': {
      paint: {
        'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#6c6ff5', 1, '#e5485a'],
        'line-width': 12,
      },
    },
  },
  sources: { route: { lineMetrics: true } },
});
```

### URL params

With `handleUrlParams` enabled, the place and the route can be defined in the browser url. Param names can be changed with the [`urlParams`](#url-params-handling) option.

```
http://your-server/?startFeature=featureIdOrTitle&destinationFeature=featureIdOrTitle&defaultPlace=placeIdOrTitle
```

### 3D polygons data

1. Create a `MultiPolygon` feature, that's the polygon itself.
2. Optionally set its `label-line` property, an imaginary line along which the POI title is drawn.
3. Connect the POI to the polygon: POIs located inside the polygon are connected automatically (see `autoAssign`), otherwise add the polygon id to the POI `metadata.polygon_id`.

To keep a POI inside a polygon unconnected, set its `metadata.prevent_polygon` to `true`.

Polygon feature:

```json
{
  "type": "Feature",
  "geometry": {
    "type": "MultiPolygon",
    "coordinates": "coordinates of all corner points"
  },
  "properties": {
    "id": "my-poi-polygon-id",
    "label-line": [
      [longitude, latitude],
      [longitude, latitude]
    ]
  }
}
```

POI feature:

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
    "metadata": {
      "polygon_id": "my-poi-polygon-id"
    }
  }
}
```

## Select component

The select component uses [Autocomplete.js](https://tarekraafat.github.io/autoComplete.js). Optionally load the [css file](assets/proximiio-js-library.css) from the assets folder and adjust it to your needs.

```html
<input id="proximiioSelect" class="proximiio-select" type="text" tabindex="1" />
```

```javascript
// @param dataset {string} dataset to search in, 'Places' | 'Floors' | 'Pois'
// @param options {AutocompleteOptions} see https://tarekraafat.github.io/autoComplete.js/#/configuration,
//                options.selector defaults to '#proximiioSelect'
// @param useApiSearch {boolean} optional, default false, filter results via the API, necessary for 100+ places or floors
const select = new Proximiio.Select('Places', {
  placeHolder: 'Pick the place',
  resultItem: { highlight: { render: true } },
});

select.getSelectListener().subscribe((place) => {
  console.log('place selected', place);
});
```

## ImageDetection component

Detects nearby POIs from the device camera using the Google Vision Cloud REST API.

| Option               | Type                   | Description                                    |
| -------------------- | ---------------------- | ---------------------------------------------- |
| `gVisionApiKey`      | `string`               | **required**, Google Vision Cloud API key      |
| `pois`               | `SortedPoiItemModel[]` | **required**, POIs to compare the results with |
| `captureButtonText`  | `string`               | capture button text                            |
| `closeButtonText`    | `string`               | close button text                              |
| `noResultsText`      | `string`               | text shown when there are no results           |
| `resultsHeadingText` | `string`               | results heading text                           |
| `returnResults`      | `number`               | number of results to show                      |

```javascript
import { ImageDetection } from 'proximiio-js-library';

ImageDetection.init({ gVisionApiKey: 'YOUR_KEY', pois }, (item) => {
  // called with the selected POI
  const feature = features.find((f) => f.id === item.id);
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

### Route between two POIs picked in select components

```html
<input id="from-poi-select" class="proximiio-select" type="text" tabindex="1" />
<input id="to-poi-select" class="proximiio-select" type="text" tabindex="1" />
```

```javascript
const map = new Proximiio.Map();

map.getMapReadyListener().subscribe(() => {
  let fromPoi = null;
  let toPoi = null;

  const findRoute = () => {
    if (fromPoi && toPoi) {
      map.findRouteByIds(toPoi.id, fromPoi.id);
    }
  };

  const fromPoiSelect = new Proximiio.Select('Pois', {
    placeHolder: 'Pick the start poi',
    highlight: true,
    selector: '#from-poi-select',
  });

  fromPoiSelect.getSelectListener().subscribe((poi) => {
    fromPoi = poi;
    map.centerToFeature(poi.id); // optional
    findRoute();
  });

  const toPoiSelect = new Proximiio.Select('Pois', {
    placeHolder: 'Pick the end poi',
    highlight: true,
    selector: '#to-poi-select',
  });

  toPoiSelect.getSelectListener().subscribe((poi) => {
    toPoi = poi;
    map.centerToFeature(poi.id); // optional
    findRoute();
  });
});
```

### Adding features and updating their positions

This example uses [turf](https://turfjs.org) to generate random positions for demo purposes. In a real app the positions come from your own API, but the idea of `addCustomFeature()` and `updateFeature()` stays the same.

```html
<div id="proximiioMap" style="height: 500px;"></div>
```

```javascript
const customPoiList = [
  { id: 'custom-poi-1', title: 'Custom Poi', level: 0 },
  { id: 'custom-poi-2', title: 'Custom Poi 2', level: 0 },
  { id: 'custom-poi-3', title: 'Custom Poi 3', level: 0 },
];

const map = new Proximiio.Map();

map.getMapReadyListener().subscribe(() => {
  const bounds = map.getMapboxInstance().getBounds();
  const randomPosition = () => turf.randomPosition([bounds._ne.lng, bounds._ne.lat, bounds._sw.lng, bounds._sw.lat]);

  for (const poi of customPoiList) {
    const [lng, lat] = randomPosition();
    map.addCustomFeature(poi.title, poi.level, lat, lng, '', poi.id);
  }

  // move features every 5 seconds
  setInterval(() => {
    for (const poi of customPoiList) {
      const [lng, lat] = randomPosition();
      map.updateFeature(poi.id, poi.title, poi.level, lat, lng);
    }
  }, 5000);
});
```

## Development

After cloning the repository install dependencies:

```bash
npm install
```

Rebuild the library after changes in `./src`:

```bash
npm run build
```
