import { Eventable, Observer } from '../eventable';
import BaseSource from '../components/map/sources/base_source';
import BaseLayer from '../components/map/layers/base_layer';
import BackgroundLayer from '../components/map/layers/background_layer';
import RasterLayer from '../components/map/layers/raster_layer';
import FillLayer from '../components/map/layers/fill_layer';
import LineLayer from '../components/map/layers/line_layer';
import FillExtrusionLayer from '../components/map/layers/fill_extrusion_layer';
import SymbolLayer from '../components/map/layers/symbol_layer';
import HeatmapLayer from '../components/map/layers/heatmap_layer';
import CircleLayer from '../components/map/layers/circle_layer';
import HillshadeLayer from '../components/map/layers/hillshade_layer';

import { diff } from 'deep-diff';

import { METADATA_POLYGON_EDITING } from '../components/map/constants';
import DEFAULT_METADATA from '../components/map/metadata';

type StyleProps = { [property: string]: any };

export interface StyleLayerOverride {
  paint?: StyleProps;
  layout?: StyleProps;
}

/**
 * Persistent style changes, applied with Map.applyStyle().
 * Property value null restores the original value of that property.
 */
export interface StyleOverrides {
  layers?: { [layerId: string]: StyleLayerOverride };
  sources?: { [sourceId: string]: StyleProps };
}

export interface StyleResetOptions {
  layers?: string[];
  sources?: string[];
}

interface OverrideEntry {
  values: StyleProps;
  // property values before the first override, undefined = property was not set
  originals: StyleProps;
}

interface StoredOverrides {
  layers: { [layerId: string]: { paint: OverrideEntry; layout: OverrideEntry } };
  sources: { [sourceId: string]: OverrideEntry };
}

const createEntry = (): OverrideEntry => ({ values: {}, originals: {} });

const applyEntry = (target: StyleProps, entry: OverrideEntry) => {
  Object.keys(entry.values).forEach((key) => {
    if (!(key in entry.originals)) {
      entry.originals[key] = target[key];
    }
    target[key] = entry.values[key];
  });
};

const restoreEntry = (target: StyleProps | undefined, entry: OverrideEntry, keys = Object.keys(entry.values)) => {
  keys.forEach((key) => {
    if (target && key in entry.originals) {
      if (entry.originals[key] === undefined) {
        delete target[key];
      } else {
        target[key] = entry.originals[key];
      }
    }
    delete entry.values[key];
    delete entry.originals[key];
  });
};

const mergeEntry = (target: StyleProps | undefined, entry: OverrideEntry, props: StyleProps = {}) => {
  const keys = Object.keys(props);
  restoreEntry(
    target,
    entry,
    keys.filter((key) => props[key] === null),
  );
  keys.filter((key) => props[key] !== null).forEach((key) => (entry.values[key] = props[key]));
  if (target) {
    applyEntry(target, entry);
  }
};

const layerProps = (layer: any, group: 'paint' | 'layout'): StyleProps | undefined => {
  if (!layer) {
    return undefined;
  }
  layer[group] = layer[group] || {};
  return layer[group];
};

export default class StyleModel {
  _observers?: Observer[] = [];
  _overrides?: StoredOverrides = { layers: {}, sources: {} };
  id: string;
  // tslint:disable-next-line:variable-name
  organization_id: string;
  version: number;
  name: string;
  metadata: any;
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  sources: { [id: string]: any };
  glyphs: string;
  layers: any[];
  overlay? = false;
  segments = false;
  routable = false;
  cluster = true;
  rooms = true;

