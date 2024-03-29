import BaseLayer, { Serializable } from './base_layer';
export class PaintProperties extends Serializable {
    constructor(data) {
        super();
        this.fillExtrusionColor = data['fill-extrusion-color'] || '#000000';
        this.fillExtrusionOpacity = data['fill-extrusion-opacity'] || 1;
        this.fillExtrusionTranslate = data['fill-extrusion-translate'] || [0, 0];
        this.fillExtrusionTranslateAnchor = data['fill-extrusion-translate-anchor'] || 'map';
        this.fillExtrusionPattern = data['fill-extrusion-pattern'];
        this.fillExtrusionHeight = data['fill-extrusion-height'] || 0;
        this.fillExtrusionBase = data['fill-extrusion-base'] || 0;
        this.fillExtrusionVerticalGradient = data['fill-extrusion-vertical-gradient'] || true;
    }
}
export class LayoutProperties extends Serializable {
    constructor(data) {
        super();
        this.visibility = data.visibility || 'visible';
    }
}
export default class FillExtrusionLayer extends BaseLayer {
    constructor(data) {
        super(data);
        this.paint = new PaintProperties(data.paint || {});
        this.layout = new LayoutProperties(data.layout || {});
    }
}
