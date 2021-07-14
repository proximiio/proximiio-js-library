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
exports.LayoutProperties = exports.PaintProperties = void 0;
var base_layer_1 = require("./base_layer");
var PaintProperties = /** @class */ (function (_super) {
    __extends(PaintProperties, _super);
    function PaintProperties(data) {
        var _this = _super.call(this) || this;
        _this.heatmapRadius = data['heatmap-radius'] || 30;
        _this.heatmapWeight = data['heatmap-weight'] || 1;
        _this.heatmapIntensity = data['heatmap-intensity'] || 1;
        _this.heatmapOpacity = data['heatmap-opacity'] || 1;
        _this.heatmapColor = data['heatmap-color'] || '';
        return _this;
    }
    return PaintProperties;
}(base_layer_1.Serializable));
exports.PaintProperties = PaintProperties;
var LayoutProperties = /** @class */ (function (_super) {
    __extends(LayoutProperties, _super);
    function LayoutProperties(data) {
        var _this = _super.call(this) || this;
        _this.visibility = data.visibility || 'visible';
        return _this;
    }
    return LayoutProperties;
}(base_layer_1.Serializable));
exports.LayoutProperties = LayoutProperties;
var HeatmapLayer = /** @class */ (function (_super) {
    __extends(HeatmapLayer, _super);
    function HeatmapLayer(data) {
        var _this = _super.call(this, data) || this;
        _this.paint = new PaintProperties(data.paint || {});
        _this.layout = new LayoutProperties(data.layout || {});
        return _this;
    }
    return HeatmapLayer;
}(base_layer_1.default));
exports.default = HeatmapLayer;
