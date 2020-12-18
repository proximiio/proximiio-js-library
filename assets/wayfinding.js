import * as turf from '@turf/turf';

export class Wayfinding {

    /**
     *
     * @param featureCollection {FeatureCollection}
     */
    constructor(featureCollection) {
        let featureList = featureCollection.features;
        let minLevel = undefined;
        let maxLevel = undefined;

        featureList.forEach(feature => {
            let level = feature.properties.level;
            if (minLevel === undefined || level < minLevel) {
                minLevel = level;
            }
            if (maxLevel === undefined || maxLevel < level) {
                maxLevel = level;
            }
            if (feature.properties.levels !== undefined) {
                feature.properties.levels.forEach(level => {
                    if (minLevel === undefined || level < minLevel) {
                        minLevel = level;
                    }
                    if (maxLevel === undefined || maxLevel < level) {
                        maxLevel = level;
                    }
                });
            }
        });

        if (minLevel === undefined) throw "No feature with level was supplied!";

        let routableAreaFeatureList = featureList.filter(feature => feature.properties.routable && (feature.geometry.type === "MultiPolygon" || feature.geometry.type === "Polygon"));
        let floorGeojsonMap = new Map();
        for (let level = minLevel; level <= maxLevel; level++) {
            let floorAreaFeature = routableAreaFeatureList.find(feature => feature.properties.level === level);
            floorGeojsonMap.set(level, turf.featureCollection(floorAreaFeature !== undefined ? [floorAreaFeature] : []));
        }

        // Extract corridors, level changers, accessibility POIs
        let corridorList = featureList.filter(feature => feature.properties.class === 'path');
        let levelChangerList = featureList.filter(feature =>
            feature.properties.type === 'elevator'
            || feature.properties.type === 'escalator'
            || feature.properties.type === 'staircase'
        );
        levelChangerList.forEach(levelChanger => {
            if (levelChanger.id === undefined) levelChanger.id = levelChanger.properties.id;
        });
        let accesibilityPoiTypeList = ['door', 'ticket_gate'];
        let accessibilityPoiList = featureList.filter(feature => accesibilityPoiTypeList.includes(feature.properties.type));

        // LevelChangers: Create level array from legacy min/max values
        levelChangerList.forEach(levelChanger => {
            if (levelChanger.properties.levels === undefined) {
                if (levelChanger.properties.level_min !== undefined && levelChanger.properties.level_max !== undefined) {
                    levelChanger.properties.levels = [];
                    for (let level = levelChanger.properties.level_min; level <= levelChanger.properties.level_max; level++) {
                        levelChanger.properties.levels.push(level);
                    }
                }
            }
        });

        // Use legacy constructor. TODO Replace this
        this._legacyConstructor(floorGeojsonMap, levelChangerList, corridorList, accessibilityPoiList);

    }


    /**
     * TODO: replace this
     * @param floorGeojsonMap {Map}
     * @param levelChangers {Feature<Point>[]}
     * @param corridors  {Feature<LineString>[]}
     * @param accessibilityPoiList  {Feature<Point>[]}
     */
    _legacyConstructor(floorGeojsonMap, levelChangers, corridors, accessibilityPoiList) {
        this.wallOffsetDistance = 0.5; //m
        this.floorList = floorGeojsonMap;
        this.levelChangerList = levelChangers;
        this.accessibilityPoi = accessibilityPoiList;
        this.corridors = [
            ...corridors.filter(it => it.geometry.type === 'LineString')
//            ,
//            ...corridors.filter(it => it.geometry.type === 'MultiLineString').map(it => turf.flatten(it).features).flat()
        ];

        this.rebuildData();
        this.configuration = {
            avoidElevators: false,
            avoidEscalators: false,
            avoidStaircases: false,
            avoidRamps: false,
            avoidNarrowPaths: false,
            avoidRevolvingDoors: false,
            avoidTicketGates: false,
            avoidBarriers: false
        };
        this.POI_TYPE = {
            ELEVATOR: 'elevator',
            ESCALATOR: 'escalator',
            STAIRCASE: 'staircase',
            RAMP: 'ramp',
            NARROW_PATH: 'narrow_path',
            REVOLVING_DOOR: 'door',
            TICKET_GATE: 'ticket_gate',
            BARRIER: 'barrier'
        };
        this._pathFixDistance = 1.0;
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
        Object.keys(configuration).forEach(property => {
            if (this.configuration.hasOwnProperty(property)) {
                this.configuration[property] = configuration[property];
            }
        });
        this._pathFixDistance = pathFixDistance;
    }

