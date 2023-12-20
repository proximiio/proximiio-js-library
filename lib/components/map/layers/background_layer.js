import BaseLayer, { Serializable } from './base_layer';
export class PaintProperties extends Serializable {
    constructor(data) {
        super();
        this.backgroundColor = data['background-color'] || '#000000';
        this.backgroundPattern = data['background-pattern'];
        this.backgroundOpacity = data['background-opacity'] || 1;
    }
}
export class LayoutProperties extends Serializable {
    constructor(data) {
        super();
        this.visibility = data.visibility || 'visible';
    }
}
export default class BackgroundLayer extends BaseLayer {
    constructor(data) {
        super(data);
        this.paint = new PaintProperties(data.paint || {});
        this.layout = new LayoutProperties(data.layout || {});
    }
}
