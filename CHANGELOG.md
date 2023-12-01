# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - YYYY-MM-DD

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
- For `point` type of animation, you can turn on/off loopint via `routeAnimation.looping`

### Deprecated

- Map constuctor option `animatedRoute`
- Map constuctor option `animationLooping`

### Removed

---

### Fixed

---
### Security

---