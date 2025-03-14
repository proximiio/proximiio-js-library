import BaseModel from './base';
export class KioskModel extends BaseModel {
    constructor(data) {
        super(data);
        this.name = data.name;
        this.coordinates = data.coordinates ? data.coordinates : { lat: 60.1669635, lng: 24.9217484 };
        this.level = data.level;
        this.zoom = data.zoom;
        this.bearing = data.bearing;
        this.pitch = data.pitch;
        this.bounds = data.bounds;
        this.floor_id = data.floor_id;
    }
    get hasLocation() {
        return !isNaN(this.coordinates.lat) && !isNaN(this.coordinates.lng);
    }
}
