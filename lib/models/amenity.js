import BaseModel from './base';
export class AmenityModel extends BaseModel {
    constructor(data) {
        super(data);
        this.category = data.category;
        this.iconOffset = data.iconOffset;
        this.list = data.list;
        this.title = data.title;
        this.description = data.description;
        this.icon = data.icon;
    }
    get hasIcon() {
        return !!this.icon;
    }
}
