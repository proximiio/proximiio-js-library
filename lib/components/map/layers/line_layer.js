import BaseLayer, { Serializable } from './base_layer';
export class PaintProperties extends Serializable {
    constructor(data) {
        super();
        this.lineColor = data['line-color'] || '#000000';
        this.lineOpacity = data['line-opacity'] || 1;
        this.lineTranslate = data['line-translate'] || [0, 0];
        this.lineTranslateAnchor = data['line-translate-anchor'] || 'map';
        this.lineWidth = data['line-width'] || 1;
        this.lineGapWidth = data['line-gap-width'] || 0;
        this.lineOffset = data['line-offset'] || 0;
        this.lineBlur = data['line-blur'] || 0;
        this.lineDasharray = data['line-dasharray'];
        this.linePattern = data['line-pattern'];
        this.lineGradient = data['line-gradient'];
    }
}
export class LayoutProperties extends Serializable {
    constructor(data) {
        super();
        this.visibility = data.visibility || 'visible';
        this.lineCap = data['line-cap'] || 'butt';
        this.lineJoin = data['line-join'] || 'miter';
        this.lineMiterLimit = data['line-miter-limit'] || 2;
        this.lineRoundLimit = data['line-round-limit'] || 1.05;
    }
}
export default class LineLayer extends BaseLayer {
    constructor(data) {
        super(data);
        this.paint = new PaintProperties(data.paint || {});
        this.layout = new LayoutProperties(data.layout || {});
    }
}
