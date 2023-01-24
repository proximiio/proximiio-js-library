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
        _this.fillAntialias = data['fill-antialias'] || true;
        _this.fillOpacity = data['fill-opacity'] || 1;
        _this.fillColor = data['fill-color'] || '#000000';
        _this.fillOutlineColor = data['fill-outline-color'];
        _this.fillTranslate = data['fill-translate'] || [0, 0];
        _this.fillTranslateAnchor = data['fill-translate-anchor'] || 'map';
        _this.fillPattern = data['fill-pattern'];
        return _this;
    }
    return PaintProperties;
}(base_layer_1.Serializable));
exports.PaintProperties = PaintProperties;
var LayoutProperties = /** @class */ (function (_super) {
    __extends(LayoutProperties, _super);
    function LayoutProperties(data) {
        var _this = _super.call(this) || this;
        // this.fillSortKey = data['fill-sort-key']
        _this.visibility = data.visibility || 'visible';
        return _this;
    }
    return LayoutProperties;
}(base_layer_1.Serializable));
exports.LayoutProperties = LayoutProperties;
var FillLayer = /** @class */ (function (_super) {
    __extends(FillLayer, _super);
    function FillLayer(data) {
        var _this = _super.call(this, data) || this;
        _this.paint = new PaintProperties(data.paint || {});
        _this.layout = new LayoutProperties(data.layout || {});
        return _this;
    }
    return FillLayer;
}(base_layer_1.default));
exports.default = FillLayer;
