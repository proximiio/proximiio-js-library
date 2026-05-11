import{featureCollection as TurfFeatureCollection,point as TurfPoint,lineString as TurfLineString}from"@turf/helpers";import{default as TurfFlatten}from"@turf/flatten";import{polygonToLine as TurfPolygonToLine}from"@turf/polygon-to-line";import{default as TurfBooleanContains}from"@turf/boolean-contains";import{default as TurfDestination}from"@turf/destination";import{default as TurfLineIntersect}from"@turf/line-intersect";import{default as TurfBearing}from"@turf/bearing";import{default as TurfMidpoint}from"@turf/midpoint";import{default as TurfPointToLineDistance}from"@turf/point-to-line-distance";import{default as TurfDistance}from"@turf/distance";import{default as TurfNearestPointOnLine}from"@turf/nearest-point-on-line";const turf={lineIntersect:TurfLineIntersect,pointToLineDistance:TurfPointToLineDistance,nearestPointOnLine:TurfNearestPointOnLine,polygonToLine:TurfPolygonToLine,flatten:TurfFlatten,booleanContains:TurfBooleanContains,featureCollection:TurfFeatureCollection,point:TurfPoint,lineString:TurfLineString,destination:TurfDestination,bearing:TurfBearing,midpoint:TurfMidpoint,distance:TurfDistance},wayfindingLogger=new Proxy({},{get:()=>()=>{}});// wayfindingLogger removed in the port — replaced with a no-op proxy so existing
// call sites compile but emit nothing.
export class Wayfinding{/**
   *
   * @param featureCollection {FeatureCollection}
   */constructor(e){let r,o,i=e.features;if(i.forEach(e=>{let i=e.properties.level;(void 0===r||i<r)&&(r=i),(void 0===o||o<i)&&(o=i),void 0!==e.properties.levels&&e.properties.levels.forEach(e=>{(void 0===r||e<r)&&(r=e),(void 0===o||o<e)&&(o=e)})}),void 0===r)throw"No feature with level was supplied!";let t=i.filter(e=>e.properties.routable&&("MultiPolygon"===e.geometry.type||"Polygon"===e.geometry.type)),s=new Map;for(let i,n=r;n<=o;n++)i=t.find(e=>e.properties.level===n),s.set(n,turf.featureCollection(void 0===i?[]:[i]));// Extract corridors, level changers, accessibility POIs
let n=i.filter(e=>"path"===e.properties.class),p=i.filter(e=>"elevator"===e.properties.type||"escalator"===e.properties.type||"staircase"===e.properties.type),a=["door","ticket_gate"],l=i.filter(e=>a.includes(e.properties.type));// LevelChangers: Create level array from legacy min/max values
p.forEach(e=>{if(void 0===e.properties.levels&&void 0!==e.properties.level_min&&void 0!==e.properties.level_max){e.properties.levels=[];for(let r=e.properties.level_min;r<=e.properties.level_max;r++)e.properties.levels.push(r)}}),this._legacyConstructor(s,p,n,l)}/**
   * TODO: replace this
   * @param floorGeojsonMap {Map}
   * @param levelChangers {Feature<Point>[]}
   * @param corridors  {Feature<LineString>[]}
   * @param accessibilityPoiList  {Feature<Point>[]}
   */_legacyConstructor(e,r,o,i){//m
this.wallOffsetDistance=.5,this.floorList=e,this.levelChangerList=r,this.accessibilityPoi=i,this.corridors=[...o.filter(e=>"LineString"===e.geometry.type)//            ,
//            ...corridors.filter(it => it.geometry.type === 'MultiLineString').map(it => turf.flatten(it).features).flat()
],this.rebuildData(),this.configuration={avoidElevators:!1,avoidEscalators:!1,avoidStaircases:!1,avoidRamps:!1,avoidNarrowPaths:!1,avoidRevolvingDoors:!1,avoidTicketGates:!1,avoidBarriers:!1},this.POI_TYPE={ELEVATOR:"elevator",ESCALATOR:"escalator",STAIRCASE:"staircase",RAMP:"ramp",NARROW_PATH:"narrow_path",REVOLVING_DOOR:"door",TICKET_GATE:"ticket_gate",BARRIER:"barrier"},this._pathFixDistance=1}/**
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
   */setConfiguration(e,r=1){Object.keys(e).forEach(r=>{Object.prototype.hasOwnProperty.call(this.configuration,r)&&(this.configuration[r]=e[r])}),this._pathFixDistance=r}rebuildData(){let e=new Map;this.floorList.forEach((r,o)=>{let i=[],t=[],s=[];// Floor features == "walkable areas"
r.features.forEach(e=>{let r=turf.flatten(turf.polygonToLine(e)).features.map(e=>e.geometry);// Floor wall lines, we wish to split to individual walls
r.forEach(e=>{let r,s;// Last point is the same as first, therefore limit index to exclude last point
for(let n=0;n<e.coordinates.length-1;n++){let p;0==n?(r=turf.point(e.coordinates[n]),r.properties.level=o,r.properties.neighbours=[],p=r):p=s,n==e.coordinates.length-2?s=r:(s=turf.point(e.coordinates[n+1]),s.properties.level=o,s.properties.neighbours=[]),p.properties.neighbours.push(s),s.properties.neighbours.push(p),i.push(p),t.push([p,s])}}),s=s.concat(turf.flatten(e).features)}),e.set(o,{areas:s,points:i,walls:t,wallFeatures:t.map(e=>turf.lineString([e[0].geometry.coordinates,e[1].geometry.coordinates]))})}),this.bearingCache=new Map,this.floorData=e,this.floorData.forEach((e,r)=>{// List of physical POIs on this level that are within area
let o=this.accessibilityPoi.filter(e=>r===e.properties.level).filter(r=>0<e.areas.filter(e=>turf.booleanContains(e,r)).length);o.forEach(o=>{// Generate points around POI to allow going around, but only if they are "within area
let i=[turf.destination(o.geometry.coordinates,o.properties.radius+this.wallOffsetDistance,0,{units:"meters"}),turf.destination(o.geometry.coordinates,o.properties.radius+this.wallOffsetDistance,60,{units:"meters"}),turf.destination(o.geometry.coordinates,o.properties.radius+this.wallOffsetDistance,120,{units:"meters"}),turf.destination(o.geometry.coordinates,o.properties.radius+this.wallOffsetDistance,180,{units:"meters"}),turf.destination(o.geometry.coordinates,o.properties.radius+this.wallOffsetDistance,-120,{units:"meters"}),turf.destination(o.geometry.coordinates,o.properties.radius+this.wallOffsetDistance,-60,{units:"meters"})].filter(r=>0<e.areas.filter(e=>turf.booleanContains(e,r)).length);i.forEach(e=>{e.properties.level=r,e.properties.isDetourPoint=!0}),e.points=e.points.concat(i),this.detourPointList=i})});// Split lines into single line segments
let r=[],o=[];this.corridors.forEach(e=>{let t=e.geometry.coordinates,s=null;for(let n=0;n<t.length-1;n++){let i;null==s?(i=turf.point(t[n]),i.properties.neighbours=[],i.properties.level=e.properties.level):i=s;let p=turf.point(t[n+1]);p.properties.level=e.properties.level,p.properties.neighbours=[],(!1!=e.properties.bidirectional||!1!=e.properties.swapDirection)&&i.properties.neighbours.push(p),(!1!=e.properties.bidirectional||!0==e.properties.swapDirection)&&p.properties.neighbours.push(i);let a=turf.lineString([i.geometry.coordinates,p.geometry.coordinates]);// Mark lineFeature accordingly
a.properties.level=e.properties.level,a.properties.bidirectional=e.properties.bidirectional,a.properties.swapDirection=e.properties.swapDirection,e.properties.narrowPath&&(i.properties.narrowPath=!0,p.properties.narrowPath=!0,a.properties.narrowPath=!0),e.properties.ramp&&(i.properties.ramp=!0,p.properties.ramp=!0,a.properties.ramp=!0),r.push([i,p]),o.push(a),s=p}});let t=[],s=new Map,n=0;// Split individual segments when intersecting
for(n=0;n<r.length;){// for (let i = 0; i < corridorLinePointPairs.length - 1; i++) {
let e=r[n],i=o[n];// let segmentIntersectionList = [];
s.has(n)||s.set(n,[]);for(let p=n+1;p<r.length;p++){s.has(p)||s.set(p,[]);let a=r[p];if(i.properties.level!==o[p].properties.level)continue;// Consecutive segments, should not cross (rather, they cross at the end point)
if(a.includes(e[0])||a.includes(e[1]))continue;let l=o[p],d=turf.lineIntersect(i,l).features;if(0<d.length){let r=d[0];// this._setNeighbourhoodBasedOnCorridorDirectionality(corridorLineFeatures[i], segment[0], segment[1], intersectingPoint);
r.properties.level=e[0].properties.level,r.properties.isCorridorPoint=!0,(i.properties.narrowPath||l.properties.narrowPath)&&(r.properties.narrowPath=!0),(i.properties.ramp||l.properties.ramp)&&(r.properties.ramp=!0),s.get(n).push(r),s.get(p).push(r),t.push(r)}}n++}for(n=0;n<r.length;){// for (let i = 0; i < corridorLinePointPairs.length; i++) {
let e=r[n],i=o[n],t=e[0],p=e[1],a=s.get(n);a.sort((e,r)=>this._comparePointsByDistanceFromReference(t,e,r)),a?(a.forEach(e=>{if(this._setNeighbourhoodBasedOnCorridorDirectionality(i,t,p,e),!1!=i.properties.bidirectional)e.properties.neighbours=e.properties.neighbours.concat(a.filter(r=>r!==e));else if(!0!=i.properties.swapDirection){let r=a.slice(a.indexOf(e));e.properties.neighbours.push(...r)}else{let r=a.slice(0,a.indexOf(e));e.properties.neighbours.push(...r)}}),o[n].properties.intersectionPointList=a):o[n].properties.intersectionPointList=[],n++}let p=[];// Split corridor lines on interesections wilth walls
for(n=0;n<r.length;){let e=r[n],i=o[n],t=[],s=this.floorData.get(e[0].properties.level).walls,a=this.floorData.get(e[0].properties.level).wallFeatures;if(a.forEach((r,o)=>{let s=turf.lineIntersect(i,r).features;if(0<s.length){let r=s[0];r.properties.level=e[0].properties.level,r.properties.neighbours=[],r.properties.bordersArea=!0,i.properties.narrowPath&&(r.properties.narrowPath=!0),i.properties.ramp&&(r.properties.ramp=!0);let n=this._distance(e[0],r);t.push({point:r,distance:n,wallIndex:o})}}),0<t.length){t.sort((e,r)=>e.distance-r.distance);// Inject parts of segments split by intersections
let r=e[0];t.forEach(e=>{// Inject split segments of currently processed segment
let i=turf.lineString([r.geometry.coordinates,e.point.geometry.coordinates]);i.properties.level=r.properties.level,r.properties.neighbours.push(e.point),s[e.wallIndex][0].properties.neighbours.push(e.point),s[e.wallIndex][1].properties.neighbours.push(e.point),e.point.properties.neighbours.push(r,s[e.wallIndex][0],s[e.wallIndex][1]),e.point.properties.neighbours.push(...o[n].properties.intersectionPointList),o[n].properties.intersectionPointList.forEach(r=>r.properties.neighbours.push(e.point)),r=e.point,o[n].properties.intersectionPointList.push(e.point)});// Inject from last intersection to end of original segment
let i=turf.lineString([r.geometry.coordinates,e[1].geometry.coordinates]);i.properties.level=r.properties.level,e[1].properties.neighbours.push(r),r.properties.neighbours.push(e[1]),p.push(...t.map(e=>e.point))}n++}p.forEach(e=>{this.floorData.get(e.properties.level).points.push(e)}),p.forEach(e=>{let r=this._findNeighbours(e,null,null,this.floorData.get(e.properties.level).points);e.properties.neighbours.push(...r)}),this.corridorLinePointPairs=r,this.corridorLineFeatures=o,this.corridorLinePoints=[],this.corridorLinePointPairs.forEach(e=>{e[0].properties.isCorridorPoint=!0,e[1].properties.isCorridorPoint=!0,this.corridorLinePoints.includes(e[0])||this.corridorLinePoints.push(e[0]),this.corridorLinePoints.includes(e[1])||this.corridorLinePoints.push(e[1])}),this.corridorLinePoints=this.corridorLinePoints.concat(t);let a=new Map;this.levelChangerList.forEach(e=>{// Create level changer groups
if(e.properties.group!==void 0){// Get group array, initiate if neccessary
let r=e.properties.group;a.has(r)||a.set(r,[]);let o=a.get(r);// Add lc to group map
o.push(e)}e.properties.fixedPointMap=new Map,(e.properties.levels||[]).forEach(r=>{let o=this._copyPoint(e);o.properties.level=r;let i=this._getFixPointInArea(o);// Do not fix level changers that are further than 5 meters from any path or area
5<this._distance(o,i)||(i===o?(i=this._copyPoint(e),i.properties.level=r,e.properties.fixedPointMap.set(r,i)):(e.properties.fixedPointMap.set(r,i),i.properties.onCorridor&&(i.properties.neighbours=[...this.corridorLinePointPairs[i.properties.corridorIndex],...s.get(i.properties.corridorIndex)],i.properties.neighbours.forEach(o=>{o.properties.levels!==void 0&&(o=o.properties.fixedPointMap.get(r)),o.properties.neighbours===void 0&&(o.properties.neighbours=[]),o.properties.neighbours.push(e)}),this.corridorLineFeatures[i.properties.corridorIndex].properties.intersectionPointList.push(e))))})}),a.forEach(e=>{e.forEach(r=>{r.properties.fixedPointMap.forEach(o=>{o.properties.neighbours.push(...e.filter(e=>e!==r))})})})}_removeItemFromList(e,r){let o=e.indexOf(r);0<=o&&e.splice(o,1)}load(e,r){this.neighbourMap=e,this.rebuildData(),this.wallOffsets=r,this.wallOffsetLineList=[],this._getPointList().forEach((e,r)=>{let o=this.wallOffsets[r];if(o){// console.log(point);
let r=turf.lineString([e.geometry.coordinates,o.geometry.coordinates]);r.properties.level=e.properties.level,this.wallOffsetLineList.push(r)}})}/**
   * @param point {Feature<Point>}
   * @param level {Number}
   * @private true
   */_isPointOnLevel(e,r){return void 0===e.properties.fixedPointMap?e.properties.level===r:e.properties.fixedPointMap.has(r)}_getPointList(){let e=[];return this.floorData.forEach(r=>{e=e.concat(r.points)}),e=e.concat(this.levelChangerList),e=e.concat(this.corridorLinePoints),e}/**
   *
   * @returns {{neighbourhood: Object, wallOffsets: Object}}
   */preprocess(){return{neighbourhood:this._generateNeighbourhoodMap(),wallOffsets:this._generateWallOffsets()}}_generateNeighbourhoodMap(){// this.nbLines = [];
let e=this._getPointList(),r={};// NeighbourMap for polygon points
return this.floorData.forEach((o,i)=>{let t={},s=o.points.concat(this.levelChangerList.filter(e=>this._isPointOnLevel(e,i)));s.forEach(r=>{let o=e.indexOf(r),n=this._unwrapLevelChangerPoint(r,i),p=n===r?null:n,a=this._findNeighbours(n,p,null,s);// Get unwrapped point if case the point is a level changer, so we can properly test neighbourhood
// Simulate startPoint to force lowering number of intersections allowed.
// Unwrapped point is inside accessible area, thus there should be only one intersection, wall point itself.
t[o]=a.map(r=>e.indexOf(r))}),r[i]=t}),this.corridorLinePoints.forEach(o=>{let i,t=e.indexOf(o),s=o.properties.level,n=r[s];// Find neighbours in polygon only for points crossing polygon
if(o.properties.bordersArea){let r=this.floorData.get(s).points.concat(this.levelChangerList.filter(e=>this._isPointOnLevel(e,s))).concat(this.corridorLinePoints.filter(e=>e.properties.bordersArea&&this._isPointOnLevel(e,s)));i=this._findNeighbours(o,o,null,r),i.forEach(r=>{let o=e.indexOf(r);void 0===n[o]&&(n[o]=[]),n[o].includes(t)||n[o].push(t)})}else i=o.properties.neighbours;// Store relationship for corridor point
void 0===n[t]?n[t]=i.map(r=>e.indexOf(r)):i.forEach(r=>n[t].push(e.indexOf(r)))}),this.neighbourMap=r,r}_generateWallOffsets(){this.wallOffsetLineList=[],this.wallOffsets={};let e=this._getPointList();//        console.log('wallOffsets:');
//        console.log(JSON.stringify(this.wallOffsets));
return e.forEach(r=>{// Do no process level changers
if(null==r.properties.level)return;// a) Find walls where the point P is used and the other points in walls: A, B
let o=this.floorData.get(r.properties.level).walls.filter(e=>e.includes(r));if(0===o.length)return;let i=o[0][0]===r?o[0][1]:o[0][0],t=o[1][0]===r?o[1][1]:o[1][0],s=turf.bearing(r,i),n=turf.bearing(r,t),p=this._averageBearing(s,n),a=0<p?p-180:p+180,l=turf.destination(r.geometry.coordinates,.01,p,{units:"meters"}),d=turf.destination(r.geometry.coordinates,.01,a,{units:"meters"}),c=null;// b) Get average bearing to points A,B
// this.wallOffsetLineList.push(turf.lineString([point.geometry.coordinates, offsetPoint.geometry.coordinates]));
// c) Generate two points M,N very close to point P
// d) Test which point is contained within accessible area
for(let e in this.floorData.get(r.properties.level).areas){let o=this.floorData.get(r.properties.level).areas[e];if(turf.booleanContains(o,l)){c=l;break}else if(turf.booleanContains(o,d)){c=d;break}}// Stop if either of points is not contained...
if(null==c)return;// e) Generate point F at double the distance of wall offset
let g=turf.destination(r.geometry.coordinates,2*this.wallOffsetDistance,c===l?p:a,{units:"meters"}),u=turf.lineString([r.geometry.coordinates,g.geometry.coordinates]);// f) Test if PF intersects with any wall, update point F and PF to shortest available size
this.floorData.get(r.properties.level).walls.forEach((e,i)=>{// Do not test walls containing point P, they will intersect of course
if(o.includes(e))return;let t=this.floorData.get(r.properties.level).wallFeatures[i],s=turf.lineIntersect(u,t);// Find intersection point, use it to produce new
0<s.features.length&&(g=turf.point(s.features[0].geometry.coordinates),u=turf.lineString([r.geometry.coordinates,g.geometry.coordinates]))});// g) Create wall offset point as midpoint between points P,F
let f=turf.midpoint(r.geometry.coordinates,g.geometry.coordinates);f.properties.level=r.properties.level,this.wallOffsets[e.indexOf(r)]=f;let h=turf.lineString([r.geometry.coordinates,f.geometry.coordinates]);h.properties.level=r.properties.level,this.wallOffsetLineList.push(h)}),this.wallOffsets}/**
   * @param current {Feature<Point>}
   * @return {[Feature<Point>]}
   */reconstructPath(e){var r=Math.abs,o=Number.MAX_VALUE;let i=[],t=e;do if(this.levelChangerList.includes(e)){// Fix on previous level
let s=this._unwrapLevelChangerPoint(e,t.properties.level);s!==e&&(s=this._copyPoint(s),s.properties.level=t.properties.level,null!=e.id&&(s.id=e.id),null!=e.properties.id&&(s.properties.id=e.properties.id),null!=e.properties.amenity&&(s.properties.amenity=e.properties.amenity),null!=e.properties.type&&(s.properties.type=e.properties.type),i.push(s));//                // Point on previous level
//                let prevFloorPoint = this._copyPoint(current);
//                prevFloorPoint.properties.level = previous.properties.level;
//                path.push(prevFloorPoint);
//
//                // Point on next level
//                let nextFloorPoint = this._copyPoint(current);
//                nextFloorPoint.properties.level = current.properties.cameFrom.properties.level;
//                path.push(nextFloorPoint);
// Fix on next level
let n;if(null!=e.properties.cameFrom.properties.levels){let i=o;e.properties.fixedPointMap.forEach((o,s)=>{if(o.properties.neighbours.includes(e.properties.cameFrom)){let e=r(t.properties.level-s);e<i&&(i=e,n=s)}})}else n=e.properties.cameFrom.properties.level;let p=this._unwrapLevelChangerPoint(e,n);p!==e&&(p=this._copyPoint(p),p.properties.level=n,null!=e.id&&(p.id=e.id),null!=e.properties.id&&(p.properties.id=e.properties.id),null!=e.properties.amenity&&(p.properties.amenity=e.properties.amenity),null!=e.properties.type&&(p.properties.type=e.properties.type),i.push(p)),e=e.properties.cameFrom,t=p}else{let r=this._calculateWallOffsetPointList(e,0<i.length?i[i.length-1]:t);r.forEach(r=>{if(t===e||t.geometry.coordinates[0]!==r.geometry.coordinates[0]||t.geometry.coordinates[1]!==r.geometry.coordinates[1]){let o=this._copyPoint(r);o.properties.level=e.properties.level,i.push(o),t=r}}),e=e.properties.cameFrom}while(null!=e);// let pathCoordinates = path.map(point => point.geometry.coordinates);
return i.reverse(),i}_calculateWallOffsetPointList(e,r){let o=this._getPointList(),i=o.indexOf(e),t=o.indexOf(r),s=[],n=e;// a) offset current point
0<=i&&this.wallOffsets[i]&&(n=this.wallOffsets[i]),s.push(n);let p;do{let o=turf.lineString([r.geometry.coordinates,n.geometry.coordinates]);p=[],this.wallOffsetLineList.forEach((r,s)=>{// Do not process wall offsets from another floor
if(r.properties.level===e.properties.level&&s!==t&&s!==i)// Do not process wall offsets with previous or current point
{let e=turf.lineIntersect(o,r);if(0<e.features.length){let r=this.wallOffsets[s];// store distance to previousPoint
r.properties.distance=this._distance(e.features[0],n),r.properties.offsetIndex=s,p.push(r)}}}),0<p.length&&(p.sort((e,r)=>e.properties.distance-r.properties.distance),n=p[0],i=n.properties.offsetIndex,s.push(n))}while(0<p.length);return s.reverse()}_getIntersectingOffsetPoints(e,r){if(e===r||e.properties.level!==r.properties.level)return[];let o=turf.lineString([e.geometry.coordinates,r.geometry.coordinates]),i=[];//        console.log(intersectingWallOffsetPoints);
return this.wallOffsetLineList.forEach((r,t)=>{if(r.properties.level===e.properties.level&&0<turf.lineIntersect(o,r).features.length){let o=this.wallOffsets[t];o.properties.distance=turf.pointToLineDistance(e.geometry.coordinates,r,{units:"meters"}),i.push(o)}}),i.sort((e,r)=>r.properties.distance-r.properties.distance),i}clearData(){this.floorData.forEach(e=>{for(let r in e.points){let o=e.points[r];delete o.properties.cameFrom,delete o.properties.gscore,delete o.properties.fscore,delete o.properties.neighbours}}),this.levelChangerList.forEach(e=>{delete e.properties.cameFrom,delete e.properties.gscore,delete e.properties.fscore,delete e.properties.neighbours}),this.corridorLinePoints.forEach(e=>{delete e.properties.cameFrom,delete e.properties.gscore,delete e.properties.fscore,delete e.properties.neighbours})}/**
   *
   * @param startPoint {Feature<Point>}
   * @param endPoint {Feature<Point>}
   * @return {[Feature<Point>]}
   * @private
   */runAStar(e,r){this.clearData(),this.nbLines=[],this.bearingCache=new Map;const o=`route_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;wayfindingLogger.startRoute(o),wayfindingLogger.info("route-start","Route request received",{start:{coordinates:e.geometry.coordinates,level:e.properties.level,id:e.id||e.properties.id},end:{coordinates:r.geometry.coordinates,level:r.properties.level,id:r.id||r.properties.id},configuration:this.configuration,pathFixDistance:this._pathFixDistance});let i=this._getFixPointInArea(e),t=this._getFixEndPoint(r,e.properties.level);const s=i!==e,n=t!==r;wayfindingLogger.logPointFix("start",{coordinates:e.geometry.coordinates,level:e.properties.level},s?{coordinates:i.geometry.coordinates,level:i.properties.level}:null,s?i.properties.onCorridor?"snapped to corridor":"snapped to area":"already valid"),wayfindingLogger.logPointFix("end",{coordinates:r.geometry.coordinates,level:r.properties.level},n?{coordinates:t.geometry.coordinates,level:t.properties.level}:null,n?t.properties.onCorridor?"snapped to corridor":"snapped to area":"already valid");let p=[i],a=[];i.properties.gscore=0,i.properties.fscore=this._heuristic(i,t);let l=0;const d=5e4,c=100;for(;0<p.length;){if(l++,l>d)return wayfindingLogger.logAStarFailure("Max iterations exceeded",{maxIterations:d,openSetSize:p.length,closedSetSize:a.length,lastCurrentPoint:p[0]?{coordinates:p[0].geometry.coordinates,level:p[0].properties.level,fscore:p[0].properties.fscore}:null}),void wayfindingLogger.endRoute(!1);0==l%c&&wayfindingLogger.logAStarIteration(l,p.length,a.length,p[0]?{coordinates:p[0].geometry.coordinates,level:p[0].properties.level,fscore:p[0].properties.fscore||0}:null);let o=this._getMinFScore(p);if(null===o){wayfindingLogger.logAStarFailure("Unable to find best point - openSet exhausted",{iteration:l,openSetSize:p.length,closedSetSize:a.length}),wayfindingLogger.endRoute(!1);break}if(o===t){wayfindingLogger.info("astar-success","Route found!",{iterations:l,closedSetSize:a.length,startLevel:e.properties.level,endLevel:r.properties.level,directDistance:this._distance(e,r)});let s=this.reconstructPath(o);t!==r&&(!t.properties.onCorridor||this._distance(t,r)>this._pathFixDistance)&&s.push(r),i!==e&&(!i.properties.onCorridor||this._distance(i,e)>this._pathFixDistance)&&s.unshift(e);const n=[...new Set(s.map(e=>e.properties.level))];return wayfindingLogger.logPathReconstruction(s.length,n),wayfindingLogger.endRoute(!0,s.length),s}a.push(p.splice(p.indexOf(o),1));let s=this._getNeighbours(o,i,t);for(let e in 0===s.length&&0==l%c&&wayfindingLogger.warn("neighbours","No neighbours found for current point",{iteration:l,currentCoords:o.geometry.coordinates,currentLevel:o.properties.level,isCorridorPoint:o.properties.isCorridorPoint,onCorridor:o.properties.onCorridor,bordersArea:o.properties.bordersArea}),s.forEach(e=>this.nbLines.push(turf.lineString([o.geometry.coordinates,e.geometry.coordinates]))),s){let r=s[e];if(-1<a.indexOf(r))continue;let i=o.properties.gscore+this._distance(o,r),n=null==r.properties.gscore?1/0:r.properties.gscore;i<n&&(r.properties.cameFrom=o,r.properties.gscore=i,r.properties.fscore=i+this._heuristic(r,t),0>p.indexOf(r)&&p.push(r))}}return wayfindingLogger.logAStarFailure("Open set is empty - no path exists",{iterations:l,closedSetSize:a.length,startFixed:i!==e,endFixed:t!==r,startLevel:e.properties.level,endLevel:r.properties.level,startCoords:e.geometry.coordinates,endCoords:r.geometry.coordinates,fixedStartCoords:i.geometry.coordinates,fixedEndCoords:t.geometry.coordinates,possibleCauses:["Start and end points are on disconnected floors","No walkable area (routable polygons) connected to start/end","No paths (corridors) drawn between areas","Level changers missing for multi-floor routes","Accessibility filters blocking all routes"]}),void wayfindingLogger.endRoute(!1)}/**
   *
   * @param point {Feature<Point>}
   * @param startPoint {Feature<Point>}
   * @param endPoint {Feature<Point>}
   * @return {Point[]}
   * @private
   */_getNeighbours(e,r,o){let i=[];if(e===r){let t=this._getPointList().filter(r=>this._isPointOnLevel(r,e.properties.level));i=this._findNeighbours(e,r,o,t),i=i.filter(r=>{//                if (neighbourPoint === endPoint) {
//                    console.log('testing endPoint');
//                }
let o=e.properties.level,i=this.configuration.avoidRevolvingDoors&&this._testAccessibilityPoiNeighbourhood(e,r,o,this.POI_TYPE.REVOLVING_DOOR),t=this.configuration.avoidTicketGates&&this._testAccessibilityPoiNeighbourhood(e,r,o,this.POI_TYPE.TICKET_GATE);return!i&&!t})}else{// Gather neighbours over all levels
let r=this._getPointList(),t=r.indexOf(e);// Test if endpoint is neighbour
if(this.floorData.forEach((o,s)=>{let n=this.neighbourMap[s];Object.prototype.hasOwnProperty.call(n,t)&&n[t].forEach(o=>{let t=r[o],n=this.configuration.avoidRevolvingDoors&&this._testAccessibilityPoiNeighbourhood(e,t,s,this.POI_TYPE.REVOLVING_DOOR),p=this.configuration.avoidTicketGates&&this._testAccessibilityPoiNeighbourhood(e,t,s,this.POI_TYPE.TICKET_GATE);i.includes(t)||n||p||i.push(t)})}),void 0!==e.properties.level&&e.properties.level===o.properties.level||null!=e.properties.fixedPointMap&&e.properties.fixedPointMap.has(o.properties.level)){let r=this.configuration.avoidRevolvingDoors&&this._testAccessibilityPoiNeighbourhood(e,o,o.properties.level,this.POI_TYPE.REVOLVING_DOOR),t=this.configuration.avoidTicketGates&&this._testAccessibilityPoiNeighbourhood(e,o,o.properties.level,this.POI_TYPE.TICKET_GATE);if(!r&&!t)// Endpoint is fixed on corridor
if(o.properties.onCorridor)o.properties.neighbours.includes(e)?!1!=this.corridorLineFeatures[o.properties.corridorIndex].properties.bidirectional&&i.push(o):void 0!==o.properties.neighboursLeadingTo&&o.properties.neighboursLeadingTo.includes(e)&&i.push(o);else{let r=this._unwrapLevelChangerPoint(e,o.properties.level),t=1;(r.properties.isCorridorPoint||r.properties.onCorridor)&&t--,this._countIntersections(r,o,t)&&i.push(o)}}}const t=i.length,s=i.filter(e=>!(this.configuration.avoidElevators&&e.properties.type===this.POI_TYPE.ELEVATOR)&&!(this.configuration.avoidEscalators&&e.properties.type===this.POI_TYPE.ESCALATOR)&&!(this.configuration.avoidStaircases&&e.properties.type===this.POI_TYPE.STAIRCASE)&&!(this.configuration.avoidNarrowPaths&&e.properties.narrowPath)&&!(this.configuration.avoidRamps&&e.properties.ramp)),n=t-s.length;return 0<n&&wayfindingLogger.debug("neighbour-filter","Neighbours filtered by accessibility config",{pointLevel:e.properties.level,pointCoords:e.geometry.coordinates,beforeFilter:t,afterFilter:s.length,filteredOut:n,activeFilters:{avoidElevators:this.configuration.avoidElevators,avoidEscalators:this.configuration.avoidEscalators,avoidStaircases:this.configuration.avoidStaircases,avoidNarrowPaths:this.configuration.avoidNarrowPaths,avoidRamps:this.configuration.avoidRamps}}),s}/**
   *
   * @param pointA {Feature<Point>}
   * @param pointB {Feature<Point>}
   * @param level {Number}
   * @param accesibilityType {String}
   * @returns {boolean}
   * @private
   */_testAccessibilityPoiNeighbourhood(e,r,o,i){//        console.log('testing accesibility for ' + accesibilityType);
// Filter out lines that intersect revolving door POIs.
if(this.configuration.avoidRevolvingDoors){let t=turf.lineString([e.geometry.coordinates,r.geometry.coordinates]),s=this.accessibilityPoi.filter(e=>e.properties.level===o&&e.properties.type===i);for(let e=0;e<s.length;e++){let r=s[e],o=turf.pointToLineDistance(r.geometry.coordinates,t,{units:"meters"});//                console.log(distance);
if(o<=r.properties.radius)//                    console.log('accesibility for ' + accesibilityType + ' endend as true');
return!0}}//        console.log('accesibility for ' + accesibilityType + ' endend as false');
return!1}/**
   * @param point {Feature<Point>}
   * @param startPoint {Feature<Point>}
   * @param endPoint {Feature<Point>}
   * @param proposedPointList {[Feature<Point>]}
   * @return {[Point]}
   */_findNeighbours(e,r,o,i){let t=[];// Start point is on corridor line, use only preset neighbours on line
if(null!=e.properties.neighbours&&(t=[...e.properties.neighbours]),e===r&&e.properties.onCorridor||e.properties.isCorridorPoint&&!e.properties.bordersArea)return o&&o.properties.onCorridor&&r.properties.corridorIndex===o.properties.corridorIndex&&t.push(o),t;let s=0;o&&this._isPointOnLevel(o,e.properties.level)&&i.push(o);let n=this._unwrapLevelChangerPoint(e,e.properties.level);for(let p in i){let o=i[p];// Same point is not neighbour with itself
if(e===o)continue;// Already assigned
if(0<=t.indexOf(o))continue;let a=this._unwrapLevelChangerPoint(o,e.properties.level);s=2,e===r&&s--,o===r&&s--,e!==n&&s--,o!==a&&s--,(o.properties.isCorridorPoint||o.properties.onCorridor)&&s--;let l=this._countIntersections(e,a,s);if(l){// if (allowedIntersections >= 1) {
let r=turf.midpoint(e.geometry.coordinates,o.geometry.coordinates);for(let i in this.floorData.get(e.properties.level).areas){let s=this.floorData.get(e.properties.level).areas[i];if(turf.booleanContains(s,r)){t.push(o);break}}// } else {
//     neighbours.push(proposedPoint);
// }
}//---
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
}return t}/**
   * @param pointA {Feature<Point>}
   * @param pointB {Feature<Point>}
   * @private {Boolean} true if points are on the same level
   */_comparePointLevels(e,r){// If both points are NOT level changers
if(null==e.properties.levels&&null==r.properties.levels)return e.properties.level===r.properties.level;// At least one of points is level changer
let o=e.properties.fixedPointMap===void 0?[e.properties.level]:[...e.properties.fixedPointMap.keys()],i=r.properties.fixedPointMap===void 0?[r.properties.level]:[...r.properties.fixedPointMap.keys()];return 0<o.filter(e=>i.includes(e)).length}/**
   * @param point {Feature<Point>}
   * @param level {Number}
   * @return {Feature<Point>}
   */_unwrapLevelChangerPoint(e,r){let o=e.properties.fixedPointMap;if(o){let i=o.get(r);return i?i:e}return e}/**
   *
   * @param pointFrom {Point}
   * @param pointTo {Point}
   * @param maxIntersections {Number}
   * @return {Boolean}
   */_countIntersections(e,r,o){let i=e.geometry.coordinates,t=r.geometry.coordinates,s=this._bearing(i,t),n=0,p=[],a=this.floorData.get(e.properties.level).walls,l=this.floorData.get(e.properties.level).wallFeatures;for(let d in a){let r=a[d],c=!1,g=!1;if(e==r[0]||e==r[1])c=!0,g=!0;else{let e=this._bearing(i,r[0].geometry.coordinates),o=this._bearing(i,r[1].geometry.coordinates);if(e>o){let r=e;e=o,o=r}let t=o-e;t<Math.PI?e<=s&&s<=o&&(c=!0):(e>=s||s>=o)&&(c=!0)}if(c){if(g)this._testIdenticalPointInList(e,p)||(p.push(e),n++);else{let e=turf.lineIntersect(turf.lineString([i,t]),l[d]).features;0<e.length&&!this._testIdenticalPointInList(e[0],p)&&(p.push(e[0]),n++)}if(n>o)return!1}}return!0}/**
   *
   * @private
   */_averageBearing(e,r){if(e>r){let o=e;e=r,r=o}180<r-e&&(r-=360);let o=(r+e)/2;return-180>=o?360+o:o}// Converts from degrees to radians.
_toRadians(e){return e*Math.PI/180}_bearing(e,r){var o=Math.atan2,i=Math.sin,t=Math.cos;// let hasCache = false;
let s=this.bearingCache.get(e);if(s){let e=s.get(r);if(null!=e)return e}let n=this._toRadians(e[0]),p=this._toRadians(e[1]),a=this._toRadians(r[0]),l=this._toRadians(r[1]),d=t(l),c=i(a-n)*d,g=t(p)*i(l)-i(p)*d*t(a-n),u=o(c,g);return this._storeBearingCache(e,r,u),u}_storeBearingCache(e,r,o){var i=Math.PI;let t=this.bearingCache.get(e);t||(t=new Map,this.bearingCache.set(e,t)),t.set(r,o),t=this.bearingCache.get(r),t||(t=new Map,this.bearingCache.set(r,t)),0>=o?o+=i:o-=i,t.set(e,o)}_testIdenticalPointInList(e,r){let o=e.geometry.coordinates;for(let i in r){let e=r[i].geometry.coordinates;if(e[0]===o[0]&&e[1]===o[1])return!0}return!1}/**
   *
   * @param pointSet {[Feature<Point>]}
   * @returns {Feature<Point>}
   */_getMinFScore(e){let r=null,o=1/0;for(let i in e){let t=e[i];t.properties.fscore<o&&(r=t,o=t.properties.fscore)}return r}/**
   *
   * @param pointA {Feature<Point>}
   * @param pointB {Feature<Point>}
   * @returns {*|number|undefined}
   */_heuristic(e,r){if(this._comparePointLevels(e,r)){let o=0;return(void 0!==e.properties.levels||void 0!==r.properties.levels)&&(o=20),this._distance(e,r)+o}else{// Filter out direct level changers
let o=this.levelChangerList.filter(o=>o!==e&&o!==r&&this._comparePointLevels(o,e)&&this._comparePointLevels(o,r)),i=1/0;// Calculate best estimation for direct level change
// Return estimation if direct level change was found
return o.forEach(o=>{let t=this._distance(e,o)+this._distance(o,r)+10;t<i&&(i=t)}),i<1/0?i:2e3;// TODO we need to fix heuristic calculations
//            // Filter out levelChangers available on pointA level and not previously tested direct levelChangers
//            let levelChangerList = this.levelChangerList
//                .filter(levelChanger => directLevelChangerList.indexOf(levelChanger) < 0)
//                .filter(levelChanger => levelChanger.properties.levels.includes(pointA.properties.level))
//                .filter(levelChanger => levelChanger !== pointA);
//            bestDistance = Infinity;
//            levelChangerList.forEach(levelChanger => {
//                let levelChangerPoint = this._copyPoint(levelChanger);
//                let levelChangerDistance = this._distance(pointA, levelChangerPoint);
//                levelChanger.properties.levels.forEach(i => {
//                    levelChangerPoint.properties.level = i;
//                    let distance = this._heuristic(levelChangerPoint, pointB);
//                    if (levelChangerDistance + distance < bestDistance) {
//                        bestDistance = levelChangerDistance + distance;
//                    }
//                });
//            });
//            if (bestDistance < Infinity) {
//                return bestDistance;
//            }
}}/**
   *
   * @param pointA {Point}
   * @param pointB {Point}
   * @returns {*|number|undefined}
   */_distance(e,r){let o=0;return void 0!==r.properties.levels&&(o=10),turf.distance(e,r,{units:"meters"})+o}/**
   *
   * @private
   */_getFixEndPoint(e,r){var o=Math.abs;// LC
if(e.properties.fixedPointMap!==void 0){let i;e.properties.fixedPointMap.keys().forEach(e=>{(i===void 0||o(i-r)>o(e-r))&&(i=e)}),e=this._copyPoint(e),e.properties.level=i}return this._getFixPointInArea(e)}_getFixPointInArea(e){var r=Math.round;let o=this.floorData.get(e.properties.level);if(!o)return wayfindingLogger.warn("point-fix","No floor data for level",{level:e.properties.level,pointCoords:e.geometry.coordinates}),e;// If point is located without accessible area, do nothing
let i=o.areas;for(let r in i){let o=i[r];if(turf.booleanContains(o,e))return e}wayfindingLogger.debug("point-fix","Point not in any area, searching for nearest path",{level:e.properties.level,pointCoords:e.geometry.coordinates,areasCount:i.length});// Find nearest wall to stick to
let t=null,s=1/0;o.wallFeatures.forEach(r=>{let o=turf.pointToLineDistance(e.geometry.coordinates,r,{units:"meters"});o<s&&(t=r,s=o)});let n=this.corridorLineFeatures.filter(r=>r.properties.level===e.properties.level),p=null,a=1/0;// Test if area or corridor is closer, create appropriate fixed point
if(n.forEach(r=>{let o=this.corridorLineFeatures.indexOf(r),i=turf.pointToLineDistance(e.geometry.coordinates,r,{units:"meters"});i<a&&(p=o,a=i)}),null===t&&null===p)return wayfindingLogger.warn("point-fix","No corridor or wall found near point",{level:e.properties.level,pointCoords:e.geometry.coordinates,corridorsOnLevel:n.length,wallsOnLevel:o.wallFeatures.length}),e;else{let o;// Corridor is closer
if(null!==p&&a<s){// Create fixed point on line itself
let i=this.corridorLineFeatures[p];if(o=turf.nearestPointOnLine(i,e),o.properties.onCorridor=!0,o.properties.corridorIndex=p,o.properties.neighbours||(o.properties.neighbours=[]),!1!=this.corridorLineFeatures[p].properties.bidirectional)o.properties.neighbours.push(this.corridorLinePointPairs[p][0],this.corridorLinePointPairs[p][1]),o.properties.neighbours.push(...i.properties.intersectionPointList),o.properties.neighboursLeadingTo=[this.corridorLinePointPairs[p][0],this.corridorLinePointPairs[p][1],...i.properties.intersectionPointList];else if(!0!=this.corridorLineFeatures[p].properties.swapDirection){o.properties.neighbours.push(this.corridorLinePointPairs[p][0]);// include only intersection points after this point
let e=this._distance(o,this.corridorLinePointPairs[p][0]),r=i.properties.intersectionPointList.filter(r=>this._distance(r,this.corridorLinePointPairs[p][0])<e),t=i.properties.intersectionPointList.filter(r=>this._distance(r,this.corridorLinePointPairs[p][0])>=e);o.properties.neighbours.push(...t),o.properties.neighboursLeadingTo=r}else{o.properties.neighbours.push(this.corridorLinePointPairs[p][1]);// include only intersection points before this point
let e=this._distance(o,this.corridorLinePointPairs[p][0]),r=i.properties.intersectionPointList.filter(r=>this._distance(r,this.corridorLinePointPairs[p][0])<=e),t=i.properties.intersectionPointList.filter(r=>this._distance(r,this.corridorLinePointPairs[p][0])>e);o.properties.neighbours.push(...r),o.properties.neighboursLeadingTo=t}wayfindingLogger.debug("point-fix","Point snapped to corridor",{level:e.properties.level,originalCoords:e.geometry.coordinates,fixedCoords:o.geometry.coordinates,corridorDistance:r(100*a)/100,wallDistance:r(100*s)/100,neighbourCount:o.properties.neighbours.length,bidirectional:this.corridorLineFeatures[p].properties.bidirectional})}else if(null!==t){// Create fixed point inside area
let i=turf.nearestPointOnLine(t,e),n=turf.bearing(e,i);o=turf.destination(e.geometry.coordinates,s+.05,n,{units:"meters"}),wayfindingLogger.debug("point-fix","Point snapped to wall",{level:e.properties.level,originalCoords:e.geometry.coordinates,fixedCoords:o.geometry.coordinates,wallDistance:r(100*s)/100,corridorDistance:null===p?"no corridor":r(100*a)/100})}// Mark level of fixed point
// Return created point
return o.properties.level=e.properties.level,o}}/**
   * @param point {Feature <Point>}
   * @return {Feature <Point>}
   */_copyPoint(e){let r=turf.point([e.geometry.coordinates[0],e.geometry.coordinates[1]]);return null!=e.id&&(r.id=e.id),null!=e.properties.id&&(r.properties.id=e.properties.id),null!=e.properties.amenity&&(r.properties.amenity=e.properties.amenity),null!=e.properties.type&&(r.properties.type=e.properties.type),r}_setNeighbourhoodBasedOnCorridorDirectionality(e,r,o,i){i.properties.neighbours===void 0&&(i.properties.neighbours=[]),!1==e.properties.bidirectional?!1===e.properties.swapDirection?(r.properties.neighbours.push(i),i.properties.neighbours.push(o)):(o.properties.neighbours.push(i),i.properties.neighbours.push(r)):(i.properties.neighbours.push(r,o),r.properties.neighbours.push(i),o.properties.neighbours.push(i))}_comparePointsByDistanceFromReference(e,r,o){let i=turf.distance(e,r),t=turf.distance(e,o);return i>t?1:t>i?-1:0}/* ─── Helpers below are preserved from proximiio-js-library 1.16.x ─────
   * These are public API used by the map components (routing_source,
   * guidanceStepsGenerator, main). They wrap the core runAStar above.
   */ // Alias kept for backward compatibility — some callers use `calculatePath` directly.
calculatePath(e,r){return this.runAStar(e,r)}runAStarWithDetails(e,r){const o=this.runAStar(e,r),i=this.calculateDistance(o),t=this.calculateTime(o,i);return{path:o,distance:i,duration:t,isElevator:this.isPathElevator(o),isEscalator:this.isPathEscalator(o),isStaircase:this.isPathStaircase(o),isFlat:this.isPathFlat(o)}}calculateDistance(e){if(!e||2>e.length)return 0;let r=0;for(let o=1;o<e.length;o++)r+=this._distance(e[o-1],e[o]);return r}// Walking duration in seconds. Uses 1.4 m/s as the default walking speed.
calculateTime(e,r){if(!e||2>e.length)return 0;const o=this.walkingSpeed||1.4;return(null==r?this.calculateDistance(e):r)/o}extractAllLevels(e){const r=e||(this.floorData?[...this.floorData.keys()]:[]);if(Array.isArray(r)&&r.length&&"number"==typeof r[0])return[...new Set(r)].sort((e,r)=>e-r);const o=new Set;return r.forEach(e=>{e&&e.properties&&("number"==typeof e.properties.level&&o.add(e.properties.level),Array.isArray(e.properties.levels)&&e.properties.levels.forEach(e=>o.add(e)))}),[...o].sort((e,r)=>e-r)}isPathElevator(e){return Array.isArray(e)&&e.some(e=>e&&e.properties&&e.properties.type===this.POI_TYPE.ELEVATOR)}isPathEscalator(e){return Array.isArray(e)&&e.some(e=>e&&e.properties&&e.properties.type===this.POI_TYPE.ESCALATOR)}isPathStaircase(e){return Array.isArray(e)&&e.some(e=>e&&e.properties&&e.properties.type===this.POI_TYPE.STAIRCASE)}isPathFlat(e){if(!Array.isArray(e)||0===e.length)return!0;const r=e[0]?.properties?.level;return e.every(e=>e?.properties?.level===r)}}export default Wayfinding;