import { Feature } from 'geojson';
/**
 * Check if feature geometry is Polygon or MultiPolygon
 */
export declare function isPolygonal(feature: Feature): boolean;
/**
 * Round coordinate to 8 decimal places
 */
export declare function roundCoordinate(val: number): number;
/**
 * Rewind polygon rings
 * @param feat GeoJSON Feature
 * @param outer desired orientation of outer ring (true = clockwise)
 */
export declare function rewind(feat: Feature, outer: boolean): void;
