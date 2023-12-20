import BaseLayer, { Serializable } from './base_layer';
export class PaintProperties extends Serializable {
    constructor(data) {
        super();
        this.hillshadeIlluminationDirection = data['hillshade-illumination-direction'] || 335;
        this.hillshadeIlluminationAnchor = data['hillshade-illumination-anchor'] || 'viewport';
        this.hillshadeExaggeration = data['hillshade-exaggeration'] || 0.5;
        this.hillshadeShadowColor = data['hillshade-shadow-color'] || '#000000"';
        this.hillshadeHighlightColor = data['hillshade-highlight-color'] || '#ffffff';
        this.hillshadeAccentColor = data['hillshade-accent-color'] || '#000000';
    }
}
export class LayoutProperties extends Serializable {
    constructor(data) {
        super();
        this.visibility = data.visibility || 'visible';
    }
}
export default class HillShadeLayer extends BaseLayer {
    constructor(data) {
        super(data);
        this.paint = new PaintProperties(data.paint || {});
        this.layout = new LayoutProperties(data.layout || {});
    }
}
