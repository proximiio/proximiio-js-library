import{featureCollection as TurfFeatureCollection,point as TurfPoint,lineString as TurfLineString}from"@turf/helpers";import{default as TurfFlatten}from"@turf/flatten";import{polygonToLine as TurfPolygonToLine}from"@turf/polygon-to-line";import{default as TurfBooleanContains}from"@turf/boolean-contains";import{default as TurfDestination}from"@turf/destination";import{default as TurfLineIntersect}from"@turf/line-intersect";import{default as TurfBearing}from"@turf/bearing";import{default as TurfMidpoint}from"@turf/midpoint";import{default as TurfPointToLineDistance}from"@turf/point-to-line-distance";import{default as TurfDistance}from"@turf/distance";import{default as TurfNearestPointOnLine}from"@turf/nearest-point-on-line";const turf={lineIntersect:TurfLineIntersect,pointToLineDistance:TurfPointToLineDistance,nearestPointOnLine:TurfNearestPointOnLine,polygonToLine:TurfPolygonToLine,flatten:TurfFlatten,booleanContains:TurfBooleanContains,featureCollection:TurfFeatureCollection,point:TurfPoint,lineString:TurfLineString,destination:TurfDestination,bearing:TurfBearing,midpoint:TurfMidpoint,distance:TurfDistance};export class Wayfinding{/**
   *
   * @param featureCollection {FeatureCollection}
   */constructor(e){this.configuration={avoidElevators:!1,avoidEscalators:!1,avoidStaircases:!1,avoidRamps:!1,avoidNarrowPaths:!1,avoidRevolvingDoors:!1,avoidTicketGates:!1,avoidBarriers:!1,avoidHills:!1},this.POI_TYPE={ELEVATOR:"elevator",ESCALATOR:"escalator",STAIRCASE:"staircase",RAMP:"ramp",HILL:"hill",NARROW_PATH:"narrow_path",REVOLVING_DOOR:"door",TICKET_GATE:"ticket_gate",BARRIER:"barrier"},this.ACCESSIBILITY_POI_TYPE=["door","ticket_gate"],this.LEVEL_CHANGER_TYPE=["elevator","escalator","staircase","ramp","hill"],this.PATH_TYPE="path",this.LINE_STRING_TYPE="LineString",this.DIRECTION_UP="up",this.DIRECTION_DOWN="down",this.ROUTABLE_TYPE=["MultiPolygon","Polygon"],this.UNIT_TYPE="meters",this.pathFixDistance=1,this.wallOffsetDistance=.5,this.walkingSpeed=1.4,this.floorHeight=4.5,this.elevatorSpeed=.9,this.elevatorWaiting=55,this.escalatorSpeed=.24,this.staircasesSpeed=.3;// meters / second
const r=e.features,i=this.extractAllLevels(r).filter(e=>"undefined"!=typeof e);if(console.log("available levels",i),0===i.length)throw"No feature with level was supplied!";// const { minLevel, maxLevel } = this.extractMinMaxLevel(featureList);
// if (minLevel === undefined)
//     throw 'No feature with level was supplied!';
const o=r.filter(e=>e.properties.routable&&this.ROUTABLE_TYPE.includes(e.geometry.type)),t=new Map;i.forEach(e=>{const r=o.filter(r=>r.properties.level===e);t.set(e,turf.featureCollection(void 0===r?[]:r))}),this.floorList=t,this.corridors=r.filter(e=>e.properties.class===this.PATH_TYPE&&e.geometry.type===this.LINE_STRING_TYPE);// Level changers
const s=r.filter(e=>this.LEVEL_CHANGER_TYPE.includes(e.properties.type));s.forEach(e=>{void 0===e.id&&(e.id=e.properties.id)}),s.forEach(e=>{if(void 0!==e.properties.levels);// console.log('level changer avail levels', levelChanger.properties.levels);
else if(e.properties.levels=[],void 0!==e.properties.level_min&&void 0!==e.properties.level_max){console.log("we should not be here",e.properties.id,e.properties.levels);for(let r=e.properties.level_min;r<=e.properties.level_max;r++)e.properties.levels.push(r)}}),this.levelChangerList=s,this.accessibilityPoi=r.filter(e=>this.ACCESSIBILITY_POI_TYPE.includes(e.properties.type)),this.rebuildData()}/**
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
   */setConfiguration(e,r=1){Object.keys(e).forEach(r=>{this.configuration.hasOwnProperty(r)&&(this.configuration[r]=e[r])}),this.pathFixDistance=r}extractAllLevels(e){const r=[];return e.forEach(e=>{const i=e.properties.level;r.includes(i)||r.push(i)}),r.sort(),r.filter(e=>"undefined"!=typeof e)}extractMinMaxLevel(e){let r,i;return e.forEach(e=>{const o=e.properties.level;(void 0===r||o<r)&&(r=o),(void 0===i||i<o)&&(i=o),void 0!==e.properties.levels&&e.properties.levels.forEach(e=>{(void 0===r||e<r)&&(r=e),(void 0===i||i<e)&&(i=e)})}),{minLevel:r,maxLevel:i}}rebuildData(){const e=new Map;this.floorList.forEach((r,i)=>{const o=[],t=[];let s=[];// Floor features == "walkable areas"
r.features.forEach(e=>{const r=turf.flatten(turf.polygonToLine(e)).features.map(e=>e.geometry);// Floor wall lines, we wish to split to individual walls
r.forEach(r=>{let s,p;// Last point is the same as first, therefore limit index to exclude last point
for(let n=0;n<r.coordinates.length-1;n++){let a;0==n?(s=turf.point(r.coordinates[n]),s.properties.level=i,s.properties.neighbours=[],s.properties.walkableAreaId=e.id,a=s):a=p,n==r.coordinates.length-2?p=s:(p=turf.point(r.coordinates[n+1]),p.properties.level=i,p.properties.neighbours=[],p.properties.walkableAreaId=e.id),a.properties.neighbours.push(p),p.properties.neighbours.push(a),o.push(a),t.push([a,p])}}),s=s.concat(turf.flatten(e).features)}),e.set(i,{areas:s,points:o,walls:t,wallFeatures:t.map(e=>turf.lineString([e[0].geometry.coordinates,e[1].geometry.coordinates]))})}),this.bearingCache=new Map,this.floorData=e,this.floorData.forEach((e,r)=>{// List of physical POIs on this level that are within area
const i=this.accessibilityPoi.filter(e=>r===e.properties.level).filter(r=>0<e.areas.filter(e=>turf.booleanContains(e,r)).length);i.forEach(i=>{// Generate points around POI to allow going around, but only if they are "within area
const o=[turf.destination(i.geometry.coordinates,i.properties.radius+this.wallOffsetDistance,0,{units:this.UNIT_TYPE}),turf.destination(i.geometry.coordinates,i.properties.radius+this.wallOffsetDistance,60,{units:this.UNIT_TYPE}),turf.destination(i.geometry.coordinates,i.properties.radius+this.wallOffsetDistance,120,{units:this.UNIT_TYPE}),turf.destination(i.geometry.coordinates,i.properties.radius+this.wallOffsetDistance,180,{units:this.UNIT_TYPE}),turf.destination(i.geometry.coordinates,i.properties.radius+this.wallOffsetDistance,-120,{units:this.UNIT_TYPE}),turf.destination(i.geometry.coordinates,i.properties.radius+this.wallOffsetDistance,-60,{units:this.UNIT_TYPE})].filter(r=>0<e.areas.filter(e=>turf.booleanContains(e,r)).length);o.forEach(e=>{e.properties.level=r,e.properties.isDetourPoint=!0}),e.points=e.points.concat(o),this.detourPointList=o})});// Split lines into single line segments
const r=[],o=[];this.corridors.forEach(e=>{const t=e.geometry.coordinates;let s=null;for(let p=0;p<t.length-1;p++){let i;null==s?(i=turf.point(t[p]),i.properties.neighbours=[],i.properties.level=e.properties.level):i=s;const n=turf.point(t[p+1]);n.properties.level=e.properties.level,n.properties.neighbours=[],(!1!=e.properties.bidirectional||!1!=e.properties.swapDirection)&&i.properties.neighbours.push(n),(!1!=e.properties.bidirectional||!0==e.properties.swapDirection)&&n.properties.neighbours.push(i);const a=turf.lineString([i.geometry.coordinates,n.geometry.coordinates]);// Mark lineFeature accordingly
a.properties.level=e.properties.level,a.properties.bidirectional=e.properties.bidirectional,a.properties.swapDirection=e.properties.swapDirection,e.properties.narrowPath&&(i.properties.narrowPath=!0,n.properties.narrowPath=!0,a.properties.narrowPath=!0),e.properties.ramp&&(i.properties.ramp=!0,n.properties.ramp=!0,a.properties.ramp=!0),e.properties.hill&&(i.properties.hill=!0,n.properties.hill=!0,a.properties.hill=!0),r.push([i,n]),o.push(a),s=n}});const t=[],s=new Map;let p=0;// Split individual segments when intersecting
for(p=0;p<r.length;){// for (let i = 0; i < corridorLinePointPairs.length - 1; i++) {
const e=r[p],i=o[p];// let segmentIntersectionList = [];
s.has(p)||s.set(p,[]);for(let n=p+1;n<r.length;n++){s.has(n)||s.set(n,[]);const a=r[n];if(i.properties.level!==o[n].properties.level)continue;// Consecutive segments, should not cross (rather, they cross at the end point)
if(a.includes(e[0])||a.includes(e[1]))continue;const l=o[n],d=turf.lineIntersect(i,l).features;if(0<d.length){const r=d[0];r.properties.level=e[0].properties.level,r.properties.isCorridorPoint=!0,(i.properties.narrowPath||l.properties.narrowPath)&&(r.properties.narrowPath=!0),(i.properties.ramp||l.properties.ramp)&&(r.properties.ramp=!0),(i.properties.hill||l.properties.hill)&&(r.properties.hill=!0),s.get(p).push(r),s.get(n).push(r),t.push(r)}}p++}for(p=0;p<r.length;){const e=r[p],i=o[p],t=e[0],n=e[1],a=s.get(p);a.sort((e,r)=>this._comparePointsByDistanceFromReference(t,e,r)),a?(a.forEach(e=>{if(this._setNeighbourhoodBasedOnCorridorDirectionality(i,t,n,e),!1!=i.properties.bidirectional)e.properties.neighbours=e.properties.neighbours.concat(a.filter(r=>r!==e));else if(!0!=i.properties.swapDirection){const r=a.slice(a.indexOf(e));e.properties.neighbours.push(...r)}else{const r=a.slice(0,a.indexOf(e));e.properties.neighbours.push(...r)}}),o[p].properties.intersectionPointList=a):o[p].properties.intersectionPointList=[],p++}const n=[];// Split corridor lines on interesections wilth walls
for(p=0;p<r.length;){const e=r[p],i=o[p],t=[],s=this.floorData.get(e[0].properties.level).walls,a=this.floorData.get(e[0].properties.level).wallFeatures;if(a.forEach((r,o)=>{const p=turf.lineIntersect(i,r).features;if(0<p.length){const r=p[0];r.properties.level=e[0].properties.level,r.properties.neighbours=[],r.properties.bordersArea=!0,r.properties.walkableAreaId=s[0][0].properties.walkableAreaId,i.properties.narrowPath&&(r.properties.narrowPath=!0),i.properties.ramp&&(r.properties.ramp=!0),i.properties.hill&&(r.properties.hill=!0);const n=this._distance(e[0],r);t.push({point:r,distance:n,wallIndex:o})}}),0<t.length){t.sort((e,r)=>e.distance-r.distance);// Inject parts of segments split by intersections
let r=e[0];t.forEach(e=>{r.properties.neighbours.push(e.point),s[e.wallIndex][0].properties.neighbours.push(e.point),s[e.wallIndex][1].properties.neighbours.push(e.point),e.point.properties.neighbours.push(r,s[e.wallIndex][0],s[e.wallIndex][1]),e.point.properties.neighbours.push(...o[p].properties.intersectionPointList),o[p].properties.intersectionPointList.forEach(r=>r.properties.neighbours.push(e.point)),r=e.point,o[p].properties.intersectionPointList.push(e.point)});// Inject from last intersection to end of original segment
const i=turf.lineString([r.geometry.coordinates,e[1].geometry.coordinates]);i.properties.level=r.properties.level,e[1].properties.neighbours.push(r),r.properties.neighbours.push(e[1]),n.push(...t.map(e=>e.point))}p++}n.forEach(e=>{this.floorData.get(e.properties.level).points.push(e)}),n.forEach(e=>{const r=this._findNeighbours(e,null,null,this.floorData.get(e.properties.level).points);e.properties.neighbours.push(...r)}),this.corridorLinePointPairs=r,this.corridorLineFeatures=o,this.corridorLinePoints=[],this.corridorLinePointPairs.forEach(e=>{e[0].properties.isCorridorPoint=!0,e[1].properties.isCorridorPoint=!0,this.corridorLinePoints.includes(e[0])||this.corridorLinePoints.push(e[0]),this.corridorLinePoints.includes(e[1])||this.corridorLinePoints.push(e[1])}),this.corridorLinePoints=this.corridorLinePoints.concat(t);const a=new Map;this.levelChangerList.forEach(e=>{// Create level changer groups
if(e.properties.group!==void 0){// Get group array, initiate if neccessary
const r=e.properties.group;a.has(r)||a.set(r,[]);const i=a.get(r);// Add lc to group map
i.push(e)}else a.set(e.id,[e]);e.properties.fixedPointMap=new Map,e.properties.levels.forEach(r=>{const i=this._copyPoint(e);i.properties.level=r;const o=this._getFixPointInArea(i);o.id=e.id,o.properties.amenity=e.properties.amenity,o.properties.direction=e.properties.direction,o.properties.id=e.properties.id,o.properties.level=r,o.properties.type=e.properties.type,o.properties.neighbours===void 0&&(o.properties.neighbours=[]);// Do not fix level changers that are further than 5 meters from any path or area
5<this._distance(i,o)||(// Store fixed point into the level changer
e.properties.fixedPointMap.set(r,o),o.properties.onCorridor&&o.properties.neighboursLeadingTo!==void 0&&(o.properties.neighboursLeadingTo.forEach(e=>{e.properties.neighbours===void 0&&(e.properties.neighbours=[]),e.properties.neighbours.push(o)}),this.corridorLineFeatures[o.properties.corridorIndex].properties.intersectionPointList.push(o)))})}),a.forEach(e=>{const r=e.map(e=>e.properties.direction).find(e=>e!==void 0),i=[];e.forEach(e=>{i.push(...e.properties.fixedPointMap.values())}),i.forEach(e=>{e.properties.neighbours==null&&(e.properties.neighbours=[]),r===this.DIRECTION_UP?e.properties.neighbours.push(...i.filter(r=>r.properties.level>e.properties.level)):r===this.DIRECTION_DOWN?e.properties.neighbours.push(...i.filter(r=>r.properties.level<e.properties.level)):e.properties.neighbours.push(...i.filter(r=>r.properties.level!==e.properties.level))})})}_removeItemFromList(e,r){const i=e.indexOf(r);0<=i&&e.splice(i,1)}load(e,r){this.neighbourMap=e,this.rebuildData(),this.wallOffsets=r,this.wallOffsetLineList=[],this._getPointList().forEach((e,r)=>{const i=this.wallOffsets[r];if(i){const r=turf.lineString([e.geometry.coordinates,i.geometry.coordinates]);r.properties.level=e.properties.level,this.wallOffsetLineList.push(r)}})}/**
   * @param point {Feature<Point>}
   * @param level {Number}
   * @private true
   */_isPointOnLevel(e,r){return void 0===e.properties.fixedPointMap?e.properties.level===r:e.properties.fixedPointMap.has(r)}_getPointList(){let e=[];return this.floorData.forEach(r=>{e=e.concat(r.points)}),this.levelChangerList.forEach(r=>e.push(...r.properties.fixedPointMap.values())),e=e.concat(),e=e.concat(this.corridorLinePoints),e}/**
   *
   * @returns {{neighbourhood: Object, wallOffsets: Object}}
   */preprocess(){return{neighbourhood:this._generateNeighbourhoodMap(),wallOffsets:this._generateWallOffsets()}}_generateNeighbourhoodMap(){// this.nbLines = [];
const e=this._getPointList(),r={};// NeighbourMap for polygon points
return this.floorData.forEach((i,o)=>{const t={},s=i.points.concat(this.levelChangerList.filter(e=>this._isPointOnLevel(e,o)).map(e=>e.properties.fixedPointMap.get(o)));s.forEach(r=>{const i=e.indexOf(r),p=this._unwrapLevelChangerPoint(r,o),n=p===r?null:p,a=this._findNeighbours(p,n,null,s);// Get unwrapped point if case the point is a level changer, so we can properly test neighbourhood
// Simulate startPoint to force lowering number of intersections allowed.
// Unwrapped point is inside accessible area, thus there should be only one intersection, wall point itself.
t[i]=a.map(r=>e.indexOf(r))}),r[o]=t}),this.corridorLinePoints.forEach(i=>{const o=e.indexOf(i),t=i.properties.level;let s;const p=r[t];// Find neighbours in polygon only for points crossing polygon
if(i.properties.bordersArea){const r=this.floorData.get(t).points.concat(this.levelChangerList.filter(e=>this._isPointOnLevel(e,t))).concat(this.corridorLinePoints.filter(e=>e.properties.bordersArea&&this._isPointOnLevel(e,t)));s=this._findNeighbours(i,i,null,r),s.forEach(r=>{const i=e.indexOf(r);void 0===p[i]&&(p[i]=[]),p[i].includes(o)||p[i].push(o)})}else s=i.properties.neighbours;// Store relationship for corridor point
void 0===p[o]?p[o]=s.map(r=>e.indexOf(r)):s.forEach(r=>p[o].push(e.indexOf(r)))}),this.neighbourMap=r,r}_generateWallOffsets(){this.wallOffsetLineList=[],this.wallOffsets={};const e=this._getPointList();return e.forEach(r=>{// Do no process level changers
if(null==r.properties.level)return;// a) Find walls where the point P is used and the other points in walls: A, B
const i=this.floorData.get(r.properties.level).walls.filter(e=>e.includes(r));if(0===i.length)return;const o=i[0][0]===r?i[0][1]:i[0][0],t=i[1][0]===r?i[1][1]:i[1][0],s=turf.bearing(r,o),p=turf.bearing(r,t),n=this._averageBearing(s,p),a=0<n?n-180:n+180,l=turf.destination(r.geometry.coordinates,.01,n,this.UNIT_TYPE),d=turf.destination(r.geometry.coordinates,.01,a,this.UNIT_TYPE);// b) Get average bearing to points A,B
// this.wallOffsetLineList.push(turf.lineString([point.geometry.coordinates, offsetPoint.geometry.coordinates]));
// c) Generate two points M,N very close to point P
// d) Test which point is contained within accessible area
let c=null;for(const e in this.floorData.get(r.properties.level).areas){const i=this.floorData.get(r.properties.level).areas[e];if(turf.booleanContains(i,l)){c=l;break}else if(turf.booleanContains(i,d)){c=d;break}}// Stop if either of points is not contained...
if(null==c)return;// e) Generate point F at double the distance of wall offset
let h=turf.destination(r.geometry.coordinates,2*this.wallOffsetDistance,c===l?n:a,this.UNIT_TYPE),g=turf.lineString([r.geometry.coordinates,h.geometry.coordinates]);// f) Test if PF intersects with any wall, update point F and PF to shortest available size
this.floorData.get(r.properties.level).walls.forEach((e,o)=>{// Do not test walls containing point P, they will intersect of course
if(i.includes(e))return;const t=this.floorData.get(r.properties.level).wallFeatures[o],s=turf.lineIntersect(g,t);// Find intersection point, use it to produce new
0<s.features.length&&(h=turf.point(s.features[0].geometry.coordinates),g=turf.lineString([r.geometry.coordinates,h.geometry.coordinates]))});// g) Create wall offset point as midpoint between points P,F
const u=turf.midpoint(r.geometry.coordinates,h.geometry.coordinates);u.properties.level=r.properties.level,this.wallOffsets[e.indexOf(r)]=u;const f=turf.lineString([r.geometry.coordinates,u.geometry.coordinates]);f.properties.level=r.properties.level,this.wallOffsetLineList.push(f)}),this.wallOffsets}/**
   * @param current {Feature<Point>}
   * @return {[Feature<Point>]}
   */reconstructPath(e){var r=Math.PI,o=Math.abs;let t=[],s=e;do{const r=this._calculateWallOffsetPointList(e,0<t.length?t[t.length-1]:s);if(r.forEach(r=>{if(s===e||s.geometry.coordinates[0]!==r.geometry.coordinates[0]||s.geometry.coordinates[1]!==r.geometry.coordinates[1]){const i=this._copyPoint(r);i.properties.level=e.properties.level,i.properties.walkableAreaId=e.properties.walkableAreaId,i.properties.bordersArea=e.properties.bordersArea,t.push(i),s=r}}),e=e.properties.cameFrom,1e4<t.length)throw new Error("Too big route")}while(null!=e);t.reverse();let p=[];// Simplify the route by omitting corners that are basically at the same spot
for(let r=0;r<t.length-1;r++){const e=t[r],i=t[r+1];// Different floors nothing to do
if(e.properties.level!==i.properties.level)continue;const o=this._distance(e,i);// 50cm
.5>o&&p.push(e)}t=t.filter(e=>!p.includes(e)),p=[];// Simplify the route by omitting corners that are basically straight
for(let s=1;s<t.length-1;s++){const e=t[s-1],i=t[s],n=t[s+1];// Different floors nothing to do
if(e.properties.level!==i.properties.level||e.properties.level!==n.properties.level)continue;const a=this.bearing(e.geometry.coordinates,i.geometry.coordinates),l=this.bearing(i.geometry.coordinates,n.geometry.coordinates);let d=o(a-l);d>r&&(d-=r),.03488888>d&&p.push(i)}// let pathCoordinates = path.map(point => point.geometry.coordinates);
return t=t.filter(e=>!p.includes(e)),t}_calculateWallOffsetPointList(e,r){const i=this._getPointList();let o=i.indexOf(e);const t=i.indexOf(r),s=[];let p=e;// a) offset current point
0<=o&&this.wallOffsets[o]&&(p=this.wallOffsets[o]),s.push(p);let n;do{const i=turf.lineString([r.geometry.coordinates,p.geometry.coordinates]);n=[],this.wallOffsetLineList.forEach((r,s)=>{// Do not process wall offsets from another floor
if(r.properties.level===e.properties.level&&s!==t&&s!==o)// Do not process wall offsets with previous or current point
{const e=turf.lineIntersect(i,r);if(0<e.features.length){const r=this.wallOffsets[s];// store distance to previousPoint
r.properties.distance=this._distance(e.features[0],p),r.properties.offsetIndex=s,n.push(r)}}}),0<n.length&&(n.sort((e,r)=>e.properties.distance-r.properties.distance),p=n[0],o=p.properties.offsetIndex,s.push(p))}while(0<n.length);return s.reverse()}_getIntersectingOffsetPoints(e,r){if(e===r||e.properties.level!==r.properties.level)return[];const i=turf.lineString([e.geometry.coordinates,r.geometry.coordinates]),o=[];return this.wallOffsetLineList.forEach((r,t)=>{if(r.properties.level===e.properties.level&&0<turf.lineIntersect(i,r).features.length){const i=this.wallOffsets[t];i.properties.distance=turf.pointToLineDistance(e.geometry.coordinates,r,{units:this.UNIT_TYPE}),o.push(i)}}),o.sort((e,r)=>r.properties.distance-r.properties.distance),o}clearData(){this.floorData.forEach(e=>{for(const r in e.points){const i=e.points[r];delete i.properties.cameFrom,delete i.properties.gscore,delete i.properties.fscore}}),this.levelChangerList.forEach(e=>{e.properties.fixedPointMap.forEach(e=>{delete e.properties.cameFrom,delete e.properties.gscore,delete e.properties.fscore})}),this.corridorLinePoints.forEach(e=>{delete e.properties.cameFrom,delete e.properties.gscore,delete e.properties.fscore})}/**
   *
   * @param startPoint {Feature<Point>}
   * @param endPoint {Feature<Point>}
   * @return {[Feature<Point>]}
   */runAStar(e,r){const i=this.calculatePath(e,r),o=this.calculatePath(r,e);return void 0===i&&void 0===o?void 0:void 0===i&&void 0!==o?o:void 0!==i&&void 0===o?i:i.length<=o.length?i:o}/**
   *
   * @param startPoint {Feature<Point>}
   * @param endPoint {Feature<Point>}
   * @return {[Feature<Point>]}
   * @private
   */runAStarWithDetails(e,r){const i=this.runAStar(e,r),o=this.calculateDistance(i),t=this.calculateTime(i,o);return{path:i,distance:o,duration:t}}/**
   * Calculate length of the path in meters
   * @param path {Feature<Point>}
   * @return {Float}
   * @private
   */ /**
   * Check if path has an elevator
   * @param path {Feature<Point>}
   * @param key {Int}
   * @return {Boolean}
   * @private
   */isPathElevator(e,r){return!(e[r].properties.type!=this.POI_TYPE.ELEVATOR||e[r+1].properties.type!=this.POI_TYPE.ELEVATOR)}/**
   * Check if path has an escalator
   * @param path {Feature<Point>}
   * @param key {Int}
   * @return {Boolean}
   * @private
   */isPathEscalator(e,r){return!(e[r].properties.type!=this.POI_TYPE.ESCALATOR||e[r+1].properties.type!=this.POI_TYPE.ESCALATOR)}/**
   * Check if path has a staircase
   * @param path {Feature<Point>}
   * @param key {Int}
   * @return {Boolean}
   * @private
   */isPathStaircase(e,r){return!(e[r].properties.type!=this.POI_TYPE.STAIRCASE||e[r+1].properties.type!=this.POI_TYPE.STAIRCASE)}/**
   * Check if path is flat without stairs, elevator or escalator
   * @param path {Feature<Point>}
   * @param key {Int}
   * @return {Boolean}
   * @private
   */isPathFlat(e,r){return!this.isPathElevator(e,r)&&!this.isPathEscalator(e,r)&&!this.isPathStaircase(e,r)}calculateDistance(e){let r=0;return void 0===e||0===e.length?r:(e.forEach((i,o)=>{void 0!==e[o+1]&&(r+=turf.distance(e[o],e[o+1],{units:this.UNIT_TYPE}))}),r)}/**
   * Calculate length of the path in seconds
   * @param path {Feature<Point>}
   * @param distance {Float}
   * @return {Float}
   * @private
   */calculateTime(e,r){var i=Math.abs;let o=r/this.walkingSpeed,t=0,s=0,p=0;e===void 0&&(e=[]),e.forEach((r,o)=>{var n=Math.sqrt;if(this.isPathElevator(e,o)){let r=i(e[o].properties.level-e[o+1].properties.level);t+=r*this.floorHeight/this.elevatorSpeed+this.elevatorWaiting}if(this.isPathEscalator(e,o)){let r=i(e[o].properties.level-e[o+1].properties.level),t=this.floorHeight*this.floorHeight;s+=r*n(t+t)/this.escalatorSpeed}if(this.isPathStaircase(e,o)){let r=i(e[o].properties.level-e[o+1].properties.level),t=this.floorHeight*this.floorHeight;p+=r*n(t+t)/this.staircasesSpeed}});const n=o+t+s+p;return{shortest:o,elevator:t,escalator:s,staircase:p,realistic:n}}/**
   *
   * @param startPoint {Feature<Point>}
   * @param endPoint {Feature<Point>}
   * @return {[Feature<Point>]}
   * @private
   */calculatePath(e,r){this.clearData(),this.nbLines=[],this.bearingCache=new Map;const i=this._getFixPointInArea(e),o=this._getFixEndPoint(r,e.properties.level),t=[i],s=[];for(i.properties.gscore=0,i.properties.fscore=this._heuristic(i,o);0<t.length;){const p=this._getMinFScore(t,s);// Unable to find best point to continue?
if(null===p)break;if(p===o){let t;try{t=this.reconstructPath(p)}catch(e){return}return o!==r&&(!o.properties.onCorridor||this._distance(o,r)>this.pathFixDistance)&&(r.properties.fixed=!0,t.push(r)),i!==e&&(!i.properties.onCorridor||this._distance(i,e)>this.pathFixDistance)&&(e.properties.fixed=!0,t.unshift(e)),t[t.length-1].properties.gscore=p.properties.gscore,t}s.push(t.splice(t.indexOf(p),1));const n=this._getNeighbours(p,i,o);n.forEach(e=>this.nbLines.push(turf.lineString([p.geometry.coordinates,e.geometry.coordinates]))),n.forEach(e=>{if(!s.includes(e)){const r=p.properties.gscore+this._distance(p,e),i=null==e.properties.gscore?1/0:e.properties.gscore;r<i&&(e.properties.cameFrom=p,e.properties.gscore=r+.2,e.properties.fscore=r+this._heuristic(e,o),!t.includes(e)&&t.push(e))}})}}_checkIfCrossingTwoPolygon(e,r){const i=e.properties||{},o=r.properties||{};if(o.walkableAreaId!==void 0&&i.walkableAreaId!==void 0){if(o.walkableAreaId!==i.walkableAreaId)return!0;if(void 0===o.bordersArea)return!0}return void 0!==i.walkableAreaId&&void 0===o.walkableAreaId&&!0!==o.isCorridorPoint}/**
   *
   * @param point {Feature<Point>}
   * @param startPoint {Feature<Point>}
   * @param endPoint {Feature<Point>}
   * @return {Point[]}
   * @private
   */_getNeighbours(e,r,i){let o=[];if(e===r){const t=this._getPointList().filter(r=>this._isPointOnLevel(r,e.properties.level));o=this._findNeighbours(e,r,i,t),o=o.filter(r=>{const i=e.properties.level,o=this.configuration.avoidRevolvingDoors&&this._testAccessibilityPoiNeighbourhood(e,r,i,this.POI_TYPE.REVOLVING_DOOR),t=this.configuration.avoidTicketGates&&this._testAccessibilityPoiNeighbourhood(e,r,i,this.POI_TYPE.TICKET_GATE),s=this._checkIfCrossingTwoPolygon(e,r);return!o&&!t&&!s})}else{// Gather neighbours over all levels
const r=this._getPointList(),t=r.indexOf(e);// Test if endpoint is neighbour
if(0<=t&&this.floorData.forEach((i,s)=>{const p=this.neighbourMap[s];p.hasOwnProperty(t)&&p[t].forEach(i=>{const t=r[i],p=this.configuration.avoidRevolvingDoors&&this._testAccessibilityPoiNeighbourhood(e,t,s,this.POI_TYPE.REVOLVING_DOOR),n=this.configuration.avoidTicketGates&&this._testAccessibilityPoiNeighbourhood(e,t,s,this.POI_TYPE.TICKET_GATE),a=this._checkIfCrossingTwoPolygon(e,t);o.includes(t)||p||n||a||o.push(t)})}),void 0!==e.properties.level&&e.properties.level===i.properties.level||null!=e.properties.fixedPointMap&&e.properties.fixedPointMap.has(i.properties.level)){const r=this.configuration.avoidRevolvingDoors&&this._testAccessibilityPoiNeighbourhood(e,i,i.properties.level,this.POI_TYPE.REVOLVING_DOOR),t=this.configuration.avoidTicketGates&&this._testAccessibilityPoiNeighbourhood(e,i,i.properties.level,this.POI_TYPE.TICKET_GATE),s=this._checkIfCrossingTwoPolygon(e,i);if(!r&&!t&&!s)// Endpoint is fixed on corridor
if(i.properties.onCorridor)i.properties.neighbours.includes(e)?!1!=this.corridorLineFeatures[i.properties.corridorIndex].properties.bidirectional&&o.push(i):void 0!==i.properties.neighboursLeadingTo&&i.properties.neighboursLeadingTo.includes(e)&&o.push(i);else{const r=this._unwrapLevelChangerPoint(e,i.properties.level);let t=1;(r.properties.isCorridorPoint||r.properties.onCorridor)&&t--,this._countIntersections(r,i,t)&&o.push(i)}}}return o.filter(e=>{if(this.configuration.avoidElevators&&e.properties.type===this.POI_TYPE.ELEVATOR)return!1;return!(this.configuration.avoidEscalators&&e.properties.type===this.POI_TYPE.ESCALATOR)&&!(this.configuration.avoidStaircases&&e.properties.type===this.POI_TYPE.STAIRCASE)&&!(this.configuration.avoidNarrowPaths&&e.properties.narrowPath)&&!(this.configuration.avoidRamps&&e.properties.ramp)&&!(this.configuration.avoidHills&&e.properties.hill)})}/**
   *
   * @param pointA {Feature<Point>}
   * @param pointB {Feature<Point>}
   * @param level {Number}
   * @param accesibilityType {String}
   * @returns {boolean}
   * @private
   */_testAccessibilityPoiNeighbourhood(e,r,i,o){// Filter out lines that intersect revolving door POIs.
let t=!1;if(o===this.POI_TYPE.REVOLVING_DOOR&&this.configuration.avoidRevolvingDoors){const s=turf.lineString([e.geometry.coordinates,r.geometry.coordinates]),p=this.accessibilityPoi.filter(e=>e.properties.level===i&&e.properties.type===o);p.forEach(e=>{const r=turf.pointToLineDistance(e.geometry.coordinates,s,{units:this.UNIT_TYPE});r<=e.properties.radius&&(t=!0)})}return t}/**
   * @param point {Feature<Point>}
   * @param startPoint {Feature<Point>}
   * @param endPoint {Feature<Point>}
   * @param proposedPointList {[Feature<Point>]}
   * @return {[Point]}
   */_findNeighbours(e,r,i,o){let t=[];// Start point is on corridor line, use only preset neighbours on line
if(null!=e.properties.neighbours&&(t=[...e.properties.neighbours]),e===r&&e.properties.onCorridor||e.properties.isCorridorPoint&&!e.properties.bordersArea)return i&&i.properties.onCorridor&&r.properties.corridorIndex===i.properties.corridorIndex&&t.push(i),t;let s=0;i&&this._isPointOnLevel(i,e.properties.level)&&o.push(i);const p=this._unwrapLevelChangerPoint(e,e.properties.level);for(const n in o){const i=o[n];// Same point is not neighbour with itself
if(e===i)continue;// Already assigned
if(t.includes(i))continue;const a=this._unwrapLevelChangerPoint(i,e.properties.level);s=2,e===r&&s--,i===r&&s--,e!==p&&s--,i!==a&&s--,(i.properties.isCorridorPoint||i.properties.onCorridor)&&s--;const l=this._countIntersections(e,a,s);if(l){// if (allowedIntersections >= 1) {
const r=turf.midpoint(e.geometry.coordinates,i.geometry.coordinates);for(const o in this.floorData.get(e.properties.level).areas){const s=this.floorData.get(e.properties.level).areas[o];if(turf.booleanContains(s,r)){t.push(i);break}}}}return t}/**
   * @param pointA {Feature<Point>}
   * @param pointB {Feature<Point>}
   * @private {Boolean} true if points are on the same level
   */_comparePointLevels(e,r){// If both points are NOT level changers
if(null==e.properties.levels&&null==r.properties.levels)return e.properties.level===r.properties.level;// At least one of points is level changer
const i=e.properties.fixedPointMap===void 0?[e.properties.level]:[...e.properties.fixedPointMap.keys()],o=r.properties.fixedPointMap===void 0?[r.properties.level]:[...r.properties.fixedPointMap.keys()];return 0<i.filter(e=>o.includes(e)).length}/**
   * @param point {Feature<Point>}
   * @param level {Number}
   * @return {Feature<Point>}
   */_unwrapLevelChangerPoint(e,r){const i=e.properties.fixedPointMap;if(i){const o=i.get(r);return o?o:e}return e}/**
   *
   * @param pointFrom {Point}
   * @param pointTo {Point}
   * @param maxIntersections {Number}
   * @return {Boolean}
   */_countIntersections(e,r,i){const o=e.geometry.coordinates,t=r.geometry.coordinates,s=this.bearing(o,t);let p=0;const n=[],a=this.floorData.get(e.properties.level).walls,l=this.floorData.get(e.properties.level).wallFeatures;for(const d in a){const r=a[d];let c=!1,h=!1;if(e==r[0]||e==r[1])c=!0,h=!0;else{let e=this.bearing(o,r[0].geometry.coordinates),i=this.bearing(o,r[1].geometry.coordinates);if(e>i){const r=e;e=i,i=r}const t=i-e;t<Math.PI?e<=s&&s<=i&&(c=!0):(e>=s||s>=i)&&(c=!0)}if(c){if(h)this._testIdenticalPointInList(e,n)||(n.push(e),p++);else{const e=turf.lineIntersect(turf.lineString([o,t]),l[d]).features;0<e.length&&!this._testIdenticalPointInList(e[0],n)&&(n.push(e[0]),p++)}if(p>i)return!1}}return!0}/**
   *
   * @private
   */_averageBearing(e,r){if(e>r){const i=e;e=r,r=i}180<r-e&&(r-=360);const i=(r+e)/2;return-180>=i?360+i:i}// Converts from degrees to radians.
toRadians(e){return e*Math.PI/180}bearing(e,r){var i=Math.atan2,o=Math.sin,t=Math.cos;// let hasCache = false;
const s=this.bearingCache.get(e);if(s){const e=s.get(r);if(null!=e)return e}const p=this.toRadians(e[0]),n=this.toRadians(e[1]),a=this.toRadians(r[0]),l=this.toRadians(r[1]),d=t(l),c=o(a-p)*d,h=t(n)*o(l)-o(n)*d*t(a-p),g=i(c,h);return this._storeBearingCache(e,r,g),g}_storeBearingCache(e,r,i){var o=Math.PI;let t=this.bearingCache.get(e);t||(t=new Map,this.bearingCache.set(e,t)),t.set(r,i),t=this.bearingCache.get(r),t||(t=new Map,this.bearingCache.set(r,t)),0>=i?i+=o:i-=o,t.set(e,i)}_testIdenticalPointInList(e,r){return r.find(r=>r.geometry.coordinates[0]===e.geometry.coordinates[0]&&r.geometry.coordinates[1]===e.geometry.coordinates[1])!==void 0}/**
   *
   * @param pointSet {[Feature<Point>]}
   * @returns {Feature<Point>}
   */_getMinFScore(e,r){let i=null,o=1/0;const t=(r.slice(-1).properties||{}).walkableAreaId,s=(r.slice(-2).properties||{}).walkableAreaId;return e.forEach(e=>{const r=e.properties;r.fscore<o&&(i=e,o=r.fscore)}),i}/**
   *
   * @param pointA {Feature<Point>}
   * @param pointB {Feature<Point>}
   * @returns {*|number|undefined}
   */_heuristic(e,r){if(this._comparePointLevels(e,r)){let i=0;return(void 0!==e.properties.levels||void 0!==r.properties.levels)&&(i=20),this._distance(e,r)+i}else{// Filter out direct level changers
const i=this.levelChangerList.filter(i=>i!==e&&i!==r&&this._comparePointLevels(i,e)&&this._comparePointLevels(i,r));// Calculate best estimation for direct level change
let o=1/0;// Return estimation if direct level change was found
return i.forEach(i=>{const t=this._distance(e,i)+this._distance(i,r)+10;t<o&&(o=t)}),o<1/0?o:2e3}}/**
   *
   * @param pointA {Feature}
   * @param pointB {Feature}
   * @returns {*|number|undefined}
   */_distance(e,r){let i=0;return r.properties.level!==e.properties.level&&(i=10),turf.distance(e,r,{units:this.UNIT_TYPE})+i}/**
   *
   * @private
   */_getFixEndPoint(e,r){var i=Math.abs;const o=this.levelChangerList.find(r=>r.id===e.id);if(o!==void 0&&o.properties.fixedPointMap!==void 0){let t;o.properties.fixedPointMap.forEach((e,o)=>{(t===void 0||i(t-r)>i(o-r))&&(t=o)}),e=this._copyPoint(e),e.properties.level=t}return this._getFixPointInArea(e)}_getFixPointInArea(e){const r=this.floorData.get(e.properties.level);// If point is located without accessible area, do nothing
let i;if(r.areas.forEach(r=>{if(turf.booleanContains(r,e))return void(i=e)}),void 0!==i)return i;// Find nearest wall to stick to
let o=null,t=1/0;r.wallFeatures.forEach(r=>{const i=turf.pointToLineDistance(e.geometry.coordinates,r,{units:this.UNIT_TYPE});i<=t&&(o=r,t=i)});const s=this.corridorLineFeatures.filter(r=>r.properties.level===e.properties.level);let p=null,n=1/0;// Test if area or corridor is closer, create appropriate fixed point
if(s.forEach(r=>{const i=this.corridorLineFeatures.indexOf(r),o=turf.pointToLineDistance(e.geometry.coordinates,r,{units:this.UNIT_TYPE});o<n&&(p=i,n=o)}),null===o&&null===p)// could not find neither close area or corridor
return e;else{let r;// Corridor is closer
if(void 0!==p&&n<t){// Create fixed point on line itself
const i=this.corridorLineFeatures[p];if(r=turf.nearestPointOnLine(i,e),r.properties.onCorridor=!0,r.properties.corridorIndex=p,r.properties.neighbours||(r.properties.neighbours=[]),!1!=this.corridorLineFeatures[p].properties.bidirectional)r.properties.neighbours.push(this.corridorLinePointPairs[p][0],this.corridorLinePointPairs[p][1]),r.properties.neighbours.push(...i.properties.intersectionPointList),r.properties.neighboursLeadingTo=[this.corridorLinePointPairs[p][0],this.corridorLinePointPairs[p][1],...i.properties.intersectionPointList];else if(!0!=this.corridorLineFeatures[p].properties.swapDirection){r.properties.neighbours.push(this.corridorLinePointPairs[p][0]);// include only intersection points after this point
const e=this._distance(r,this.corridorLinePointPairs[p][0]),o=i.properties.intersectionPointList.filter(r=>this._distance(r,this.corridorLinePointPairs[p][0])<e),t=i.properties.intersectionPointList.filter(r=>this._distance(r,this.corridorLinePointPairs[p][0])>=e);r.properties.neighbours.push(...t),r.properties.neighboursLeadingTo=o}else{r.properties.neighbours.push(this.corridorLinePointPairs[p][1]);// include only intersection points before this point
const e=this._distance(r,this.corridorLinePointPairs[p][0]),o=i.properties.intersectionPointList.filter(r=>this._distance(r,this.corridorLinePointPairs[p][0])<=e),t=i.properties.intersectionPointList.filter(r=>this._distance(r,this.corridorLinePointPairs[p][0])>e);r.properties.neighbours.push(...o),r.properties.neighboursLeadingTo=t}// Wall is closer
}else if(null!==o){// Create fixed point inside area
const i=turf.nearestPointOnLine(o,e),s=turf.bearing(e,i);r=turf.destination(e.geometry.coordinates,t+.05,s,this.UNIT_TYPE)}// Mark level of fixed point
// Return created point
return r.properties.level=e.properties.level,r}}/**
   * @param point {Feature <Point>}
   * @return {Feature <Point>}
   */_copyPoint(e){const r=turf.point([e.geometry.coordinates[0],e.geometry.coordinates[1]]);return void 0!==e.id&&(r.id=e.id),void 0!==e.properties.id&&(r.properties.id=e.properties.id),void 0!==e.properties.amenity&&(r.properties.amenity=e.properties.amenity),void 0!==e.properties.type&&(r.properties.type=e.properties.type),r}_setNeighbourhoodBasedOnCorridorDirectionality(e,r,i,o){o.properties.neighbours===void 0&&(o.properties.neighbours=[]),!1==e.properties.bidirectional?!1===e.properties.swapDirection?(r.properties.neighbours.push(o),o.properties.neighbours.push(i)):(i.properties.neighbours.push(o),o.properties.neighbours.push(r)):(o.properties.neighbours.push(r,i),r.properties.neighbours.push(o),i.properties.neighbours.push(o))}_comparePointsByDistanceFromReference(e,r,i){const o=turf.distance(e,r),t=turf.distance(e,i);return o>t?1:t>o?-1:0}}