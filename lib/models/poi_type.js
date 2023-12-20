export const POI_TYPE = {
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
    RAMP: 'ramp',
    TEXT: 'text',
};
export default class PoiType {
    constructor(type, title, icon) {
        this.type = type;
        this.title = title;
        this.icon = icon;
    }
}
