export declare const POI_TYPE: {
    POI: string;
    HAZARD: string;
    DOOR: string;
    ENTRANCE: string;
    TICKET_GATE: string;
    DECISION: string;
    LANDMARK: string;
    ELEVATOR: string;
    ESCALATOR: string;
    STAIRCASE: string;
    TEXT: string;
};
export default class PoiType {
    type: string;
    title: string;
    icon: string;
    constructor(type: string, title: string, icon: string);
}