  constructor(data: any) {
    // super();
    this.id = data.id;
    this.organization_id = data.organization_id;
    this.version = data.version || 1;
    this.name = data.name || 'New Style';
    this.metadata = Object.assign(DEFAULT_METADATA, data.metadata || {});
    this.center = data.center || [18.555, 48.4437];
    this.zoom = data.zoom || 8;
    this.bearing = data.bearing || 0;
    this.pitch = data.pitch || 0;
    this.sources = data.sources || [];
    this.glyphs = data.glyphs || '';
    this.layers = (data.layers || [])
      .map((layer: any) => {
        if (layer.type === 'background') {
          return new BackgroundLayer(layer).json;
        }
        if (layer.type === 'raster') {
          return new RasterLayer(layer).json;
        }
        if (layer.type === 'fill') {
          return new FillLayer(layer).json;
        }
        if (layer.type === 'line') {
          return new LineLayer(layer).json;
        }
        if (layer.type === 'fill-extrusion') {
          return new FillExtrusionLayer(layer).json;
        }
        if (layer.type === 'symbol') {
          return new SymbolLayer(layer).json;
        }
        if (layer.type === 'heatmap') {
          return new HeatmapLayer(layer).json;
        }
        if (layer.type === 'circle') {
          return new CircleLayer(layer).json;
        }
        if (layer.type === 'hillshade') {
          return new HillshadeLayer(layer).json;
        }
        return new BaseLayer(layer);
      })
      .concat(this.getUniversalLayers('main'))
      .concat(this.getSyntheticLayers());
  }

  on(observer: Observer) {
    if (this._observers) {
      this._observers.push(observer);
    }
  }

  off(observer: Observer) {
    const index = this._observers ? this._observers.findIndex((o) => o === observer) : 0;
    if (index >= 0) {
      if (this._observers) {
        this._observers.splice(index, 1);
      }
    }
  }

  notify(event?: string, data?: any) {
    if (this._observers) {
      this._observers.forEach((observer) => observer(event, data, this));
    }
  }

