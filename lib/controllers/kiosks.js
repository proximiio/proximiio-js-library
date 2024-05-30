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
import { KioskModel } from '../models/kiosk';
export const getKiosks = (limit, skip, order, dir, filterByIndex, q, filter) => __awaiter(void 0, void 0, void 0, function* () {
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
        const res = yield axios.get(`core/kiosks${queryParams}`);
        return {
            data: res.data.map((item) => new KioskModel(item)),
            total: +res.headers.searchcount,
        };
    }
    catch (e) {
        throw new Error(`Retrieving kiosks failed, ${e.message}`);
    }
});
export const getKiosksBundle = ({ bundleUrl, }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch(`${bundleUrl}/kiosks.json`);
        const data = yield res.json();
        return {
            data: data.map((item) => new KioskModel(item)),
            total: +data.length,
        };
    }
    catch (e) {
        throw new Error(`Retrieving floors failed, ${e.message}`);
    }
});
export const getKioskById = (kioskId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield axios.get(`core/kiosks/${kioskId}`);
        return new KioskModel(res.data);
    }
    catch (e) {
        throw new Error(`Retrieving kiosk by id '${kioskId}' failed, ${e.message}`);
    }
});
export default {
    getKiosks,
    getKioskById,
};
