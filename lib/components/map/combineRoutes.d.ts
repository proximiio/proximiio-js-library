type Geometry = {
    type: 'LineString' | 'Point';
    coordinates: number[][] | number[];
};
type Feature<T = any> = {
    type: 'Feature';
    geometry: Geometry;
    properties: T;
    id?: string;
};
type PathFeature = Feature<{
    level?: number;
    step?: number;
    source?: string;
    [key: string]: any;
}>;
type PointFeature = Feature<{
    level?: number;
    source?: string;
    [key: string]: any;
}>;
type RouteInput = {
    paths?: Record<string, PathFeature>;
    points?: PointFeature[];
    levelPaths?: Record<string, {
        level: number;
        paths: PathFeature[];
    }>;
    levelPoints?: Record<string, PointFeature[]>;
    details?: {
        distance?: number;
        duration?: {
            shortest?: number;
            realistic?: number;
        };
    };
};
type CombinedRoute = {
    paths: Record<string, PathFeature>;
    points: PointFeature[];
    levelPaths: Record<string, {
        level: number;
        paths: PathFeature[];
    }>;
    levelPoints: Record<string, PointFeature[]>;
    fullPath: Feature<{}>;
    details: {
        distance: number;
        duration: {
            shortest: number;
            realistic: number;
        };
    };
};
declare function combineRoutes(cityRoute: RouteInput, mallRoute: RouteInput, order?: 'city-first' | 'mall-first'): CombinedRoute;
export default combineRoutes;
