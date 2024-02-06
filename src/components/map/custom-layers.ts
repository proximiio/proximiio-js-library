import FillExtrusionLayer, { PaintProperties } from './layers/fill_extrusion_layer';
import LineLayer, {
  LayoutProperties as LineLayoutProperties,
  PaintProperties as LinePaintProperties,
} from './layers/line_layer';
import SymbolLayer, { LayoutProperties, PaintProperties as PaintPropertiesSymbol } from './layers/symbol_layer';
import { PolygonLayer, PolygonOptions } from './main';

export class PolygonsLayer extends FillExtrusionLayer {
  constructor(data: PolygonLayer) {
    super(data);
    this.id = `${data.featureType}-custom`;
    this.type = 'fill-extrusion';
    this.minzoom = data.minZoom;
    this.maxzoom = data.maxZoom;
    this.source = 'main';
    this.filter = [
      'all',
      ['==', ['get', 'type', ['get', '_dynamic']], `${data.featureType}-custom`],
      ['==', ['to-number', ['get', 'level']], 0],
    ];
    this.paint = new PaintProperties({
      'fill-extrusion-height': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        data.selectedPolygonHeight,
        ['boolean', ['feature-state', 'hover'], false],
        data.hoverPolygonHeight,
        ['boolean', ['feature-state', 'active'], false],
        data.hoverPolygonHeight,
        data.defaultPolygonHeight,
      ],
      'fill-extrusion-base': data.base,
      'fill-extrusion-opacity': data.opacity,
      'fill-extrusion-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        data.selectedPolygonColor,
        ['boolean', ['feature-state', 'hover'], false],
        data.hoverPolygonColor,
        ['boolean', ['feature-state', 'active'], false],
        data.hoverPolygonColor,
        ['boolean', ['feature-state', 'disabled'], false],
        '#8a8a8a',
        data.defaultPolygonColor,
      ],
    });
  }
}

export class PolygonIconsLayer extends SymbolLayer {
  constructor(data: PolygonOptions) {
    super(data);
    this.id = 'poi-custom-icons';
    this.type = 'symbol';
    this.minzoom = data.minZoom;
    this.maxzoom = data.maxZoom;
    this.source = 'main';
    this.filter = [
      'all',
      ['==', ['get', 'type', ['get', '_dynamic']], 'poi-custom'],
      [
        'any',
        ['all', ['!', ['has', 'icon_only']], ['!', ['has', 'text_only']]],
        ['all', ['has', 'icon_only'], ['==', ['get', 'icon_only'], true]],
        [
          'all',
          ['has', 'icon_only'],
          ['has', 'text_only'],
          ['==', ['get', 'text_only'], false],
          ['==', ['get', 'icon_only'], false],
        ],
      ],
      ['==', ['to-number', ['get', 'level']], 0],
    ];
    this.layout = new LayoutProperties({
      'icon-image': '{amenity}',
      'icon-size': ['interpolate', ['exponential', 0.5], ['zoom'], 17, 0.1, 22, 0.5],
      'text-anchor': 'top',
      'text-offset': [0, 2],
      'text-font': ['Open Sans Regular'],
      'text-size': 14,
      'symbol-placement': 'point',
      'icon-allow-overlap': true,
      'text-allow-overlap': true,
      visibility: false,
    });
  }
}

export class PolygonTitlesLayer extends SymbolLayer {
  constructor(data: PolygonLayer) {
    super(data);
    this.id = `${data.featureType}-labels`;
    this.type = 'symbol';
    this.minzoom = data.minZoom;
    this.maxzoom = data.maxZoom;
    this.source = 'main';
    this.filter = [
      'all',
      ['==', ['get', 'type', ['get', '_dynamic']], `${data.featureType}-label`],
      ['==', ['to-number', ['get', 'level']], 0],
    ];
    this.layout = new LayoutProperties({
      'symbol-placement': data.symbolPlacement,
      'text-anchor': 'center',
      'text-ignore-placement': true,
      'text-allow-overlap': true,
      'text-field': '{title}',
      'text-font': data.textFont,
      'text-size': data.labelFontSize,
      'text-letter-spacing': 0.005,
      'text-max-width': 7,
    });
    this.paint = new PaintPropertiesSymbol({
      'text-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        data.selectedLabelColor,
        ['boolean', ['feature-state', 'hover'], false],
        data.hoverLabelColor,
        data.defaultLabelColor,
      ],
    });
  }
}

export class PolygonTitlesLineLayer extends LineLayer {
  constructor(data: PolygonLayer) {
    super(data);
    this.id = `shop-labels-line`;
    this.type = 'line';
    this.minzoom = 12;
    this.maxzoom = 22;
    this.source = 'main';
    this.filter = [
      'all',
      ['==', ['get', 'type', ['get', '_dynamic']], `shop-label`],
      ['==', ['to-number', ['get', 'level']], 0],
    ];
    this.layout = new LineLayoutProperties({
      'line-join': 'round',
      'line-cap': 'round',
    });
    this.paint = new LinePaintProperties({
      'line-color': '#000',
      'line-width': 3,
    });
  }
}
