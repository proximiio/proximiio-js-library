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
    };
    Floors: {
        getFloors: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string) => Promise<{
            data: import("./models/floor").FloorModel[];
            total: number;
        }>;
        getPlaceFloors: (placeId: string) => Promise<import("./models/floor").FloorModel[]>;
    };
    Kiosks: {
        getKiosks: (limit?: number, skip?: number, order?: string, dir?: string, filterByIndex?: string, q?: string, filter?: string) => Promise<{
            data: import("./models/kiosk").KioskModel[];
            total: number;
        }>;
        getKioskById: (kioskId: string) => Promise<import("./models/kiosk").KioskModel>;
    };
    Ads: {
        getAds: () => Promise<{
            data: import("./models/ad").AdModel[];
        }>;
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
