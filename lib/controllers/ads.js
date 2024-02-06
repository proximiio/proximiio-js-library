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
import { AdModel } from '../models/ad';
export const getAds = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield axios.get(`marketing/ads`);
        return {
            data: res.data.map((item) => new AdModel(item)),
        };
    }
    catch (e) {
        throw new Error(`Retrieving kiosks failed, ${e.message}`);
    }
});
export default {
    getAds,
};
