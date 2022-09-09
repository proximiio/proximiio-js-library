"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Wayfinding = void 0;

var turf = _interopRequireWildcard(require("@turf/turf"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Wayfinding = /*#__PURE__*/function () {
  // meters
  // meters
  // meters / second
  // meters
  // meters / second
  // second
  // meters / second
  // meters / second

  /**
   *
   * @param featureCollection {FeatureCollection}
   */
  function Wayfinding(featureCollection) {
    var _this = this;

    _classCallCheck(this, Wayfinding);

    _defineProperty(this, "configuration", {
      avoidElevators: false,
      avoidEscalators: false,
      avoidStaircases: false,
      avoidRamps: false,
      avoidNarrowPaths: false,
      avoidRevolvingDoors: false,
      avoidTicketGates: false,
      avoidBarriers: false,
      avoidHills: false
    });

    _defineProperty(this, "POI_TYPE", {
      ELEVATOR: "elevator",
      ESCALATOR: "escalator",
      STAIRCASE: "staircase",
      RAMP: "ramp",
      HILL: "hill",
      NARROW_PATH: "narrow_path",
      REVOLVING_DOOR: "door",
      TICKET_GATE: "ticket_gate",
      BARRIER: "barrier"
    });

    _defineProperty(this, "ACCESSIBILITY_POI_TYPE", ["door", "ticket_gate"]);

    _defineProperty(this, "LEVEL_CHANGER_TYPE", ["elevator", "escalator", "staircase", "ramp", "hill"]);

    _defineProperty(this, "PATH_TYPE", "path");

    _defineProperty(this, "LINE_STRING_TYPE", "LineString");

    _defineProperty(this, "DIRECTION_UP", "up");

    _defineProperty(this, "DIRECTION_DOWN", "down");

    _defineProperty(this, "ROUTABLE_TYPE", ["MultiPolygon", "Polygon"]);

    _defineProperty(this, "UNIT_TYPE", "meters");

    _defineProperty(this, "pathFixDistance", 1.0);

    _defineProperty(this, "wallOffsetDistance", 0.5);

    _defineProperty(this, "walkingSpeed", 1.4);

    _defineProperty(this, "floorHeight", 4.5);

    _defineProperty(this, "elevatorSpeed", 0.9);

    _defineProperty(this, "elevatorWaiting", 55.0);

    _defineProperty(this, "escalatorSpeed", 0.24);

    _defineProperty(this, "staircasesSpeed", 0.3);

    var featureList = featureCollection.features;

    var _this$extractMinMaxLe = this.extractMinMaxLevel(featureList),
        minLevel = _this$extractMinMaxLe.minLevel,
        maxLevel = _this$extractMinMaxLe.maxLevel;

    if (minLevel === undefined) throw "No feature with level was supplied!";
    var routableAreaFeatureList = featureList.filter(function (feature) {
      return feature.properties.routable && _this.ROUTABLE_TYPE.includes(feature.geometry.type);
    });
    var floorGeojsonMap = new Map();

    var _loop = function _loop(level) {
      var floorAreaFeature = routableAreaFeatureList.filter(function (feature) {
        return feature.properties.level === level;
      });
      floorGeojsonMap.set(level, turf.featureCollection(floorAreaFeature !== undefined ? floorAreaFeature : []));
    };

    for (var level = minLevel; level <= maxLevel; level++) {
      _loop(level);
    }

    this.floorList = floorGeojsonMap; // Corridors

    this.corridors = featureList.filter(function (feature) {
      return feature.properties["class"] === _this.PATH_TYPE && feature.geometry.type === _this.LINE_STRING_TYPE;
    }); // Level changers

    var levelChangers = featureList.filter(function (feature) {
      return _this.LEVEL_CHANGER_TYPE.includes(feature.properties.type);
    });
    levelChangers.forEach(function (levelChanger) {
      if (levelChanger.id === undefined) {
        levelChanger.id = levelChanger.properties.id;
      }
    });
    levelChangers.forEach(function (levelChanger) {
      if (levelChanger.properties.levels === undefined) {
        levelChanger.properties.levels = [];

        if (levelChanger.properties.level_min !== undefined && levelChanger.properties.level_max !== undefined) {
          for (var _level = levelChanger.properties.level_min; _level <= levelChanger.properties.level_max; _level++) {
            levelChanger.properties.levels.push(_level);
          }
        }
      }
    });
    this.levelChangerList = levelChangers; // Accessibility POI

    this.accessibilityPoi = featureList.filter(function (feature) {
      return _this.ACCESSIBILITY_POI_TYPE.includes(feature.properties.type);
    });
    this.rebuildData();
  }
  /**
   * @param configuration {Object}
   * @param configuration.avoidElevators {Boolean}
   * @param configuration.avoidEscalators {Boolean}
   * @param configuration.avoidStaircases {Boolean}
   * @param configuration.avoidRamps {Boolean}
   * @param configuration.avoidNarrowPaths {Boolean}
   * @param configuration.avoidRevolvingDoors {Boolean}
   * @param configuration.avoidTicketGates {Boolean}
   * @param configuration.avoidBarriers {Boolean}
   * @param pathFixDistance {Number}
   */


  _createClass(Wayfinding, [{
    key: "setConfiguration",
    value: function setConfiguration(configuration) {
      var _this2 = this;

      var pathFixDistance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1.0;
      Object.keys(configuration).forEach(function (property) {
        if (_this2.configuration.hasOwnProperty(property)) {
          _this2.configuration[property] = configuration[property];
        }
      });
      this.pathFixDistance = pathFixDistance;
    }
  }, {
    key: "extractMinMaxLevel",
    value: function extractMinMaxLevel(featureList) {
      var minLevel = undefined;
      var maxLevel = undefined;
      featureList.forEach(function (feature) {
        var level = feature.properties.level;

        if (minLevel === undefined || level < minLevel) {
          minLevel = level;
        }

        if (maxLevel === undefined || maxLevel < level) {
          maxLevel = level;
        }

        if (feature.properties.levels !== undefined) {
          feature.properties.levels.forEach(function (level) {
            if (minLevel === undefined || level < minLevel) {
              minLevel = level;
            }

            if (maxLevel === undefined || maxLevel < level) {
              maxLevel = level;
            }
          });
        }
      });
      return {
        minLevel: minLevel,
        maxLevel: maxLevel
      };
    }
  }, {
    key: "rebuildData",
    value: function rebuildData() {
      var _this3 = this;

      var floorData = new Map();
      this.floorList.forEach(function (floor, level) {
        var floorPoints = [];
        var floorWalls = [];
        var floorAreas = []; // Floor features == "walkable areas"

        floor.features.forEach(function (walkableArea) {
          var wallLineStringList = turf.flatten(turf.polygonToLine(walkableArea)).features.map(function (feature) {
            return feature.geometry;
          }); // Floor wall lines, we wish to split to individual walls

          wallLineStringList.forEach(function (wallLineString) {
            var firstPoint;
            var nextPoint; // Last point is the same as first, therefore limit index to exclude last point

            for (var index = 0; index < wallLineString.coordinates.length - 1; index++) {
              var point = void 0;

              if (index === 0) {
                firstPoint = turf.point(wallLineString.coordinates[index]);
                firstPoint.properties.level = level;
                firstPoint.properties.neighbours = [];
                firstPoint.properties.walkableAreaId = walkableArea.id;
                point = firstPoint;
              } else {
                point = nextPoint;
              }

              if (index === wallLineString.coordinates.length - 2) {
                nextPoint = firstPoint;
              } else {
                nextPoint = turf.point(wallLineString.coordinates[index + 1]);
                nextPoint.properties.level = level;
                nextPoint.properties.neighbours = [];
                nextPoint.properties.walkableAreaId = walkableArea.id;
              }

              point.properties.neighbours.push(nextPoint);
              nextPoint.properties.neighbours.push(point);
              floorPoints.push(point);
              floorWalls.push([point, nextPoint]);
            }
          });
          floorAreas = floorAreas.concat(turf.flatten(walkableArea).features);
        });
        floorData.set(level, {
          areas: floorAreas,
          points: floorPoints,
          walls: floorWalls,
          wallFeatures: floorWalls.map(function (wall) {
            return turf.lineString([wall[0].geometry.coordinates, wall[1].geometry.coordinates]);
          })
        });
      });
      this.bearingCache = new Map();
      this.floorData = floorData;
      this.floorData.forEach(function (floorData, floorLevel) {
        // List of physical POIs on this level that are within area
        var inAreaPoiList = _this3.accessibilityPoi.filter(function (poi) {
          return floorLevel === poi.properties.level;
        }).filter(function (poi) {
          return floorData.areas.filter(function (area) {
            return turf.booleanContains(area, poi);
          }).length > 0;
        });

        inAreaPoiList.forEach(function (poi) {
          // Generate points around POI to allow going around, but only if they are "within area
          var detourPointList = [turf.destination(poi.geometry.coordinates, poi.properties.radius + _this3.wallOffsetDistance, 0, {
            units: _this3.UNIT_TYPE
          }), turf.destination(poi.geometry.coordinates, poi.properties.radius + _this3.wallOffsetDistance, 60, {
            units: _this3.UNIT_TYPE
          }), turf.destination(poi.geometry.coordinates, poi.properties.radius + _this3.wallOffsetDistance, 120, {
            units: _this3.UNIT_TYPE
          }), turf.destination(poi.geometry.coordinates, poi.properties.radius + _this3.wallOffsetDistance, 180, {
            units: _this3.UNIT_TYPE
          }), turf.destination(poi.geometry.coordinates, poi.properties.radius + _this3.wallOffsetDistance, -120, {
            units: _this3.UNIT_TYPE
          }), turf.destination(poi.geometry.coordinates, poi.properties.radius + _this3.wallOffsetDistance, -60, {
            units: _this3.UNIT_TYPE
          })].filter(function (poi) {
            return floorData.areas.filter(function (area) {
              return turf.booleanContains(area, poi);
            }).length > 0;
          });
          detourPointList.forEach(function (point) {
            point.properties.level = floorLevel;
            point.properties.isDetourPoint = true;
          });
          floorData.points = floorData.points.concat(detourPointList);
          _this3.detourPointList = detourPointList;
        });
      }); // Split lines into single line segments

      var corridorLinePointPairs = [];
      var corridorLineFeatures = [];
      this.corridors.forEach(function (corridor, _) {
        var coordinateList = corridor.geometry.coordinates;
        var lastPoint = null;

        for (var _i = 0; _i < coordinateList.length - 1; _i++) {
          var pointA = void 0;

          if (lastPoint != null) {
            pointA = lastPoint;
          } else {
            pointA = turf.point(coordinateList[_i]);
            pointA.properties.neighbours = [];
            pointA.properties.level = corridor.properties.level;
          }

          var pointB = turf.point(coordinateList[_i + 1]);
          pointB.properties.level = corridor.properties.level;
          pointB.properties.neighbours = [];
          var isBidirectional = corridor.properties.bidirectional === undefined || corridor.properties.bidirectional === true;
          var isSwappedDirection = corridor.properties.swapDirection !== undefined && corridor.properties.swapDirection === true;

          if (isBidirectional || !isSwappedDirection) {
            pointA.properties.neighbours.push(pointB);
          }

          if (isBidirectional || isSwappedDirection) {
            pointB.properties.neighbours.push(pointA);
          }

          var lineFeature = turf.lineString([pointA.geometry.coordinates, pointB.geometry.coordinates]);
          lineFeature.properties.level = corridor.properties.level; // Mark lineFeature accordingly

          lineFeature.properties.bidirectional = isBidirectional;
          lineFeature.properties.swapDirection = isSwappedDirection; // Mark points as NarrowPath if corridor is NarrowPath

          var isNarrowPath = corridor.properties.narrowPat === true;

          if (isNarrowPath) {
            pointA.properties.narrowPath = true;
            pointB.properties.narrowPath = true;
            lineFeature.properties.narrowPath = true;
          } // Mark points as Ramp if corridor is Ramp


          var isRamp = corridor.properties.ramp === true;

          if (isRamp) {
            pointA.properties.ramp = true;
            pointB.properties.ramp = true;
            lineFeature.properties.ramp = true;
          } // Mark points as Hill if corridor is Hill


          if (corridor.properties.hill) {
            pointA.properties.hill = true;
            pointB.properties.hill = true;
            lineFeature.properties.hill = true;
          }

          corridorLinePointPairs.push([pointA, pointB]);
          corridorLineFeatures.push(lineFeature);
          lastPoint = pointB;
        }
      });
      var segmentIntersectionPointList = [];
      var segmentIntersectionPointMap = new Map();
      var i = 0; // Split individual segments when intersecting

      i = 0;

      while (i < corridorLinePointPairs.length) {
        var segment = corridorLinePointPairs[i];
        var segmentLineString = corridorLineFeatures[i]; // let segmentIntersectionList = [];

        if (!segmentIntersectionPointMap.has(i)) {
          segmentIntersectionPointMap.set(i, []);
        }

        for (var j = i + 1; j < corridorLinePointPairs.length; j++) {
          if (!segmentIntersectionPointMap.has(j)) {
            segmentIntersectionPointMap.set(j, []);
          }

          var segmentToTest = corridorLinePointPairs[j];

          if (segmentLineString.properties.level !== corridorLineFeatures[j].properties.level) {
            continue;
          } // Consecutive segments, should not cross (rather, they cross at the end point)


          if (segmentToTest.includes(segment[0]) || segmentToTest.includes(segment[1])) {
            continue;
          }

          var segmentLineStringToTest = corridorLineFeatures[j];
          var intersections = turf.lineIntersect(segmentLineString, segmentLineStringToTest).features;

          if (intersections.length > 0) {
            var intersectingPoint = intersections[0];
            intersectingPoint.properties.level = segment[0].properties.level;
            intersectingPoint.properties.isCorridorPoint = true; // Intersect point inherits filters from both intersecting lines

            if (segmentLineString.properties.narrowPath || segmentLineStringToTest.properties.narrowPath) {
              intersectingPoint.properties.narrowPath = true;
            }

            if (segmentLineString.properties.ramp || segmentLineStringToTest.properties.ramp) {
              intersectingPoint.properties.ramp = true;
            }

            if (segmentLineString.properties.hill || segmentLineStringToTest.properties.hill) {
              intersectingPoint.properties.hill = true;
            }

            segmentIntersectionPointMap.get(i).push(intersectingPoint);
            segmentIntersectionPointMap.get(j).push(intersectingPoint);
            segmentIntersectionPointList.push(intersectingPoint);
          }
        }

        i++;
      }

      i = 0;

      var _loop2 = function _loop2() {
        var segment = corridorLinePointPairs[i];
        var segmentFeature = corridorLineFeatures[i];
        var pointA = segment[0];
        var pointB = segment[1];
        var segmentIntersectionList = segmentIntersectionPointMap.get(i);
        segmentIntersectionList.sort(function (a, b) {
          return _this3._comparePointsByDistanceFromReference(pointA, a, b);
        });

        if (segmentIntersectionList) {
          segmentIntersectionList.forEach(function (intersection) {
            _this3._setNeighbourhoodBasedOnCorridorDirectionality(segmentFeature, pointA, pointB, intersection);

            var isBidirectional = segmentFeature.properties.bidirectional === undefined || segmentFeature.properties.bidirectional === true;
            var isSwappedDirection = segmentFeature.properties.swapDirection !== undefined && segmentFeature.properties.swapDirection === true;

            if (isBidirectional) {
              intersection.properties.neighbours = intersection.properties.neighbours.concat(segmentIntersectionList.filter(function (it) {
                return it !== intersection;
              }));
            } else {
              if (!isSwappedDirection) {
                var _intersection$propert;

                var pointsAfter = segmentIntersectionList.slice(segmentIntersectionList.indexOf(intersection));

                (_intersection$propert = intersection.properties.neighbours).push.apply(_intersection$propert, _toConsumableArray(pointsAfter));
              } else {
                var _intersection$propert2;

                var pointsBefore = segmentIntersectionList.slice(0, segmentIntersectionList.indexOf(intersection));

                (_intersection$propert2 = intersection.properties.neighbours).push.apply(_intersection$propert2, _toConsumableArray(pointsBefore));
              }
            }
          });
          corridorLineFeatures[i].properties.intersectionPointList = segmentIntersectionList;
        } else {
          corridorLineFeatures[i].properties.intersectionPointList = [];
        }

        i++;
      };

      while (i < corridorLinePointPairs.length) {
        _loop2();
      }

      var segmentToWallIntersectionPointList = []; // Split corridor lines on interesections wilth walls

      i = 0;

      var _loop3 = function _loop3() {
        var segment = corridorLinePointPairs[i];
        var segmentFeature = corridorLineFeatures[i];
        var segmentIntersections = [];

        var walls = _this3.floorData.get(segment[0].properties.level).walls;

        var wallFeatures = _this3.floorData.get(segment[0].properties.level).wallFeatures;

        wallFeatures.forEach(function (wallFeature, wallIndex) {
          var intersections = turf.lineIntersect(segmentFeature, wallFeature).features;

          if (intersections.length > 0) {
            var intersectPoint = intersections[0];
            intersectPoint.properties.level = segment[0].properties.level;
            intersectPoint.properties.neighbours = [];
            intersectPoint.properties.bordersArea = true;
            intersectPoint.properties.walkableAreaId = walls[0][0].properties.walkableAreaId; // Intersect point inherits filters from both intersecting lines

            if (segmentFeature.properties.narrowPath) {
              intersectPoint.properties.narrowPath = true;
            }

            if (segmentFeature.properties.ramp) {
              intersectPoint.properties.ramp = true;
            }

            if (segmentFeature.properties.hill) {
              intersectPoint.properties.hill = true;
            }

            var distance = _this3._distance(segment[0], intersectPoint);

            segmentIntersections.push({
              point: intersectPoint,
              distance: distance,
              wallIndex: wallIndex
            });
          }
        });

        if (segmentIntersections.length > 0) {
          // Sort by distance from first point
          segmentIntersections.sort(function (a, b) {
            return a.distance - b.distance;
          }); // Inject parts of segments split by intersections

          var previousPoint = segment[0];
          segmentIntersections.forEach(function (intersection, index) {
            var _intersection$point$p;

            // Set neighbourhood with points connected to intersection (next point will be added in next loop or with segment endpoint)
            previousPoint.properties.neighbours.push(intersection.point);
            walls[intersection.wallIndex][0].properties.neighbours.push(intersection.point);
            walls[intersection.wallIndex][1].properties.neighbours.push(intersection.point);
            intersection.point.properties.neighbours.push(previousPoint, walls[intersection.wallIndex][0], walls[intersection.wallIndex][1]); // TODO check directionality?

            (_intersection$point$p = intersection.point.properties.neighbours).push.apply(_intersection$point$p, _toConsumableArray(corridorLineFeatures[i].properties.intersectionPointList));

            corridorLineFeatures[i].properties.intersectionPointList.forEach(function (point) {
              return point.properties.neighbours.push(intersection.point);
            }); // Remember last point

            previousPoint = intersection.point;
            corridorLineFeatures[i].properties.intersectionPointList.push(intersection.point);
          }); // Inject from last intersection to end of original segment

          var newCorridor = turf.lineString([previousPoint.geometry.coordinates, segment[1].geometry.coordinates]);
          newCorridor.properties.level = previousPoint.properties.level; // connect last intersection point with end point

          segment[1].properties.neighbours.push(previousPoint);
          previousPoint.properties.neighbours.push(segment[1]);
          segmentToWallIntersectionPointList.push.apply(segmentToWallIntersectionPointList, _toConsumableArray(segmentIntersections.map(function (intersection) {
            return intersection.point;
          })));
        }

        i++;
      };

      while (i < corridorLinePointPairs.length) {
        _loop3();
      }

      segmentToWallIntersectionPointList.forEach(function (point) {
        _this3.floorData.get(point.properties.level).points.push(point);
      }); // this.segmentToWallIntersectionPointList = segmentToWallIntersectionPointList.map(p => turf.point(p.geometry.coordinates));

      segmentToWallIntersectionPointList.forEach(function (point) {
        var _point$properties$nei;

        var neighbours = _this3._findNeighbours(point, null, null, _this3.floorData.get(point.properties.level).points);

        (_point$properties$nei = point.properties.neighbours).push.apply(_point$properties$nei, _toConsumableArray(neighbours));
      }); // Store corridor data

      this.corridorLinePointPairs = corridorLinePointPairs;
      this.corridorLineFeatures = corridorLineFeatures;
      this.corridorLinePoints = [];
      this.corridorLinePointPairs.forEach(function (pair) {
        pair[0].properties.isCorridorPoint = true;
        pair[1].properties.isCorridorPoint = true;

        if (!_this3.corridorLinePoints.includes(pair[0])) {
          _this3.corridorLinePoints.push(pair[0]);
        }

        if (!_this3.corridorLinePoints.includes(pair[1])) {
          _this3.corridorLinePoints.push(pair[1]);
        }
      });
      this.corridorLinePoints = this.corridorLinePoints.concat(segmentIntersectionPointList);
      var levelChangerGroupMap = new Map();
      this.levelChangerList.forEach(function (levelChanger) {
        // Create level changer groups
        if (levelChanger.properties.group !== undefined) {
          // Get group array, initiate if neccessary
          var groupId = levelChanger.properties.group;
          if (!levelChangerGroupMap.has(groupId)) levelChangerGroupMap.set(groupId, []);
          var group = levelChangerGroupMap.get(groupId); // Add lc to group map

          group.push(levelChanger);
        } else {
          levelChangerGroupMap.set(levelChanger.id, [levelChanger]);
        }

        levelChanger.properties.fixedPointMap = new Map();
        levelChanger.properties.levels.forEach(function (level) {
          var point = _this3._copyPoint(levelChanger);

          point.properties.level = level;

          var fixedPoint = _this3._getFixPointInArea(point);

          fixedPoint.id = levelChanger.id;
          fixedPoint.properties.amenity = levelChanger.properties.amenity;
          fixedPoint.properties.direction = levelChanger.properties.direction;
          fixedPoint.properties.id = levelChanger.properties.id;
          fixedPoint.properties.level = level;
          fixedPoint.properties.type = levelChanger.properties.type;
          if (fixedPoint.properties.neighbours === undefined) fixedPoint.properties.neighbours = []; // Do not fix level changers that are further than 5 meters from any path or area

          if (_this3._distance(point, fixedPoint) > 5) {
            return;
          } // Store fixed point into the level changer


          levelChanger.properties.fixedPointMap.set(level, fixedPoint); // Add neighbourhood for corridor

          if (fixedPoint.properties.onCorridor) {
            if (fixedPoint.properties.neighboursLeadingTo !== undefined) {
              fixedPoint.properties.neighboursLeadingTo.forEach(function (neighbour) {
                if (neighbour.properties.neighbours === undefined) neighbour.properties.neighbours = [];
                neighbour.properties.neighbours.push(fixedPoint);
              });

              _this3.corridorLineFeatures[fixedPoint.properties.corridorIndex].properties.intersectionPointList.push(fixedPoint);
            }
          }
        });
      });
      levelChangerGroupMap.forEach(function (lcList, groupId) {
        var direction = lcList.map(function (it) {
          return it.properties.direction;
        }).find(function (it) {
          return it !== undefined;
        });
        var fixedPointList = [];
        lcList.forEach(function (lc) {
          fixedPointList.push.apply(fixedPointList, _toConsumableArray(lc.properties.fixedPointMap.values()));
        });
        fixedPointList.forEach(function (fixedPoint) {
          // init neighbour
          if (fixedPoint.properties.neighbours == undefined) fixedPoint.properties.neighbours = []; // Set neighbourhood

          if (direction === _this3.DIRECTION_UP) {
            var _fixedPoint$propertie;

            (_fixedPoint$propertie = fixedPoint.properties.neighbours).push.apply(_fixedPoint$propertie, _toConsumableArray(fixedPointList.filter(function (it) {
              return it.properties.level > fixedPoint.properties.level;
            })));
          } else if (direction === _this3.DIRECTION_DOWN) {
            var _fixedPoint$propertie2;

            (_fixedPoint$propertie2 = fixedPoint.properties.neighbours).push.apply(_fixedPoint$propertie2, _toConsumableArray(fixedPointList.filter(function (it) {
              return it.properties.level < fixedPoint.properties.level;
            })));
          } else {
            var _fixedPoint$propertie3;

            (_fixedPoint$propertie3 = fixedPoint.properties.neighbours).push.apply(_fixedPoint$propertie3, _toConsumableArray(fixedPointList.filter(function (it) {
              return it.properties.level !== fixedPoint.properties.level;
            })));
          }
        });
      });
    }
  }, {
    key: "_removeItemFromList",
    value: function _removeItemFromList(list, item) {
      var index = list.indexOf(item);

      if (index >= 0) {
        list.splice(index, 1);
      }
    }
  }, {
    key: "load",
    value: function load(neighboursMap, wallOffsets) {
      var _this4 = this;

      this.neighbourMap = neighboursMap;
      this.rebuildData();
      this.wallOffsets = wallOffsets;
      this.wallOffsetLineList = [];

      this._getPointList().forEach(function (point, index) {
        var offsetPoint = _this4.wallOffsets[index];

        if (!offsetPoint) {
          return;
        }

        var offsetLine = turf.lineString([point.geometry.coordinates, offsetPoint.geometry.coordinates]);
        offsetLine.properties.level = point.properties.level;

        _this4.wallOffsetLineList.push(offsetLine);
      });
    }
    /**
     * @param point {Feature<Point>}
     * @param level {Number}
     * @private true
     */

  }, {
    key: "_isPointOnLevel",
    value: function _isPointOnLevel(point, level) {
      if (point.properties.fixedPointMap !== undefined) {
        return point.properties.fixedPointMap.has(level);
      } else if (point.properties.level === level) {
        return true;
      } else {
        return false;
      }
    }
  }, {
    key: "_getPointList",
    value: function _getPointList() {
      var points = [];
      this.floorData.forEach(function (data, level) {
        points = points.concat(data.points);
      });
      this.levelChangerList.forEach(function (lc) {
        var _points;

        return (_points = points).push.apply(_points, _toConsumableArray(lc.properties.fixedPointMap.values()));
      });
      points = points.concat();
      points = points.concat(this.corridorLinePoints);
      return points;
    }
    /**
     *
     * @returns {{neighbourhood: Object, wallOffsets: Object}}
     */

  }, {
    key: "preprocess",
    value: function preprocess() {
      return {
        neighbourhood: this._generateNeighbourhoodMap(),
        wallOffsets: this._generateWallOffsets()
      };
    }
  }, {
    key: "_generateNeighbourhoodMap",
    value: function _generateNeighbourhoodMap() {
      var _this5 = this;

      var points = this._getPointList();

      var neighboursMap = {}; // NeighbourMap for polygon points

      this.floorData.forEach(function (levelFloorData, level) {
        var levelNeighboursMap = {};
        var levelPoints = levelFloorData.points.concat(_this5.levelChangerList.filter(function (point) {
          return _this5._isPointOnLevel(point, level);
        }).map(function (it) {
          return it.properties.fixedPointMap.get(level);
        }));
        levelPoints.forEach(function (point) {
          var pointIndex = points.indexOf(point); // Get unwrapped point if case the point is a level changer, so we can properly test neighbourhood

          var unwrappedPoint = _this5._unwrapLevelChangerPoint(point, level); // Simulate startPoint to force lowering number of intersections allowed.
          // Unwrapped point is inside accessible area, thus there should be only one intersection, wall point itself.


          var startPoint = unwrappedPoint === point ? null : unwrappedPoint;

          var neighbours = _this5._findNeighbours(unwrappedPoint, startPoint, null, levelPoints);

          levelNeighboursMap[pointIndex] = neighbours.map(function (neighbour) {
            return points.indexOf(neighbour);
          });
        });
        neighboursMap[level] = levelNeighboursMap;
      }); // NeighbourMap for corridor points

      this.corridorLinePoints.forEach(function (point) {
        var pointIndex = points.indexOf(point);
        var level = point.properties.level;
        var neighbours;
        var levelNeighboursMap = neighboursMap[level]; // Find neighbours in polygon only for points crossing polygon

        if (point.properties.bordersArea) {
          var potentialPoints = _this5.floorData.get(level).points.concat(_this5.levelChangerList.filter(function (point) {
            return _this5._isPointOnLevel(point, level);
          })).concat(_this5.corridorLinePoints.filter(function (point) {
            return point.properties.bordersArea && _this5._isPointOnLevel(point, level);
          }));

          neighbours = _this5._findNeighbours(point, point, null, potentialPoints); // Add reverse relationship

          neighbours.forEach(function (neighbour) {
            var neighbourIndex = points.indexOf(neighbour);

            if (levelNeighboursMap[neighbourIndex] === undefined) {
              levelNeighboursMap[neighbourIndex] = [];
            }

            if (!levelNeighboursMap[neighbourIndex].includes(pointIndex)) {
              levelNeighboursMap[neighbourIndex].push(pointIndex);
            }
          });
        } else {
          neighbours = point.properties.neighbours;
        } // Store relationship for corridor point


        if (levelNeighboursMap[pointIndex] === undefined) {
          levelNeighboursMap[pointIndex] = neighbours.map(function (neighbour) {
            return points.indexOf(neighbour);
          });
        } else {
          neighbours.forEach(function (neighbour) {
            return levelNeighboursMap[pointIndex].push(points.indexOf(neighbour));
          });
        }
      }); // Export and store data

      this.neighbourMap = neighboursMap;
      return neighboursMap;
    }
  }, {
    key: "_generateWallOffsets",
    value: function _generateWallOffsets() {
      var _this6 = this;

      this.wallOffsetLineList = [];
      this.wallOffsets = {};

      var pointList = this._getPointList();

      pointList.forEach(function (point) {
        // Do no process level changers
        if (point.properties.level == null) {
          return;
        } // a) Find walls where the point P is used and the other points in walls: A, B


        var walls = _this6.floorData.get(point.properties.level).walls.filter(function (wall) {
          return wall.includes(point);
        });

        if (walls.length === 0) {
          return;
        }

        var pointA = walls[0][0] === point ? walls[0][1] : walls[0][0];
        var pointB = walls[1][0] === point ? walls[1][1] : walls[1][0];
        var pointABearing = turf.bearing(point, pointA);
        var pointBBearing = turf.bearing(point, pointB); // b) Get average bearing to points A,B

        var bearing = _this6._averageBearing(pointABearing, pointBBearing);

        var oppositeBearing = bearing > 0 ? bearing - 180 : bearing + 180; // this.wallOffsetLineList.push(turf.lineString([point.geometry.coordinates, offsetPoint.geometry.coordinates]));
        // c) Generate two points M,N very close to point P

        var pointM = turf.destination(point.geometry.coordinates, 0.01, bearing, {
          units: _this6.UNIT_TYPE
        });
        var pointN = turf.destination(point.geometry.coordinates, 0.01, oppositeBearing, {
          units: _this6.UNIT_TYPE
        }); // d) Test which point is contained within accessible area

        var containedPoint = null;

        for (var areaIndex in _this6.floorData.get(point.properties.level).areas) {
          var area = _this6.floorData.get(point.properties.level).areas[areaIndex];

          if (turf.booleanContains(area, pointM)) {
            containedPoint = pointM;
            break;
          } else if (turf.booleanContains(area, pointN)) {
            containedPoint = pointN;
            break;
          }
        } // Stop if either of points is not contained...


        if (containedPoint == null) {
          return;
        } // e) Generate point F at double the distance of wall offset


        var pointF = turf.destination(point.geometry.coordinates, _this6.wallOffsetDistance * 2, containedPoint === pointM ? bearing : oppositeBearing, {
          units: _this6.UNIT_TYPE
        }); // f) Test if PF intersects with any wall, update point F and PF to shortest available size

        var linePF = turf.lineString([point.geometry.coordinates, pointF.geometry.coordinates]);

        _this6.floorData.get(point.properties.level).walls.forEach(function (wall, index) {
          // Do not test walls containing point P, they will intersect of course
          if (walls.includes(wall)) {
            return;
          }

          var lineWall = _this6.floorData.get(point.properties.level).wallFeatures[index]; // Find intersection point, use it to produce new


          var intersections = turf.lineIntersect(linePF, lineWall);

          if (intersections.features.length > 0) {
            pointF = turf.point(intersections.features[0].geometry.coordinates);
            linePF = turf.lineString([point.geometry.coordinates, pointF.geometry.coordinates]);
          }
        }); // g) Create wall offset point as midpoint between points P,F


        var offsetPoint = turf.midpoint(point.geometry.coordinates, pointF.geometry.coordinates);
        offsetPoint.properties.level = point.properties.level;
        _this6.wallOffsets[pointList.indexOf(point)] = offsetPoint;
        var offsetLine = turf.lineString([point.geometry.coordinates, offsetPoint.geometry.coordinates]);
        offsetLine.properties.level = point.properties.level;

        _this6.wallOffsetLineList.push(offsetLine);
      });
      return this.wallOffsets;
    }
    /**
     * @param current {Feature<Point>}
     * @return {[Feature<Point>]}
     */

  }, {
    key: "reconstructPath",
    value: function reconstructPath(current) {
      var _this7 = this;

      var path = [];
      var previous = current;

      do {
        var pointsToInject = this._calculateWallOffsetPointList(current, path.length > 0 ? path[path.length - 1] : previous);

        pointsToInject.forEach(function (point) {
          if (previous === current || previous.geometry.coordinates[0] !== point.geometry.coordinates[0] || previous.geometry.coordinates[1] !== point.geometry.coordinates[1]) {
            var newPoint = _this7._copyPoint(point);

            newPoint.properties.level = current.properties.level;
            newPoint.properties.walkableAreaId = current.properties.walkableAreaId;
            newPoint.properties.bordersArea = current.properties.bordersArea;
            path.push(newPoint);
            previous = point;
          }
        });
        current = current.properties.cameFrom;

        if (path.length > 10000) {
          throw new Error("Too big route");
        }
      } while (current != null);

      path.reverse();
      var pointsToFilter = []; // Simplify the route by omitting corners that are basically at the same spot

      for (var i = 0; i < path.length - 1; i++) {
        var pointA = path[i];
        var pointB = path[i + 1]; // Different floors nothing to do

        if (pointA.properties.level !== pointB.properties.level) {
          continue;
        }

        var distanceAtoB = this._distance(pointA, pointB); // 70cm


        if (distanceAtoB < 0.7) {
          pointsToFilter.push(pointA);
        }
      }

      path = path.filter(function (pathPoint) {
        return !pointsToFilter.includes(pathPoint);
      });
      pointsToFilter = []; // Simplify the route by omitting corners that are basically straight

      for (var _i2 = 1; _i2 < path.length - 1; _i2++) {
        var _pointA = path[_i2 - 1];
        var _pointB = path[_i2];
        var pointC = path[_i2 + 1]; // Different floors nothing to do

        if (_pointA.properties.level !== _pointB.properties.level || _pointA.properties.level !== pointC.properties.level) {
          continue;
        }

        var bearingAtoB = this.bearing(_pointA.geometry.coordinates, _pointB.geometry.coordinates);
        var bearingBtoC = this.bearing(_pointB.geometry.coordinates, pointC.geometry.coordinates);
        var bearingDiff = Math.abs(bearingAtoB - bearingBtoC);

        if (bearingDiff > Math.PI) {
          bearingDiff -= Math.PI;
        } // 2 degrees filter


        if (bearingDiff < 0.03488888) {
          pointsToFilter.push(_pointB);
        }
      }

      path = path.filter(function (pathPoint) {
        return !pointsToFilter.includes(pathPoint);
      }); // let pathCoordinates = path.map(point => point.geometry.coordinates);

      return path;
    }
  }, {
    key: "_calculateWallOffsetPointList",
    value: function _calculateWallOffsetPointList(currentPoint, previousPoint) {
      var _this8 = this;

      var pointList = this._getPointList();

      var currentPointIndex = pointList.indexOf(currentPoint);
      var previousPointIndex = pointList.indexOf(previousPoint);
      var offsetPointList = [];
      var currentOffsetPoint = currentPoint; // a) offset current point

      if (currentPointIndex >= 0 && this.wallOffsets[currentPointIndex]) {
        currentOffsetPoint = this.wallOffsets[currentPointIndex];
      }

      offsetPointList.push(currentOffsetPoint);
      var potentialOffsetPoints;

      var _loop4 = function _loop4() {
        var line = turf.lineString([previousPoint.geometry.coordinates, currentOffsetPoint.geometry.coordinates]);
        potentialOffsetPoints = [];

        _this8.wallOffsetLineList.forEach(function (wallOffsetLine, index) {
          // Do not process wall offsets from another floor
          if (wallOffsetLine.properties.level !== currentPoint.properties.level) {
            return;
          } // Do not process wall offsets with previous or current point


          if (index === previousPointIndex || index === currentPointIndex) {
            return;
          }

          var intersection = turf.lineIntersect(line, wallOffsetLine);

          if (intersection.features.length > 0) {
            var offsetPoint = _this8.wallOffsets[index]; // store distance to previousPoint

            offsetPoint.properties.distance = _this8._distance(intersection.features[0], currentOffsetPoint);
            offsetPoint.properties.offsetIndex = index;
            potentialOffsetPoints.push(offsetPoint);
          }
        });

        if (potentialOffsetPoints.length > 0) {
          potentialOffsetPoints.sort(function (a, b) {
            return a.properties.distance - b.properties.distance;
          });
          currentOffsetPoint = potentialOffsetPoints[0];
          currentPointIndex = currentOffsetPoint.properties.offsetIndex;
          offsetPointList.push(currentOffsetPoint);
        }
      };

      do {
        _loop4();
      } while (potentialOffsetPoints.length > 0);

      return offsetPointList.reverse();
    }
  }, {
    key: "_getIntersectingOffsetPoints",
    value: function _getIntersectingOffsetPoints(current, previous) {
      var _this9 = this;

      if (current === previous || current.properties.level !== previous.properties.level) {
        return [];
      }

      var line = turf.lineString([current.geometry.coordinates, previous.geometry.coordinates]);
      var intersectingWallOffsetPoints = [];
      this.wallOffsetLineList.forEach(function (wallOffsetLine, index) {
        if (wallOffsetLine.properties.level !== current.properties.level) {
          return;
        }

        if (turf.lineIntersect(line, wallOffsetLine).features.length > 0) {
          var point = _this9.wallOffsets[index];
          point.properties.distance = turf.pointToLineDistance(current.geometry.coordinates, wallOffsetLine, {
            units: _this9.UNIT_TYPE
          });
          intersectingWallOffsetPoints.push(point);
        }
      });
      intersectingWallOffsetPoints.sort(function (a, b) {
        return b.properties.distance - b.properties.distance;
      });
      return intersectingWallOffsetPoints;
    }
  }, {
    key: "clearData",
    value: function clearData() {
      this.floorData.forEach(function (data, level) {
        for (var index in data.points) {
          var point = data.points[index];
          delete point.properties.cameFrom;
          delete point.properties.gscore;
          delete point.properties.fscore;
        }
      });
      this.levelChangerList.forEach(function (levelChanger) {
        levelChanger.properties.fixedPointMap.forEach(function (it, level) {
          delete it.properties.cameFrom;
          delete it.properties.gscore;
          delete it.properties.fscore;
        });
      });
      this.corridorLinePoints.forEach(function (point) {
        delete point.properties.cameFrom;
        delete point.properties.gscore;
        delete point.properties.fscore;
      });
    }
    /**
     *
     * @param startPoint {Feature<Point>}
     * @param endPoint {Feature<Point>}
     * @return {[Feature<Point>]}
     * @private
     */

  }, {
    key: "runAStar",
    value: function runAStar(startPoint, endPoint) {
      var natural = this.calculatePath(startPoint, endPoint);

      if (natural !== undefined && natural.length == 2) {
        var isPathOnLineProperDirection = this._checkShortPath(natural[0], natural[1]);

        if (!isPathOnLineProperDirection) {
          return undefined;
        }
      }

      return natural;
    }
    /**
     *
     * @param startPoint {Feature<Point>}
     * @param endPoint {Feature<Point>}
     * @return {[Feature<Point>]}
     * @private
     */

  }, {
    key: "runAStarWithDetails",
    value: function runAStarWithDetails(startPoint, endPoint) {
      var path = this.runAStar(startPoint, endPoint);
      var distance = this.calculateDistance(path);
      var duration = this.calculateTime(path, distance);
      return {
        path: path,
        distance: distance,
        duration: duration
      };
    }
    /**
     * Check if path has an elevator
     * @param path {Feature<Point>}
     * @param key {Int}
     * @return {Boolean}
     * @private
     */

  }, {
    key: "isPathElevator",
    value: function isPathElevator(path, key) {
      if (path[key].properties.type == this.POI_TYPE.ELEVATOR && path[key + 1].properties.type == this.POI_TYPE.ELEVATOR) {
        return true;
      }

      return false;
    }
    /**
     * Check if path has an escalator
     * @param path {Feature<Point>}
     * @param key {Int}
     * @return {Boolean}
     * @private
     */

  }, {
    key: "isPathEscalator",
    value: function isPathEscalator(path, key) {
      if (path[key].properties.type == this.POI_TYPE.ESCALATOR && path[key + 1].properties.type == this.POI_TYPE.ESCALATOR) {
        return true;
      }

      return false;
    }
    /**
     * Check if path has a staircase
     * @param path {Feature<Point>}
     * @param key {Int}
     * @return {Boolean}
     * @private
     */

  }, {
    key: "isPathStaircase",
    value: function isPathStaircase(path, key) {
      if (path[key].properties.type == this.POI_TYPE.STAIRCASE && path[key + 1].properties.type == this.POI_TYPE.STAIRCASE) {
        return true;
      }

      return false;
    }
    /**
     * Check if path is flat without stairs, elevator or escalator
     * @param path {Feature<Point>}
     * @param key {Int}
     * @return {Boolean}
     * @private
     */

  }, {
    key: "isPathFlat",
    value: function isPathFlat(path, key) {
      return !this.isPathElevator(path, key) && !this.isPathEscalator(path, key) && !this.isPathStaircase(path, key);
    }
    /**
     * Calculate length of the path in meters
     * @param path {Feature<Point>}
     * @return {Float}
     * @private
     */

  }, {
    key: "calculateDistance",
    value: function calculateDistance(path) {
      var _this10 = this;

      var distance = 0;

      if (path === undefined || path.length === 0) {
        return distance;
      }

      path.forEach(function (_, key) {
        if (path[key + 1] !== undefined) {
          distance += turf.distance(path[key], path[key + 1], {
            units: _this10.UNIT_TYPE
          });
        }
      });
      return distance;
    }
    /**
     * Calculate length of the path in seconds
     * @param path {Feature<Point>}
     * @param distance {Float}
     * @return {Float}
     * @private
     */

  }, {
    key: "calculateTime",
    value: function calculateTime(path, distance) {
      var _this11 = this;

      var time = distance / this.walkingSpeed;
      var elevator = 0.0;
      var escalator = 0.0;
      var staircase = 0.0;

      if (path === undefined) {
        path = [];
      }

      path.forEach(function (_, key) {
        if (_this11.isPathElevator(path, key)) {
          var levels = Math.abs(path[key].properties.level - path[key + 1].properties.level);
          elevator += levels * _this11.floorHeight / _this11.elevatorSpeed + _this11.elevatorWaiting;
        }

        if (_this11.isPathEscalator(path, key)) {
          var _levels = Math.abs(path[key].properties.level - path[key + 1].properties.level);

          var base = _this11.floorHeight * _this11.floorHeight;
          escalator += _levels * Math.sqrt(base + base) / _this11.escalatorSpeed;
        }

        if (_this11.isPathStaircase(path, key)) {
          var _levels2 = Math.abs(path[key].properties.level - path[key + 1].properties.level);

          var _base = _this11.floorHeight * _this11.floorHeight;

          staircase += _levels2 * Math.sqrt(_base + _base) / _this11.staircasesSpeed;
        }
      });
      var realistic = time + elevator + escalator + staircase;
      return {
        shortest: time,
        elevator: elevator,
        escalator: escalator,
        staircase: staircase,
        realistic: realistic
      };
    }
    /**
     *
     * @param startPoint {Feature<Point>}
     * @param endPoint {Feature<Point>}
     * @return {[Feature<Point>]}
     * @private
     */

  }, {
    key: "calculatePath",
    value: function calculatePath(startPoint, endPoint) {
      var _this12 = this;

      this.clearData();
      this.nbLines = [];
      this.bearingCache = new Map();

      var fixedStartPoint = this._getFixPointInArea(startPoint, true);

      var fixedEndPoint = this._getFixEndPoint(endPoint, startPoint.properties.level);

      var openSet = [fixedStartPoint];
      var closedSet = [];
      fixedStartPoint.properties.gscore = 0;
      fixedStartPoint.properties.fscore = this._heuristic(fixedStartPoint, fixedEndPoint);

      var _loop5 = function _loop5() {
        var current = _this12._getMinFScore(openSet, closedSet); // Unable to find best point to continue?


        if (current === null) {
          return "break";
        }

        if (current === fixedEndPoint) {
          var finalPath = undefined;

          try {
            finalPath = _this12.reconstructPath(current);
          } catch (error) {
            return {
              v: undefined
            };
          }

          if (fixedEndPoint !== endPoint && (!fixedEndPoint.properties.onCorridor || _this12._distance(fixedEndPoint, endPoint) > _this12.pathFixDistance)) {
            endPoint.properties.fixed = true;
            finalPath.push(endPoint);
          }

          if (fixedStartPoint !== startPoint && (!fixedStartPoint.properties.onCorridor || _this12._distance(fixedStartPoint, startPoint) > _this12.pathFixDistance)) {
            startPoint.properties.fixed = true;
            finalPath.unshift(startPoint);
          }

          finalPath[finalPath.length - 1].properties.gscore = current.properties.gscore;
          return {
            v: finalPath
          };
        }

        closedSet.push(openSet.splice(openSet.indexOf(current), 1));

        var neighbours = _this12._getNeighbours(current, fixedStartPoint, fixedEndPoint);

        neighbours.forEach(function (n) {
          return _this12.nbLines.push(turf.lineString([current.geometry.coordinates, n.geometry.coordinates]));
        });
        neighbours.forEach(function (neighbour) {
          if (closedSet.indexOf(neighbour) <= -1) {
            var tentativeGScore = current.properties.gscore + _this12._distance(current, neighbour);

            var gScoreNeighbour = neighbour.properties.gscore != null ? neighbour.properties.gscore : Infinity;

            if (tentativeGScore < gScoreNeighbour) {
              neighbour.properties.cameFrom = current;
              neighbour.properties.gscore = tentativeGScore + 0.2;
              neighbour.properties.fscore = tentativeGScore + _this12._heuristic(neighbour, fixedEndPoint);

              if (openSet.indexOf(neighbour) < 0) {
                openSet.push(neighbour);
              }
            }
          }
        });
      };

      while (openSet.length > 0) {
        var _ret = _loop5();

        if (_ret === "break") break;
        if (_typeof(_ret) === "object") return _ret.v;
      }

      return undefined;
    }
  }, {
    key: "_checkIfCrossingTwoPolygon",
    value: function _checkIfCrossingTwoPolygon(current, neighbour) {
      var last = current.properties || {};
      var candidate = neighbour.properties || {};

      if (candidate.walkableAreaId !== undefined && last.walkableAreaId !== undefined) {
        if (candidate.walkableAreaId !== last.walkableAreaId) {
          return true;
        }

        if (candidate.bordersArea === undefined) {
          return true;
        }
      }

      if (last.walkableAreaId !== undefined && candidate.walkableAreaId === undefined) {
        if (candidate.isCorridorPoint === true) {
          return false;
        }

        return true;
      }

      return false;
    }
    /**
     *
     * @param point {Feature<Point>}
     * @param startPoint {Feature<Point>}
     * @param endPoint {Feature<Point>}
     * @return {Point[]}
     * @private
     */

  }, {
    key: "_getNeighbours",
    value: function _getNeighbours(point, startPoint, endPoint) {
      var _this13 = this;

      var neighbours = [];

      if (point === startPoint) {
        var levelPoints = this._getPointList().filter(function (proposedPoint) {
          return _this13._isPointOnLevel(proposedPoint, point.properties.level);
        });

        neighbours = this._findNeighbours(point, startPoint, endPoint, levelPoints);
        neighbours = neighbours.filter(function (neighbourPoint) {
          var level = point.properties.level;

          var revolvingDoorBlock = _this13.configuration.avoidRevolvingDoors && _this13._testAccessibilityPoiNeighbourhood(point, neighbourPoint, level, _this13.POI_TYPE.REVOLVING_DOOR);

          var ticketGateBlock = _this13.configuration.avoidTicketGates && _this13._testAccessibilityPoiNeighbourhood(point, neighbourPoint, level, _this13.POI_TYPE.TICKET_GATE);

          var isCrossingTwoPolygon = _this13._checkIfCrossingTwoPolygon(point, neighbourPoint);

          return !revolvingDoorBlock && !ticketGateBlock && !isCrossingTwoPolygon;
        });
      } else {
        // Gather neighbours over all levels
        var points = this._getPointList();

        var pointIndex = points.indexOf(point);

        if (pointIndex >= 0) {
          this.floorData.forEach(function (_, level) {
            var levelNeighbourMap = _this13.neighbourMap[level];

            if (levelNeighbourMap.hasOwnProperty(pointIndex)) {
              levelNeighbourMap[pointIndex].forEach(function (neighbourIndex) {
                var neighbourPoint = points[neighbourIndex];

                var revolvingDoorBlock = _this13.configuration.avoidRevolvingDoors && _this13._testAccessibilityPoiNeighbourhood(point, neighbourPoint, level, _this13.POI_TYPE.REVOLVING_DOOR);

                var ticketGateBlock = _this13.configuration.avoidTicketGates && _this13._testAccessibilityPoiNeighbourhood(point, neighbourPoint, level, _this13.POI_TYPE.TICKET_GATE);

                var isCrossingTwoPolygon = _this13._checkIfCrossingTwoPolygon(point, neighbourPoint);

                if (!neighbours.includes(neighbourPoint) && !revolvingDoorBlock && !ticketGateBlock && !isCrossingTwoPolygon) {
                  neighbours.push(neighbourPoint);
                }
              });
            }
          });
        } // Test if endpoint is neighbour


        if (point.properties.level !== undefined && point.properties.level === endPoint.properties.level || point.properties.fixedPointMap != undefined && point.properties.fixedPointMap.has(endPoint.properties.level)) {
          var revolvingDoorBlock = this.configuration.avoidRevolvingDoors && this._testAccessibilityPoiNeighbourhood(point, endPoint, endPoint.properties.level, this.POI_TYPE.REVOLVING_DOOR);

          var ticketGateBlock = this.configuration.avoidTicketGates && this._testAccessibilityPoiNeighbourhood(point, endPoint, endPoint.properties.level, this.POI_TYPE.TICKET_GATE);

          var isCrossingTwoPolygon = this._checkIfCrossingTwoPolygon(point, endPoint);

          if (!revolvingDoorBlock && !ticketGateBlock && !isCrossingTwoPolygon) {
            // Endpoint is fixed on corridor
            if (endPoint.properties.onCorridor) {
              if (endPoint.properties.neighbours.includes(point)) {
                neighbours.push(endPoint);
              } else if (endPoint.properties.neighboursLeadingTo !== undefined && endPoint.properties.neighboursLeadingTo.includes(point)) {
                neighbours.push(endPoint);
              } // End point is not on corridor, therefore should be in the area

            } else {
              var unwrapped = this._unwrapLevelChangerPoint(point, endPoint.properties.level);

              var allowedIntersections = 1;

              if (unwrapped.properties.isCorridorPoint || unwrapped.properties.onCorridor) {
                allowedIntersections--;
              }

              if (this._countIntersections(unwrapped, endPoint, allowedIntersections)) {
                neighbours.push(endPoint);
              }
            }
          }
        }
      }

      return neighbours.filter(function (neighbour) {
        if (_this13.configuration.avoidElevators && neighbour.properties.type === _this13.POI_TYPE.ELEVATOR) {
          return false;
        } else if (_this13.configuration.avoidEscalators && neighbour.properties.type === _this13.POI_TYPE.ESCALATOR) {
          return false;
        } else if (_this13.configuration.avoidStaircases && neighbour.properties.type === _this13.POI_TYPE.STAIRCASE) {
          return false;
        } else if (_this13.configuration.avoidNarrowPaths && neighbour.properties.narrowPath) {
          return false;
        } else if (_this13.configuration.avoidRamps && neighbour.properties.ramp) {
          return false;
        } else if (_this13.configuration.avoidHills && neighbour.properties.hill) {
          return false;
        }

        return true;
      });
    }
    /**
     *
     * @param pointA {Feature<Point>}
     * @param pointB {Feature<Point>}
     * @param level {Number}
     * @param accesibilityType {String}
     * @returns {boolean}
     * @private
     */

  }, {
    key: "_testAccessibilityPoiNeighbourhood",
    value: function _testAccessibilityPoiNeighbourhood(pointA, pointB, level, accesibilityType) {
      var _this14 = this;

      // Filter out lines that intersect revolving door POIs.
      var skip = false;

      if (accesibilityType === this.POI_TYPE.REVOLVING_DOOR && this.configuration.avoidRevolvingDoors) {
        var line = turf.lineString([pointA.geometry.coordinates, pointB.geometry.coordinates]);
        var poiList = this.accessibilityPoi.filter(function (poi) {
          return poi.properties.level === level && poi.properties.type === accesibilityType;
        });
        poiList.forEach(function (poi) {
          var distance = turf.pointToLineDistance(poi.geometry.coordinates, line, {
            units: _this14.UNIT_TYPE
          });

          if (distance <= poi.properties.radius) {
            skip = true;
          }
        });
      }

      return skip;
    }
    /**
     * @param point {Feature<Point>}
     * @param startPoint {Feature<Point>}
     * @param endPoint {Feature<Point>}
     * @param proposedPointList {[Feature<Point>]}
     * @return {[Point]}
     */

  }, {
    key: "_findNeighbours",
    value: function _findNeighbours(point, startPoint, endPoint, proposedPointList) {
      var neighbours = [];

      if (point.properties.neighbours != null) {
        neighbours = _toConsumableArray(point.properties.neighbours);
      } // Start point is on corridor line, use only preset neighbours on line


      if (point === startPoint && point.properties.onCorridor || point.properties.isCorridorPoint && !point.properties.bordersArea) {
        // End point is on the same corridor line == they are neighbours
        if (endPoint && endPoint.properties.onCorridor && startPoint.properties.corridorIndex === endPoint.properties.corridorIndex) {
          neighbours.push(endPoint);
        }

        return neighbours;
      }

      var allowedIntersections = 0;

      if (endPoint && this._isPointOnLevel(endPoint, point.properties.level)) {
        proposedPointList.push(endPoint);
      }

      var fixedPoint = this._unwrapLevelChangerPoint(point, point.properties.level);

      for (var index in proposedPointList) {
        var proposedPoint = proposedPointList[index]; // Same point is not neighbour with itself

        if (point === proposedPoint) {
          continue;
        } // Already assigned


        if (neighbours.indexOf(proposedPoint) >= 0) {
          continue;
        }

        var fixedProposedPoint = this._unwrapLevelChangerPoint(proposedPoint, point.properties.level);

        allowedIntersections = 2;

        if (point === startPoint) {
          allowedIntersections--;
        }

        if (proposedPoint === startPoint) {
          allowedIntersections--;
        }

        if (point !== fixedPoint) {
          allowedIntersections--;
        }

        if (proposedPoint !== fixedProposedPoint) {
          allowedIntersections--;
        }

        if (proposedPoint.properties.isCorridorPoint || proposedPoint.properties.onCorridor) {
          allowedIntersections--;
        }

        var intersects = this._countIntersections(point, fixedProposedPoint, allowedIntersections);

        if (intersects) {
          // if (allowedIntersections >= 1) {
          var midpoint = turf.midpoint(point.geometry.coordinates, proposedPoint.geometry.coordinates);

          for (var polIndex in this.floorData.get(point.properties.level).areas) {
            var area = this.floorData.get(point.properties.level).areas[polIndex];

            if (turf.booleanContains(area, midpoint)) {
              neighbours.push(proposedPoint);
              break;
            }
          }
        }
      }

      return neighbours;
    }
    /**
     * @param pointA {Feature<Point>}
     * @param pointB {Feature<Point>}
     * @private {Boolean} true if points are on the same level
     */

  }, {
    key: "_comparePointLevels",
    value: function _comparePointLevels(pointA, pointB) {
      // If both points are NOT level changers
      if (pointA.properties.levels == null && pointB.properties.levels == null) {
        return pointA.properties.level === pointB.properties.level;
      } // At least one of points is level changer


      var pointALevelList = pointA.properties.fixedPointMap !== undefined ? _toConsumableArray(pointA.properties.fixedPointMap.keys()) : [pointA.properties.level];
      var pointBLevelList = pointB.properties.fixedPointMap !== undefined ? _toConsumableArray(pointB.properties.fixedPointMap.keys()) : [pointB.properties.level];
      return pointALevelList.filter(function (feature) {
        return pointBLevelList.includes(feature);
      }).length > 0;
    }
    /**
     * @param point {Feature<Point>}
     * @param level {Number}
     * @return {Feature<Point>}
     */

  }, {
    key: "_unwrapLevelChangerPoint",
    value: function _unwrapLevelChangerPoint(point, level) {
      var fixedPointMap = point.properties.fixedPointMap;

      if (fixedPointMap) {
        var fixedPoint = fixedPointMap.get(level);

        if (fixedPoint) {
          return fixedPoint;
        } else {
          return point;
        }
      } else {
        return point;
      }
    }
    /**
     *
     * @param pointFrom {Point}
     * @param pointTo {Point}
     * @param maxIntersections {Number}
     * @return {Boolean}
     */

  }, {
    key: "_countIntersections",
    value: function _countIntersections(pointFrom, pointTo, maxIntersections) {
      var fromCoordinates = pointFrom.geometry.coordinates;
      var toCoordinates = pointTo.geometry.coordinates;
      var bearing = this.bearing(fromCoordinates, toCoordinates);
      var intersections = 0;
      var intersectionPointList = [];
      var floorWalls = this.floorData.get(pointFrom.properties.level).walls;
      var floorWallFeatures = this.floorData.get(pointFrom.properties.level).wallFeatures;

      for (var index in floorWalls) {
        var wall = floorWalls[index];
        var inRange = false;
        var pointIsInAWall = false;

        if (pointFrom == wall[0] || pointFrom == wall[1]) {
          inRange = true;
          pointIsInAWall = true;
        } else {
          var wBearingA = this.bearing(fromCoordinates, wall[0].geometry.coordinates);
          var wBearingB = this.bearing(fromCoordinates, wall[1].geometry.coordinates);

          if (wBearingA > wBearingB) {
            var temp = wBearingA;
            wBearingA = wBearingB;
            wBearingB = temp;
          }

          var bearingDiff = wBearingB - wBearingA;

          if (bearingDiff < Math.PI) {
            if (wBearingA <= bearing && bearing <= wBearingB) {
              inRange = true;
            }
          } else {
            if (wBearingA >= bearing || bearing >= wBearingB) {
              inRange = true;
            }
          }
        }

        if (inRange) {
          if (pointIsInAWall) {
            if (!this._testIdenticalPointInList(pointFrom, intersectionPointList)) {
              intersectionPointList.push(pointFrom);
              intersections++;
            }
          } else {
            var intersectPoints = turf.lineIntersect(turf.lineString([fromCoordinates, toCoordinates]), floorWallFeatures[index]).features;

            if (intersectPoints.length > 0) {
              if (!this._testIdenticalPointInList(intersectPoints[0], intersectionPointList)) {
                intersectionPointList.push(intersectPoints[0]);
                intersections++;
              }
            }
          }

          if (intersections > maxIntersections) {
            return false;
          }
        }
      }

      return true;
    }
    /**
     *
     * @private
     */

  }, {
    key: "_averageBearing",
    value: function _averageBearing(bearingA, bearingB) {
      if (bearingA > bearingB) {
        var temp = bearingA;
        bearingA = bearingB;
        bearingB = temp;
      }

      if (bearingB - bearingA > 180) {
        bearingB -= 360;
      }

      var finalBearing = (bearingB + bearingA) / 2;
      return finalBearing <= -180 ? 360 + finalBearing : finalBearing;
    } // Converts from degrees to radians.

  }, {
    key: "toRadians",
    value: function toRadians(degrees) {
      return degrees * Math.PI / 180;
    }
  }, {
    key: "bearing",
    value: function bearing(start, end) {
      // let hasCache = false;
      var endCache = this.bearingCache.get(start);

      if (endCache) {
        var cache = endCache.get(end);

        if (cache != null) {
          return cache;
        }
      }

      var startLng = this.toRadians(start[0]);
      var startLat = this.toRadians(start[1]);
      var destLng = this.toRadians(end[0]);
      var destLat = this.toRadians(end[1]);
      var cosDestLat = Math.cos(destLat);
      var y = Math.sin(destLng - startLng) * cosDestLat;
      var x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * cosDestLat * Math.cos(destLng - startLng);
      var bearing = Math.atan2(y, x);

      this._storeBearingCache(start, end, bearing);

      return bearing;
    }
  }, {
    key: "_storeBearingCache",
    value: function _storeBearingCache(start, end, bearing) {
      var cacheMap = this.bearingCache.get(start);

      if (!cacheMap) {
        cacheMap = new Map();
        this.bearingCache.set(start, cacheMap);
      }

      cacheMap.set(end, bearing);
      cacheMap = this.bearingCache.get(end);

      if (!cacheMap) {
        cacheMap = new Map();
        this.bearingCache.set(end, cacheMap);
      }

      if (bearing <= 0) {
        bearing += Math.PI;
      } else {
        bearing -= Math.PI;
      }

      cacheMap.set(start, bearing);
    }
  }, {
    key: "_testIdenticalPointInList",
    value: function _testIdenticalPointInList(point, pointList) {
      return pointList.find(function (list) {
        return list.geometry.coordinates[0] === point.geometry.coordinates[0] && list.geometry.coordinates[1] === point.geometry.coordinates[1];
      }) !== undefined;
    }
    /**
     *
     * @param pointSet {[Feature<Point>]}
     * @returns {Feature<Point>}
     */

  }, {
    key: "_getMinFScore",
    value: function _getMinFScore(pointSet, previous) {
      var bestPoint = null;
      var bestScore = Infinity;
      var lastWalkableAreaId = (previous.slice(-1).properties || {}).walkableAreaId;
      var penultimateWalkableAreaId = (previous.slice(-2).properties || {}).walkableAreaId;
      var closedWalkable = penultimateWalkableAreaId !== undefined && lastWalkableAreaId === penultimateWalkableAreaId;
      pointSet.forEach(function (point) {
        var properties = point.properties;

        if (properties.fscore < bestScore) {
          //} && (closedWalkable || (!closedWalkable && properties.walkableAreaId === lastWalkableAreaId))) {
          bestPoint = point;
          bestScore = properties.fscore;
        }
      });
      return bestPoint;
    }
    /**
     *
     * @param pointA {Feature<Point>}
     * @param pointB {Feature<Point>}
     * @returns {*|number|undefined}
     */

  }, {
    key: "_heuristic",
    value: function _heuristic(pointA, pointB) {
      var _this15 = this;

      if (this._comparePointLevels(pointA, pointB)) {
        var penalty = 0;

        if (pointA.properties.levels !== undefined || pointB.properties.levels !== undefined) {
          penalty = 20;
        }

        return this._distance(pointA, pointB) + penalty;
      } else {
        // Filter out direct level changers
        var directLevelChangerList = this.levelChangerList.filter(function (levelChanger) {
          return levelChanger !== pointA && levelChanger !== pointB && _this15._comparePointLevels(levelChanger, pointA) && _this15._comparePointLevels(levelChanger, pointB);
        }); // Calculate best estimation for direct level change

        var bestDistance = Infinity;
        directLevelChangerList.forEach(function (levelChanger) {
          var distance = _this15._distance(pointA, levelChanger) + _this15._distance(levelChanger, pointB) + 10;

          if (distance < bestDistance) {
            bestDistance = distance;
          }
        }); // Return estimation if direct level change was found

        if (bestDistance < Infinity) {
          return bestDistance;
        }

        return 2000;
      }
    }
    /**
     *
     * @param pointA {Feature}
     * @param pointB {Feature}
     * @returns {*|number|undefined}
     */

  }, {
    key: "_distance",
    value: function _distance(pointA, pointB) {
      var levelChangePenalty = 0;
      if (pointB.properties.level !== pointA.properties.level) levelChangePenalty = 10;
      return turf.distance(pointA, pointB, {
        units: this.UNIT_TYPE
      }) + levelChangePenalty;
    }
    /**
     *
     * @private
     */

  }, {
    key: "_getFixEndPoint",
    value: function _getFixEndPoint(endPoint, startPointLevel) {
      var lc = this.levelChangerList.find(function (it) {
        return it.id === endPoint.id;
      });

      if (lc !== undefined && lc.properties.fixedPointMap !== undefined) {
        var nearestLevel = undefined;
        lc.properties.fixedPointMap.forEach(function (_, level) {
          if (nearestLevel === undefined || Math.abs(nearestLevel - startPointLevel) > Math.abs(level - startPointLevel)) {
            nearestLevel = level;
          }
        });
        endPoint = this._copyPoint(endPoint);
        endPoint.properties.level = nearestLevel;
      }

      return this._getFixPointInArea(endPoint);
    }
  }, {
    key: "_getFixPointInArea",
    value: function _getFixPointInArea(point) {
      var _this16 = this;

      var isStart = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var floorData = this.floorData.get(point.properties.level); // If point is located without accessible area, do nothing

      var pointFound = undefined;
      floorData.areas.forEach(function (polygon) {
        if (turf.booleanContains(polygon, point)) {
          pointFound = point;
          return;
        }
      });

      if (pointFound !== undefined) {
        return pointFound;
      } // Find nearest wall to stick to


      var bestWall = null;
      var bestWallDistance = Infinity;
      floorData.wallFeatures.forEach(function (wall) {
        var distance = turf.pointToLineDistance(point.geometry.coordinates, wall, {
          units: _this16.UNIT_TYPE
        });

        if (distance <= bestWallDistance) {
          bestWall = wall;
          bestWallDistance = distance;
        }
      });
      var levelCorridorFeatures = this.corridorLineFeatures.filter(function (corridorLine) {
        return corridorLine.properties.level === point.properties.level;
      });
      var bestCorridorIndex = null;
      var bestCorridorDistance = Infinity;
      levelCorridorFeatures.forEach(function (corridor) {
        var corridorIndex = _this16.corridorLineFeatures.indexOf(corridor);

        var corridorDistance = turf.pointToLineDistance(point.geometry.coordinates, corridor, {
          units: _this16.UNIT_TYPE
        });

        if (corridorDistance < bestCorridorDistance) {
          bestCorridorIndex = corridorIndex;
          bestCorridorDistance = corridorDistance;
        }
      }); // Test if area or corridor is closer, create appropriate fixed point

      if (bestWall === null && bestCorridorIndex === null) {
        // could not find neither close area or corridor
        return point;
      } else {
        var fixedPoint; // Corridor is closer

        if (bestCorridorIndex !== undefined && bestCorridorDistance < bestWallDistance) {
          // Create fixed point on line itself
          var line = this.corridorLineFeatures[bestCorridorIndex];
          fixedPoint = turf.nearestPointOnLine(line, point); // Mark this fixed point is on corridor, preset neighbours

          fixedPoint.properties.onCorridor = true;
          fixedPoint.properties.corridorIndex = bestCorridorIndex;

          if (!fixedPoint.properties.neighbours) {
            fixedPoint.properties.neighbours = [];
          }

          var isBidirectional = this.corridorLineFeatures[bestCorridorIndex].properties.bidirectional === undefined || this.corridorLineFeatures[bestCorridorIndex].properties.bidirectional === true;
          var isSwappedDirection = this.corridorLineFeatures[bestCorridorIndex].properties.swapDirection !== undefined && this.corridorLineFeatures[bestCorridorIndex].properties.swapDirection === true;

          if (isBidirectional) {
            var _fixedPoint$propertie4;

            fixedPoint.properties.neighbours.push(this.corridorLinePointPairs[bestCorridorIndex][0], this.corridorLinePointPairs[bestCorridorIndex][1]);

            (_fixedPoint$propertie4 = fixedPoint.properties.neighbours).push.apply(_fixedPoint$propertie4, _toConsumableArray(line.properties.intersectionPointList));

            fixedPoint.properties.neighboursLeadingTo = [this.corridorLinePointPairs[bestCorridorIndex][0], this.corridorLinePointPairs[bestCorridorIndex][1]].concat(_toConsumableArray(line.properties.intersectionPointList));
          } else {
            if (!isSwappedDirection && !isStart) {
              var _fixedPoint$propertie5;

              var after = this.corridorLinePointPairs[bestCorridorIndex][0];
              fixedPoint.properties.neighbours.push(after); // include only intersection points after this point

              var distance = this._distance(fixedPoint, after);

              var pointsBefore = line.properties.intersectionPointList.filter(function (point) {
                return _this16._distance(point, after) < distance;
              });
              var pointsAfter = line.properties.intersectionPointList.filter(function (point) {
                return _this16._distance(point, after) >= distance;
              });

              (_fixedPoint$propertie5 = fixedPoint.properties.neighbours).push.apply(_fixedPoint$propertie5, _toConsumableArray(pointsAfter));

              fixedPoint.properties.neighboursLeadingTo = pointsBefore;
            } else {
              var _fixedPoint$propertie6;

              var before = this.corridorLinePointPairs[bestCorridorIndex][1];
              fixedPoint.properties.neighbours.push(before); // include only intersection points before this point

              var _distance2 = this._distance(fixedPoint, before);

              var _pointsBefore = line.properties.intersectionPointList.filter(function (point) {
                return _this16._distance(point, before) <= _distance2;
              });

              var _pointsAfter = line.properties.intersectionPointList.filter(function (point) {
                return _this16._distance(point, before) > _distance2;
              });

              (_fixedPoint$propertie6 = fixedPoint.properties.neighbours).push.apply(_fixedPoint$propertie6, _toConsumableArray(_pointsBefore));

              fixedPoint.properties.neighboursLeadingTo = _pointsAfter;
            }
          } // Wall is closer

        } else if (bestWall !== null) {
          // Create fixed point inside area
          var nearestPoint = turf.nearestPointOnLine(bestWall, point);
          var bearing = turf.bearing(point, nearestPoint);
          fixedPoint = turf.destination(point.geometry.coordinates, bestWallDistance + 0.05, bearing, {
            units: this.UNIT_TYPE
          });
        } // Mark level of fixed point


        fixedPoint.properties.level = point.properties.level; // Return created point

        return fixedPoint;
      }
    }
    /**
     * @param point {Feature <Point>}
     * @return {Feature <Point>}
     */

  }, {
    key: "_copyPoint",
    value: function _copyPoint(pointFeature) {
      var point = turf.point([pointFeature.geometry.coordinates[0], pointFeature.geometry.coordinates[1]]);
      if (pointFeature.id !== undefined) point.id = pointFeature.id;
      if (pointFeature.properties.id !== undefined) point.properties.id = pointFeature.properties.id;
      if (pointFeature.properties.amenity !== undefined) point.properties.amenity = pointFeature.properties.amenity;
      if (pointFeature.properties.type !== undefined) point.properties.type = pointFeature.properties.type;
      return point;
    }
  }, {
    key: "_setNeighbourhoodBasedOnCorridorDirectionality",
    value: function _setNeighbourhoodBasedOnCorridorDirectionality(segmentFeature, segmentPointA, segmentPointB, intersectionPoint) {
      if (intersectionPoint.properties.neighbours === undefined) {
        intersectionPoint.properties.neighbours = [];
      }

      var isBidirectional = segmentFeature.properties.bidirectional === undefined || segmentFeature.properties.bidirectional === true;
      var isSwappedDirection = segmentFeature.properties.swapDirection !== undefined && segmentFeature.properties.swapDirection === true;

      if (isBidirectional) {
        intersectionPoint.properties.neighbours.push(segmentPointA, segmentPointB);
        segmentPointA.properties.neighbours.push(intersectionPoint);
        segmentPointB.properties.neighbours.push(intersectionPoint);
      } else {
        if (!isSwappedDirection) {
          segmentPointA.properties.neighbours.push(intersectionPoint);
          intersectionPoint.properties.neighbours.push(segmentPointB);
        } else {
          segmentPointB.properties.neighbours.push(intersectionPoint);
          intersectionPoint.properties.neighbours.push(segmentPointA);
        }
      }
    }
  }, {
    key: "_comparePointsByDistanceFromReference",
    value: function _comparePointsByDistanceFromReference(reference, intersectionA, intersectionB) {
      var dA = turf.distance(reference, intersectionA);
      var dB = turf.distance(reference, intersectionB);
      if (dA > dB) return 1;
      if (dB > dA) return -1;
      return 0;
    }
  }, {
    key: "_checkShortPath",
    value: function _checkShortPath(start, end) {
      var startCorridor = this._getFixPointInArea(start, true);

      var endCorridor = this._getFixPointInArea(end, true);

      if (startCorridor.properties.corridorIndex === endCorridor.properties.corridorIndex) {
        var index = startCorridor.properties.corridorIndex;
        var corridor = this.corridorLineFeatures[index];
        var isBidirectional = corridor.properties.bidirectional === undefined || corridor.properties.bidirectional === true;

        if (isBidirectional) {
          return true;
        }

        var coords = corridor.geometry.coordinates;
        var corridorBearing = turf.bearing(coords[0], coords[1]);
        var pathBearing = turf.bearing(start, end);
        var delta = parseInt(corridorBearing - pathBearing);
        var isSwappedDirection = corridor.properties.swapDirection !== undefined && corridor.properties.swapDirection;
        return isSwappedDirection ? delta !== 0 : delta === 0;
      }

      return true;
    }
  }]);

  return Wayfinding;
}();

exports.Wayfinding = Wayfinding;