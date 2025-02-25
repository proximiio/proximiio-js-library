import FillExtrusionLayer, { PaintProperties } from './layers/fill_extrusion_layer';
import LineLayer, {
  LayoutProperties as LineLayoutProperties,
  PaintProperties as LinePaintProperties,
} from './layers/line_layer';
import SymbolLayer, { LayoutProperties, PaintProperties as PaintPropertiesSymbol } from './layers/symbol_layer';
import { PolygonOptions } from './main';

export class PolygonsLayer extends FillExtrusionLayer {
  constructor(data: PolygonOptions) {
    super(data);
    this.id = `polygons-custom`;
    this.type = 'fill-extrusion';
    this.source = 'main';
    this.filter = [
      'all',
      ['>=', ['zoom'], ['get', 'dynamic_minZoom']],
      ['<=', ['zoom'], ['get', 'dynamic_maxZoom']],
      ['==', ['get', 'type', ['get', '_dynamic']], `polygons-custom`],
      ['==', ['to-number', ['get', 'level']], 0],
    ];
    this.paint = new PaintProperties({
      'fill-extrusion-height': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        ['get', 'dynamic_selectedHeight'],
        ['boolean', ['feature-state', 'hover'], false],
        ['get', 'dynamic_hoverHeight'],
        ['boolean', ['feature-state', 'active'], false],
        ['get', 'dynamic_activeHeight'],
        ['boolean', ['feature-state', 'disabled'], false],
        ['get', 'dynamic_disabledHeight'],
        ['get', 'dynamic_defaultHeight'],
      ],
      'fill-extrusion-base': ['get', 'dynamic_base'],

      'fill-extrusion-opacity': data.opacity,

      'fill-extrusion-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        ['get', 'dynamic_selectedColor'],
        ['boolean', ['feature-state', 'hover'], false],
        ['get', 'dynamic_hoverColor'],
        ['boolean', ['feature-state', 'active'], false],
        ['get', 'dynamic_activeColor'],
        ['boolean', ['feature-state', 'disabled'], false],
        ['get', 'dynamic_disabledColor'],
        ['get', 'dynamic_defaultColor'],
      ],
    });
  }
}

export class PolygonIconsLayer extends SymbolLayer {
  constructor(data: PolygonOptions) {
    super(data);
    this.id = `polygons-icons`;
    this.type = 'symbol';
    this.source = 'main';
    this.filter = [
      'all',
      ['>=', ['zoom'], ['get', 'dynamic_iconMinZoom']],
      ['<=', ['zoom'], ['get', 'dynamic_iconMaxZoom']],
      ['==', ['get', 'type', ['get', '_dynamic']], `polygons-label`],
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
      ['any', ['!', ['has', 'available']], ['==', ['get', 'available'], true]],
    ];
    this.layout = new LayoutProperties({
      'icon-image': ['get', 'id'],
      'symbol-placement': data.symbolPlacement,
      'icon-size': ['interpolate', ['exponential', 0.5], ['zoom'], 17, 0.1, 22, 0.5],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-keep-upright': true,
    });
    this.paint = new PaintPropertiesSymbol({
      'icon-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        1,
        ['boolean', ['feature-state', 'hover'], false],
        1,
        ['boolean', ['feature-state', 'active'], false],
        1,
        ['boolean', ['feature-state', 'disabled'], false],
        ['get', 'dynamic_disabledOpacity'],
        ['get', 'dynamic_disabledOpacity'],
      ],
    });
  }
}

export class PolygonTitlesLayer extends SymbolLayer {
  constructor(data: PolygonOptions) {
    super(data);
    this.id = `polygons-labels`;
    this.type = 'symbol';
    this.source = 'main';
    this.filter = [
      'all',
      ['>=', ['zoom'], ['get', 'dynamic_labelMinZoom']],
      ['<=', ['zoom'], ['get', 'dynamic_labelMaxZoom']],
      ['==', ['get', 'type', ['get', '_dynamic']], `polygons-label`],
      [
        'any',
        ['all', ['!', ['has', 'icon_only']], ['!', ['has', 'text_only']]],
        ['all', ['has', 'text_only'], ['==', ['get', 'text_only'], true]],
        [
          'all',
          ['has', 'icon_only'],
          ['has', 'text_only'],
          ['==', ['get', 'text_only'], false],
          ['==', ['get', 'icon_only'], false],
        ],
      ],
      ['==', ['to-number', ['get', 'level']], 0],
      ['any', ['!', ['has', 'available']], ['==', ['get', 'available'], true]],
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
        ['get', 'dynamic_selectedTextColor'],
        ['boolean', ['feature-state', 'hover'], false],
        ['get', 'dynamic_hoverTextColor'],
        ['boolean', ['feature-state', 'active'], false],
        ['get', 'dynamic_activeTextColor'],
        ['boolean', ['feature-state', 'disabled'], false],
        ['get', 'dynamic_disabledTextColor'],
        ['get', 'dynamic_defaultTextColor'],
      ],
    });
  }
}

export class PolygonTitlesLineLayer extends LineLayer {
  constructor(data: PolygonOptions) {
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
