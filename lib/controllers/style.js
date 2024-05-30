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
import StyleModel from '../models/style';
export const getStyle = (id) => __awaiter(void 0, void 0, void 0, function* () {
    let url = '/v5/geo/style';
    if (id) {
        url += `s/${id}`;
    }
    const res = yield axios.get(url);
    return new StyleModel(res.data);
});
export const getStyleBundle = ({ bundleUrl }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch(`${bundleUrl}/style.json`);
        const data = yield res.json();
        return new StyleModel(data);
    }
    catch (e) {
        throw new Error(`Retrieving style failed, ${e.message}`);
    }
});
export const getStyles = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = '/v5/geo/styles';
    const res = yield axios.get(url);
    return res.data.map((item) => new StyleModel(item));
});
export const getStylesBundle = ({ bundleUrl }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const res = yield fetch(`${bundleUrl}/styles.json`);
        const data = yield res.json();
        return data.map((item) => new StyleModel(item));
    }
    catch (e) {
        throw new Error(`Retrieving styles failed, ${e.message}`);
    }
});
export const getStyleUrl = () => {
    return `https://api.proximi.fi/v5/geo/style?token=${axios.defaults.headers.common.Authorization}`;
};
