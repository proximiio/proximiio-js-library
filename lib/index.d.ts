import { Map } from './components/map/main';
import { Select } from './components/select/main';
import SelectLogger from './components/logger/select';
import SearchLogger from './components/logger/search';
import { ImageDetection } from './components/imageDetection/main';
import InteractionLogger from './components/logger/interaction';
import StoreFeedback from './components/feedback/store';
import VisitorFeedback from './components/feedback/visitor';
declare const _default: {
    Auth: {
        login: (email: string, password: string) => Promise<import("axios").AxiosResponse<any, any>>;
        loginWithToken: (token: string) => Promise<import("axios").AxiosResponse<any, any>>;
        setToken: (token: string) => Promise<string>;
        getUserConfig: () => Promise<any>;
        getCurrentUser: () => Promise<any>;
    };
    Places: {
        getPlaces: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string, filter?: string) => Promise<{
            data: import("./models/place").PlaceModel[];
            total: number;
        }>;
        getPlaceById: (placeId: string) => Promise<import("./models/place").PlaceModel>;
        getPlaceByIdBundle: ({ bundleUrl, placeId, }: {
            bundleUrl: string;
            placeId: string;
        }) => Promise<import("./models/place").PlaceModel>;
    };
    Floors: {
        getFloors: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string) => Promise<{
            data: import("./models/floor").FloorModel[];
            total: number;
        }>;
        getFloorsBundle: ({ bundleUrl, }: {
            bundleUrl: string;
        }) => Promise<{
            data: import("./models/floor").FloorModel[];
            total: number;
        }>;
        getPlaceFloors: (placeId: string) => Promise<import("./models/floor").FloorModel[]>;
        getFloorById: (floorId: string) => Promise<import("./models/floor").FloorModel>;
        getFloorByIdBundle: ({ bundleUrl, floorId, }: {
            bundleUrl: string;
            floorId: string;
        }) => Promise<import("./models/floor").FloorModel>;
    };
    Kiosks: {
        getKiosks: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string, filter?: string) => Promise<{
            data: import("./models/kiosk").KioskModel[];
            total: number;
        }>;
        getKiosksBundle: ({ bundleUrl, }: {
            bundleUrl: string;
        }) => Promise<{
            data: import("./models/kiosk").KioskModel[];
            total: number;
        }>;
        getKioskById: (kioskId: string) => Promise<import("./models/kiosk").KioskModel>;
        getKioskByIdBundle: ({ bundleUrl, kioskId, }: {
            bundleUrl: string;
            kioskId: string;
        }) => Promise<import("./models/kiosk").KioskModel>;
    };
    Ads: {
        getAds: () => Promise<{
            data: import("./models/ad").AdModel[];
        }>;
    };
    Geo: {
        getFeatures: ({ initPolygons, polygonLayers, autoLabelLines, hiddenAmenities, useTimerangeData, filter, featuresMaxBounds, localSources, }: {
            initPolygons?: boolean;
            polygonLayers: import("./components/map/main").PolygonLayer[];
            autoLabelLines?: boolean;
            hiddenAmenities?: string[];
            useTimerangeData?: boolean;
            filter?: {
                key: string;
                value: string;
                hideIconOnly?: boolean;
            };
            featuresMaxBounds?: import("maplibre-gl").LngLatBoundsLike;
            localSources?: {
                features?: import("./models/feature").FeatureCollection;
            };
        }) => Promise<import("./models/feature").FeatureCollection>;
        addFeatures: (featureCollection: import("@turf/helpers").FeatureCollection<import("@turf/helpers").Geometry | import("@turf/helpers").GeometryCollection, {
            [name: string]: any;
        }>) => Promise<void>;
        updateFeature: (featureData: import("@turf/helpers").Feature<import("@turf/helpers").Geometry | import("@turf/helpers").GeometryCollection, {
            [name: string]: any;
        }>, featureId: string) => Promise<void>;
        deleteFeatures: (featureCollection: import("@turf/helpers").FeatureCollection<import("@turf/helpers").Geometry | import("@turf/helpers").GeometryCollection, {
            [name: string]: any;
        }>) => Promise<void>;
        getAmenities: ({ amenityIdProperty, localSources, }: {
            amenityIdProperty?: string;
            localSources?: {
                amenities?: import("./models/amenity").AmenityModel[];
            };
        }) => Promise<any>;
        getPois: () => Promise<import("./models/feature").default[]>;
        getFeatureById: (featureId: string) => Promise<import("./models/feature").default>;
        getFeatureByIdBundle: ({ bundleUrl, featureId, }: {
            bundleUrl: string;
            featureId: string;
        }) => Promise<import("./models/feature").default>;
    };
    Map: typeof Map;
    Select: typeof Select;
    SelectLogger: typeof SelectLogger;
    SearchLogger: typeof SearchLogger;
    InteractionLogger: typeof InteractionLogger;
    StoreFeedback: typeof StoreFeedback;
    VisitorFeedback: typeof VisitorFeedback;
};
export default _default;
export { ImageDetection };
