import BaseLayer, { Serializable } from './base_layer';

export class PaintProperties extends Serializable {
  fillAntialias: boolean;
  fillOpacity: number;
  fillColor: string;
  fillOutlineColor?: string;
  fillTranslate: [number, number];
  fillTranslateAnchor: 'map' | 'viewport';
  fillPattern?: string;

  constructor(data: any) {
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
  fillSortKey?: number;
  visibility: 'visible' | 'none';

  constructor(data: any) {
    super();
    // this.fillSortKey = data['fill-sort-key']
    this.visibility = data.visibility || 'visible';
  }
}

export default class FillLayer extends BaseLayer {
  paint: PaintProperties;
  layout: LayoutProperties;

  constructor(data: any) {
    super(data);
    this.paint = new PaintProperties(data.paint || {});
    this.layout = new LayoutProperties(data.layout || {});
  }
}
