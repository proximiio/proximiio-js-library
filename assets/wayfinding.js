import * as turf from '@turf/turf';

export class Wayfinding {
  configuration = {
    avoidElevators: false,
    avoidEscalators: false,
    avoidStaircases: false,
    avoidRamps: false,
    avoidNarrowPaths: false,
    avoidRevolvingDoors: false,
    avoidTicketGates: false,
    avoidBarriers: false,
    avoidHills: false,
  };

  POI_TYPE = {
    ELEVATOR: "elevator",
    ESCALATOR: "escalator",
    STAIRCASE: "staircase",
    RAMP: "ramp",
    HILL: "hill",
    NARROW_PATH: "narrow_path",
    REVOLVING_DOOR: "door",
    TICKET_GATE: "ticket_gate",
    BARRIER: "barrier",
  };

  ACCESSIBILITY_POI_TYPE = ["door", "ticket_gate"];

  LEVEL_CHANGER_TYPE = ["elevator", "escalator", "staircase", "ramp", "hill"];

  PATH_TYPE = "path";
  LINE_STRING_TYPE = "LineString";

  DIRECTION_UP = "up";
  DIRECTION_DOWN = "down";

  ROUTABLE_TYPE = ["MultiPolygon", "Polygon"];

  UNIT_TYPE = "meters";

  pathFixDistance = 1.0; // meters
  wallOffsetDistance = 0.5; // meters

  walkingSpeed = 1.4; // meters / second

  floorHeight = 4.5; // meters

  elevatorSpeed = 0.9; // meters / second
  elevatorWaiting = 55.0; // second

  escalatorSpeed = 0.24; // meters / second

  staircasesSpeed = 0.3; // meters / second

