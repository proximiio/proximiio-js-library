import { uuidv4 } from '../common';
export default class PersonModel {
    constructor(data) {
        this.id = data.id ? data.id : uuidv4();
        this.lat = data.lat;
        this.lng = data.lng;
        this.level = data.level;
    }
    updatePosition(data) {
        this.lat = data.lat;
        this.lng = data.lng;
        this.level = data.level;
    }
}
