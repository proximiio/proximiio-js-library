"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
var base_layer_1 = require("../components/map/layers/base_layer");
var background_layer_1 = require("../components/map/layers/background_layer");
var raster_layer_1 = require("../components/map/layers/raster_layer");
var fill_layer_1 = require("../components/map/layers/fill_layer");
var line_layer_1 = require("../components/map/layers/line_layer");
var fill_extrusion_layer_1 = require("../components/map/layers/fill_extrusion_layer");
var symbol_layer_1 = require("../components/map/layers/symbol_layer");
var heatmap_layer_1 = require("../components/map/layers/heatmap_layer");
var circle_layer_1 = require("../components/map/layers/circle_layer");
var hillshade_layer_1 = require("../components/map/layers/hillshade_layer");
var deep_diff_1 = require("deep-diff");
var constants_1 = require("../components/map/constants");
var metadata_1 = require("../components/map/metadata");
var StyleModel = /** @class */ (function () {
    function StyleModel(data) {
        this._observers = [];
        this.overlay = false;
        this.segments = false;
        this.routable = false;
        this.cluster = true;
        this.rooms = true;
        // super();
        this.id = data.id;
        this.organization_id = data.organization_id;
        this.version = data.version || 1;
        this.name = data.name || 'New Style';
        this.metadata = Object.assign(metadata_1.default, data.metadata || {});
        this.center = data.center || [18.555, 48.4437];
        this.zoom = data.zoom || 8;
        this.bearing = data.bearing || 0;
        this.pitch = data.pitch || 0;
        this.sources = data.sources || [];
        this.glyphs = data.glyphs || '';
        this.layers = (data.layers || [])
            .map(function (layer) {
            if (layer.type === 'background') {
                return new background_layer_1.default(layer).json;
            }
            if (layer.type === 'raster') {
                return new raster_layer_1.default(layer).json;
            }
            if (layer.type === 'fill') {
                return new fill_layer_1.default(layer).json;
            }
            if (layer.type === 'line') {
                return new line_layer_1.default(layer).json;
            }
            if (layer.type === 'fill-extrusion') {
                return new fill_extrusion_layer_1.default(layer).json;
            }
            if (layer.type === 'symbol') {
                return new symbol_layer_1.default(layer).json;
            }
            if (layer.type === 'heatmap') {
                return new heatmap_layer_1.default(layer).json;
            }
            if (layer.type === 'circle') {
                return new circle_layer_1.default(layer).json;
            }
            if (layer.type === 'hillshade') {
                return new hillshade_layer_1.default(layer).json;
            }
            return new base_layer_1.default(layer);
        })
            .concat(this.getUniversalLayers('main'))
            .concat(this.getSyntheticLayers());
    }
    StyleModel.prototype.on = function (observer) {
        if (this._observers) {
            this._observers.push(observer);
        }
    };
    StyleModel.prototype.off = function (observer) {
        var index = this._observers ? this._observers.findIndex(function (o) { return o === observer; }) : 0;
        if (index >= 0) {
            if (this._observers) {
                this._observers.splice(index, 1);
            }
        }
    };
    StyleModel.prototype.notify = function (event, data) {
        var _this = this;
        if (this._observers) {
            this._observers.forEach(function (observer) { return observer(event, data, _this); });
        }
    };
    StyleModel.prototype.getUniversalLayers = function (source) {
        var filter = [
            'all',
            ['==', ['geometry-type'], 'Polygon'],
            ['any', ['==', ['get', 'segment'], false], ['!', ['has', 'segment']]],
            ['any', ['==', ['get', 'routable'], false], ['!', ['has', 'routable']]],
            ['==', ['get', 'level'], 0],
        ];
        var segmentFilter = [
            'all',
            ['==', ['geometry-type'], 'Polygon'],
            ['has', 'segment'],
            ['==', ['get', 'segment'], true],
            ['==', ['get', 'level'], 0],
        ];
        var routableFilter = [
            'all',
            ['==', ['geometry-type'], 'Polygon'],
            ['has', 'routable'],
            ['==', ['get', 'routable'], true],
            ['==', ['get', 'level'], 0],
        ];
        var roomFilter = [
            'all',
            ['==', ['geometry-type'], 'Polygon'],
            ['has', 'room'],
            ['==', ['get', 'room'], true],
            ['==', ['get', 'level'], 0],
        ];
        var base = {
            minzoom: 1,
            maxzoom: 24,
            source: source,
        };
        return [
            new fill_layer_1.default(__assign(__assign({}, base), { id: source + "-polygon-fill", type: 'fill', filter: filter, layout: {
                    visibility: 'none',
                }, paint: {
                    'fill-color': '#08c',
                    'fill-opacity': 0.3,
                } })).json,
            new line_layer_1.default(__assign(__assign({}, base), { id: source + "-polygon-outline", type: 'line', filter: filter, layout: {
                    'line-join': 'bevel',
                    visibility: 'none',
                }, paint: {
                    'line-color': '#08c',
                    'line-width': 1,
                    'line-opacity': 1,
                } })).json,
            new line_layer_1.default(__assign(__assign({}, base), { id: source + "-room-outline", type: 'line', roomFilter: roomFilter, layout: {
                    'line-join': 'bevel',
                    visibility: 'none',
                }, paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 1,
                    'line-opacity': 1,
                } })).json,
            new fill_layer_1.default(__assign(__assign({}, base), { id: source + "-room-fill", type: 'fill', filter: roomFilter, layout: {
                    visibility: 'none',
                }, paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.3,
                } })).json,
            // segments
            new fill_layer_1.default(__assign(__assign({}, base), { id: source + "-segment-fill", type: 'fill', filter: segmentFilter, layout: {
                    visibility: 'none',
                }, paint: {
                    'fill-color': '#0c8',
                    'fill-opacity': 0.3,
                } })).json,
            new line_layer_1.default(__assign(__assign({}, base), { id: source + "-segment-outline", type: 'line', filter: segmentFilter, layout: {
                    'line-join': 'bevel',
                    visibility: 'none',
                }, paint: {
                    'line-color': '#0c8',
                    'line-width': 1,
                    'line-opacity': 1,
                } })).json,
            // routables
            new fill_layer_1.default(__assign(__assign({}, base), { id: source + "-routable-fill", type: 'fill', filter: routableFilter, layout: {
                    visibility: 'none',
                }, paint: {
                    'fill-color': '#c80',
                    'fill-opacity': 0.3,
                } })).json,
            new line_layer_1.default(__assign(__assign({}, base), { id: source + "-routable-outline", type: 'line', filter: routableFilter, layout: {
                    'line-join': 'bevel',
                    visibility: 'none',
                }, paint: {
                    'line-color': '#c80',
                    'line-width': 1,
                    'line-opacity': 1,
                } })).json,
        ];
    };
    StyleModel.prototype.getSyntheticLayers = function () {
        var polygonFill = new fill_layer_1.default({
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
        var polygonOutline = new line_layer_1.default({
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
    };
    StyleModel.prototype.usesPrefixes = function () {
        return typeof this.layers.find(function (layer) { return layer.id === 'proximiio-paths'; }) !== 'undefined';
    };
    StyleModel.prototype.addLayer = function (layer, beforeLayer) {
        if (beforeLayer) {
            this.layers.splice(this.getLayerIndex(beforeLayer) + 1, 0, layer);
        }
        else {
            this.layers.push(layer);
        }
    };
    StyleModel.prototype.getLayer = function (id) {
        return this.layers.find(function (layer) { return layer.id === id; });
    };
    StyleModel.prototype.getLayerIndex = function (id) {
        return this.layers.findIndex(function (layer) { return layer.id === id; });
    };
    StyleModel.prototype.getLayers = function (sourceId) {
        return this.layers.filter(function (layer) { return layer.source && layer.source === sourceId; });
    };
    StyleModel.prototype.addSource = function (sourceId, source) {
        this.sources[sourceId] = source;
    };
    StyleModel.prototype.removeLayer = function (id) {
        this.layers = this.layers.filter(function (layer) {
            return layer.id !== id;
        });
    };
    StyleModel.prototype.getSources = function () {
        var _this = this;
        var sources = [];
        Object.keys(this.sources).forEach(function (id) {
            var source = _this.sources[id];
            source.id = id;
            sources.push(source);
        });
        return sources;
    };
    StyleModel.prototype.setSource = function (id, data) {
        this.sources[id] = data.source;
    };
    StyleModel.prototype.getSource = function (sourceId) {
        return this.sources[sourceId];
    };
    StyleModel.prototype.removeSource = function (sourceId) {
        if (this.sources[sourceId]) {
            delete this.sources[sourceId];
        }
    };
    StyleModel.prototype.setLevel = function (level) {
        __spreadArray(__spreadArray([], this.getLayers('main')), this.getLayers('route')).forEach(function (layer) {
            if (!layer.filter) {
                return;
            }
            layer.filter.forEach(function (filter, filterIndex) {
                if (layer.id === 'proximiio-levelchangers') {
                    var lvl = "__level_" + level;
                    if (filterIndex === 3) {
                        filter[1] = lvl;
                    }
                    if (filterIndex === 4) {
                        filter[1][1] = lvl;
                    }
                }
                if (Array.isArray(filter)) {
                    var changed = false;
                    if (filter[0] === '==') {
                        var expression = filter[1];
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
                        var expression = filter[1];
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
                        var expression = filter[1];
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
    };
    Object.defineProperty(StyleModel.prototype, "polygonEditing", {
        get: function () {
            return this.metadata[constants_1.METADATA_POLYGON_EDITING] || false;
        },
        enumerable: false,
        configurable: true
    });
    StyleModel.prototype.toggleCluster = function () {
        this.cluster = !this.cluster;
        this.notify('cluster-toggled');
    };
    StyleModel.prototype.togglePolygonEditing = function () {
        if (this.metadata[constants_1.METADATA_POLYGON_EDITING]) {
            this.metadata[constants_1.METADATA_POLYGON_EDITING] = !this.metadata[constants_1.METADATA_POLYGON_EDITING];
        }
        else {
            this.metadata[constants_1.METADATA_POLYGON_EDITING] = true;
        }
        console.log('polygon-editing-toggled', this.metadata[constants_1.METADATA_POLYGON_EDITING]);
        this.notify('polygon-editing-toggled');
    };
    StyleModel.prototype.toggleRooms = function () {
        this.rooms = !this.rooms;
        this.notify('roomsss-toggled');
    };
    StyleModel.prototype.toggleOverlay = function () {
        this.overlay = !this.overlay;
        this.notify('overlay-toggled');
    };
    StyleModel.prototype.toggleSegments = function () {
        this.segments = !this.segments;
        this.notify('segments-toggled');
    };
    StyleModel.prototype.toggleRoutable = function () {
        this.routable = !this.routable;
        this.notify('routable-toggled');
    };
    StyleModel.prototype.togglePaths = function (enabled) {
        // tslint:disable-next-line:no-shadowed-variable
        var layer = this.layers.find(function (layer) { return layer.id === 'proximiio-paths' || layer.id === 'paths'; });
        if (layer) {
            var updated = new line_layer_1.default(Object.assign({}, layer.json));
            updated.layout.visibility = enabled ? 'visible' : 'none';
            this.updateLayer(updated);
        }
    };
    StyleModel.prototype.updateLayer = function (layer) {
        // debug.log('style updateLayer in:', layer)
        var idx = this.getLayerIndex(layer.id);
        var changes = [];
        if (idx >= 0) {
            var prev = this.layers[idx];
            var change = deep_diff_1.diff(prev.json, layer.json);
            console.log('change', change);
            if (change) {
                changes.push(change);
                this.layers.splice(idx, 1, layer);
                // debug.log('style should update layer', layer, 'changes', changes)
                this.notify('layer-update', { layer: layer, changes: changes.length > 0 ? changes[0] : [] });
            }
        }
    };
    StyleModel.prototype.setMetadata = function (namespace, item, value) {
        this.metadata[namespace + ":" + item] = value;
        this.notify('metadata-update');
    };
    Object.defineProperty(StyleModel.prototype, "namespaces", {
        get: function () {
            var keys = Object.keys(this.metadata);
            var pairs = keys.filter(function (key) { return key.indexOf(':') > 0; });
            var unique = new Set(pairs.map(function (pair) { return pair.split(':')[0]; }));
            return Array.from(unique).sort(function (a, b) { return a.localeCompare(b); });
        },
        enumerable: false,
        configurable: true
    });
    StyleModel.prototype.namespaceItems = function (namespace) {
        return Object.keys(this.metadata)
            .filter(function (key) { return key.indexOf(namespace + ":") === 0; })
            .map(function (key) { return key.split(':').slice(1).join(':'); });
    };
    Object.defineProperty(StyleModel.prototype, "json", {
        get: function () {
            var style = Object.assign({}, this);
            delete style._observers;
            delete style.overlay;
            style.layers = this.layers.map(function (layer) { return layer.json; });
            return JSON.parse(JSON.stringify(style));
        },
        enumerable: false,
        configurable: true
    });
    return StyleModel;
}());
exports.default = StyleModel;
