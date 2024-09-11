import { Eventable } from '../../../eventable';
import { FloorModel } from '../../../models/floor';
export default class ImageSourceManager extends Eventable {
    sources: string[];
    layers: string[];
    floors: FloorModel[];
    belowLayer: string;
    enabled: boolean;
    constructor();
    initialize({ floors }: {
        floors: FloorModel[];
    }): Promise<void>;
    setLevel(map: maplibregl.Map, level: number, state: any): void;
}
