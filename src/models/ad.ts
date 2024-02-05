import BaseModel from './base';

export class AdModel extends BaseModel {
  name: string;
  url: string;
  isDefault: boolean;
  features?: string[];
  amenities?: string[];

  constructor(data: any) {
    super(data);
    this.name = data.name;
    this.url = data.url;
    this.isDefault = data.isDefault;
    this.features = data.features;
    this.amenities = data.amenities;
  }
}
