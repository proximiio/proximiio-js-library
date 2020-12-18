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
  TEXT: 'text'
};

export default class PoiType {
  type: string;
  title: string;
  icon: string;

  constructor(type: string, title: string, icon: string) {
    this.type = type;
    this.title = title;
    this.icon = icon;
  }
}
