# Changelog

All notable changes to this project will be documented in this file.

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
