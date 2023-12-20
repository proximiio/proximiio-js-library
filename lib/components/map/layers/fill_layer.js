import BaseLayer, { Serializable } from './base_layer';
export class PaintProperties extends Serializable {
    constructor(data) {
        super();
        this.fillAntialias = data['fill-antialias'] || true;
        this.fillOpacity = data['fill-opacity'] || 1;
        this.fillColor = data['fill-color'] || '#000000';
        this.fillOutlineColor = data['fill-outline-color'];
        this.fillTranslate = data['fill-translate'] || [0, 0];
        this.fillTranslateAnchor = data['fill-translate-anchor'] || 'map';
        this.fillPattern = data['fill-pattern'];
    }
}
export class LayoutProperties extends Serializable {
    constructor(data) {
        super();
        // this.fillSortKey = data['fill-sort-key']
        this.visibility = data.visibility || 'visible';
    }
}
export default class FillLayer extends BaseLayer {
    constructor(data) {
        super(data);
        this.paint = new PaintProperties(data.paint || {});
        this.layout = new LayoutProperties(data.layout || {});
    }
}