  getUniversalLayers(source: string) {
    const filter = [
      'all',
      ['==', ['geometry-type'], 'Polygon'],
      ['any', ['==', ['get', 'segment'], false], ['!', ['has', 'segment']]],
      ['any', ['==', ['get', 'routable'], false], ['!', ['has', 'routable']]],
      ['==', ['get', 'level'], 0],
    ];

    const segmentFilter = [
      'all',
      ['==', ['geometry-type'], 'Polygon'],
      ['has', 'segment'],
      ['==', ['get', 'segment'], true],
      ['==', ['get', 'level'], 0],
    ];

    const routableFilter = [
      'all',
      ['==', ['geometry-type'], 'Polygon'],
      ['has', 'routable'],
      ['==', ['get', 'routable'], true],
      ['==', ['get', 'level'], 0],
    ];

    const roomFilter = [
      'all',
      ['==', ['geometry-type'], 'Polygon'],
      ['has', 'room'],
      ['==', ['get', 'room'], true],
      ['==', ['get', 'level'], 0],
    ];

    const base = {
      minzoom: 1,
      maxzoom: 24,
      source,
    };

    return [
      new FillLayer({
        ...base,
        id: `${source}-polygon-fill`,
        type: 'fill',
        filter,
        layout: {
          visibility: 'none',
        },
        paint: {
          'fill-color': '#08c',
          'fill-opacity': 0.3,
        },
      }).json,
      new LineLayer({
        ...base,
        id: `${source}-polygon-outline`,
        type: 'line',
        filter,
        layout: {
          'line-join': 'bevel',
          visibility: 'none',
        },
        paint: {
          'line-color': '#08c',
          'line-width': 1,
          'line-opacity': 1,
        },
      }).json,
      new LineLayer({
        ...base,
        id: `${source}-room-outline`,
        type: 'line',
        roomFilter,
        layout: {
          'line-join': 'bevel',
          visibility: 'none',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1,
          'line-opacity': 1,
        },
      }).json,
      new FillLayer({
        ...base,
        id: `${source}-room-fill`,
        type: 'fill',
        filter: roomFilter,
        layout: {
          visibility: 'none',
        },
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.3,
        },
      }).json,
      // segments
      new FillLayer({
        ...base,
        id: `${source}-segment-fill`,
        type: 'fill',
        filter: segmentFilter,
        layout: {
          visibility: 'none',
        },
        paint: {
          'fill-color': '#0c8',
          'fill-opacity': 0.3,
        },
      }).json,
      new LineLayer({
        ...base,
        id: `${source}-segment-outline`,
        type: 'line',
        filter: segmentFilter,
        layout: {
          'line-join': 'bevel',
          visibility: 'none',
        },
        paint: {
          'line-color': '#0c8',
          'line-width': 1,
          'line-opacity': 1,
        },
      }).json,
      // routables
      new FillLayer({
        ...base,
        id: `${source}-routable-fill`,
        type: 'fill',
        filter: routableFilter,
        layout: {
          visibility: 'none',
        },
        paint: {
          'fill-color': '#c80',
          'fill-opacity': 0.3,
        },
      }).json,
      new LineLayer({
        ...base,
        id: `${source}-routable-outline`,
        type: 'line',
        filter: routableFilter,
        layout: {
          'line-join': 'bevel',
          visibility: 'none',
        },
        paint: {
          'line-color': '#c80',
          'line-width': 1,
          'line-opacity': 1,
        },
      }).json,
    ];
  }

  getSyntheticLayers() {
    const polygonFill = new FillLayer({
      type: 'fill',
      minzoom: 1,
      maxzoom: 24,
      source: 'synthetic',
      id: 'synthetic-polygon-fill',
      filter: ['all', ['==', ['geometry-type'], 'Polygon']],
      layout: {
        visibility: 'visible',
      },
      paint: {
        'fill-color': '#08c',
        'fill-opacity': 0.3,
      },
    }).json;

    const polygonOutline = new LineLayer({
      type: 'line',
      minzoom: 1,
      maxzoom: 24,
      source: 'synthetic',
      id: 'synthetic-polygon-outline',
      filter: ['all', ['==', ['geometry-type'], 'Polygon']],
      layout: {
        'line-join': 'bevel',
        visibility: 'visible',
      },
      paint: {
        'line-color': '#08c',
        'line-width': 1,
        'line-opacity': 1,
      },
    }).json;

    return [polygonFill, polygonOutline];
  }

  usesPrefixes() {
    return typeof this.layers.find((layer) => layer.id === 'proximiio-paths') !== 'undefined';
  }

  addLayer(layer: any, beforeLayer: string) {
    if (beforeLayer) {
      this.layers.splice(this.getLayerIndex(beforeLayer) + 1, 0, layer);
    } else {
      this.layers.push(layer);
    }
    this.applyLayerOverrides(layer);
  }

  getLayer(id: string) {
    return this.layers.find((layer) => layer.id === id);
  }

  getLayerIndex(id: string) {
    return this.layers.findIndex((layer) => layer.id === id);
  }

  getLayers(sourceId: string): BaseLayer[] {
    return this.layers.filter((layer) => layer.source && layer.source === sourceId);
  }

  addSource(sourceId: string, source: any) {
    this.sources[sourceId] = source;
    this.applySourceOverrides(sourceId);
  }

  removeLayer(id: string) {
    this.layers = this.layers.filter((layer) => {
      return layer.id !== id;
    });
  }

  getSources(): BaseSource[] {
    const sources = [] as BaseSource[];
    Object.keys(this.sources).forEach((id) => {
      const source = this.sources[id];
      source.id = id;
      sources.push(source);
    });
    return sources;
  }

  setSource(id: string, data: BaseSource) {
    this.sources[id] = data.source;
    if (id === 'main') {
      this.sources[id].promoteId = 'id';
    }
    this.applySourceOverrides(id);
  }

  getSource(sourceId: string): BaseSource {
    return this.sources[sourceId];
  }

  removeSource(sourceId: string) {
    if (this.sources[sourceId]) {
      delete this.sources[sourceId];
    }
  }

  /**
   * Stores overrides and applies them to the current layers and sources.
   * They are re-applied whenever a layer is added or a source is (re)set,
   * so they survive floor changes, route updates and style switches.
   */
  applyOverrides(overrides: StyleOverrides) {
    Object.keys(overrides.layers || {}).forEach((layerId) => {
      const override = overrides.layers[layerId];
      const stored = (this._overrides.layers[layerId] = this._overrides.layers[layerId] || {
        paint: createEntry(),
        layout: createEntry(),
      });
      const layer = this.getLayer(layerId);
      mergeEntry(layerProps(layer, 'paint'), stored.paint, override.paint);
      mergeEntry(layerProps(layer, 'layout'), stored.layout, override.layout);
    });
    Object.keys(overrides.sources || {}).forEach((sourceId) => {
      const stored = (this._overrides.sources[sourceId] = this._overrides.sources[sourceId] || createEntry());
      mergeEntry(this.sources[sourceId], stored, overrides.sources[sourceId]);
    });
  }

  /**
   * Removes overrides and restores original values.
   * Without options all overrides are removed.
   */
  resetOverrides(options?: StyleResetOptions) {
    const layerIds = options ? options.layers || [] : Object.keys(this._overrides.layers);
    const sourceIds = options ? options.sources || [] : Object.keys(this._overrides.sources);
    layerIds.forEach((layerId) => {
      const stored = this._overrides.layers[layerId];
      if (stored) {
        const layer = this.getLayer(layerId);
        restoreEntry(layer && layer.paint, stored.paint);
        restoreEntry(layer && layer.layout, stored.layout);
        delete this._overrides.layers[layerId];
      }
    });
    sourceIds.forEach((sourceId) => {
      const stored = this._overrides.sources[sourceId];
      if (stored) {
        restoreEntry(this.sources[sourceId], stored);
        delete this._overrides.sources[sourceId];
      }
    });
  }

  /** Currently stored overrides, in the same shape as accepted by applyOverrides */
  getOverrides(): StyleOverrides {
    const overrides: StyleOverrides = { layers: {}, sources: {} };
    Object.keys(this._overrides.layers).forEach((layerId) => {
      const stored = this._overrides.layers[layerId];
      overrides.layers[layerId] = { paint: { ...stored.paint.values }, layout: { ...stored.layout.values } };
    });
    Object.keys(this._overrides.sources).forEach((sourceId) => {
      overrides.sources[sourceId] = { ...this._overrides.sources[sourceId].values };
    });
    return overrides;
  }

  applyLayerOverrides(layer: any) {
    const stored = layer && this._overrides.layers[layer.id];
    if (stored) {
      applyEntry(layerProps(layer, 'paint'), stored.paint);
      applyEntry(layerProps(layer, 'layout'), stored.layout);
    }
  }

  applySourceOverrides(sourceId: string) {
    const stored = this._overrides.sources[sourceId];
    if (stored && this.sources[sourceId]) {
      applyEntry(this.sources[sourceId], stored);
    }
  }

  setLevel(level: number) {
    [...this.getLayers('main'), ...this.getLayers('route')].forEach((layer) => {
      if (!layer.filter) {
        return;
      }
      layer.filter.forEach((filter: any, filterIndex: number) => {
        if (layer.id === 'proximiio-levelchangers') {
          const lvl = `__level_${level}`;
          if (filterIndex === 3) {
            filter[1] = lvl;
          }
          if (filterIndex === 4) {
            filter[1][1] = lvl;
          }
        }

        if (Array.isArray(filter)) {
          let changed = false;
          if (filter[0] === '==') {
            const expression = filter[1];
            if (expression[0] === 'to-number') {
              if (expression[1][0] === 'get' && expression[1][1] === 'level') {
                filter[2] = level;
                changed = true;
              }
            }

            if (expression[0] === 'get' && expression[1] === 'level') {
              filter[2] = level;
              changed = true;
            }
          }

          if (filter[0] === '<=') {
            const expression = filter[1];
            if (expression[0] === 'to-number') {
              if (expression[1][0] === 'get' && expression[1][1] === 'level_min') {
                filter[2] = level;
                changed = true;
              }
            }

            if (expression[0] === 'get' && expression[1] === 'level_min') {
              filter[2] = level;
              changed = true;
            }
          }

          if (filter[0] === '>=') {
            const expression = filter[1];
            if (expression[0] === 'to-number') {
              if (expression[1][0] === 'get' && expression[1][1] === 'level_max') {
                filter[2] = level;
                changed = true;
              }
            }

            if (expression[0] === 'get' && expression[1] === 'level_max') {
              filter[2] = level;
              changed = true;
            }
          }

          if (changed) {
            layer.filter[filterIndex] = filter;
          }
        }
      });
    });
    this.notify('filter-change');
  }

  get polygonEditing() {
    return this.metadata[METADATA_POLYGON_EDITING] || false;
  }

  toggleCluster() {
    this.cluster = !this.cluster;
    this.notify('cluster-toggled');
  }

  togglePolygonEditing() {
    if (this.metadata[METADATA_POLYGON_EDITING]) {
      this.metadata[METADATA_POLYGON_EDITING] = !this.metadata[METADATA_POLYGON_EDITING];
    } else {
      this.metadata[METADATA_POLYGON_EDITING] = true;
    }

    console.log('polygon-editing-toggled', this.metadata[METADATA_POLYGON_EDITING]);
    this.notify('polygon-editing-toggled');
  }

  toggleRooms() {
    this.rooms = !this.rooms;
    this.notify('roomsss-toggled');
  }

  toggleOverlay() {
    this.overlay = !this.overlay;
    this.notify('overlay-toggled');
  }

  toggleSegments() {
    this.segments = !this.segments;
    this.notify('segments-toggled');
  }

  toggleRoutable() {
    this.routable = !this.routable;
    this.notify('routable-toggled');
  }

  togglePaths(enabled: boolean) {
    // tslint:disable-next-line:no-shadowed-variable
    const layer = this.layers.find((layer) => layer.id === 'proximiio-paths' || layer.id === 'paths');
    if (layer) {
      // const updated = new LineLayer(Object.assign({}, layer));
      // updated.layout.visibility = enabled ? 'visible' : 'none';
      layer.layout.visibility = enabled ? 'visible' : 'none';
      // this.updateLayer(updated);
    }
  }

  updateLayer(layer: BaseLayer) {
    // debug.log('style updateLayer in:', layer)
    const idx = this.getLayerIndex(layer.id);
    const changes = [] as any;
    if (idx >= 0) {
      const prev = this.layers[idx];
      const change = diff(prev.json, layer.json);
      console.log('change', change, prev.json, layer.json);
      if (change) {
        changes.push(change);
        this.layers.splice(idx, 1, layer);
        // debug.log('style should update layer', layer, 'changes', changes)
        this.notify('layer-update', { layer, changes: changes.length > 0 ? changes[0] : [] });
      }
    }
  }

  setMetadata(namespace: string, item: string, value: any) {
    this.metadata[`${namespace}:${item}`] = value;
    this.notify('metadata-update');
  }

  get namespaces(): string[] {
    const keys = Object.keys(this.metadata);
    const pairs = keys.filter((key) => key.indexOf(':') > 0);
    const unique = new Set(pairs.map((pair) => pair.split(':')[0]));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }

  namespaceItems(namespace: string) {
    return Object.keys(this.metadata)
      .filter((key) => key.indexOf(`${namespace}:`) === 0)
      .map((key) => key.split(':').slice(1).join(':'));
  }

  get json(): any {
    const style = Object.assign({}, this);
    delete style._observers;
    delete style._overrides;
    delete style.overlay;
    style.layers = this.layers.map((layer) => layer.json);
    return JSON.parse(JSON.stringify(style));
  }

  hideIconLayers() {
    const layers = [
      'proximiio-pois-icons',
      'proximiio-pois-labels',
      'pois-icons',
      'pois-labels',
      'proximiio-levelchangers',
    ];
    layers.forEach((layer) => {
      if (this.getLayer(layer)) {
        this.getLayer(layer).layout.visibility = 'none';
      }
    });
  }

  showIconLayers() {
    const layers = [
      'proximiio-pois-icons',
      'proximiio-pois-labels',
      'pois-icons',
      'pois-labels',
      'proximiio-levelchangers',
    ];
    layers.forEach((layer) => {
      if (this.getLayer(layer)) {
        this.getLayer(layer).layout.visibility = 'visible';
      }
    });
  }
  hideLayer(layerId: string) {
    this.getLayer(layerId).layout.visibility = 'none';
  }

  showLayer(layerId: string) {
    this.getLayer(layerId).layout.visibility = 'visible';
  }

  setIconSize(size: (string | number | string[])[] | number | any) {
    if (this.getLayer('proximiio-pois-icons')) {
      this.getLayer('proximiio-pois-icons').layout['icon-size'] = size;
    }
  }
}
