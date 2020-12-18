import BaseModel from './base';

export class PlaceModel extends BaseModel {
  name: string;
  address: string;
  location: {
    lat: number,
    lng: number,
    zoom?: number
  };
  tags?: string[];
  remoteId?: string;

  constructor(data: any) {
    super(data);
    this.name = data.name;
    this.address = data.address;
    this.location = data.location ? data.location : { lat: 60.1669635, lng: 24.9217484 }
    this.tags = data.tags;
    this.remoteId = data.remote_id;
  }

  get hasLocation() {
    return !isNaN(this.location.lat) && !isNaN(this.location.lng);
  }
}
