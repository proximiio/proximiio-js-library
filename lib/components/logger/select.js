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
export default class SelectLogger {
    constructor(data) {
        this.clickedElementId = data.clickedElementId;
        this.clickedElementTitle = data.clickedElementTitle;
        this.clickedElementType = data.clickedElementType;
        this.source = data.source;
        this.kioskId = data.kioskId;
        this.metadata = data.metadata;
        this.logSelectedElement();
    }
    saveLog() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield axios.post(`web-analytics/collector/clicks`, this);
            }
            catch (e) {
                console.error(`Log saving failed, ${e.message}`);
            }
        });
    }
    logSelectedElement() {
        this.saveLog();
    }
}
