const PI = Math.PI;
const WGS84_RADIUS = 6378137.0;
/**
 * Check if feature geometry is Polygon or MultiPolygon
 */
export function isPolygonal(feature) {
    const geom = feature.geometry;
    if (!geom)
        return false;
    return geom.type === 'Polygon' || geom.type === 'MultiPolygon';
}
/**
 * Round coordinate to 8 decimal places
 */
export function roundCoordinate(val) {
    return Math.round(val * 1e8) / 1e8;
}
/**
 * Rewind polygon rings
 * @param feat GeoJSON Feature
 * @param outer desired orientation of outer ring (true = clockwise)
 */
export function rewind(feat, outer) {
    const geom = feat.geometry;
    if (!geom)
        return;
    if (geom.type === 'Polygon') {
        correctRings(geom.coordinates, outer);
    }
    else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates) {
            correctRings(poly, outer);
        }
    }
}
/**
 * Fix winding for outer + inner rings
 */
function correctRings(coords, outer) {
    if (coords.length === 0)
        return;
    // outer ring
    wind(coords[0], outer);
    // inner rings (holes)
    for (let i = 1; i < coords.length; i++) {
        wind(coords[i], !outer);
    }
}
/**
 * Compute spherical signed area and reverse if orientation is wrong
 * Port of mapbox/geojson-area algorithm
 */
function wind(coords, outer) {
    const len = coords.length;
    if (len <= 2)
        return;
    let area = 0;
    for (let i = 0; i < len; i++) {
        let lower;
        let middle;
        let upper;
        if (i === len - 2) {
            lower = len - 2;
            middle = len - 1;
            upper = 0;
        }
        else if (i === len - 1) {
            lower = len - 1;
            middle = 0;
            upper = 1;
        }
        else {
            lower = i;
            middle = i + 1;
            upper = i + 2;
        }
        const p1 = coords[lower];
        const p2 = coords[middle];
        const p3 = coords[upper];
        area += ((p3[0] * PI) / 180 - (p1[0] * PI) / 180) * Math.sin((p2[1] * PI) / 180);
    }
    area = (area * WGS84_RADIUS * WGS84_RADIUS) / 2;
    // reverse if orientation mismatch
    if (area > 0 !== outer) {
        coords.reverse();
    }
}
