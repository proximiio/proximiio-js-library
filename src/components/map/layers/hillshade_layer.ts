import BaseLayer, { Serializable } from './base_layer';

export class PaintProperties extends Serializable {
  hillshadeIlluminationDirection: number;
  hillshadeIlluminationAnchor: string;
  hillshadeExaggeration: number;
  hillshadeShadowColor: string;
  hillshadeHighlightColor: string;
  hillshadeAccentColor: string;

  constructor(data: any) {
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
  visibility: 'visible' | 'none';

  constructor(data: any) {
    super();
    this.visibility = data.visibility || 'visible';
  }
}

export default class HillShadeLayer extends BaseLayer {
  paint: PaintProperties;
  layout: LayoutProperties;

  constructor(data: any) {
    super(data);
    this.paint = new PaintProperties(data.paint || {});
    this.layout = new LayoutProperties(data.layout || {});
  }
}
