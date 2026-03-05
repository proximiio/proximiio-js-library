import BaseModel from './base';
export class GeofenceModel extends BaseModel {
    constructor(data) {
        super(data);
        this.name = data.name;
        this.type = data.type;
        this.area = data.area;
        this.address = data.address;
        this.radius = data.radius;
        this.polygon = data.polygon;
        this.metadata = data.metadata;
        this.place_id = data.place_id;
        this.place_name = data.place_name;
        this.floor_id = data.floor_id;
        this.floor_name = data.floor_name;
        this.department_id = data.department_id;
        this.department_name = data.department_name;
        this.remote_id = data.remote_id;
    }
}
