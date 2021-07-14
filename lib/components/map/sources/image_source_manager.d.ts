/// <reference types="mapbox-gl" />
import { Eventable } from '../../../eventable';
import { FloorModel } from '../../../models/floor';
export default class ImageSourceManager extends Eventable {
    sources: string[];
    layers: string[];
    floors: {
        data: FloorModel[];
        total: number;
    };
    belowLayer: string;
    enabled: boolean;
    constructor();
    initialize(): Promise<void>;
    setLevel(map: mapboxgl.Map, level: number): void;
}
