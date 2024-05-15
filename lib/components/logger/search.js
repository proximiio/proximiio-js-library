var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { axios } from '../../common';
export default class SearchLogger {
    constructor(data) {
        this.searchValue = data.searchValue;
        this.success = data.success;
        this.resultId = data.resultId;
        this.resultTitle = data.resultTitle;
        this.resultAmenity = data.resultAmenity;
        this.resultAmenityCategory = data.resultAmenityCategory;
        this.kioskId = data.kioskId;
        this.metadata = data.metadata;
        this.language = data.language;
        this.session = data.session;
        this.logSearch();
    }
    saveLog() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield axios.post(`web-analytics/collector/searches`, this);
            }
            catch (e) {
                console.error(`Log saving failed, ${e.message}`);
            }
        });
    }
    logSearch() {
        this.saveLog();
    }
}
