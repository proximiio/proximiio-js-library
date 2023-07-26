"use strict";
// The type of layer is specified  by the "type" property, and must be one of background, fill, line, symbol,
// raster, circle, fill-extrusion, heatmap, hillshade.
// Except for layers of the background type, each layer needs to refer to a source. Layers take the data that
// they get from a source, optionally filter features, and then define how those features are styled.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Serializable = void 0;
var common_1 = require("../../../common");
var Serializable = /** @class */ (function () {
    function Serializable() {
    }
    Object.defineProperty(Serializable.prototype, "json", {
        get: function () {
            return (0, common_1.kebabize)(this);
        },
        enumerable: false,
        configurable: true
    });
    return Serializable;
}());
exports.Serializable = Serializable;
var BaseLayer = /** @class */ (function () {
    function BaseLayer(data) {
        this.id = data.id;
        this.type = data.type;
        this.source = data.source;
        this.sourceLayer = data['source-layer'];
        this.minzoom = data.minzoom;
        this.maxzoom = data.maxzoom;
        this.filter = data.filter;
        this.metadata = data.metadata;
    }
    Object.defineProperty(BaseLayer.prototype, "json", {
        get: function () {
            var _a = this, id = _a.id, type = _a.type, source = _a.source, sourceLayer = _a.sourceLayer, minzoom = _a.minzoom, maxzoom = _a.maxzoom, filter = _a.filter, metadata = _a.metadata;
            var data = { id: id, type: type };
            if (source) {
                data.source = source;
            }
            if (sourceLayer) {
                data['source-layer'] = sourceLayer;
            }
            if (minzoom) {
                data.minzoom = minzoom;
            }
            if (maxzoom) {
                data.maxzoom = maxzoom;
            }
            if (filter) {
                data.filter = filter;
            }
            if (this.metadata) {
                data.metadata = metadata;
            }
            if (this.paint) {
                data.paint = this.paint.json;
            }
            if (this.layout) {
                data.layout = this.layout.json;
            }
            return data;
        },
        enumerable: false,
        configurable: true
    });
    BaseLayer.prototype.setFilterLevel = function (level) {
        var _this = this;
        this.filter.forEach(function (filter, filterIndex) {
            if (_this.id === 'proximiio-levelchangers') {
                var lvl = "__level_".concat(level);
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
                    _this.filter[filterIndex] = filter;
                }
            }
        });
    };
    return BaseLayer;
}());
exports.default = BaseLayer;
