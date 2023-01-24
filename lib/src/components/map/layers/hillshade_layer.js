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
        _this.hillshadeIlluminationDirection = data['hillshade-illumination-direction'] || 335;
        _this.hillshadeIlluminationAnchor = data['hillshade-illumination-anchor'] || 'viewport';
        _this.hillshadeExaggeration = data['hillshade-exaggeration'] || 0.5;
        _this.hillshadeShadowColor = data['hillshade-shadow-color'] || '#000000"';
        _this.hillshadeHighlightColor = data['hillshade-highlight-color'] || '#ffffff';
        _this.hillshadeAccentColor = data['hillshade-accent-color'] || '#000000';
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
var HillShadeLayer = /** @class */ (function (_super) {
    __extends(HillShadeLayer, _super);
    function HillShadeLayer(data) {
        var _this = _super.call(this, data) || this;
        _this.paint = new PaintProperties(data.paint || {});
        _this.layout = new LayoutProperties(data.layout || {});
        return _this;
    }
    return HillShadeLayer;
}(base_layer_1.default));
exports.default = HillShadeLayer;
