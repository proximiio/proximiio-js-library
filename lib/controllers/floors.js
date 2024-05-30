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
import { FloorModel } from '../models/floor';
export const getFloors = (limit, skip, order, dir, filterByIndex, q) => __awaiter(void 0, void 0, void 0, function* () {
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
    try {
        const res = yield axios.get(`core/floors${queryParams}`);
        return {
            data: res.data.map((item) => new FloorModel(item)),
            total: +res.headers.searchcount,
        };
    }
    catch (e) {
        throw new Error(`Retrieving floors failed, ${e.message}`);
    }
});
export const getFloorsBundle = ({ bundleUrl, }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch(`${bundleUrl}/floors.json`);
        const data = yield res.json();
        return {
            data: data.map((item) => new FloorModel(item)),
            total: +data.length,
        };
    }
    catch (e) {
        throw new Error(`Retrieving floors failed, ${e.message}`);
    }
});
export const getPlaceFloors = (placeId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield axios.get(`core/floors?skip=0&limit=1000&filter=place_id:${placeId}`);
        return res.data.map((item) => new FloorModel(item));
    }
    catch (e) {
        throw new Error(`Retrieving floors for place '${placeId}' failed, ${e.message}`);
    }
});
export const getPlaceFloorsBundle = ({ bundleUrl, placeId, }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch(`${bundleUrl}/floors.json`);
        const data = yield res.json();
        return data
            .filter((item) => item.place_id === placeId)
            .map((item) => new FloorModel(item));
    }
    catch (e) {
        throw new Error(`Retrieving floors for place '${placeId}' failed, ${e.message}`);
    }
});
export default {
    getFloors,
    getPlaceFloors,
};
