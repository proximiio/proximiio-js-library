import { Eventable } from '../../../eventable';
export declare type BaseSourceType = 'vector' | 'raster' | 'raster-dem' | 'geojson' | 'image' | 'video';
export default class BaseSource extends Eventable {
    id: string;
    type: BaseSourceType;
    constructor(id: string, type: BaseSourceType);
    get source(): {
        type: BaseSourceType;
    };
}
