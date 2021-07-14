import BaseLayer, { Serializable } from './base_layer';
export declare class PaintProperties extends Serializable {
    hillshadeIlluminationDirection: number;
    hillshadeIlluminationAnchor: string;
    hillshadeExaggeration: number;
    hillshadeShadowColor: string;
    hillshadeHighlightColor: string;
    hillshadeAccentColor: string;
    constructor(data: any);
}
export declare class LayoutProperties extends Serializable {
    visibility: 'visible' | 'none';
    constructor(data: any);
}
export default class HillShadeLayer extends BaseLayer {
    paint: PaintProperties;
    layout: LayoutProperties;
    constructor(data: any);
}
