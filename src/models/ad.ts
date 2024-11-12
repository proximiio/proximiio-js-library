import BaseModel from './base';

export class AdModel extends BaseModel {
  name: string;
  url: string;
  isDefault: boolean;
  isActive: boolean;
  features?: string[];
  amenities?: string[];
  startDate?: number;
  endDate?: number;

  constructor(data: any) {
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
