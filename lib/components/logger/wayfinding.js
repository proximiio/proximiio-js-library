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
import BaseLogger from './base';
export default class WayfindingLogger extends BaseLogger {
    constructor(data) {
        super(data);
        this.startLngLat = data.startLngLat;
        this.startLevel = data.startLevel;
        this.startSegmentId = data.startSegmentId;
        this.startSegmentName = data.startSegmentName;
        this.startGeofenceId = data.startGeofenceId;
        this.startGeofenceName = data.startGeofenceName;
        this.destinationFeatureId = data.destinationFeatureId;
        this.destinationName = data.destinationName;
        this.destinationLngLat = data.destinationLngLat;
        this.destinationLevel = data.destinationLevel;
        this.foundPath = data.foundPath;
        this.optionAvoidBarrier = data.optionAvoidBarrier;
        this.optionAvoidElevators = data.optionAvoidElevators;
        this.optionAvoidEscalators = data.optionAvoidEscalators;
        this.optionAvoidNarrowPaths = data.optionAvoidNarrowPaths;
        this.optionAvoidRamps = data.optionAvoidRamps;
        this.optionAvoidStaircases = data.optionAvoidStaircases;
        this.optionAvoidTicketGates = data.optionAvoidTicketGates;
        this.route = data.route;
        this.rerouted = data.rerouted;
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield axios.post(`v6/geo/wayfinding_logs`, [this]);
            }
            catch (e) {
                console.log(`Log saving failed, ${e.message}`);
            }
        });
    }
}
