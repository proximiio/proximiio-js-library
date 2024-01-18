import BaseModel from './base';

export class KioskModel extends BaseModel {
  name: string;
  coordinates: {
    lat: number,
    lng: number,
  };
  level: number;
  zoom?: number;
  bearing?: number;
  pitch?: number;
  bounds?: [[number, number], [number, number]];

  constructor(data: any) {
    super(data);
    this.name = data.name;
    this.coordinates = data.coordinates ? data.coordinates : { lat: 60.1669635, lng: 24.9217484 };
    this.level = data.level;
    this.zoom  = data.zoom;
    this.bearing = data.bearing;
    this.pitch = data.pitch;
    this.bounds = data.bounds;
  }

  get hasLocation() {
    return !isNaN(this.coordinates.lat) && !isNaN(this.coordinates.lng);
  }
}
