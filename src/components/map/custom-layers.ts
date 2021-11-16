import FillExtrusionLayer from './layers/fill_extrusion_layer';
import SymbolLayer from './layers/symbol_layer';

export const PolygonsLayer = new FillExtrusionLayer({
  id: 'shop-custom',
  type: 'fill-extrusion',
  minzoom: 17,
  maxzoom: 24,
  source: 'main',
  filter: ['all', ['==', ['get', 'type'], 'shop-custom'], ['==', ['to-number', ['get', 'level']], 0]],
  paint: {
    'fill-extrusion-height': 3,
    'fill-extrusion-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#6945ed',
      ['boolean', ['feature-state', 'hover'], false],
      '#a58dfa',
      ['boolean', ['feature-state', 'disabled'], false],
      '#8a8a8a',
      '#dbd7e8',
    ],
  },
});

export const PolygonIconsLayer = new SymbolLayer({
  id: 'poi-custom-icons',
  type: 'symbol',
  minzoom: 17,
  maxzoom: 24,
  source: 'main',
  filter: ['all', ['==', ['get', 'type'], 'poi-custom'], ['==', ['to-number', ['get', 'level']], 0]],
  layout: {
    'icon-image': '{amenity}',
    'icon-size': ['interpolate', ['exponential', 0.5], ['zoom'], 17, 0.1, 22, 0.5],
    'text-anchor': 'top',
    'text-offset': [0, 2],
    'text-font': ['Open Sans Regular'],
    'text-size': 14,
    'symbol-placement': 'point',
    'icon-allow-overlap': true,
    'text-allow-overlap': true,
  },
});

export const PolygonTitlesLayer = new SymbolLayer({
  id: 'shop-labels',
  type: 'symbol',
  minzoom: 17,
  maxzoom: 24,
  source: 'main',
  filter: ['all', ['==', ['get', 'type'], 'shop-label'], ['==', ['to-number', ['get', 'level']], 0]],
  layout: {
    'symbol-placement': 'line-center',
    'text-anchor': 'top',
    'text-ignore-placement': true,
    'text-allow-overlap': true,
    'text-field': '{title}',
    'text-font': ['Open Sans Bold'],
    'text-size': [
      'interpolate', ['linear'], ['zoom'],
      18, 4,
      18.5, 6,
      19, 14,
      19.5, 16,
      20, 18,
      20.5, 24,
      21, 30,
      21.5, 36,
      22, 42
    ],
    'text-letter-spacing': 0.005,
    'text-max-width': 7,
  },
  paint: {
    'text-color': [
      'case',
      ['boolean', ['feature-state', 'selected'], false],
      '#fff',
      ['boolean', ['feature-state', 'hover'], false],
      '#fff',
      '#6945ed',
    ],
  },
});
