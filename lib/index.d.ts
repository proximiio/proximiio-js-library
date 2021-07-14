import { Map } from './components/map/main';
import { Select } from './components/select/main';
declare const _default: {
    Auth: {
        login: (email: string, password: string) => Promise<import("axios").AxiosResponse<any>>;
        loginWithToken: (token: string) => Promise<import("axios").AxiosResponse<any>>;
    };
    Places: {
        getPlaces: (limit?: number | undefined, skip?: number | undefined, order?: string | undefined, dir?: string | undefined, filterByIndex?: string | undefined, q?: string | undefined, filter?: string | undefined) => Promise<{
            data: import("./models/place").PlaceModel[];
            total: number;
        }>;
        getPlaceById: (placeId: string) => Promise<import("./models/place").PlaceModel>;
    };
    Floors: {
        getFloors: (limit?: number | undefined, skip?: number | undefined, order?: string | undefined, dir?: string | undefined, filterByIndex?: string | undefined, q?: string | undefined) => Promise<{
            data: import("./models/floor").FloorModel[];
            total: number;
        }>;
        getPlaceFloors: (placeId: string) => Promise<import("./models/floor").FloorModel[]>;
    };
    Map: typeof Map;
    Select: typeof Select;
};
export default _default;