    rebuildData() {

        let floorData = new Map();
        this.floorList.forEach((floor, level) => {
            let floorPoints = [];
            let floorWalls = [];
            let floorAreas = [];

            // Floor features == "walkable areas"
            floor.features.forEach((walkableArea, walkableAreaIndex) => {
                let wallLineStringList = turf.flatten(turf.polygonToLine(walkableArea)).features.map(feature => {return feature.geometry; });
                // Floor wall lines, we wish to split to individual walls
                wallLineStringList.forEach(wallLineString => {
                    let firstPoint;
                    let nextPoint;

                    // Last point is the same as first, therefore limit index to exclude last point
                    for (let index = 0; index < wallLineString.coordinates.length - 1; index++) {
                        let point;
                        if (index === 0) {
                            firstPoint = turf.point(wallLineString.coordinates[index]);
                            firstPoint.properties.level = level;
                            firstPoint.properties.neighbours = [];
                            point = firstPoint;
                        } else {
                            point = nextPoint;
                        }
                        if (index === wallLineString.coordinates.length - 2) {
                            nextPoint = firstPoint
                        } else {
                            nextPoint = turf.point(wallLineString.coordinates[index + 1]);
                            nextPoint.properties.level = level;
                            nextPoint.properties.neighbours = [];
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
                wallFeatures: floorWalls.map(wall => turf.lineString([wall[0].geometry.coordinates, wall[1].geometry.coordinates]))
            });

        });

        this.bearingCache = new Map();
        this.floorData = floorData;

        this.floorData.forEach((floorData, floorLevel) => {
            // List of physical POIs on this level that are within area
            let inAreaPoiList = this.accessibilityPoi
                .filter(poi => floorLevel === poi.properties.level)
                .filter(poi =>
                    floorData.areas.filter(area => turf.booleanContains(area, poi)) .length > 0)
            ;
            inAreaPoiList.forEach(poi => {
                // Generate points around POI to allow going around, but only if they are "within area
                let detourPointList = [
                    turf.destination(poi.geometry.coordinates, poi.properties.radius + this.wallOffsetDistance, 0, {units: 'meters'}),
                    turf.destination(poi.geometry.coordinates, poi.properties.radius + this.wallOffsetDistance, 60, {units: 'meters'}),
                    turf.destination(poi.geometry.coordinates, poi.properties.radius + this.wallOffsetDistance, 120, {units: 'meters'}),
                    turf.destination(poi.geometry.coordinates, poi.properties.radius + this.wallOffsetDistance, 180, {units: 'meters'}),
                    turf.destination(poi.geometry.coordinates, poi.properties.radius + this.wallOffsetDistance, -120, {units: 'meters'}),
                    turf.destination(poi.geometry.coordinates, poi.properties.radius + this.wallOffsetDistance, -60, {units: 'meters'})
                ].filter(poi => floorData.areas.filter(area => turf.booleanContains(area, poi)).length > 0);
                detourPointList.forEach(point => {
                    point.properties.level = floorLevel;
                    point.properties.isDetourPoint  = true;
                });
                floorData.points = floorData.points.concat(detourPointList);
                this.detourPointList = detourPointList;
            });
        });

        // Split lines into single line segments
        let corridorLinePointPairs = [];
        let corridorLineFeatures = [];
        this.corridors.forEach((corridor, corridorIndex) => {
            let coordinateList = corridor.geometry.coordinates;
            let lastPoint = null;
            for (let i = 0; i < coordinateList.length - 1; i++) {
                let pointA;
                if (lastPoint != null) {
                    pointA = lastPoint
                } else {
                    pointA = turf.point(coordinateList[i]);
                    pointA.properties.neighbours = [];
                    pointA.properties.level = corridor.properties.level;
                }
                let pointB = turf.point(coordinateList[i + 1]);
                pointB.properties.level = corridor.properties.level;
                pointB.properties.neighbours = [];
                if (corridor.properties.bidirectional != false || corridor.properties.swapDirection != false)
                    pointA.properties.neighbours.push(pointB);
                if (corridor.properties.bidirectional != false || corridor.properties.swapDirection == true)
                    pointB.properties.neighbours.push(pointA);

                let lineFeature = turf.lineString([pointA.geometry.coordinates, pointB.geometry.coordinates]);
                lineFeature.properties.level = corridor.properties.level;

                // Mark lineFeature accordingly
                lineFeature.properties.bidirectional = corridor.properties.bidirectional;
                lineFeature.properties.swapDirection = corridor.properties.swapDirection;

                // Mark points as NarrowPath if corridor is NarrowPath
                if (corridor.properties.narrowPath) {
                    pointA.properties.narrowPath = true;
                    pointB.properties.narrowPath = true;
                    lineFeature.properties.narrowPath = true;
                }
                // Mark points as Ramp if corridor is Ramp
                if (corridor.properties.ramp) {
                    pointA.properties.ramp = true;
                    pointB.properties.ramp = true;
                    lineFeature.properties.ramp = true;
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
        // for (let i = 0; i < corridorLinePointPairs.length - 1; i++) {
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

                if (segmentLineString.properties.level !== corridorLineFeatures[j].properties.level) {
                    continue
                }

                // Consecutive segments, should not cross (rather, they cross at the end point)
                if (segmentToTest.includes(segment[0]) || segmentToTest.includes(segment[1])) {
                    continue;
                }

                let segmentLineStringToTest = corridorLineFeatures[j];
                let intersections = turf.lineIntersect(segmentLineString, segmentLineStringToTest).features;
                if (intersections.length > 0) {
                    let intersectingPoint = intersections[0];
                    intersectingPoint.properties.level = segment[0].properties.level;
                    intersectingPoint.properties.isCorridorPoint = true;
                    // Intersect point inherits filters from both intersecting lines
                    if (segmentLineString.properties.narrowPath || segmentLineStringToTest.properties.narrowPath) {
                        intersectingPoint.properties.narrowPath = true;
                        // console.log(intersectingPoint);
                    }
                    if (segmentLineString.properties.ramp || segmentLineStringToTest.properties.ramp) {
                        intersectingPoint.properties.ramp = true;
                    }
                    // this._setNeighbourhoodBasedOnCorridorDirectionality(corridorLineFeatures[i], segment[0], segment[1], intersectingPoint);

                    segmentIntersectionPointMap.get(i).push(intersectingPoint);
                    segmentIntersectionPointMap.get(j).push(intersectingPoint);
                    segmentIntersectionPointList.push(intersectingPoint);
                    // console.log();
                    // console.log(i + '/' +j + ' = ' + intersectingPoint.geometry.coordinates[0] + ',' + intersectingPoint.geometry.coordinates[1]);
                }
            }
            i++;
        }

        i = 0;
        while (i < corridorLinePointPairs.length) {
        // for (let i = 0; i < corridorLinePointPairs.length; i++) {
            let segment = corridorLinePointPairs[i];
            let segmentFeature = corridorLineFeatures[i];
            let pointA = segment[0];
            let pointB = segment[1];
            let segmentIntersectionList = segmentIntersectionPointMap.get(i);
            segmentIntersectionList.sort((a, b) => this._comparePointsByDistanceFromReference(pointA, a, b));
            if (segmentIntersectionList) {
                segmentIntersectionList.forEach((intersection) => {
                    this._setNeighbourhoodBasedOnCorridorDirectionality(segmentFeature, pointA, pointB, intersection);
                    if (segmentFeature.properties.bidirectional != false) {
                        intersection.properties.neighbours = intersection.properties.neighbours.concat(segmentIntersectionList.filter(it => it !== intersection));
                    } else if (segmentFeature.properties.swapDirection != true) {
                        let pointsAfter = segmentIntersectionList.slice(segmentIntersectionList.indexOf(intersection));
                        intersection.properties.neighbours.push(...pointsAfter);
                    } else {
                        let pointsBefore = segmentIntersectionList.slice(0, segmentIntersectionList.indexOf(intersection));
                        intersection.properties.neighbours.push(...pointsBefore);
                    }
                });
                corridorLineFeatures[i].properties.intersectionPointList = segmentIntersectionList;
            } else {
                corridorLineFeatures[i].properties.intersectionPointList = []
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
            let wallFeatures = this.floorData.get(segment[0].properties.level).wallFeatures;

            wallFeatures.forEach((wallFeature, wallIndex) => {
                let intersections = turf.lineIntersect(segmentFeature, wallFeature).features;
                if (intersections.length > 0) {
                    let intersectPoint = intersections[0];
                    intersectPoint.properties.level = segment[0].properties.level;
                    intersectPoint.properties.neighbours = [];
                    intersectPoint.properties.bordersArea = true;
                    // Intersect point inherits filters from both intersecting lines
                    if (segmentFeature.properties.narrowPath) {
                        intersectPoint.properties.narrowPath = true;
                    }
                    if (segmentFeature.properties.ramp) {
                        intersectPoint.properties.ramp = true;
                    }
                    let distance = this._distance(segment[0], intersectPoint);
                    segmentIntersections.push({
                        point: intersectPoint,
                        distance: distance,
                        wallIndex: wallIndex
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
                    walls[intersection.wallIndex][0].properties.neighbours.push(intersection.point);
                    walls[intersection.wallIndex][1].properties.neighbours.push(intersection.point);
                    intersection.point.properties.neighbours.push(previousPoint, walls[intersection.wallIndex][0], walls[intersection.wallIndex][1]);
                    // TODO check directionality?
                    intersection.point.properties.neighbours.push(...corridorLineFeatures[i].properties.intersectionPointList);
                    corridorLineFeatures[i].properties.intersectionPointList.forEach(point => point.properties.neighbours.push(intersection.point));

                    // Remember last point
                    previousPoint = intersection.point;
                    corridorLineFeatures[i].properties.intersectionPointList.push(intersection.point);
                });

                // Inject from last intersection to end of original segment
                let newCorridor = turf.lineString([previousPoint.geometry.coordinates, segment[1].geometry.coordinates]);
                newCorridor.properties.level = previousPoint.properties.level;

                // connect last intersection point with end point
                segment[1].properties.neighbours.push(previousPoint);
                previousPoint.properties.neighbours.push(segment[1]);

                segmentToWallIntersectionPointList.push(...segmentIntersections.map((intersection) => intersection.point));
            }
            i++;
        }

        segmentToWallIntersectionPointList.forEach((point) => {
            this.floorData.get(point.properties.level).points.push(point);
        });
        // this.segmentToWallIntersectionPointList = segmentToWallIntersectionPointList.map(p => turf.point(p.geometry.coordinates));

        segmentToWallIntersectionPointList.forEach((point) => {
            let neighbours = this._findNeighbours(point, null, null, this.floorData.get(point.properties.level).points);
            point.properties.neighbours.push(...neighbours);
        });


        // Store corridor data
        this.corridorLinePointPairs = corridorLinePointPairs;
        this.corridorLineFeatures = corridorLineFeatures;
        this.corridorLinePoints = [];
        this.corridorLinePointPairs.forEach(pair => {
            pair[0].properties.isCorridorPoint = true;
            pair[1].properties.isCorridorPoint = true;

            if (!this.corridorLinePoints.includes(pair[0])) {
                this.corridorLinePoints.push(pair[0]);
            }
            if (!this.corridorLinePoints.includes(pair[1])) {
                this.corridorLinePoints.push(pair[1]);
            }
        });
        this.corridorLinePoints = this.corridorLinePoints.concat(segmentIntersectionPointList);

        let levelChangerGroupMap = new Map();

        this.levelChangerList.forEach(levelChanger => {

            // Create level changer groups
            if (levelChanger.properties.group !== undefined) {
                // Get group array, initiate if neccessary
                let groupId = levelChanger.properties.group;
                if (!levelChangerGroupMap.has(groupId)) levelChangerGroupMap.set(groupId, []);
                let group = levelChangerGroupMap.get(groupId);
                // Add lc to group map
                group.push(levelChanger);
            } else {
                levelChangerGroupMap.set(levelChanger.id, [levelChanger]);
            }

            levelChanger.properties.fixedPointMap = new Map();
            levelChanger.properties.levels.forEach(level => {
                let point = this._copyPoint(levelChanger);
                point.properties.level = level;
                let fixedPoint = this._getFixPointInArea(point);
                fixedPoint.id = levelChanger.id;
                fixedPoint.properties.amenity = levelChanger.properties.amenity;
                fixedPoint.properties.direction = levelChanger.properties.direction;
                fixedPoint.properties.id = levelChanger.properties.id;
                fixedPoint.properties.level = level;
                fixedPoint.properties.type = levelChanger.properties.type;
                if (fixedPoint.properties.neighbours === undefined) fixedPoint.properties.neighbours = [];

                // Do not fix level changers that are further than 5 meters from any path or area
                if (this._distance(point, fixedPoint) > 5) {
                    return;
                }

                // Store fixed point into the level changer
                levelChanger.properties.fixedPointMap.set(level, fixedPoint);

                // Add neighbourhood for corridor
                if (fixedPoint.properties.onCorridor) {
                    // fixedPoint.properties.neighbours = [...this.corridorLinePointPairs[fixedPoint.properties.corridorIndex], ...segmentIntersectionPointMap.get(fixedPoint.properties.corridorIndex)];
                    if (fixedPoint.properties.neighboursLeadingTo !== undefined) {
                        fixedPoint.properties.neighboursLeadingTo.forEach(neighbour => {
                            if (neighbour.properties.neighbours === undefined) neighbour.properties.neighbours = [];
                            neighbour.properties.neighbours.push(fixedPoint);
                        });
                        this.corridorLineFeatures[fixedPoint.properties.corridorIndex].properties.intersectionPointList.push(fixedPoint);
                    }
                }
            });
        });

        levelChangerGroupMap.forEach( (lcList, groupId) => {

            let direction = lcList.map(it => it.properties.direction).find(it => it !== undefined);
            let fixedPointList = [];
            lcList.forEach(lc => {
                fixedPointList.push(...lc.properties.fixedPointMap.values());
            });

            fixedPointList.forEach(fixedPoint => {
                // init neighbour
                if (fixedPoint.properties.neighbours == undefined) fixedPoint.properties.neighbours = [];
                // Set neighbourhood
                if (direction === 'up') {
                    fixedPoint.properties.neighbours.push(...fixedPointList.filter(it => it.properties.level > fixedPoint.properties.level))
                } else if (direction === 'down') {
                    fixedPoint.properties.neighbours.push(...fixedPointList.filter(it => it.properties.level < fixedPoint.properties.level))
                } else {
                    fixedPoint.properties.neighbours.push(...fixedPointList.filter(it => it.properties.level !== fixedPoint.properties.level))
                }
            });
        });
    }

    _removeItemFromList(list, item) {
        let index = list.indexOf(item);
        if (index >= 0) {
            list.splice(index, 1);
        }
    }

    load(neighboursMap, wallOffsets) {
        this.neighbourMap = neighboursMap;
        this.rebuildData();
        this.wallOffsets = wallOffsets;
        this.wallOffsetLineList = [];
        this._getPointList().forEach((point, index) =>{
            let offsetPoint = this.wallOffsets[index];
            if (!offsetPoint) {
                return;
            }
            // console.log(point);
            let offsetLine = turf.lineString([point.geometry.coordinates, offsetPoint.geometry.coordinates]);
            offsetLine.properties.level = point.properties.level;
            this.wallOffsetLineList.push(offsetLine);
        });
        // drawLayer('offsetLayer', turf.featureCollection(this.wallOffsetLineList));
    }

    /**
     * @param point {Feature<Point>}
     * @param level {Number}
     * @private true
     */
    _isPointOnLevel(point, level) {
        if (point.properties.fixedPointMap !== undefined) {
            return point.properties.fixedPointMap.has(level)
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
        this.levelChangerList.forEach(lc => points.push(...lc.properties.fixedPointMap.values()));
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
            wallOffsets: this._generateWallOffsets()
        }
    }

    _generateNeighbourhoodMap() {

        // this.nbLines = [];

        let points = this._getPointList();
        let neighboursMap = {};

        // NeighbourMap for polygon points
        this.floorData.forEach((levelFloorData, level) => {
            let levelNeighboursMap = {};
            let levelPoints = levelFloorData.points.concat(this.levelChangerList.filter(point => this._isPointOnLevel(point, level)).map(it => it.properties.fixedPointMap.get(level)));
            levelPoints.forEach(point => {
                let pointIndex = points.indexOf(point);
                // Get unwrapped point if case the point is a level changer, so we can properly test neighbourhood
                let unwrappedPoint = this._unwrapLevelChangerPoint(point, level);
                // Simulate startPoint to force lowering number of intersections allowed.
                // Unwrapped point is inside accessible area, thus there should be only one intersection, wall point itself.
                let startPoint = unwrappedPoint === point ? null : unwrappedPoint;
                let neighbours = this._findNeighbours(unwrappedPoint, startPoint, null, levelPoints);
                // if (level === 1) {
                //     neighbours.forEach(neighbour => this.nbLines.push(turf.lineString([point.geometry.coordinates, neighbour.geometry.coordinates])));
                // }
                levelNeighboursMap[pointIndex] = neighbours.map(neighbour => points.indexOf(neighbour));
            });
            neighboursMap[level] = levelNeighboursMap;
        });

        // NeighbourMap for corridor points
        this.corridorLinePoints.forEach(point => {

            let pointIndex = points.indexOf(point);
            let level = point.properties.level;
            let neighbours;
            let levelNeighboursMap = neighboursMap[level];

            // Find neighbours in polygon only for points crossing polygon
            if (point.properties.bordersArea) {
                let potentialPoints = this.floorData.get(level).points
                    .concat(this.levelChangerList.filter(point => this._isPointOnLevel(point, level)))
                    .concat(this.corridorLinePoints.filter(point => point.properties.bordersArea && this._isPointOnLevel(point, level)));
                neighbours = this._findNeighbours(point, point, null, potentialPoints);

                // neighbours.forEach(neighbour => this.nbLines.push(turf.lineString([point.geometry.coordinates, neighbour.geometry.coordinates])));

                // Add reverse relationship
                neighbours.forEach(neighbour => {
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

                // neighbours.forEach(neighbour => this.nbLines.push(turf.lineString([point.geometry.coordinates, neighbour.geometry.coordinates])));

            }

            // Store relationship for corridor point
            if (levelNeighboursMap[pointIndex] === undefined) {
                levelNeighboursMap[pointIndex] = neighbours.map(neighbour => points.indexOf(neighbour));
            } else {
                neighbours.forEach(neighbour => levelNeighboursMap[pointIndex].push(points.indexOf(neighbour)));
            }

        });

        // Export and store data
//        console.log('neighbourMap:');
//        console.log(JSON.stringify(neighboursMap));
        this.neighbourMap = neighboursMap;
        return neighboursMap;
    }

    _generateWallOffsets() {
        this.wallOffsetLineList = [];
        this.wallOffsets = {};
        let pointList = this._getPointList();
        pointList.forEach(point => {
            // Do no process level changers
            if (point.properties.level == null) {
                return;
            }

            // a) Find walls where the point P is used and the other points in walls: A, B
            let walls = this.floorData.get(point.properties.level).walls.filter(wall => (wall.includes(point)));

            if (walls.length === 0) {
                return;
            }

            let pointA = walls[0][0] === point ? walls[0][1] : walls[0][0];
            let pointB = walls[1][0] === point ? walls[1][1] : walls[1][0];
            let pointABearing = turf.bearing(point, pointA);
            let pointBBearing = turf.bearing(point, pointB);

            // b) Get average bearing to points A,B
            let bearing = this._averageBearing(pointABearing, pointBBearing);
            let oppositeBearing = bearing > 0 ? (bearing - 180) : (bearing + 180);
            // this.wallOffsetLineList.push(turf.lineString([point.geometry.coordinates, offsetPoint.geometry.coordinates]));


            // c) Generate two points M,N very close to point P
            let pointM = turf.destination(point.geometry.coordinates, 0.01, bearing, {units: 'meters'});
            let pointN = turf.destination(point.geometry.coordinates, 0.01, oppositeBearing, {units: 'meters'});

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
            let pointF = turf.destination(point.geometry.coordinates, this.wallOffsetDistance * 2, containedPoint === pointM ? bearing : oppositeBearing, {units: 'meters'});

            // f) Test if PF intersects with any wall, update point F and PF to shortest available size
            let linePF = turf.lineString([point.geometry.coordinates, pointF.geometry.coordinates]);
            this.floorData.get(point.properties.level).walls.forEach((wall, index) => {
                // Do not test walls containing point P, they will intersect of course
                if (walls.includes(wall)) {
                    return;
                }
                let lineWall = this.floorData.get(point.properties.level).wallFeatures[index];
                // Find intersection point, use it to produce new
                let intersections = turf.lineIntersect(linePF, lineWall);
                if (intersections.features.length > 0) {
                    pointF = turf.point(intersections.features[0].geometry.coordinates);
                    linePF = turf.lineString([point.geometry.coordinates, pointF.geometry.coordinates]);
                }
            });

            // g) Create wall offset point as midpoint between points P,F
            let offsetPoint = turf.midpoint(point.geometry.coordinates, pointF.geometry.coordinates);
            offsetPoint.properties.level = point.properties.level;
            this.wallOffsets[pointList.indexOf(point)] = offsetPoint;
            let offsetLine = turf.lineString([point.geometry.coordinates, offsetPoint.geometry.coordinates]);
            offsetLine.properties.level = point.properties.level;
            this.wallOffsetLineList.push(offsetLine);
        });

//        console.log('wallOffsets:');
//        console.log(JSON.stringify(this.wallOffsets));
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
            let pointsToInject = this._calculateWallOffsetPointList(current, path.length > 0 ? path[path.length - 1] : previous);
            pointsToInject.forEach((point) => {
                if (previous === current || previous.geometry.coordinates[0] !== point.geometry.coordinates[0] || previous.geometry.coordinates[1] !== point.geometry.coordinates[1]) {
                    let newPoint = this._copyPoint(point);
                    newPoint.properties.level = current.properties.level;
                    path.push(newPoint);
                    previous = point;
                }
            });
            current =  current.properties.cameFrom;
        } while (current != null);

        path.reverse();
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
            let line = turf.lineString([previousPoint.geometry.coordinates, currentOffsetPoint.geometry.coordinates]);
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
                    offsetPoint.properties.distance = this._distance(intersection.features[0], currentOffsetPoint);
                    offsetPoint.properties.offsetIndex = index;
                    potentialOffsetPoints.push(offsetPoint);
                }
            });
            if (potentialOffsetPoints.length > 0) {
                potentialOffsetPoints.sort((a, b) => (a.properties.distance - b.properties.distance));
                currentOffsetPoint = potentialOffsetPoints[0];
                currentPointIndex = currentOffsetPoint.properties.offsetIndex;
                offsetPointList.push(currentOffsetPoint);
            }
        } while (potentialOffsetPoints.length > 0);

        return offsetPointList.reverse();
    }

    _getIntersectingOffsetPoints(current, previous) {
        if (current === previous || current.properties.level !== previous.properties.level) {
            return [];
        }
        let line = turf.lineString([current.geometry.coordinates, previous.geometry.coordinates]);
        let intersectingWallOffsetPoints = [];
        this.wallOffsetLineList.forEach((wallOffsetLine, index) => {
            if (wallOffsetLine.properties.level !== current.properties.level) {
                return;
            }
            if (turf.lineIntersect(line, wallOffsetLine).features.length > 0) {
                let point = this.wallOffsets[index];
                point.properties.distance = turf.pointToLineDistance(current.geometry.coordinates, wallOffsetLine, {units: 'meters'});
                intersectingWallOffsetPoints.push(point);
            }
        });
        // let line

//        console.log('//////////////');
//        console.log(intersectingWallOffsetPoints);
        intersectingWallOffsetPoints.sort((a,b) => (b.properties.distance - b.properties.distance));
//        console.log(intersectingWallOffsetPoints);
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
        this.levelChangerList.forEach(levelChanger => {
            levelChanger.properties.fixedPointMap.forEach((it, level) => {
                delete it.properties.cameFrom;
                delete it.properties.gscore;
                delete it.properties.fscore;
            });
        });
        this.corridorLinePoints.forEach(point => {
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
        this.clearData();

        this.nbLines = [];

        this.bearingCache = new Map();

        let fixedStartPoint = this._getFixPointInArea(startPoint);
        let fixedEndPoint = this._getFixEndPoint(endPoint, startPoint.properties.level);

        let openSet = [fixedStartPoint];
        let closedSet = [];

        fixedStartPoint.properties.gscore = 0;
        fixedStartPoint.properties.fscore = this._heuristic(fixedStartPoint, fixedEndPoint);

        while (openSet.length > 0) {
            let current = this._getMinFScore(openSet);

            // Unable to find best point to continue?
            if (current === null) {
                break;
            }

            if (current === fixedEndPoint) {
//                console.log('found the route!');
                let finalPath = this.reconstructPath(current);
                if (fixedEndPoint !== endPoint && endPoint.properties.levels !== undefined && (!fixedEndPoint.properties.onCorridor || this._distance(fixedEndPoint, endPoint) > this._pathFixDistance)) {
                    endPoint.properties.fixed = true
                    finalPath.push(endPoint);
                }
                if (fixedStartPoint !== startPoint && (!fixedStartPoint.properties.onCorridor || this._distance(fixedStartPoint, startPoint) > this._pathFixDistance)) {
                    startPoint.properties.fixed = true
                    finalPath.unshift(startPoint);
                }
                finalPath[finalPath.length - 1].properties.gscore = current.properties.gscore;
                return finalPath
            }
            closedSet.push(openSet.splice(openSet.indexOf(current),1));

            let neighbours = this._getNeighbours(current, fixedStartPoint, fixedEndPoint);

            neighbours.forEach(n => this.nbLines.push(turf.lineString([current.geometry.coordinates, n.geometry.coordinates])));

            for (let nIndex in neighbours) {
                let neighbour = neighbours[nIndex];
                if (closedSet.indexOf(neighbour) > -1) {
                    continue;
                }

                let tentativeGScore = current.properties.gscore + this._distance(current, neighbour);
                let gScoreNeighbour = neighbour.properties.gscore != null ? neighbour.properties.gscore : Infinity;
                if (tentativeGScore < gScoreNeighbour) {
                    neighbour.properties.cameFrom = current;
                    neighbour.properties.gscore = tentativeGScore + 0.2;
                    neighbour.properties.fscore = tentativeGScore + this._heuristic(neighbour, fixedEndPoint);
                    if (openSet.indexOf(neighbour) < 0) {
                        openSet.push(neighbour);
                    }
                }

            }
        }

//        console.log('no path found?');
        return undefined;

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
            let levelPoints = this._getPointList().filter(proposedPoint => this._isPointOnLevel(proposedPoint, point.properties.level));
            neighbours = this._findNeighbours(point, startPoint, endPoint, levelPoints);
            neighbours = neighbours.filter(neighbourPoint => {
//                if (neighbourPoint === endPoint) {
//                    console.log('testing endPoint');
//                }
                let level = point.properties.level;
                let revolvingDoorBlock = this.configuration.avoidRevolvingDoors && this._testAccessibilityPoiNeighbourhood(point, neighbourPoint, level, this.POI_TYPE.REVOLVING_DOOR);
                let ticketGateBlock = this.configuration.avoidTicketGates && this._testAccessibilityPoiNeighbourhood(point, neighbourPoint, level, this.POI_TYPE.TICKET_GATE);
                return !revolvingDoorBlock && !ticketGateBlock;
            });
        } else {
            // Gather neighbours over all levels
            let points = this._getPointList();
            let pointIndex = points.indexOf(point);
            if (pointIndex >= 0) {
                this.floorData.forEach((_, level) => {
                    let levelNeighbourMap = this.neighbourMap[level];
                    if (levelNeighbourMap.hasOwnProperty(pointIndex)) {
                        levelNeighbourMap[pointIndex].forEach(neighbourIndex => {
                            let neighbourPoint = points[neighbourIndex];

                            let revolvingDoorBlock = this.configuration.avoidRevolvingDoors && this._testAccessibilityPoiNeighbourhood(point, neighbourPoint, level, this.POI_TYPE.REVOLVING_DOOR);
                            let ticketGateBlock = this.configuration.avoidTicketGates && this._testAccessibilityPoiNeighbourhood(point, neighbourPoint, level, this.POI_TYPE.TICKET_GATE);

                            if (!neighbours.includes(neighbourPoint) && !revolvingDoorBlock && !ticketGateBlock) {
                                neighbours.push(neighbourPoint);
                            }
                        });
                    }
                });
            }

            // Test if endpoint is neighbour
            if (
                (point.properties.level !== undefined && point.properties.level === endPoint.properties.level)
                || (point.properties.fixedPointMap != undefined && point.properties.fixedPointMap.has(endPoint.properties.level))
            ) {

                let revolvingDoorBlock = this.configuration.avoidRevolvingDoors && this._testAccessibilityPoiNeighbourhood(point, endPoint, endPoint.properties.level, this.POI_TYPE.REVOLVING_DOOR);
                let ticketGateBlock = this.configuration.avoidTicketGates && this._testAccessibilityPoiNeighbourhood(point, endPoint, endPoint.properties.level, this.POI_TYPE.TICKET_GATE);

                if (!revolvingDoorBlock && !ticketGateBlock) {

                    // Endpoint is fixed on corridor
                    if (endPoint.properties.onCorridor) {

                        if (endPoint.properties.neighbours.includes(point)) {
                            if (this.corridorLineFeatures[endPoint.properties.corridorIndex].properties.bidirectional != false) {
                                neighbours.push(endPoint);
                            }
                        } else if (endPoint.properties.neighboursLeadingTo !== undefined && endPoint.properties.neighboursLeadingTo.includes(point)) {
                            neighbours.push(endPoint);
                        }

                        // End point is not on corridor, therefore should be in the area
                    } else {
                        let unwrapped = this._unwrapLevelChangerPoint(point, endPoint.properties.level);
                        let allowedIntersections = 1;
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
        return neighbours.filter(neighbour => {
            if (this.configuration.avoidElevators && neighbour.properties.type === this.POI_TYPE.ELEVATOR) {
                return false;
            } else if (this.configuration.avoidEscalators && neighbour.properties.type === this.POI_TYPE.ESCALATOR) {
                return false;
            } else if (this.configuration.avoidStaircases && neighbour.properties.type === this.POI_TYPE.STAIRCASE) {
                return false;
            } else if (this.configuration.avoidNarrowPaths && neighbour.properties.narrowPath) {
                return false;
            } else if (this.configuration.avoidRamps && neighbour.properties.ramp) {
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
//        console.log('testing accesibility for ' + accesibilityType);
        // Filter out lines that intersect revolving door POIs.
        if (this.configuration.avoidRevolvingDoors) {
            let line = turf.lineString([pointA.geometry.coordinates, pointB.geometry.coordinates]);
            let poiList = this.accessibilityPoi.filter(poi => (poi.properties.level === level && poi.properties.type === accesibilityType));
            for (let i = 0; i < poiList.length; i++) {
                let poi = poiList[i];
                let distance = turf.pointToLineDistance(poi.geometry.coordinates, line, {units: 'meters'});
//                console.log(distance);
                if (distance <= poi.properties.radius) {
//                    console.log('accesibility for ' + accesibilityType + ' endend as true');
                    return true;
                }
            }
        }
//        console.log('accesibility for ' + accesibilityType + ' endend as false');
        return false;
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
        if ((point === startPoint && point.properties.onCorridor) || (point.properties.isCorridorPoint && !point.properties.bordersArea)) {
            // End point is on the same corridor line == they are neighbours
            if (endPoint && endPoint.properties.onCorridor && startPoint.properties.corridorIndex === endPoint.properties.corridorIndex) {
                neighbours.push(endPoint);
            }
            return neighbours;
        }


        let allowedIntersections = 0;
        if (endPoint && this._isPointOnLevel(endPoint, point.properties.level)) {
            proposedPointList.push(endPoint);
        }

        let fixedPoint = this._unwrapLevelChangerPoint(point, point.properties.level);

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

            let fixedProposedPoint = this._unwrapLevelChangerPoint(proposedPoint, point.properties.level);

            allowedIntersections = 2;
            if (point === startPoint) {
                allowedIntersections--;
            }
            if (proposedPoint === startPoint) {
                allowedIntersections --;
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

            let intersects = this._countIntersections(point, fixedProposedPoint, allowedIntersections);

            if (intersects) {
                // if (allowedIntersections >= 1) {
                let midpoint = turf.midpoint(point.geometry.coordinates, proposedPoint.geometry.coordinates);
                for (let polIndex in this.floorData.get(point.properties.level).areas) {
                    let area = this.floorData.get(point.properties.level).areas[polIndex];
                    if (turf.booleanContains(area, midpoint)) {
                        neighbours.push(proposedPoint);
                        break;
                    }
                }
                // } else {
                //     neighbours.push(proposedPoint);
                // }
            }


            //---
            // if (point === startPoint || proposedPoint === endPoint) {
            //     if (point === startPoint && proposedPoint === endPoint) {
            //         allowedIntersections = 0;
            //     } else {
            //         allowedIntersections = 1;
            //     }
            //     let intersections = this._countIntersections(point, proposedPoint, allowedIntersections);
            //     if (intersections === true) {
            //         neighbours.push(proposedPoint);
            //     }
            // } else {
            //     let intersections = this._countIntersections(point, proposedPoint, 2);
            //     if (intersections === true) {
            //         let midpoint = turf.midpoint(point.geometry.coordinates, proposedPoint.geometry.coordinates);
            //         for (let polIndex in this.polygons) {
            //             let polygon = this.polygons[polIndex];
            //             if (turf.booleanContains(polygon, midpoint)) {
            //                 neighbours.push(proposedPoint);
            //                 break;
            //             }
            //         }
            //     }
            // }
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
        let pointALevelList = pointA.properties.fixedPointMap !== undefined ? [...pointA.properties.fixedPointMap.keys()] : [pointA.properties.level];
        let pointBLevelList = pointB.properties.fixedPointMap !== undefined ? [...pointB.properties.fixedPointMap.keys()] : [pointB.properties.level];
        return pointALevelList.filter(feature => pointBLevelList.includes(feature)).length > 0;

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
        let bearing = this._bearing(fromCoordinates, toCoordinates);
        let intersections = 0;
        let intersectionPointList = [];

        let floorWalls = this.floorData.get(pointFrom.properties.level).walls;
        let floorWallFeatures = this.floorData.get(pointFrom.properties.level).wallFeatures;

        for (let index in floorWalls) {
            let wall = floorWalls[index];

            let inRange = false;
            let pointIsInAWall = false;
            if (pointFrom == wall[0] || pointFrom == wall[1]) {
                inRange = true;
                pointIsInAWall = true;
            } else {
                let wBearingA = this._bearing(fromCoordinates, wall[0].geometry.coordinates);
                let wBearingB = this._bearing(fromCoordinates, wall[1].geometry.coordinates);
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
                    if (!this._testIdenticalPointInList(pointFrom, intersectionPointList)) {
                        intersectionPointList.push(pointFrom);
                        intersections++;
                    }
                } else {
                    let intersectPoints = turf.lineIntersect(
                        turf.lineString([fromCoordinates, toCoordinates]),
                        floorWallFeatures[index]
                    ).features;
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
    _averageBearing(bearingA, bearingB) {
        if (bearingA > bearingB) {
            let  temp = bearingA;
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
    _toRadians(degrees) {
        return degrees * Math.PI / 180;
    };

    _bearing(start, end) {
        // let hasCache = false;
        let endCache = this.bearingCache.get(start);
        if (endCache) {
            let cache = endCache.get(end);
            if (cache != null) {
                return cache;
            }
        }

        let startLng = this._toRadians(start[0]);
        let startLat = this._toRadians(start[1]);
        let destLng = this._toRadians(end[0]);
        let destLat = this._toRadians(end[1]);
        let cosDestLat = Math.cos(destLat);

        let y = Math.sin(destLng - startLng) * cosDestLat;
        let x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * cosDestLat * Math.cos(destLng - startLng);
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
        let pointCoordinates = point.geometry.coordinates;
        for (let index in pointList) {
            let proposedPointCoordinates = pointList[index].geometry.coordinates;
            if (proposedPointCoordinates[0] === pointCoordinates[0] && proposedPointCoordinates[1] === pointCoordinates[1]) {
                return true;
            }
        }
        return false;
    }

    /**
     *
     * @param pointSet {[Feature<Point>]}
     * @returns {Feature<Point>}
     */
    _getMinFScore(pointSet) {
        let bestPoint = null;
        let bestScore = Infinity;
        for (let index in pointSet) {
            let point = pointSet[index];
            if (point.properties.fscore < bestScore) {
                bestPoint = point;
                bestScore = point.properties.fscore;
            }
        }
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
            if (pointA.properties.levels !== undefined || pointB.properties.levels !== undefined) {
                penalty = 20;
            }
            return this._distance(pointA, pointB) + penalty;
        } else {
            // Filter out direct level changers
            let directLevelChangerList = this.levelChangerList.filter(levelChanger => {
                return levelChanger !== pointA && levelChanger !== pointB
                    && this._comparePointLevels(levelChanger, pointA)
                    && this._comparePointLevels(levelChanger, pointB)
            });

            // Calculate best estimation for direct level change
            let bestDistance = Infinity;
            directLevelChangerList.forEach(levelChanger => {
                let distance = this._distance(pointA, levelChanger) + this._distance(levelChanger, pointB) + 10;
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
        if (pointB.properties.level !== pointA.properties.level) levelChangePenalty = 10;
        return turf.distance(pointA, pointB, {units:'meters'}) + levelChangePenalty;
    }

    /**
     *
     * @private
     */
    _getFixEndPoint(endPoint, startPointLevel) {
        // LC
        if (endPoint.properties.fixedPointMap !== undefined) {
            let nearestLevel = undefined;
            endPoint.properties.fixedPointMap.keys().forEach(level => {
                if (nearestLevel === undefined || Math.abs(nearestLevel - startPointLevel) > Math.abs(level - startPointLevel)) {
                    nearestLevel = level;
                }
            });
            endPoint = this._copyPoint(endPoint);
            endPoint.properties.level = nearestLevel;
        }
        return this._getFixPointInArea(endPoint);
    }

    _getFixPointInArea(point) {
        let floorData = this.floorData.get(point.properties.level);

        // If point is located without accessible area, do nothing
        let areaList  = floorData.areas;
        for (let index in areaList) {
            let polygon = areaList[index];
            if (turf.booleanContains(polygon, point)) {
                return point;
            }
        }

        // Find nearest wall to stick to
        let bestWall = null;
        let bestWallDistance = Infinity;
        floorData.wallFeatures.forEach(wall => {
            let distance = turf.pointToLineDistance(point.geometry.coordinates, wall, {units: 'meters'});
            if (distance < bestWallDistance) {
                bestWall = wall;
                bestWallDistance = distance;
            }
        });

        let levelCorridorFeatures = this.corridorLineFeatures.filter(corridorLine => corridorLine.properties.level === point.properties.level);
        let bestCorridorIndex = null;
        let bestCorridorDistance = Infinity;
        levelCorridorFeatures.forEach(corridor => {
            let corridorIndex = this.corridorLineFeatures.indexOf(corridor);
            let corridorDistance = turf.pointToLineDistance(point.geometry.coordinates, corridor, {units: 'meters'});
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
            if (bestCorridorIndex !== undefined && bestCorridorDistance < bestWallDistance) {

                // Create fixed point on line itself
                let line = this.corridorLineFeatures[bestCorridorIndex];
                fixedPoint = turf.nearestPointOnLine(line, point);

                // Mark this fixed point is on corridor, preset neighbours
                fixedPoint.properties.onCorridor = true;
                fixedPoint.properties.corridorIndex = bestCorridorIndex;
                if (!fixedPoint.properties.neighbours) {
                    fixedPoint.properties.neighbours = [];
                }
                if (this.corridorLineFeatures[bestCorridorIndex].properties.bidirectional != false) {
                    fixedPoint.properties.neighbours.push(this.corridorLinePointPairs[bestCorridorIndex][0], this.corridorLinePointPairs[bestCorridorIndex][1]);
                    fixedPoint.properties.neighbours.push(...line.properties.intersectionPointList);
                    fixedPoint.properties.neighboursLeadingTo = [
                        this.corridorLinePointPairs[bestCorridorIndex][0],
                        this.corridorLinePointPairs[bestCorridorIndex][1],
                        ...line.properties.intersectionPointList
                    ];
                } else if (this.corridorLineFeatures[bestCorridorIndex].properties.swapDirection != true) {
                    fixedPoint.properties.neighbours.push(this.corridorLinePointPairs[bestCorridorIndex][0]);
                    // include only intersection points after this point
                    let distance = this._distance(fixedPoint, this.corridorLinePointPairs[bestCorridorIndex][0]);
                    let pointsBefore = line.properties.intersectionPointList.filter(point => this._distance(point, this.corridorLinePointPairs[bestCorridorIndex][0]) < distance);
                    let pointsAfter = line.properties.intersectionPointList.filter(point => this._distance(point, this.corridorLinePointPairs[bestCorridorIndex][0]) >= distance);
                    fixedPoint.properties.neighbours.push(...pointsAfter);
                    fixedPoint.properties.neighboursLeadingTo = pointsBefore;
                } else {
                    fixedPoint.properties.neighbours.push(this.corridorLinePointPairs[bestCorridorIndex][1]);
                    // include only intersection points before this point
                    let distance = this._distance(fixedPoint, this.corridorLinePointPairs[bestCorridorIndex][0]);
                    let pointsBefore = line.properties.intersectionPointList.filter(point => this._distance(point, this.corridorLinePointPairs[bestCorridorIndex][0]) <= distance);
                    let pointsAfter = line.properties.intersectionPointList.filter(point => this._distance(point, this.corridorLinePointPairs[bestCorridorIndex][0]) > distance);
                    fixedPoint.properties.neighbours.push(...pointsBefore);
                    fixedPoint.properties.neighboursLeadingTo = pointsAfter;
                }

                // Wall is closer
            } else if (bestWall !== null) {

                // Create fixed point inside area
                let nearestPoint = turf.nearestPointOnLine(bestWall, point);
                let bearing = turf.bearing(point, nearestPoint);
                fixedPoint =  turf.destination(point.geometry.coordinates, bestWallDistance + 0.05, bearing, {units: 'meters'});
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
        let point = turf.point([pointFeature.geometry.coordinates[0], pointFeature.geometry.coordinates[1]]);
        if (pointFeature.id !== undefined) point.id = pointFeature.id;
        if (pointFeature.properties.id !== undefined) point.properties.id = pointFeature.properties.id;
        if (pointFeature.properties.amenity !== undefined) point.properties.amenity = pointFeature.properties.amenity;
        if (pointFeature.properties.type !== undefined) point.properties.type = pointFeature.properties.type;
        return point;
    }

    _setNeighbourhoodBasedOnCorridorDirectionality(segmentFeature, segmentPointA, segmentPointB, intersectionPoint) {
        if (intersectionPoint.properties.neighbours === undefined) {
            intersectionPoint.properties.neighbours = [];
        }
        if (segmentFeature.properties.bidirectional != false) {
            intersectionPoint.properties.neighbours.push(segmentPointA, segmentPointB);
            segmentPointA.properties.neighbours.push(intersectionPoint);
            segmentPointB.properties.neighbours.push(intersectionPoint);
        } else if (segmentFeature.properties.swapDirection === false) {
            segmentPointA.properties.neighbours.push(intersectionPoint);
            intersectionPoint.properties.neighbours.push(segmentPointB);
        } else {
            segmentPointB.properties.neighbours.push(intersectionPoint);
            intersectionPoint.properties.neighbours.push(segmentPointA);
        }
    }

    _comparePointsByDistanceFromReference(reference, intersectionA, intersectionB) {
        let dA = turf.distance(reference, intersectionA);
        let dB = turf.distance(reference, intersectionB);
        if (dA > dB) return 1;
        if (dB > dA) return -1;
        return 0;
    }
}

export default Wayfinding;
