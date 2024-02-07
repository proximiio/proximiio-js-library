# Changelog

All notable changes to this project will be documented in this file.

## [1.11.16] - 2024-02-07

### Fixed

- Fix kiosk label translation

## [1.11.15] - 2024-02-07

### Added

- New map constuctor option `kioskSettings.showLabel` to allow showing label 'You are here' under the kiosk point
- New map constuctor option `routeAnimation.pointIconUrl` and `routeAnimation.pointIconSize` to allow defining route point icon and size

## [1.11.14] - 2024-02-06

### Fixed

- Fix missing dependencies

## [1.11.13] - 2024-02-06

### Changed

- Improved polygon labels auto positioning

## [1.11.12] - 2024-02-06

### Added

- New SelectLogger component to log selected/clicked feature, amenity or amenity_category
- Added new model for ad
- Added controller to handle api calls to retrieve list of ads

## [1.11.11] - 2024-01-25

### Fixed

- Update condition to check for multiple RTLTextPluginStatus values to ensure proper handling of plugin status

## [1.11.10] - 2024-01-19

### Added

- Added new model for kiosk
- Added controller to handle api calls to retrieve list of kiosks and kiosk by id
- Add get kiosks list in getPackage call
- Save kiosks list from getPackage into map state
- New map constuctor option `polygonLayers` to allow define additional features to behave like clickable polygons

  Example configuration:

  ```javascript
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
  }],
  ```

### Removed

- Removed experimental support for parking spot polygons, use polygonLayers property instead

## [1.11.9] - 2024-01-17

### Changed

- Parking spot polygons colors change

## [1.11.8] - 2024-01-17

### Added

- Add support for parking spot polygons and labels (experimental)

## [1.11.7] - 2024-01-15

### Fixed

- Minor fix of code by adding conditional check before modifying levelNeighboursMap

## [1.11.4] - 2023-12-27

### Added

- Add support for specifying default floor level in Proximiio.Map options `defaultFloorLevel` to set the initial floor level of the map feat(main.ts)

## [1.11.1] - 2023-12-21

### Changed

- Fix turf.js imports in wayfinding alghorithm

## [1.11.0] - 2023-12-20

### Fixed

- Fix `setLanguage` method to change features title based on current language dynamically
- Fix bug in getClosestFeature method to handle case when fromFeature parameter is undefined

### Changed

- Typescript compiler options set to ES2015 (target, module)

## [1.10.6] - 2023-12-18

### Fixed

- Fix incorrect function name in if condition to check if RTL text plugin is loaded

## [1.10.5] - 2023-12-18

### Fixed

- Add condition to check if RTL text plugin is already loaded before setting it to improve performance and prevent unnecessary loading
- Handle case when destinationParam is undefined to prevent error when finding destinationFeature

## [1.10.4] - 2023-12-14

### Changed

- Method `getFloorName` has become public
- Method `getClosestFeature` has become public

## [1.10.3] - 2023-12-07

### Added

- New map constuctor option `polygonsOptions.textFont` for configuring font stack for displaying labels in polygons

## [1.10.2] - 2023-12-06

### Added

- Add cursor style change on mouseenter and mouseleave events for 'proximiio-pois-icons' and 'pois-icons' layers

## [1.10.1] - 2023-12-04

### Fixed

- Fixed bug when calling route animation while there were no route yet

## [1.10.0] - 2023-12-04

### Added

- New map constuctor option `routeAnimation` to replace deprecated `animatedRoute` and `animationLooping`
- New map constuctor option `routeAnimation.enabled`
- New map constuctor option `routeAnimation.type`, possible values are `dash` or `point`
- New map constuctor option `routeAnimation.looping`, only applicable for `point` route animation
- New map constuctor option `routeAnimation.followRoute`, only applicable for `point` route animation
- New map constuctor option `routeAnimation.duration`, only applicable for `point` route animation
- New map constuctor option `routeAnimation.durationMultiplier`, only applicable for `point` route animation
- New map constuctor option `routeAnimation.fps`, only applicable for `point` route animation
- New map constuctor option `routeAnimation.pointColor`, only applicable for `point` route animation
- New map constuctor option `routeAnimation.pointRadius`, only applicable for `point` route animation
- New map constuctor option `routeAnimation.lineColor`
- New map constuctor option `routeAnimation.lineOpacity`
- New map constuctor option `routeAnimation.lineWidth`

### Changed

- Now you can enable route animation via `routeAnimation.enabled` setting
- For `point` type of animation, you can turn on/off looping via `routeAnimation.looping`
- Changed text font to `Amiri Bold` for polygon labels and level changer popups to fix `ar` translation issue

### Deprecated

- Map constuctor option `animatedRoute`
- Map constuctor option `animationLooping`

### Removed

---

### Fixed

- Enable click events on `proximiio-pois-icons` and `pois-icons` layers while polygons are initiated
- Fixed some `ar` translations

### Security

---
