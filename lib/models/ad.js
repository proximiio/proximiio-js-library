import BaseModel from './base';
export class AdModel extends BaseModel {
    constructor(data) {
        super(data);
        this.name = data.name;
        this.url = data.url;
        this.isDefault = data.isDefault;
        this.isActive = data.isActive;
        this.features = data.features;
        this.amenities = data.amenities;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
    }
}
