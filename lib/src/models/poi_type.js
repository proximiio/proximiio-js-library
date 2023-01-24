"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POI_TYPE = void 0;
exports.POI_TYPE = {
    POI: 'poi',
    HAZARD: 'hazard',
    DOOR: 'door',
    ENTRANCE: 'entrance',
    TICKET_GATE: 'ticket_gate',
    DECISION: 'decision',
    LANDMARK: 'landmark',
    ELEVATOR: 'elevator',
    ESCALATOR: 'escalator',
    STAIRCASE: 'staircase',
    TEXT: 'text',
};
var PoiType = /** @class */ (function () {
    function PoiType(type, title, icon) {
        this.type = type;
        this.title = title;
        this.icon = icon;
    }
    return PoiType;
}());
exports.default = PoiType;
