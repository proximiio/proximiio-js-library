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
    /*this.filter = [
      'all',
      ['>=', ['zoom'], ['coalesce', ['get', 'minZoom', ['get', '_dynamic']], data.minZoom]],
      ['<=', ['zoom'], ['coalesce', ['get', 'maxZoom', ['get', '_dynamic']], data.maxZoom]],
      ['==', ['get', 'type', ['get', '_dynamic']], `polygons-custom`],
      ['==', ['to-number', ['get', 'level']], 0],
    ];
    this.paint = new PaintProperties({
      'fill-extrusion-height': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        ['coalesce', ['get', 'selectedHeight', ['get', '_dynamic']], data.selectedPolygonHeight],
        ['boolean', ['feature-state', 'hover'], false],
        ['coalesce', ['get', 'hoverHeight', ['get', '_dynamic']], data.hoverPolygonHeight],
        ['boolean', ['feature-state', 'active'], false],
        ['coalesce', ['get', 'activeHeight', ['get', '_dynamic']], data.hoverPolygonHeight],
        ['boolean', ['feature-state', 'disabled'], false],
        ['coalesce', ['get', 'disabledHeight', ['get', '_dynamic']], data.disabledPolygonHeight],
        ['coalesce', ['get', 'defaultHeight', ['get', '_dynamic']], data.defaultPolygonHeight],
      ],

      'fill-extrusion-base': ['coalesce', ['get', 'base', ['get', '_dynamic']], data.base],

      'fill-extrusion-opacity': ['coalesce', ['get', 'opacity', ['get', '_dynamic']], data.opacity],

      'fill-extrusion-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        ['coalesce', ['get', 'selectedColor', ['get', '_dynamic']], data.selectedPolygonColor],
        ['boolean', ['feature-state', 'hover'], false],
        ['coalesce', ['get', 'hoverColor', ['get', '_dynamic']], data.hoverPolygonColor],
        ['boolean', ['feature-state', 'active'], false],
        ['coalesce', ['get', 'activeColor', ['get', '_dynamic']], data.hoverPolygonColor],
        ['boolean', ['feature-state', 'disabled'], false],
        ['coalesce', ['get', 'disabledColor', ['get', '_dynamic']], data.disabledPolygonColor],
        ['coalesce', ['get', 'defaultColor', ['get', '_dynamic']], data.defaultPolygonColor],
      ],
    });*/
    this.filter = [
      'all',
      ['==', ['get', 'type', ['get', '_dynamic']], `polygons-custom`],
      ['==', ['to-number', ['get', 'level']], 0],
    ];
    this.paint = new PaintProperties({
      'fill-extrusion-height': 10,

      'fill-extrusion-base': 0,

      'fill-extrusion-opacity': 1,

      'fill-extrusion-color': '#00C1D5',
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
      ['>=', ['zoom'], ['coalesce', ['get', 'minZoom', ['get', '_dynamic']], data.iconMinZoom]],
      ['<=', ['zoom'], ['coalesce', ['get', 'maxZoom', ['get', '_dynamic']], data.iconMaxZoom]],
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
      'icon-image': [
        'coalesce',
        ['get', 'iconImage', ['get', '_dynamic']],
        data.iconImage ? data.iconImage : undefined,
      ],
      'symbol-placement': ['coalesce', ['get', 'symbolPlacement', ['get', '_dynamic']], data.symbolPlacement],
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
        [
          'coalesce',
          ['get', 'disabledOpacity', ['get', '_dynamic']],
          data.iconImageDefaultVisible || data.iconImageDefaultVisible === undefined ? 1 : 0,
        ],
        [
          'coalesce',
          ['get', 'defaultOpacity', ['get', '_dynamic']],
          data.iconImageDefaultVisible || data.iconImageDefaultVisible === undefined ? 1 : 0,
        ],
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
      ['>=', ['zoom'], ['coalesce', ['get', 'minZoom', ['get', '_dynamic']], data.labelMinZoom]],
      ['<=', ['zoom'], ['coalesce', ['get', 'maxZoom', ['get', '_dynamic']], data.labelMaxZoom]],
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
      'symbol-placement': ['coalesce', ['get', 'symbolPlacement', ['get', '_dynamic']], data.symbolPlacement],
      'text-anchor': 'center',
      'text-ignore-placement': true,
      'text-allow-overlap': true,
      'text-field': '{title}',
      'text-font': ['coalesce', ['get', 'textFont', ['get', '_dynamic']], data.textFont],
      'text-size': ['coalesce', ['get', 'textSize', ['get', '_dynamic']], data.labelFontSize],
      'text-letter-spacing': 0.005,
      'text-max-width': 7,
    });
    this.paint = new PaintPropertiesSymbol({
      'text-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        ['coalesce', ['get', 'selectedTextColor', ['get', '_dynamic']], data.selectedLabelColor],
        ['boolean', ['feature-state', 'hover'], false],
        ['coalesce', ['get', 'hoverTextColor', ['get', '_dynamic']], data.hoverLabelColor],
        ['boolean', ['feature-state', 'active'], false],
        ['coalesce', ['get', 'activeTextColor', ['get', '_dynamic']], data.hoverLabelColor],
        ['boolean', ['feature-state', 'disabled'], false],
        ['coalesce', ['get', 'disabledTextColor', ['get', '_dynamic']], data.disabledLabelColor],
        ['coalesce', ['get', 'defaultTextColor', ['get', '_dynamic']], data.defaultLabelColor],
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
