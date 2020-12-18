import BaseModel from './base';

export class AmenityModel extends BaseModel {
  category: string;
  iconOffset: [number, number];
  list: boolean;
  title: string;
  description: string;
  icon: string;

  constructor(data: any) {
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