  /**
   *
   * @param featureCollection {FeatureCollection}
   */
  constructor(featureCollection) {
    const featureList = featureCollection.features;

    const { minLevel, maxLevel } = this.extractMinMaxLevel(featureList);
    if (minLevel === undefined) throw "No feature with level was supplied!";

    const routableAreaFeatureList = featureList.filter(
      (feature) =>
        feature.properties.routable &&
        this.ROUTABLE_TYPE.includes(feature.geometry.type)
    );
    let floorGeojsonMap = new Map();
    for (let level = minLevel; level <= maxLevel; level++) {
      let floorAreaFeature = routableAreaFeatureList.filter(
        (feature) => feature.properties.level === level
      );
      floorGeojsonMap.set(
        level,
        turf.featureCollection(
          floorAreaFeature !== undefined ? floorAreaFeature : []
        )
      );
    }
    this.floorList = floorGeojsonMap;

    // Corridors
    this.corridors = featureList.filter(
      (feature) =>
        feature.properties.class === this.PATH_TYPE &&
        feature.geometry.type === this.LINE_STRING_TYPE
    );

    // Level changers
    let levelChangers = featureList.filter((feature) =>
      this.LEVEL_CHANGER_TYPE.includes(feature.properties.type)
    );
    levelChangers.forEach((levelChanger) => {
      if (levelChanger.id === undefined) {
        levelChanger.id = levelChanger.properties.id;
      }
    });
    levelChangers.forEach((levelChanger) => {
      if (levelChanger.properties.levels === undefined) {
        levelChanger.properties.levels = [];
        if (
          levelChanger.properties.level_min !== undefined &&
          levelChanger.properties.level_max !== undefined
        ) {
          for (
            let level = levelChanger.properties.level_min;
            level <= levelChanger.properties.level_max;
            level++
          ) {
            levelChanger.properties.levels.push(level);
          }
        }
      }
    });
    this.levelChangerList = levelChangers;

    // Accessibility POI
    this.accessibilityPoi = featureList.filter((feature) =>
      this.ACCESSIBILITY_POI_TYPE.includes(feature.properties.type)
    );

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
  setConfiguration(configuration, pathFixDistance = 1.0) {
    Object.keys(configuration).forEach((property) => {
      if (this.configuration.hasOwnProperty(property)) {
        this.configuration[property] = configuration[property];
      }
    });
    this.pathFixDistance = pathFixDistance;
  }

  extractMinMaxLevel(featureList) {
    let minLevel = undefined;
    let maxLevel = undefined;

    featureList.forEach((feature) => {
      let level = feature.properties.level;
      if (minLevel === undefined || level < minLevel) {
        minLevel = level;
      }
      if (maxLevel === undefined || maxLevel < level) {
        maxLevel = level;
      }
      if (feature.properties.levels !== undefined) {
        feature.properties.levels.forEach((level) => {
          if (minLevel === undefined || level < minLevel) {
            minLevel = level;
          }
          if (maxLevel === undefined || maxLevel < level) {
            maxLevel = level;
          }
        });
      }
    });
    return { minLevel, maxLevel };
  }

  rebuildData() {
    let floorData = new Map();
    this.floorList.forEach((floor, level) => {
      let floorPoints = [];
      let floorWalls = [];
      let floorAreas = [];

      // Floor features == "walkable areas"
      floor.features.forEach((walkableArea) => {
        let wallLineStringList = turf
          .flatten(turf.polygonToLine(walkableArea))
          .features.map((feature) => feature.geometry);
        // Floor wall lines, we wish to split to individual walls
        wallLineStringList.forEach((wallLineString) => {
          let firstPoint;
          let nextPoint;

          // Last point is the same as first, therefore limit index to exclude last point
          for (
            let index = 0;
            index < wallLineString.coordinates.length - 1;
            index++
          ) {
            let point;
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
        wallFeatures: floorWalls.map((wall) =>
          turf.lineString([
            wall[0].geometry.coordinates,
            wall[1].geometry.coordinates,
          ])
        ),
      });
    });

    this.bearingCache = new Map();
    this.floorData = floorData;

    this.floorData.forEach((floorData, floorLevel) => {
      // List of physical POIs on this level that are within area
      let inAreaPoiList = this.accessibilityPoi
        .filter((poi) => floorLevel === poi.properties.level)
        .filter(
          (poi) =>
            floorData.areas.filter((area) => turf.booleanContains(area, poi))
              .length > 0
        );

      inAreaPoiList.forEach((poi) => {
        // Generate points around POI to allow going around, but only if they are "within area
        let detourPointList = [
          turf.destination(
            poi.geometry.coordinates,
            poi.properties.radius + this.wallOffsetDistance,
            0,
            { units: this.UNIT_TYPE }
          ),
          turf.destination(
            poi.geometry.coordinates,
            poi.properties.radius + this.wallOffsetDistance,
            60,
            { units: this.UNIT_TYPE }
          ),
          turf.destination(
            poi.geometry.coordinates,
            poi.properties.radius + this.wallOffsetDistance,
            120,
            { units: this.UNIT_TYPE }
          ),
          turf.destination(
            poi.geometry.coordinates,
            poi.properties.radius + this.wallOffsetDistance,
            180,
            { units: this.UNIT_TYPE }
          ),
          turf.destination(
            poi.geometry.coordinates,
            poi.properties.radius + this.wallOffsetDistance,
            -120,
            { units: this.UNIT_TYPE }
          ),
          turf.destination(
            poi.geometry.coordinates,
            poi.properties.radius + this.wallOffsetDistance,
            -60,
            { units: this.UNIT_TYPE }
          ),
        ].filter(
          (poi) =>
            floorData.areas.filter((area) => turf.booleanContains(area, poi))
              .length > 0
        );
        detourPointList.forEach((point) => {
          point.properties.level = floorLevel;
          point.properties.isDetourPoint = true;
        });
        floorData.points = floorData.points.concat(detourPointList);
        this.detourPointList = detourPointList;
      });
    });

    // Split lines into single line segments
    let corridorLinePointPairs = [];
    let corridorLineFeatures = [];
    this.corridors.forEach((corridor, _) => {
      let coordinateList = corridor.geometry.coordinates;
      let lastPoint = null;
      for (let i = 0; i < coordinateList.length - 1; i++) {
        let pointA;
        if (lastPoint != null) {
          pointA = lastPoint;
        } else {
          pointA = turf.point(coordinateList[i]);
          pointA.properties.neighbours = [];
          pointA.properties.level = corridor.properties.level;
        }
        let pointB = turf.point(coordinateList[i + 1]);
        pointB.properties.level = corridor.properties.level;
        pointB.properties.neighbours = [];

        const isAvailableNow = this._checkTimeBased(corridor) && this._checkAvailablePath(corridor);

        const isBidirectional =
          corridor.properties.bidirectional === undefined ||
          corridor.properties.bidirectional === true;
        const isSwappedDirection =
          corridor.properties.swapDirection !== undefined &&
          corridor.properties.swapDirection === true;

        if (isAvailableNow) {
          if (isBidirectional || !isSwappedDirection) {
            pointA.properties.neighbours.push(pointB);
          }

          if (isBidirectional || isSwappedDirection) {
            pointB.properties.neighbours.push(pointA);
          }
        }

        let lineFeature = turf.lineString([
          pointA.geometry.coordinates,
          pointB.geometry.coordinates,
        ]);
        lineFeature.properties.level = corridor.properties.level;

        // Mark lineFeature accordingly
        lineFeature.properties.isAvailableNow = isAvailableNow;
        lineFeature.properties.bidirectional = isBidirectional;
        lineFeature.properties.swapDirection = isSwappedDirection;

        // Mark points as NarrowPath if corridor is NarrowPath
        const isNarrowPath = corridor.properties.narrowPath === true;
        if (isNarrowPath === true) {
          pointA.properties.narrowPath = true;
          pointB.properties.narrowPath = true;
          lineFeature.properties.narrowPath = true;
        }

        // Mark points as Ramp if corridor is Ramp
        const isRamp = corridor.properties.ramp === true;
        if (isRamp === true) {
          pointA.properties.ramp = true;
          pointB.properties.ramp = true;
          lineFeature.properties.ramp = true;
        }

        const isHill = corridor.properties.ramp === true;
        // Mark points as Hill if corridor is Hill
        if (isHill === true) {
          pointA.properties.hill = true;
          pointB.properties.hill = true;
          lineFeature.properties.hill = true;
        }

        corridorLinePointPairs.push([pointA, pointB]);
        corridorLineFeatures.push(lineFeature);
        lastPoint = pointB;
      }
    });

    let segmentIntersectionPointList = [];
    let segmentIntersectionPointMap = new Map();
    let i = 0;

    // Split individual segments when intersecting
    i = 0;
    while (i < corridorLinePointPairs.length) {
      let segment = corridorLinePointPairs[i];
      let segmentLineString = corridorLineFeatures[i];

      // let segmentIntersectionList = [];

      if (!segmentIntersectionPointMap.has(i)) {
        segmentIntersectionPointMap.set(i, []);
      }
      for (let j = i + 1; j < corridorLinePointPairs.length; j++) {
        if (!segmentIntersectionPointMap.has(j)) {
          segmentIntersectionPointMap.set(j, []);
        }
        let segmentToTest = corridorLinePointPairs[j];

        if (
          segmentLineString.properties.level !==
          corridorLineFeatures[j].properties.level
        ) {
          continue;
        }

        // Consecutive segments, should not cross (rather, they cross at the end point)
        if (
          segmentToTest.includes(segment[0]) ||
          segmentToTest.includes(segment[1])
        ) {
          continue;
        }

        let segmentLineStringToTest = corridorLineFeatures[j];
        let intersections = turf.lineIntersect(
          segmentLineString,
          segmentLineStringToTest
        ).features;
        if (intersections.length > 0) {
          let intersectingPoint = intersections[0];
          intersectingPoint.properties.level = segment[0].properties.level;
          intersectingPoint.properties.isCorridorPoint = true;
          // Intersect point inherits filters from both intersecting lines
          if (
            segmentLineString.properties.narrowPath ||
            segmentLineStringToTest.properties.narrowPath
          ) {
            intersectingPoint.properties.narrowPath = true;
          }
          if (
            segmentLineString.properties.ramp ||
            segmentLineStringToTest.properties.ramp
          ) {
            intersectingPoint.properties.ramp = true;
          }

          if (
            segmentLineString.properties.hill ||
            segmentLineStringToTest.properties.hill
          ) {
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
    while (i < corridorLinePointPairs.length) {
      let segment = corridorLinePointPairs[i];
      let segmentFeature = corridorLineFeatures[i];
      let pointA = segment[0];
      let pointB = segment[1];
      let segmentIntersectionList = segmentIntersectionPointMap.get(i);
      segmentIntersectionList.sort((a, b) =>
        this._comparePointsByDistanceFromReference(pointA, a, b)
      );
      if (segmentIntersectionList) {
        segmentIntersectionList.forEach((intersection) => {
          this._setNeighbourhoodBasedOnCorridorDirectionality(
            segmentFeature,
            pointA,
            pointB,
            intersection
          );

          const isAvailableNow = segmentFeature.properties.isAvailableNow;

          const isBidirectional =
            segmentFeature.properties.bidirectional === undefined ||
            segmentFeature.properties.bidirectional === true;

          const isSwappedDirection =
            segmentFeature.properties.swapDirection !== undefined &&
            segmentFeature.properties.swapDirection === true;

            if (isAvailableNow) {
              if (isBidirectional) {
                intersection.properties.neighbours =
                  intersection.properties.neighbours.concat(
                    segmentIntersectionList.filter((it) => it !== intersection)
                  );
              } else {
                if (!isSwappedDirection) {
                  let pointsAfter = segmentIntersectionList.slice(
                    segmentIntersectionList.indexOf(intersection)
                  );
                  intersection.properties.neighbours.push(...pointsAfter);
                } else {
                  let pointsBefore = segmentIntersectionList.slice(
                    0,
                    segmentIntersectionList.indexOf(intersection)
                  );
                  intersection.properties.neighbours.push(...pointsBefore);
                }
              }
            }
          
        });
        corridorLineFeatures[i].properties.intersectionPointList =
          segmentIntersectionList;
      } else {
        corridorLineFeatures[i].properties.intersectionPointList = [];
      }
      i++;
    }
    let segmentToWallIntersectionPointList = [];

    // Split corridor lines on interesections wilth walls
    i = 0;
    while (i < corridorLinePointPairs.length) {
      let segment = corridorLinePointPairs[i];
      let segmentFeature = corridorLineFeatures[i];

      let segmentIntersections = [];
      let walls = this.floorData.get(segment[0].properties.level).walls;
      let wallFeatures = this.floorData.get(
        segment[0].properties.level
      ).wallFeatures;

      wallFeatures.forEach((wallFeature, wallIndex) => {
        let intersections = turf.lineIntersect(
          segmentFeature,
          wallFeature
        ).features;
        if (intersections.length > 0) {
          let intersectPoint = intersections[0];
          intersectPoint.properties.level = segment[0].properties.level;
          intersectPoint.properties.neighbours = [];
          intersectPoint.properties.bordersArea = true;
          intersectPoint.properties.walkableAreaId =
            walls[0][0].properties.walkableAreaId;

          // Intersect point inherits filters from both intersecting lines
          if (segmentFeature.properties.narrowPath) {
            intersectPoint.properties.narrowPath = true;
          }
          if (segmentFeature.properties.ramp) {
            intersectPoint.properties.ramp = true;
          }
          if (segmentFeature.properties.hill) {
            intersectPoint.properties.hill = true;
          }
          let distance = this._distance(segment[0], intersectPoint);
          segmentIntersections.push({
            point: intersectPoint,
            distance: distance,
            wallIndex: wallIndex,
          });
        }
      });

      if (segmentIntersections.length > 0) {
        // Sort by distance from first point
        segmentIntersections.sort((a, b) => a.distance - b.distance);

        // Inject parts of segments split by intersections
        let previousPoint = segment[0];

        segmentIntersections.forEach((intersection, index) => {
          // Set neighbourhood with points connected to intersection (next point will be added in next loop or with segment endpoint)
          previousPoint.properties.neighbours.push(intersection.point);
          walls[intersection.wallIndex][0].properties.neighbours.push(
            intersection.point
          );
          walls[intersection.wallIndex][1].properties.neighbours.push(
            intersection.point
          );
          intersection.point.properties.neighbours.push(
            previousPoint,
            walls[intersection.wallIndex][0],
            walls[intersection.wallIndex][1]
          );
          // TODO check directionality?
          intersection.point.properties.neighbours.push(
            ...corridorLineFeatures[i].properties.intersectionPointList
          );
          corridorLineFeatures[i].properties.intersectionPointList.forEach(
            (point) => point.properties.neighbours.push(intersection.point)
          );

          // Remember last point
          previousPoint = intersection.point;
          corridorLineFeatures[i].properties.intersectionPointList.push(
            intersection.point
          );
        });

        // Inject from last intersection to end of original segment
        let newCorridor = turf.lineString([
          previousPoint.geometry.coordinates,
          segment[1].geometry.coordinates,
        ]);
        newCorridor.properties.level = previousPoint.properties.level;

        // connect last intersection point with end point
        segment[1].properties.neighbours.push(previousPoint);
        previousPoint.properties.neighbours.push(segment[1]);

        segmentToWallIntersectionPointList.push(
          ...segmentIntersections.map((intersection) => intersection.point)
        );
      }
      i++;
    }

    segmentToWallIntersectionPointList.forEach((point) => {
      this.floorData.get(point.properties.level).points.push(point);
    });
    // this.segmentToWallIntersectionPointList = segmentToWallIntersectionPointList.map(p => turf.point(p.geometry.coordinates));

    segmentToWallIntersectionPointList.forEach((point) => {
      let neighbours = this._findNeighbours(
        point,
        null,
        null,
        this.floorData.get(point.properties.level).points
      );
      point.properties.neighbours.push(...neighbours);
    });

    // Store corridor data
    this.corridorLinePointPairs = corridorLinePointPairs;
    this.corridorLineFeatures = corridorLineFeatures;
    this.corridorLinePoints = [];
    this.corridorLinePointPairs.forEach((pair) => {
      pair[0].properties.isCorridorPoint = true;
      pair[1].properties.isCorridorPoint = true;

      if (!this.corridorLinePoints.includes(pair[0])) {
        this.corridorLinePoints.push(pair[0]);
      }
      if (!this.corridorLinePoints.includes(pair[1])) {
        this.corridorLinePoints.push(pair[1]);
      }
    });
    this.corridorLinePoints = this.corridorLinePoints.concat(
      segmentIntersectionPointList
    );

    let levelChangerGroupMap = new Map();

    this.levelChangerList.forEach((levelChanger) => {
      // Create level changer groups
      if (levelChanger.properties.group !== undefined) {
        // Get group array, initiate if neccessary
        let groupId = levelChanger.properties.group;
        if (!levelChangerGroupMap.has(groupId))
          levelChangerGroupMap.set(groupId, []);
        let group = levelChangerGroupMap.get(groupId);
        // Add lc to group map
        group.push(levelChanger);
      } else {
        levelChangerGroupMap.set(levelChanger.id, [levelChanger]);
      }

      levelChanger.properties.fixedPointMap = new Map();
      levelChanger.properties.levels.forEach((level) => {
        let point = this._copyPoint(levelChanger);
        point.properties.level = level;
        let fixedPoint = this._getFixPointInArea(point);
        fixedPoint.id = levelChanger.id;
        fixedPoint.properties.amenity = levelChanger.properties.amenity;
        fixedPoint.properties.direction = levelChanger.properties.direction;
        fixedPoint.properties.id = levelChanger.properties.id;
        fixedPoint.properties.level = level;
        fixedPoint.properties.type = levelChanger.properties.type;
        if (fixedPoint.properties.neighbours === undefined)
          fixedPoint.properties.neighbours = [];

        // Do not fix level changers that are further than 5 meters from any path or area
        if (this._distance(point, fixedPoint) > 5) {
          return;
        }

        // Store fixed point into the level changer
        levelChanger.properties.fixedPointMap.set(level, fixedPoint);

        // Add neighbourhood for corridor
        if (fixedPoint.properties.onCorridor) {
          if (fixedPoint.properties.neighboursLeadingTo !== undefined) {
            fixedPoint.properties.neighboursLeadingTo.forEach((neighbour) => {
              if (neighbour.properties.neighbours === undefined)
                neighbour.properties.neighbours = [];
              neighbour.properties.neighbours.push(fixedPoint);
            });
            this.corridorLineFeatures[
              fixedPoint.properties.corridorIndex
            ].properties.intersectionPointList.push(fixedPoint);
          }
        }
      });
    });

    levelChangerGroupMap.forEach((lcList, groupId) => {
      let direction = lcList
        .map((it) => it.properties.direction)
        .find((it) => it !== undefined);
      let fixedPointList = [];
      lcList.forEach((lc) => {
        fixedPointList.push(...lc.properties.fixedPointMap.values());
      });

      fixedPointList.forEach((fixedPoint) => {
        // init neighbour
        if (fixedPoint.properties.neighbours == undefined)
          fixedPoint.properties.neighbours = [];
        // Set neighbourhood
        if (direction === this.DIRECTION_UP) {
          fixedPoint.properties.neighbours.push(
            ...fixedPointList.filter(
              (it) => it.properties.level > fixedPoint.properties.level
            )
          );
        } else if (direction === this.DIRECTION_DOWN) {
          fixedPoint.properties.neighbours.push(
            ...fixedPointList.filter(
              (it) => it.properties.level < fixedPoint.properties.level
            )
          );
        } else {
          fixedPoint.properties.neighbours.push(
            ...fixedPointList.filter(
              (it) => it.properties.level !== fixedPoint.properties.level
            )
          );
        }
      });
    });
  }

  _removeItemFromList(list, item) {
    const index = list.indexOf(item);
    if (index >= 0) {
      list.splice(index, 1);
    }
  }

  load(neighboursMap, wallOffsets) {
    this.neighbourMap = neighboursMap;
    this.rebuildData();
    this.wallOffsets = wallOffsets;
    this.wallOffsetLineList = [];
    this._getPointList().forEach((point, index) => {
      let offsetPoint = this.wallOffsets[index];
      if (!offsetPoint) {
        return;
      }
      let offsetLine = turf.lineString([
        point.geometry.coordinates,
        offsetPoint.geometry.coordinates,
      ]);
      offsetLine.properties.level = point.properties.level;
      this.wallOffsetLineList.push(offsetLine);
    });
  }

  /**
   * @param point {Feature<Point>}
   * @param level {Number}
   * @private true
   */
  _isPointOnLevel(point, level) {
    if (point.properties.fixedPointMap !== undefined) {
      return point.properties.fixedPointMap.has(level);
    } else if (point.properties.level === level) {
      return true;
    } else {
      return false;
    }
  }

  _getPointList() {
    let points = [];
    this.floorData.forEach((data, level) => {
      points = points.concat(data.points);
    });
    this.levelChangerList.forEach((lc) =>
      points.push(...lc.properties.fixedPointMap.values())
    );
    points = points.concat();
    points = points.concat(this.corridorLinePoints);
    return points;
  }

  /**
   *
   * @returns {{neighbourhood: Object, wallOffsets: Object}}
   */
  preprocess() {
    return {
      neighbourhood: this._generateNeighbourhoodMap(),
      wallOffsets: this._generateWallOffsets(),
    };
  }

  _generateNeighbourhoodMap() {
    let points = this._getPointList();
    let neighboursMap = {};

    // NeighbourMap for polygon points
    this.floorData.forEach((levelFloorData, level) => {
      let levelNeighboursMap = {};
      let levelPoints = levelFloorData.points.concat(
        this.levelChangerList
          .filter((point) => this._isPointOnLevel(point, level))
          .map((it) => it.properties.fixedPointMap.get(level))
      );
      levelPoints.forEach((point) => {
        let pointIndex = points.indexOf(point);
        // Get unwrapped point if case the point is a level changer, so we can properly test neighbourhood
        let unwrappedPoint = this._unwrapLevelChangerPoint(point, level);
        // Simulate startPoint to force lowering number of intersections allowed.
        // Unwrapped point is inside accessible area, thus there should be only one intersection, wall point itself.
        let startPoint = unwrappedPoint === point ? null : unwrappedPoint;
        let neighbours = this._findNeighbours(
          unwrappedPoint,
          startPoint,
          null,
          levelPoints
        );

        levelNeighboursMap[pointIndex] = neighbours.map((neighbour) =>
          points.indexOf(neighbour)
        );
      });
      neighboursMap[level] = levelNeighboursMap;
    });

    // NeighbourMap for corridor points
    this.corridorLinePoints.forEach((point) => {
      let pointIndex = points.indexOf(point);
      let level = point.properties.level;
      let neighbours;
      let levelNeighboursMap = neighboursMap[level];

      // Find neighbours in polygon only for points crossing polygon
      if (point.properties.bordersArea) {
        let potentialPoints = this.floorData
          .get(level)
          .points.concat(
            this.levelChangerList.filter((point) =>
              this._isPointOnLevel(point, level)
            )
          )
          .concat(
            this.corridorLinePoints.filter(
              (point) =>
                point.properties.bordersArea &&
                this._isPointOnLevel(point, level)
            )
          );
        neighbours = this._findNeighbours(point, point, null, potentialPoints);

        // Add reverse relationship
        neighbours.forEach((neighbour) => {
          let neighbourIndex = points.indexOf(neighbour);
          if (levelNeighboursMap[neighbourIndex] === undefined) {
            levelNeighboursMap[neighbourIndex] = [];
          }
          if (!levelNeighboursMap[neighbourIndex].includes(pointIndex)) {
            levelNeighboursMap[neighbourIndex].push(pointIndex);
          }
        });
      } else {
        neighbours = point.properties.neighbours;
      }

      // Store relationship for corridor point
      if (levelNeighboursMap[pointIndex] === undefined) {
        levelNeighboursMap[pointIndex] = neighbours.map((neighbour) =>
          points.indexOf(neighbour)
        );
      } else {
        neighbours.forEach((neighbour) =>
          levelNeighboursMap[pointIndex].push(points.indexOf(neighbour))
        );
      }
    });

    // Export and store data
    this.neighbourMap = neighboursMap;
    return neighboursMap;
  }

  _generateWallOffsets() {
    this.wallOffsetLineList = [];
    this.wallOffsets = {};
    let pointList = this._getPointList();
    pointList.forEach((point) => {
      // Do no process level changers
      if (point.properties.level == null) {
        return;
      }

      // a) Find walls where the point P is used and the other points in walls: A, B
      let walls = this.floorData
        .get(point.properties.level)
        .walls.filter((wall) => wall.includes(point));

      if (walls.length === 0) {
        return;
      }

      let pointA = walls[0][0] === point ? walls[0][1] : walls[0][0];
      let pointB = walls[1][0] === point ? walls[1][1] : walls[1][0];
      let pointABearing = turf.bearing(point, pointA);
      let pointBBearing = turf.bearing(point, pointB);

      // b) Get average bearing to points A,B
      let bearing = this._averageBearing(pointABearing, pointBBearing);
      let oppositeBearing = bearing > 0 ? bearing - 180 : bearing + 180;
      // this.wallOffsetLineList.push(turf.lineString([point.geometry.coordinates, offsetPoint.geometry.coordinates]));

      // c) Generate two points M,N very close to point P
      let pointM = turf.destination(point.geometry.coordinates, 0.01, bearing, {
        units: this.UNIT_TYPE,
      });
      let pointN = turf.destination(
        point.geometry.coordinates,
        0.01,
        oppositeBearing,
        { units: this.UNIT_TYPE }
      );

      // d) Test which point is contained within accessible area
      let containedPoint = null;
      for (let areaIndex in this.floorData.get(point.properties.level).areas) {
        let area = this.floorData.get(point.properties.level).areas[areaIndex];
        if (turf.booleanContains(area, pointM)) {
          containedPoint = pointM;
          break;
        } else if (turf.booleanContains(area, pointN)) {
          containedPoint = pointN;
          break;
        }
      }
      // Stop if either of points is not contained...
      if (containedPoint == null) {
        return;
      }

      // e) Generate point F at double the distance of wall offset
      let pointF = turf.destination(
        point.geometry.coordinates,
        this.wallOffsetDistance * 2,
        containedPoint === pointM ? bearing : oppositeBearing,
        { units: this.UNIT_TYPE }
      );

      // f) Test if PF intersects with any wall, update point F and PF to shortest available size
      let linePF = turf.lineString([
        point.geometry.coordinates,
        pointF.geometry.coordinates,
      ]);
      this.floorData
        .get(point.properties.level)
        .walls.forEach((wall, index) => {
          // Do not test walls containing point P, they will intersect of course
          if (walls.includes(wall)) {
            return;
          }
          let lineWall = this.floorData.get(point.properties.level)
            .wallFeatures[index];
          // Find intersection point, use it to produce new
          let intersections = turf.lineIntersect(linePF, lineWall);
          if (intersections.features.length > 0) {
            pointF = turf.point(intersections.features[0].geometry.coordinates);
            linePF = turf.lineString([
              point.geometry.coordinates,
              pointF.geometry.coordinates,
            ]);
          }
        });

      // g) Create wall offset point as midpoint between points P,F
      let offsetPoint = turf.midpoint(
        point.geometry.coordinates,
        pointF.geometry.coordinates
      );
      offsetPoint.properties.level = point.properties.level;
      this.wallOffsets[pointList.indexOf(point)] = offsetPoint;
      let offsetLine = turf.lineString([
        point.geometry.coordinates,
        offsetPoint.geometry.coordinates,
      ]);
      offsetLine.properties.level = point.properties.level;
      this.wallOffsetLineList.push(offsetLine);
    });
    return this.wallOffsets;
  }

  /**
   * @param current {Feature<Point>}
   * @return {[Feature<Point>]}
   */
  reconstructPath(current) {
    let path = [];
    let previous = current;
    do {
      let pointsToInject = this._calculateWallOffsetPointList(
        current,
        path.length > 0 ? path[path.length - 1] : previous
      );
      pointsToInject.forEach((point) => {
        if (
          previous === current ||
          previous.geometry.coordinates[0] !== point.geometry.coordinates[0] ||
          previous.geometry.coordinates[1] !== point.geometry.coordinates[1]
        ) {
          let newPoint = this._copyPoint(point);
          newPoint.properties.level = current.properties.level;
          newPoint.properties.walkableAreaId =
            current.properties.walkableAreaId;
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

    let pointsToFilter = [];

    // Simplify the route by omitting corners that are basically at the same spot
    for (let i = 0; i < path.length - 1; i++) {
      let pointA = path[i];
      let pointB = path[i + 1];

      // Different floors nothing to do
      if (pointA.properties.level !== pointB.properties.level) {
        continue;
      }

      let distanceAtoB = this._distance(pointA, pointB);
      // 70cm
      if (distanceAtoB < 0.7) {
        pointsToFilter.push(pointA);
      }
    }
    path = path.filter((pathPoint) => !pointsToFilter.includes(pathPoint));
    pointsToFilter = [];

    // Simplify the route by omitting corners that are basically straight
    for (let i = 1; i < path.length - 1; i++) {
      let pointA = path[i - 1];
      let pointB = path[i];
      let pointC = path[i + 1];

      // Different floors nothing to do
      if (
        pointA.properties.level !== pointB.properties.level ||
        pointA.properties.level !== pointC.properties.level
      ) {
        continue;
      }

      let bearingAtoB = this.bearing(
        pointA.geometry.coordinates,
        pointB.geometry.coordinates
      );
      let bearingBtoC = this.bearing(
        pointB.geometry.coordinates,
        pointC.geometry.coordinates
      );
      let bearingDiff = Math.abs(bearingAtoB - bearingBtoC);
      if (bearingDiff > Math.PI) {
        bearingDiff -= Math.PI;
      }

      // 2 degrees filter
      if (bearingDiff < 0.03488888) {
        pointsToFilter.push(pointB);
      }
    }
    path = path.filter((pathPoint) => !pointsToFilter.includes(pathPoint));

    // let pathCoordinates = path.map(point => point.geometry.coordinates);
    return path;
  }

  _calculateWallOffsetPointList(currentPoint, previousPoint) {
    let pointList = this._getPointList();
    let currentPointIndex = pointList.indexOf(currentPoint);
    let previousPointIndex = pointList.indexOf(previousPoint);
    let offsetPointList = [];
    let currentOffsetPoint = currentPoint;
    // a) offset current point
    if (currentPointIndex >= 0 && this.wallOffsets[currentPointIndex]) {
      currentOffsetPoint = this.wallOffsets[currentPointIndex];
    }
    offsetPointList.push(currentOffsetPoint);
    let potentialOffsetPoints;
    do {
      let line = turf.lineString([
        previousPoint.geometry.coordinates,
        currentOffsetPoint.geometry.coordinates,
      ]);
      potentialOffsetPoints = [];
      this.wallOffsetLineList.forEach((wallOffsetLine, index) => {
        // Do not process wall offsets from another floor
        if (wallOffsetLine.properties.level !== currentPoint.properties.level) {
          return;
        }
        // Do not process wall offsets with previous or current point
        if (index === previousPointIndex || index === currentPointIndex) {
          return;
        }
        let intersection = turf.lineIntersect(line, wallOffsetLine);
        if (intersection.features.length > 0) {
          let offsetPoint = this.wallOffsets[index];
          // store distance to previousPoint
          offsetPoint.properties.distance = this._distance(
            intersection.features[0],
            currentOffsetPoint
          );
          offsetPoint.properties.offsetIndex = index;
          potentialOffsetPoints.push(offsetPoint);
        }
      });
      if (potentialOffsetPoints.length > 0) {
        potentialOffsetPoints.sort(
          (a, b) => a.properties.distance - b.properties.distance
        );
        currentOffsetPoint = potentialOffsetPoints[0];
        currentPointIndex = currentOffsetPoint.properties.offsetIndex;
        offsetPointList.push(currentOffsetPoint);
      }
    } while (potentialOffsetPoints.length > 0);

    return offsetPointList.reverse();
  }

  _getIntersectingOffsetPoints(current, previous) {
    if (
      current === previous ||
      current.properties.level !== previous.properties.level
    ) {
      return [];
    }
    let line = turf.lineString([
      current.geometry.coordinates,
      previous.geometry.coordinates,
    ]);
    let intersectingWallOffsetPoints = [];
    this.wallOffsetLineList.forEach((wallOffsetLine, index) => {
      if (wallOffsetLine.properties.level !== current.properties.level) {
        return;
      }
      if (turf.lineIntersect(line, wallOffsetLine).features.length > 0) {
        let point = this.wallOffsets[index];
        point.properties.distance = turf.pointToLineDistance(
          current.geometry.coordinates,
          wallOffsetLine,
          { units: this.UNIT_TYPE }
        );
        intersectingWallOffsetPoints.push(point);
      }
    });

    intersectingWallOffsetPoints.sort(
      (a, b) => b.properties.distance - b.properties.distance
    );
    return intersectingWallOffsetPoints;
  }

  clearData() {
    this.floorData.forEach((data, level) => {
      for (let index in data.points) {
        let point = data.points[index];
        delete point.properties.cameFrom;
        delete point.properties.gscore;
        delete point.properties.fscore;
      }
    });
    this.levelChangerList.forEach((levelChanger) => {
      levelChanger.properties.fixedPointMap.forEach((it, level) => {
        delete it.properties.cameFrom;
        delete it.properties.gscore;
        delete it.properties.fscore;
      });
    });
    this.corridorLinePoints.forEach((point) => {
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
  runAStar(startPoint, endPoint) {
    const natural = this.calculatePath(startPoint, endPoint);
    if (natural !== undefined && natural.length == 2) {
      const isPathOnLineProperDirection = this._checkShortPath(
        natural[0],
        natural[1]
      );
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
  runAStarWithDetails(startPoint, endPoint) {
    const path = this.runAStar(startPoint, endPoint);
    const distance = this.calculateDistance(path);
    const duration = this.calculateTime(path, distance);

    return {
      path,
      distance,
      duration,
    };
  }

  /**
   * Check if path has an elevator
   * @param path {Feature<Point>}
   * @param key {Int}
   * @return {Boolean}
   * @private
   */
  isPathElevator(path, key) {
    if (
      path[key].properties.type == this.POI_TYPE.ELEVATOR &&
      path[key + 1].properties.type == this.POI_TYPE.ELEVATOR
    ) {
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
  isPathEscalator(path, key) {
    if (
      path[key].properties.type == this.POI_TYPE.ESCALATOR &&
      path[key + 1].properties.type == this.POI_TYPE.ESCALATOR
    ) {
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
  isPathStaircase(path, key) {
    if (
      path[key].properties.type == this.POI_TYPE.STAIRCASE &&
      path[key + 1].properties.type == this.POI_TYPE.STAIRCASE
    ) {
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
  isPathFlat(path, key) {
    return (
      !this.isPathElevator(path, key) &&
      !this.isPathEscalator(path, key) &&
      !this.isPathStaircase(path, key)
    );
  }

  /**
   * Calculate length of the path in meters
   * @param path {Feature<Point>}
   * @return {Float}
   * @private
   */
  calculateDistance(path) {
    let distance = 0;
    if (path === undefined || path.length === 0) {
      return distance;
    }
    path.forEach((_, key) => {
      if (path[key + 1] !== undefined) {
        distance += turf.distance(path[key], path[key + 1], {
          units: this.UNIT_TYPE,
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
  calculateTime(path, distance) {
    let time = distance / this.walkingSpeed;

    let elevator = 0.0;
    let escalator = 0.0;
    let staircase = 0.0;

    if (path === undefined) {
      path = [];
    }

    path.forEach((_, key) => {
      if (this.isPathElevator(path, key)) {
        let levels = Math.abs(
          path[key].properties.level - path[key + 1].properties.level
        );
        elevator +=
          (levels * this.floorHeight) / this.elevatorSpeed +
          this.elevatorWaiting;
      }

      if (this.isPathEscalator(path, key)) {
        let levels = Math.abs(
          path[key].properties.level - path[key + 1].properties.level
        );
        let base = this.floorHeight * this.floorHeight;
        escalator += (levels * Math.sqrt(base + base)) / this.escalatorSpeed;
      }

      if (this.isPathStaircase(path, key)) {
        let levels = Math.abs(
          path[key].properties.level - path[key + 1].properties.level
        );
        let base = this.floorHeight * this.floorHeight;
        staircase += (levels * Math.sqrt(base + base)) / this.staircasesSpeed;
      }
    });

    const realistic = time + elevator + escalator + staircase;

    return {
      shortest: time,
      elevator,
      escalator,
      staircase,
      realistic,
    };
  }

  /**
   *
   * @param startPoint {Feature<Point>}
   * @param endPoint {Feature<Point>}
   * @return {[Feature<Point>]}
   * @private
   */
  calculatePath(startPoint, endPoint) {
    this.clearData();

    this.nbLines = [];

    this.bearingCache = new Map();

    let fixedStartPoint = this._getFixPointInArea(startPoint, true);
    let fixedEndPoint = this._getFixEndPoint(
      endPoint,
      startPoint.properties.level
    );

    let openSet = [fixedStartPoint];
    let closedSet = [];

    fixedStartPoint.properties.gscore = 0;
    fixedStartPoint.properties.fscore = this._heuristic(
      fixedStartPoint,
      fixedEndPoint
    );

    while (openSet.length > 0) {
      let current = this._getMinFScore(openSet, closedSet);

      // Unable to find best point to continue?
      if (current === null) {
        break;
      }

      if (current === fixedEndPoint) {
        let finalPath = undefined;
        try {
          finalPath = this.reconstructPath(current);
        } catch (error) {
          return undefined;
        }
        if (
          fixedEndPoint !== endPoint &&
          (!fixedEndPoint.properties.onCorridor ||
            this._distance(fixedEndPoint, endPoint) > this.pathFixDistance)
        ) {
          endPoint.properties.fixed = true;
          finalPath.push(endPoint);
        }

        if (
          fixedStartPoint !== startPoint &&
          (!fixedStartPoint.properties.onCorridor ||
            this._distance(fixedStartPoint, startPoint) > this.pathFixDistance)
        ) {
          startPoint.properties.fixed = true;
          finalPath.unshift(startPoint);
        }
        finalPath[finalPath.length - 1].properties.gscore =
          current.properties.gscore;
        return finalPath;
      }
      closedSet.push(openSet.splice(openSet.indexOf(current), 1));

      let neighbours = this._getNeighbours(
        current,
        fixedStartPoint,
        fixedEndPoint
      );

      neighbours.forEach((n) =>
        this.nbLines.push(
          turf.lineString([
            current.geometry.coordinates,
            n.geometry.coordinates,
          ])
        )
      );

      neighbours.forEach((neighbour) => {
        if (closedSet.indexOf(neighbour) <= -1) {
          let tentativeGScore =
            current.properties.gscore + this._distance(current, neighbour);
          let gScoreNeighbour =
            neighbour.properties.gscore != null
              ? neighbour.properties.gscore
              : Infinity;

          if (tentativeGScore < gScoreNeighbour) {
            neighbour.properties.cameFrom = current;
            neighbour.properties.gscore = tentativeGScore + 0.2;
            neighbour.properties.fscore =
              tentativeGScore + this._heuristic(neighbour, fixedEndPoint);
            if (openSet.indexOf(neighbour) < 0) {
              openSet.push(neighbour);
            }
          }
        }
      });
    }
    return undefined;
  }

  _checkIfCrossingTwoPolygon(current, neighbour) {
    const last = current.properties || {};
    const candidate = neighbour.properties || {};

    if (
      candidate.walkableAreaId !== undefined &&
      last.walkableAreaId !== undefined
    ) {
      if (candidate.walkableAreaId !== last.walkableAreaId) {
        return true;
      }

      if (candidate.bordersArea === undefined) {
        return true;
      }
    }

    if (
      last.walkableAreaId !== undefined &&
      candidate.walkableAreaId === undefined
    ) {
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
  _getNeighbours(point, startPoint, endPoint) {
    let neighbours = [];
    if (point === startPoint) {
      let levelPoints = this._getPointList().filter((proposedPoint) =>
        this._isPointOnLevel(proposedPoint, point.properties.level)
      );
      neighbours = this._findNeighbours(
        point,
        startPoint,
        endPoint,
        levelPoints
      );
      neighbours = neighbours.filter((neighbourPoint) => {
        let level = point.properties.level;
        let revolvingDoorBlock =
          this.configuration.avoidRevolvingDoors &&
          this._testAccessibilityPoiNeighbourhood(
            point,
            neighbourPoint,
            level,
            this.POI_TYPE.REVOLVING_DOOR
          );
        let ticketGateBlock =
          this.configuration.avoidTicketGates &&
          this._testAccessibilityPoiNeighbourhood(
            point,
            neighbourPoint,
            level,
            this.POI_TYPE.TICKET_GATE
          );
        const isCrossingTwoPolygon = this._checkIfCrossingTwoPolygon(
          point,
          neighbourPoint
        );

        return !revolvingDoorBlock && !ticketGateBlock && !isCrossingTwoPolygon;
      });
    } else {
      // Gather neighbours over all levels
      let points = this._getPointList();
      let pointIndex = points.indexOf(point);
      if (pointIndex >= 0) {
        this.floorData.forEach((_, level) => {
          let levelNeighbourMap = this.neighbourMap[level];
          if (levelNeighbourMap.hasOwnProperty(pointIndex)) {
            levelNeighbourMap[pointIndex].forEach((neighbourIndex) => {
              const neighbourPoint = points[neighbourIndex];

              const revolvingDoorBlock =
                this.configuration.avoidRevolvingDoors &&
                this._testAccessibilityPoiNeighbourhood(
                  point,
                  neighbourPoint,
                  level,
                  this.POI_TYPE.REVOLVING_DOOR
                );
              const ticketGateBlock =
                this.configuration.avoidTicketGates &&
                this._testAccessibilityPoiNeighbourhood(
                  point,
                  neighbourPoint,
                  level,
                  this.POI_TYPE.TICKET_GATE
                );
              const isCrossingTwoPolygon = this._checkIfCrossingTwoPolygon(
                point,
                neighbourPoint
              );

              if (
                !neighbours.includes(neighbourPoint) &&
                !revolvingDoorBlock &&
                !ticketGateBlock &&
                !isCrossingTwoPolygon
              ) {
                neighbours.push(neighbourPoint);
              }
            });
          }
        });
      }

      // Test if endpoint is neighbour
      if (
        (point.properties.level !== undefined &&
          point.properties.level === endPoint.properties.level) ||
        (point.properties.fixedPointMap != undefined &&
          point.properties.fixedPointMap.has(endPoint.properties.level))
      ) {
        const revolvingDoorBlock =
          this.configuration.avoidRevolvingDoors &&
          this._testAccessibilityPoiNeighbourhood(
            point,
            endPoint,
            endPoint.properties.level,
            this.POI_TYPE.REVOLVING_DOOR
          );
        const ticketGateBlock =
          this.configuration.avoidTicketGates &&
          this._testAccessibilityPoiNeighbourhood(
            point,
            endPoint,
            endPoint.properties.level,
            this.POI_TYPE.TICKET_GATE
          );
        const isCrossingTwoPolygon = this._checkIfCrossingTwoPolygon(
          point,
          endPoint
        );

        if (!revolvingDoorBlock && !ticketGateBlock && !isCrossingTwoPolygon) {
          // Endpoint is fixed on corridor
          if (endPoint.properties.onCorridor) {
            if (endPoint.properties.neighbours.includes(point)) {
              neighbours.push(endPoint);
            } else if (
              endPoint.properties.neighboursLeadingTo !== undefined &&
              endPoint.properties.neighboursLeadingTo.includes(point)
            ) {
              neighbours.push(endPoint);
            }

            // End point is not on corridor, therefore should be in the area
          } else {
            let unwrapped = this._unwrapLevelChangerPoint(
              point,
              endPoint.properties.level
            );
            let allowedIntersections = 1;
            if (
              unwrapped.properties.isCorridorPoint ||
              unwrapped.properties.onCorridor
            ) {
              allowedIntersections--;
            }
            if (
              this._countIntersections(
                unwrapped,
                endPoint,
                allowedIntersections
              )
            ) {
              neighbours.push(endPoint);
            }
          }
        }
      }
    }
    return neighbours.filter((neighbour) => {
      if (
        this.configuration.avoidElevators &&
        neighbour.properties.type === this.POI_TYPE.ELEVATOR
      ) {
        return false;
      } else if (
        this.configuration.avoidEscalators &&
        neighbour.properties.type === this.POI_TYPE.ESCALATOR
      ) {
        return false;
      } else if (
        this.configuration.avoidStaircases &&
        neighbour.properties.type === this.POI_TYPE.STAIRCASE
      ) {
        return false;
      } else if (
        this.configuration.avoidNarrowPaths &&
        neighbour.properties.narrowPath
      ) {
        return false;
      } else if (this.configuration.avoidRamps && neighbour.properties.ramp) {
        return false;
      } else if (this.configuration.avoidHills && neighbour.properties.hill) {
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
  _testAccessibilityPoiNeighbourhood(pointA, pointB, level, accesibilityType) {
    // Filter out lines that intersect revolving door POIs.
    let skip = false;
    if (
      accesibilityType === this.POI_TYPE.REVOLVING_DOOR &&
      this.configuration.avoidRevolvingDoors
    ) {
      const line = turf.lineString([
        pointA.geometry.coordinates,
        pointB.geometry.coordinates,
      ]);
      const poiList = this.accessibilityPoi.filter(
        (poi) =>
          poi.properties.level === level &&
          poi.properties.type === accesibilityType
      );
      poiList.forEach((poi) => {
        const distance = turf.pointToLineDistance(
          poi.geometry.coordinates,
          line,
          { units: this.UNIT_TYPE }
        );
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
  _findNeighbours(point, startPoint, endPoint, proposedPointList) {
    let neighbours = [];
    if (point.properties.neighbours != null) {
      neighbours = [...point.properties.neighbours];
    }

    // Start point is on corridor line, use only preset neighbours on line
    if (
      (point === startPoint && point.properties.onCorridor) ||
      (point.properties.isCorridorPoint && !point.properties.bordersArea)
    ) {
      // End point is on the same corridor line == they are neighbours
      if (
        endPoint &&
        endPoint.properties.onCorridor &&
        startPoint.properties.corridorIndex ===
          endPoint.properties.corridorIndex
      ) {
        neighbours.push(endPoint);
      }
      return neighbours;
    }

    let allowedIntersections = 0;
    if (endPoint && this._isPointOnLevel(endPoint, point.properties.level)) {
      proposedPointList.push(endPoint);
    }

    let fixedPoint = this._unwrapLevelChangerPoint(
      point,
      point.properties.level
    );

    for (let index in proposedPointList) {
      let proposedPoint = proposedPointList[index];

      // Same point is not neighbour with itself
      if (point === proposedPoint) {
        continue;
      }

      // Already assigned
      if (neighbours.indexOf(proposedPoint) >= 0) {
        continue;
      }

      let fixedProposedPoint = this._unwrapLevelChangerPoint(
        proposedPoint,
        point.properties.level
      );

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
      if (
        proposedPoint.properties.isCorridorPoint ||
        proposedPoint.properties.onCorridor
      ) {
        allowedIntersections--;
      }

      let intersects = this._countIntersections(
        point,
        fixedProposedPoint,
        allowedIntersections
      );

      if (intersects) {
        // if (allowedIntersections >= 1) {
        let midpoint = turf.midpoint(
          point.geometry.coordinates,
          proposedPoint.geometry.coordinates
        );
        for (let polIndex in this.floorData.get(point.properties.level).areas) {
          let area = this.floorData.get(point.properties.level).areas[polIndex];
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
  _comparePointLevels(pointA, pointB) {
    // If both points are NOT level changers
    if (pointA.properties.levels == null && pointB.properties.levels == null) {
      return pointA.properties.level === pointB.properties.level;
    }

    // At least one of points is level changer
    let pointALevelList =
      pointA.properties.fixedPointMap !== undefined
        ? [...pointA.properties.fixedPointMap.keys()]
        : [pointA.properties.level];
    let pointBLevelList =
      pointB.properties.fixedPointMap !== undefined
        ? [...pointB.properties.fixedPointMap.keys()]
        : [pointB.properties.level];
    return (
      pointALevelList.filter((feature) => pointBLevelList.includes(feature))
        .length > 0
    );
  }

  /**
   * @param point {Feature<Point>}
   * @param level {Number}
   * @return {Feature<Point>}
   */
  _unwrapLevelChangerPoint(point, level) {
    let fixedPointMap = point.properties.fixedPointMap;
    if (fixedPointMap) {
      let fixedPoint = fixedPointMap.get(level);
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
  _countIntersections(pointFrom, pointTo, maxIntersections) {
    let fromCoordinates = pointFrom.geometry.coordinates;
    let toCoordinates = pointTo.geometry.coordinates;
    let bearing = this.bearing(fromCoordinates, toCoordinates);
    let intersections = 0;
    let intersectionPointList = [];

    let floorWalls = this.floorData.get(pointFrom.properties.level).walls;
    let floorWallFeatures = this.floorData.get(
      pointFrom.properties.level
    ).wallFeatures;

    for (let index in floorWalls) {
      let wall = floorWalls[index];

      let inRange = false;
      let pointIsInAWall = false;
      if (pointFrom == wall[0] || pointFrom == wall[1]) {
        inRange = true;
        pointIsInAWall = true;
      } else {
        let wBearingA = this.bearing(
          fromCoordinates,
          wall[0].geometry.coordinates
        );
        let wBearingB = this.bearing(
          fromCoordinates,
          wall[1].geometry.coordinates
        );
        if (wBearingA > wBearingB) {
          let temp = wBearingA;
          wBearingA = wBearingB;
          wBearingB = temp;
        }
        let bearingDiff = wBearingB - wBearingA;
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
          if (
            !this._testIdenticalPointInList(pointFrom, intersectionPointList)
          ) {
            intersectionPointList.push(pointFrom);
            intersections++;
          }
        } else {
          let intersectPoints = turf.lineIntersect(
            turf.lineString([fromCoordinates, toCoordinates]),
            floorWallFeatures[index]
          ).features;
          if (intersectPoints.length > 0) {
            if (
              !this._testIdenticalPointInList(
                intersectPoints[0],
                intersectionPointList
              )
            ) {
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
  _averageBearing(bearingA, bearingB) {
    if (bearingA > bearingB) {
      let temp = bearingA;
      bearingA = bearingB;
      bearingB = temp;
    }
    if (bearingB - bearingA > 180) {
      bearingB -= 360;
    }
    let finalBearing = (bearingB + bearingA) / 2;
    return finalBearing <= -180 ? 360 + finalBearing : finalBearing;
  }

  // Converts from degrees to radians.
  toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  bearing(start, end) {
    // let hasCache = false;
    let endCache = this.bearingCache.get(start);
    if (endCache) {
      let cache = endCache.get(end);
      if (cache != null) {
        return cache;
      }
    }

    let startLng = this.toRadians(start[0]);
    let startLat = this.toRadians(start[1]);
    let destLng = this.toRadians(end[0]);
    let destLat = this.toRadians(end[1]);
    let cosDestLat = Math.cos(destLat);

    let y = Math.sin(destLng - startLng) * cosDestLat;
    let x =
      Math.cos(startLat) * Math.sin(destLat) -
      Math.sin(startLat) * cosDestLat * Math.cos(destLng - startLng);
    let bearing = Math.atan2(y, x);
    this._storeBearingCache(start, end, bearing);
    return bearing;
  }

  _storeBearingCache(start, end, bearing) {
    let cacheMap = this.bearingCache.get(start);
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

  _testIdenticalPointInList(point, pointList) {
    return (
      pointList.find(
        (list) =>
          list.geometry.coordinates[0] === point.geometry.coordinates[0] &&
          list.geometry.coordinates[1] === point.geometry.coordinates[1]
      ) !== undefined
    );
  }

  /**
   *
   * @param pointSet {[Feature<Point>]}
   * @returns {Feature<Point>}
   */
  _getMinFScore(pointSet, previous) {
    let bestPoint = null;
    let bestScore = Infinity;

    const lastWalkableAreaId = (previous.slice(-1).properties || {})
      .walkableAreaId;
    const penultimateWalkableAreaId = (previous.slice(-2).properties || {})
      .walkableAreaId;

    const closedWalkable =
      penultimateWalkableAreaId !== undefined &&
      lastWalkableAreaId === penultimateWalkableAreaId;

    pointSet.forEach((point) => {
      const properties = point.properties;

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
  _heuristic(pointA, pointB) {
    if (this._comparePointLevels(pointA, pointB)) {
      let penalty = 0;
      if (
        pointA.properties.levels !== undefined ||
        pointB.properties.levels !== undefined
      ) {
        penalty = 20;
      }
      return this._distance(pointA, pointB) + penalty;
    } else {
      // Filter out direct level changers
      let directLevelChangerList = this.levelChangerList.filter(
        (levelChanger) => {
          return (
            levelChanger !== pointA &&
            levelChanger !== pointB &&
            this._comparePointLevels(levelChanger, pointA) &&
            this._comparePointLevels(levelChanger, pointB)
          );
        }
      );

      // Calculate best estimation for direct level change
      let bestDistance = Infinity;
      directLevelChangerList.forEach((levelChanger) => {
        let distance =
          this._distance(pointA, levelChanger) +
          this._distance(levelChanger, pointB) +
          10;
        if (distance < bestDistance) {
          bestDistance = distance;
        }
      });
      // Return estimation if direct level change was found
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
  _distance(pointA, pointB) {
    let levelChangePenalty = 0;
    if (pointB.properties.level !== pointA.properties.level)
      levelChangePenalty = 10;
    return (
      turf.distance(pointA, pointB, { units: this.UNIT_TYPE }) +
      levelChangePenalty
    );
  }

  /**
   *
   * @private
   */
  _getFixEndPoint(endPoint, startPointLevel) {
    let lc = this.levelChangerList.find((it) => it.id === endPoint.id);
    if (lc !== undefined && lc.properties.fixedPointMap !== undefined) {
      let nearestLevel = undefined;
      lc.properties.fixedPointMap.forEach((_, level) => {
        if (
          nearestLevel === undefined ||
          Math.abs(nearestLevel - startPointLevel) >
            Math.abs(level - startPointLevel)
        ) {
          nearestLevel = level;
        }
      });
      endPoint = this._copyPoint(endPoint);
      endPoint.properties.level = nearestLevel;
    }
    return this._getFixPointInArea(endPoint);
  }

  _getFixPointInArea(point, isStart = false) {
    let floorData = this.floorData.get(point.properties.level);

    // If point is located without accessible area, do nothing
    let pointFound = undefined;
    floorData.areas.forEach((polygon) => {
      if (turf.booleanContains(polygon, point)) {
        pointFound = point;
        return;
      }
    });
    if (pointFound !== undefined) {
      return pointFound;
    }

    // Find nearest wall to stick to
    let bestWall = null;
    let bestWallDistance = Infinity;

    floorData.wallFeatures.forEach((wall) => {
      let distance = turf.pointToLineDistance(
        point.geometry.coordinates,
        wall,
        { units: this.UNIT_TYPE }
      );
      if (distance <= bestWallDistance) {
        bestWall = wall;
        bestWallDistance = distance;
      }
    });

    let levelCorridorFeatures = this.corridorLineFeatures.filter(
      (corridorLine) => corridorLine.properties.level === point.properties.level
    );
    let bestCorridorIndex = null;
    let bestCorridorDistance = Infinity;
    levelCorridorFeatures.forEach((corridor) => {
      let corridorIndex = this.corridorLineFeatures.indexOf(corridor);
      let corridorDistance = turf.pointToLineDistance(
        point.geometry.coordinates,
        corridor,
        { units: this.UNIT_TYPE }
      );
      if (corridorDistance < bestCorridorDistance) {
        bestCorridorIndex = corridorIndex;
        bestCorridorDistance = corridorDistance;
      }
    });

    // Test if area or corridor is closer, create appropriate fixed point
    if (bestWall === null && bestCorridorIndex === null) {
      // could not find neither close area or corridor
      return point;
    } else {
      let fixedPoint;

      // Corridor is closer
      if (
        bestCorridorIndex !== undefined &&
        bestCorridorDistance < bestWallDistance
      ) {
        // Create fixed point on line itself
        let line = this.corridorLineFeatures[bestCorridorIndex];
        fixedPoint = turf.nearestPointOnLine(line, point);

        // Mark this fixed point is on corridor, preset neighbours
        fixedPoint.properties.onCorridor = true;
        fixedPoint.properties.corridorIndex = bestCorridorIndex;
        if (!fixedPoint.properties.neighbours) {
          fixedPoint.properties.neighbours = [];
        }

        const isAvailableNow = this.corridorLineFeatures[bestCorridorIndex].properties.isAvailableNow;
        const isBidirectional =
          this.corridorLineFeatures[bestCorridorIndex].properties
            .bidirectional === undefined ||
          this.corridorLineFeatures[bestCorridorIndex].properties
            .bidirectional === true;

        const isSwappedDirection =
          this.corridorLineFeatures[bestCorridorIndex].properties
            .swapDirection !== undefined &&
          this.corridorLineFeatures[bestCorridorIndex].properties
            .swapDirection === true;

if (isAvailableNow) {
  if (isBidirectional) {
    fixedPoint.properties.neighbours.push(
      this.corridorLinePointPairs[bestCorridorIndex][0],
      this.corridorLinePointPairs[bestCorridorIndex][1]
    );
    fixedPoint.properties.neighbours.push(
      ...line.properties.intersectionPointList
    );
    fixedPoint.properties.neighboursLeadingTo = [
      this.corridorLinePointPairs[bestCorridorIndex][0],
      this.corridorLinePointPairs[bestCorridorIndex][1],
      ...line.properties.intersectionPointList,
    ];
  } else {
    if (!isSwappedDirection && !isStart) {
      const after = this.corridorLinePointPairs[bestCorridorIndex][0];
      fixedPoint.properties.neighbours.push(after);
      // include only intersection points after this point
      let distance = this._distance(fixedPoint, after);
      let pointsBefore = line.properties.intersectionPointList.filter(
        (point) => this._distance(point, after) < distance
      );
      let pointsAfter = line.properties.intersectionPointList.filter(
        (point) => this._distance(point, after) >= distance
      );
      fixedPoint.properties.neighbours.push(...pointsAfter);
      fixedPoint.properties.neighboursLeadingTo = pointsBefore;
    } else {
      const before = this.corridorLinePointPairs[bestCorridorIndex][1];
      fixedPoint.properties.neighbours.push(before);
      // include only intersection points before this point
      let distance = this._distance(fixedPoint, before);
      let pointsBefore = line.properties.intersectionPointList.filter(
        (point) => this._distance(point, before) <= distance
      );
      let pointsAfter = line.properties.intersectionPointList.filter(
        (point) => this._distance(point, before) > distance
      );
      fixedPoint.properties.neighbours.push(...pointsBefore);
      fixedPoint.properties.neighboursLeadingTo = pointsAfter;
    }
  }
}
        

        // Wall is closer
      } else if (bestWall !== null) {
        // Create fixed point inside area
        let nearestPoint = turf.nearestPointOnLine(bestWall, point);
        let bearing = turf.bearing(point, nearestPoint);
        fixedPoint = turf.destination(
          point.geometry.coordinates,
          bestWallDistance + 0.05,
          bearing,
          { units: this.UNIT_TYPE }
        );
      }

      // Mark level of fixed point
      fixedPoint.properties.level = point.properties.level;

      // Return created point
      return fixedPoint;
    }
  }

  /**
   * @param point {Feature <Point>}
   * @return {Feature <Point>}
   */
  _copyPoint(pointFeature) {
    let point = turf.point([
      pointFeature.geometry.coordinates[0],
      pointFeature.geometry.coordinates[1],
    ]);
    if (pointFeature.id !== undefined) point.id = pointFeature.id;
    if (pointFeature.properties.id !== undefined)
      point.properties.id = pointFeature.properties.id;
    if (pointFeature.properties.amenity !== undefined)
      point.properties.amenity = pointFeature.properties.amenity;
    if (pointFeature.properties.type !== undefined)
      point.properties.type = pointFeature.properties.type;
    return point;
  }

  _setNeighbourhoodBasedOnCorridorDirectionality(
    segmentFeature,
    segmentPointA,
    segmentPointB,
    intersectionPoint
  ) {
    if (intersectionPoint.properties.neighbours === undefined) {
      intersectionPoint.properties.neighbours = [];
    }
    const isAvailableNow = segmentFeature.properties.isAvailableNow;
    const isBidirectional =
      segmentFeature.properties.bidirectional === undefined ||
      segmentFeature.properties.bidirectional === true;
    const isSwappedDirection =
      segmentFeature.properties.swapDirection !== undefined &&
      segmentFeature.properties.swapDirection === true;

      if (isAvailableNow) {
    if (isBidirectional) {
      intersectionPoint.properties.neighbours.push(
        segmentPointA,
        segmentPointB
      );
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
  }

  _comparePointsByDistanceFromReference(
    reference,
    intersectionA,
    intersectionB
  ) {
    let dA = turf.distance(reference, intersectionA);
    let dB = turf.distance(reference, intersectionB);
    if (dA > dB) return 1;
    if (dB > dA) return -1;
    return 0;
  }

  _checkShortPath(start, end) {
    const startCorridor = this._getFixPointInArea(start, true);
    const endCorridor = this._getFixPointInArea(end, true);
    if (
      startCorridor.properties.corridorIndex ===
      endCorridor.properties.corridorIndex
    ) {
      const index = startCorridor.properties.corridorIndex;
      const corridor = this.corridorLineFeatures[index];
      const isAvailableNow = corridor.properties.isAvailableNow;
      if (!isAvailableNow) {
        return false;
      }
      const isBidirectional =
        corridor.properties.bidirectional === undefined ||
        corridor.properties.bidirectional === true;
      if (isBidirectional) {
        return true;
      }
      const coords = corridor.geometry.coordinates;
      const corridorBearing = turf.bearing(coords[0], coords[1]);
      const pathBearing = turf.bearing(start, end);
      const delta = parseInt(corridorBearing - pathBearing);

      const isSwappedDirection =
        corridor.properties.swapDirection !== undefined &&
        corridor.properties.swapDirection;

      return isSwappedDirection ? delta !== 0 : delta === 0;
    }
    return true;
  }

  _checkTimeBased(feature, now = new Date()) {
    // We need to assume that from/to are in UTC time

    let isAvailableNow = true;
    if (feature.properties.openingHours !== undefined) {
    
      const currentDay = now.getUTCDay();

      const openings = feature.properties.openingHours[currentDay];

      // Current hour in UTC
      const currentHour = parseInt(now.getUTCHours());
      const currentMinute = parseInt(now.getUTCMinutes());
      const current = currentHour * 60 + currentMinute;

      // if there's no data means it's always close
      if (openings.length === 0) {
        return false;
      }

      // Retrieve opening
      const opening = openings[0].split(":");
      const openingHour = parseInt(opening[0]);
      const openingMinute = parseInt(opening[1]);
      const open = openingHour * 60 + openingMinute;

      // Retrieve closing
      const closing = openings[1].split(":");
      const closingHour = parseInt(closing[0]);
      const closingMinute = parseInt(closing[1]);
      const close = closingHour * 60 + closingMinute;

      // It's always open
      if (open === 0 && open === close) {
        return true;
      }
      
      isAvailableNow = (current >= open && current <= close);
    }
    return isAvailableNow;
  }

  _checkAvailablePath(feature) {
    let useForPath = true;

    if (feature.properties.available !== undefined) {
      useForPath = feature.properties.available;
    }

    return useForPath;
  }
}