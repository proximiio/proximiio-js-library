var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { axios } from '../common';
import { PlaceModel } from '../models/place';
export const getPlaces = (limit, skip, order, dir, filterByIndex, q, filter) => __awaiter(void 0, void 0, void 0, function* () {
    let queryParams = ``;
    if (limit) {
        queryParams += `?limit=${limit}`;
    }
    if (skip) {
        queryParams += `&skip=${skip}`;
    }
    if (order) {
        queryParams += `&order=${order}`;
    }
    if (dir) {
        queryParams += `&dir=${dir}`;
    }
    if (filterByIndex) {
        queryParams += `&filterByIndex=${filterByIndex}`;
    }
    if (q) {
        queryParams += `&q=${q}`;
    }
    if (filter) {
        queryParams += `&filter=${q}`;
    }
    try {
        const res = yield axios.get(`core/places${queryParams}`);
        return {
            data: res.data.map((item) => new PlaceModel(item)),
            total: +res.headers.searchcount,
        };
    }
    catch (e) {
        throw new Error(`Retrieving places failed, ${e.message}`);
    }
});
export const getPlaceById = (placeId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield axios.get(`core/places/${placeId}`);
        return new PlaceModel(res.data);
    }
    catch (e) {
        throw new Error(`Retrieving place by id '${placeId}' failed, ${e.message}`);
    }
});
export default {
    getPlaces,
    getPlaceById,
};
