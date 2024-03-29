import BaseLayer, { Serializable } from './base_layer';
export declare class PaintProperties extends Serializable {
    fillExtrusionColor: any;
    fillExtrusionOpacity?: number;
    fillExtrusionTranslate?: [number, number];
    fillExtrusionTranslateAnchor?: 'map' | 'viewport';
    fillExtrusionPattern?: 'string';
    fillExtrusionHeight: number;
    fillExtrusionBase?: number;
    fillExtrusionVerticalGradient?: boolean;
    constructor(data: any);
}
export declare class LayoutProperties extends Serializable {
    visibility: 'visible' | 'none';
    constructor(data: any);
}
export default class FillExtrusionLayer extends BaseLayer {
    paint: PaintProperties;
    layout: LayoutProperties;
    constructor(data: any);
}
