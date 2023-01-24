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
        _this.fillExtrusionColor = data['fill-extrusion-color'] || '#000000';
        _this.fillExtrusionOpacity = data['fill-extrusion-opacity'] || 1;
        _this.fillExtrusionTranslate = data['fill-extrusion-translate'] || [0, 0];
        _this.fillExtrusionTranslateAnchor = data['fill-extrusion-translate-anchor'] || 'map';
        _this.fillExtrusionPattern = data['fill-extrusion-pattern'];
        _this.fillExtrusionHeight = data['fill-extrusion-height'] || 0;
        _this.fillExtrusionBase = data['fill-extrusion-base'] || 0;
        _this.fillExtrusionVerticalGradient = data['fill-extrusion-vertical-gradient'] || true;
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
var FillExtrusionLayer = /** @class */ (function (_super) {
    __extends(FillExtrusionLayer, _super);
    function FillExtrusionLayer(data) {
        var _this = _super.call(this, data) || this;
        _this.paint = new PaintProperties(data.paint || {});
        _this.layout = new LayoutProperties(data.layout || {});
        return _this;
    }
    return FillExtrusionLayer;
}(base_layer_1.default));
exports.default = FillExtrusionLayer;
