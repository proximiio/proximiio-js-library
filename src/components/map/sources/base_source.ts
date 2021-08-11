import { Eventable } from '../../../eventable';

export type BaseSourceType = 'vector' | 'raster' | 'raster-dem' | 'geojson' | 'image' | 'video';

export default class BaseSource extends Eventable {
  id: string;
  type: BaseSourceType;

  constructor(id: string, type: BaseSourceType) {
    super();
    this.id = id;
    this.type = type;
  }

  get source() {
    return {
      type: this.type,
    };
  }
}
