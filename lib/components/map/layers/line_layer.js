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
        _this.lineColor = data['line-color'] || '#000000';
        _this.lineOpacity = data['line-opacity'] || 1;
        _this.lineTranslate = data['line-translate'] || [0, 0];
        _this.lineTranslateAnchor = data['line-translate-anchor'] || 'map';
        _this.lineWidth = data['line-width'] || 1;
        _this.lineGapWidth = data['line-gap-width'] || 0;
        _this.lineOffset = data['line-offset'] || 0;
        _this.lineBlur = data['line-blur'] || 0;
        _this.lineDashArray = data['line-dash-array'];
        _this.linePattern = data['line-pattern'];
        _this.lineGradient = data['line-gradient'];
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
        _this.lineCap = data['line-cap'] || 'butt';
        _this.lineJoin = data['line-join'] || 'miter';
        _this.lineMiterLimit = data['line-miter-limit'] || 2;
        _this.lineRoundLimit = data['line-round-limit'] || 1.05;
        return _this;
    }
    return LayoutProperties;
}(base_layer_1.Serializable));
exports.LayoutProperties = LayoutProperties;
var LineLayer = /** @class */ (function (_super) {
    __extends(LineLayer, _super);
    function LineLayer(data) {
        var _this = _super.call(this, data) || this;
        _this.paint = new PaintProperties(data.paint || {});
        _this.layout = new LayoutProperties(data.layout || {});
        return _this;
    }
    return LineLayer;
}(base_layer_1.default));
exports.default = LineLayer;
