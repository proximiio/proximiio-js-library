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
        _this.circleRadius = data['circle-radius'] || 5;
        _this.circleColor = data['circle-color'] || '#000000';
        _this.circleBlur = data['circle-blur'] || 0;
        _this.circleOpacity = data['circle-opacity'] || 1;
        _this.circleTranslate = data['circle-translate'] || [0, 0];
        _this.circleTranslateAnchor = data['circle-translate-anchor'] || 'map';
        _this.circlePitchScale = data['circle-pitch-scale'] || 'map';
        _this.circlePitchAlignment = data['circle-pitch-alignment'] || 'viewport';
        _this.circleStrokeWidth = data['circle-stroke-width'] || 1;
        _this.circleStrokeColor = data['circle-stroke-color'] || '#000000';
        _this.circleStrokeOpacity = data['circle-stroke-opacity'] || 1;
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
        _this.circleSortKey = data['circle-sort-key'] || 0;
        return _this;
    }
    return LayoutProperties;
}(base_layer_1.Serializable));
exports.LayoutProperties = LayoutProperties;
var CircleLayer = /** @class */ (function (_super) {
    __extends(CircleLayer, _super);
    function CircleLayer(data) {
        var _this = _super.call(this, data) || this;
        _this.type = 'circle';
        _this.paint = new PaintProperties(data.paint || {});
        _this.layout = new LayoutProperties(data.layout || {});
        return _this;
    }
    return CircleLayer;
}(base_layer_1.default));
exports.default = CircleLayer;
