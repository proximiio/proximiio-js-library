import BaseLayer, { Serializable } from './base_layer';
export class PaintProperties extends Serializable {
    constructor(data) {
        super();
        this.heatmapRadius = data['heatmap-radius'] || 30;
        this.heatmapWeight = data['heatmap-weight'] || 1;
        this.heatmapIntensity = data['heatmap-intensity'] || 1;
        this.heatmapOpacity = data['heatmap-opacity'] || 1;
        this.heatmapColor = data['heatmap-color'] || '';
    }
}
export class LayoutProperties extends Serializable {
    constructor(data) {
        super();
        this.visibility = data.visibility || 'visible';
    }
}
export default class HeatmapLayer extends BaseLayer {
    constructor(data) {
        super(data);
        this.paint = new PaintProperties(data.paint || {});
        this.layout = new LayoutProperties(data.layout || {});
    }
}
