"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolygonTitlesLineLayer = exports.PolygonTitlesLayer = exports.PolygonIconsLayer = exports.PolygonsLayer = void 0;
var fill_extrusion_layer_1 = require("./layers/fill_extrusion_layer");
var line_layer_1 = require("./layers/line_layer");
var symbol_layer_1 = require("./layers/symbol_layer");
var PolygonsLayer = /** @class */ (function (_super) {
    __extends(PolygonsLayer, _super);
    function PolygonsLayer(data) {
        var _this = _super.call(this, data) || this;
        _this.id = 'shop-custom';
        _this.type = 'fill-extrusion';
        _this.minzoom = data.minZoom;
        _this.maxzoom = data.maxZoom;
        _this.source = 'main';
        _this.filter = [
            'all',
            ['==', ['get', 'type', ['get', '_dynamic']], 'shop-custom'],
            ['==', ['to-number', ['get', 'level']], 0],
        ];
        _this.paint = new fill_extrusion_layer_1.PaintProperties({
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
        return _this;
    }
    return PolygonsLayer;
}(fill_extrusion_layer_1.default));
exports.PolygonsLayer = PolygonsLayer;
var PolygonIconsLayer = /** @class */ (function (_super) {
    __extends(PolygonIconsLayer, _super);
    function PolygonIconsLayer(data) {
        var _this = _super.call(this, data) || this;
        _this.id = 'poi-custom-icons';
        _this.type = 'symbol';
        _this.minzoom = data.minZoom;
        _this.maxzoom = data.maxZoom;
        _this.source = 'main';
        _this.filter = [
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
        _this.layout = new symbol_layer_1.LayoutProperties({
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
        return _this;
    }
    return PolygonIconsLayer;
}(symbol_layer_1.default));
exports.PolygonIconsLayer = PolygonIconsLayer;
var PolygonTitlesLayer = /** @class */ (function (_super) {
    __extends(PolygonTitlesLayer, _super);
    function PolygonTitlesLayer(data) {
        var _this = _super.call(this, data) || this;
        _this.id = 'shop-labels';
        _this.type = 'symbol';
        _this.minzoom = data.minZoom;
        _this.maxzoom = data.maxZoom;
        _this.source = 'main';
        _this.filter = [
            'all',
            ['==', ['get', 'type', ['get', '_dynamic']], 'shop-label'],
            ['==', ['to-number', ['get', 'level']], 0],
        ];
        _this.layout = new symbol_layer_1.LayoutProperties({
            'symbol-placement': data.symbolPlacement,
            'text-anchor': 'top',
            'text-ignore-placement': true,
            'text-allow-overlap': true,
            'text-field': '{title}',
            'text-font': ['Amiri Bold'],
            'text-size': data.labelFontSize,
            'text-letter-spacing': 0.005,
            'text-max-width': 7,
        });
        _this.paint = new symbol_layer_1.PaintProperties({
            'text-color': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                data.selectedLabelColor,
                ['boolean', ['feature-state', 'hover'], false],
                data.hoverLabelColor,
                data.defaultLabelColor,
            ],
        });
        return _this;
    }
    return PolygonTitlesLayer;
}(symbol_layer_1.default));
exports.PolygonTitlesLayer = PolygonTitlesLayer;
var PolygonTitlesLineLayer = /** @class */ (function (_super) {
    __extends(PolygonTitlesLineLayer, _super);
    function PolygonTitlesLineLayer(data) {
        var _this = _super.call(this, data) || this;
        _this.id = 'shop-labels-line';
        _this.type = 'line';
        _this.minzoom = data.minZoom;
        _this.maxzoom = data.maxZoom;
        _this.source = 'main';
        _this.filter = [
            'all',
            ['==', ['get', 'type', ['get', '_dynamic']], 'shop-label'],
            ['==', ['to-number', ['get', 'level']], 0],
        ];
        _this.layout = new line_layer_1.LayoutProperties({
            'line-join': 'round',
            'line-cap': 'round',
        });
        _this.paint = new line_layer_1.PaintProperties({
            'line-color': '#000',
            'line-width': 3,
        });
        return _this;
    }
    return PolygonTitlesLineLayer;
}(line_layer_1.default));
exports.PolygonTitlesLineLayer = PolygonTitlesLineLayer;
