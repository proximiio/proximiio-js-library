import { Map } from './components/map/main';
import { Select } from './components/select/main';
declare const _default: {
    Auth: {
        login: (email: string, password: string) => Promise<import("axios").AxiosResponse<any, any>>;
        loginWithToken: (token: string) => Promise<import("axios").AxiosResponse<any, any>>;
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
    Map: typeof Map;
    Select: typeof Select;
};
export default _default;
