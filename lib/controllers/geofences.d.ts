import { GeofenceModel } from '../models/geofence';
export declare const getGeofences: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string, filter?: string) => Promise<{
    data: GeofenceModel[];
    total: number;
}>;
export declare const getGeofencesBundle: ({ bundleUrl, }: {
    bundleUrl: string;
}) => Promise<{
    data: GeofenceModel[];
    total: number;
}>;
export declare const getGeofenceById: (geofenceId: string) => Promise<GeofenceModel>;
export declare const getGeofenceByIdBundle: ({ bundleUrl, geofenceId, }: {
    bundleUrl: string;
    geofenceId: string;
}) => Promise<GeofenceModel>;
declare const _default: {
    getGeofences: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string, filter?: string) => Promise<{
        data: GeofenceModel[];
        total: number;
    }>;
    getGeofencesBundle: ({ bundleUrl, }: {
        bundleUrl: string;
    }) => Promise<{
        data: GeofenceModel[];
        total: number;
    }>;
    getGeofenceById: (geofenceId: string) => Promise<GeofenceModel>;
    getGeofenceByIdBundle: ({ bundleUrl, geofenceId, }: {
        bundleUrl: string;
        geofenceId: string;
    }) => Promise<GeofenceModel>;
};
export default _default;
