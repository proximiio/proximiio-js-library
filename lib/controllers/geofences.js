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
import { GeofenceModel } from '../models/geofence';
export const getGeofences = (limit, skip, order, dir, filterByIndex, q, filter) => __awaiter(void 0, void 0, void 0, function* () {
    let queryParams = ``;
    if (limit) {
        queryParams += `?limit=${limit ? limit : 1000}`;
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
        const res = yield axios.get(`core/geofences${queryParams}`);
        return {
            data: res.data.map((item) => new GeofenceModel(item)),
            total: +res.headers.searchcount,
        };
    }
    catch (e) {
        throw new Error(`Retrieving geofences failed, ${e.message}`);
    }
});
export const getGeofencesBundle = ({ bundleUrl, }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch(`${bundleUrl}/geofences.json`);
        const data = yield res.json();
        return {
            data: data.map((item) => new GeofenceModel(item)),
            total: +data.length,
        };
    }
    catch (e) {
        throw new Error(`Retrieving geofences failed, ${e.message}`);
    }
});
export const getGeofenceById = (geofenceId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield axios.get(`core/geofences/${geofenceId}`);
        return new GeofenceModel(res.data);
    }
    catch (e) {
        throw new Error(`Retrieving geofence by id '${geofenceId}' failed, ${e.message}`);
    }
});
export const getGeofenceByIdBundle = ({ bundleUrl, geofenceId, }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch(`${bundleUrl}/geofences.json`);
        const data = yield res.json();
        return data.find((item) => { var _a, _b; return ((_a = item.id) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === geofenceId.toLowerCase() || ((_b = item.name) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === geofenceId.toLowerCase(); });
    }
    catch (e) {
        throw new Error(`Retrieving geofence failed, ${e.message}`);
    }
});
export default {
    getGeofences,
    getGeofencesBundle,
    getGeofenceById,
    getGeofenceByIdBundle,
};
