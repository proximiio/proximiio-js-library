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
var common_1 = require("../../../common");
var PaintProperties = /** @class */ (function (_super) {
    __extends(PaintProperties, _super);
    function PaintProperties(data) {
        var _this = _super.call(this) || this;
        _this.iconColor = data['icon-color'] || '#000000';
        _this.iconOpacity = data['icon-opacity'] || 1;
        _this.iconHaloColor = data['icon-halo-color'] || 'rgba(0, 0, 0, 0)';
        _this.iconHaloWidth = data['icon-halo-width'] || 0;
        _this.iconHaloBlur = data['icon-halo-blur'] || 0;
        _this.iconTranslate = data['icon-translate'] || [0, 0];
        _this.iconTranslateAnchor = data['icon-translate-anchor'] || 'map';
        _this.textOpacity = data['text-opacity'] || 1;
        _this.textColor = data['text-color'] || '#000000';
        _this.textHaloColor = data['text-halo-color'] || 'rgba(0, 0, 0, 0)';
        _this.textHaloWidth = data['text-halo-width'] || 0;
        _this.textHaloBlur = data['text-halo-blur'] || 0;
        _this.textTranslate = data['text-translate'] || [0, 0];
        _this.textTranslateAnchor = data['text-translate-anchor'] || 'map';
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
        _this.symbolPlacement = data['symbol-placement'] || 'point';
        _this.symbolSpacing = data['symbol-spacing'] || 250;
        _this.symbolAvoidEdges = data['symbol-avoid-edges'] || false;
        _this.symbolSortKey = data['symbol-sort-key'];
        _this.symbolZOrder = data['symbol-z-order'] || 'auto';
        _this.iconAllowOverlap = data['icon-allow-overlap'] || false;
        _this.iconIgnorePlacement = data['icon-ignore-placement'] || false;
        _this.iconOptional = data['icon-optional'] || false;
        _this.iconRotationAlignment = data['icon-rotation-alignment'] || 'auto';
        _this.iconSize = data['icon-size'] || 1;
        _this.iconTextFit = data['icon-text-fit'] || 'none';
        _this.iconTextFitPadding = data['icon-text-fit-padding'] || [0, 0, 0, 0];
        _this.iconImage = data['icon-image'];
        _this.iconRotate = data['icon-rotate'] || 0;
        _this.iconPadding = data['icon-padding'] || 2;
        _this.iconKeepUpright = data['icon-keep-upright'] || false;
        _this.iconOffset = data['icon-offset'] || [0, 0];
        _this.iconAnchor = data['icon-anchor'] || 'center';
        _this.iconPitchAlignment = data['icon-pitch-alignment'] || 'auto';
        _this.textPitchAlignment = data['text-pitch-alignment'] || 'auto';
        _this.textRotationAlignment = data['text-rotation-alignment'] || 'auto';
        if ((typeof data['text-font'] === 'string' && data['text-font'] === '{textFont}') ||
            (typeof data['text-font'] === 'object' && data['text-font'].property === 'textFont')) {
            _this.textFont = [
                'match',
                ['string', ['get', 'textFont']],
                'Klokantech Noto Sans Bold', ['literal', ['Klokantech Noto Sans Bold']],
                'Klokantech Noto Sans CJK Bold', ['literal', ['Klokantech Noto Sans CJK Bold']],
                'Klokantech Noto Sans CJK Regular', ['literal', ['Klokantech Noto Sans CJK Regular']],
                'Klokantech Noto Sans Italic', ['literal', ['Klokantech Noto Sans Italic']],
                'Klokantech Noto Sans Regular', ['literal', ['Klokantech Noto Sans Regular']],
                'Noto Sans Bold', ['literal', ['Noto Sans Bold']],
                'Noto Sans Bold Italic', ['literal', ['Noto Sans Bold Italic']],
                'Noto Sans Italic', ['literal', ['Noto Sans Italic']],
                'Noto Sans Regular', ['literal', ['Noto Sans Regular']],
                'Open Sans Bold', ['literal', ['Open Sans Bold']],
                'Open Sans Italic', ['literal', ['Open Sans Italic']],
                'Open Sans Regular', ['literal', ['Open Sans Regular']],
                'Open Sans Semibold', ['literal', ['Open Sans Semibold']],
                'Open Sans Semibold Italic', ['literal', ['Open Sans Semibold Italic']],
                ['literal', ['Klokantech Noto Sans Bold']]
            ];
        }
        else {
            _this.textFont = data['text-font'];
        }
        _this.textField = data['text-field'] || '';
        _this.textSize = data['text-size'] || 16;
        _this.textMaxWidth = data['text-max-width'] || 10;
        _this.textLineHeight = data['text-line-height'] || 1.2;
        _this.textLetterSpacing = data['text-letter-spacing'] || 0;
        _this.textJustify = data['text-justify'] || 'center';
        _this.textRadialOffset = data['text-radial-offset'] || 0;
        _this.textVariableAnchor = data['text-variable-anchor'];
        _this.textAnchor = data['text-anchor'] || 'center';
        _this.textMaxAngle = data['text-max-angle'] || 45;
        _this.textWritingMode = data['text-writing-mode'];
        _this.textRotate = data['text-rotate'] || 0;
        _this.textPadding = data['text-padding'] || 2;
        _this.textKeepUpright = data['text-keep-upright'] || true;
        _this.textTransform = data['text-transform'] || 'none';
        _this.textOffset = data['text-offset'] || [0, 0];
        _this.textAllowOverlap = data['text-allow-overlap'] || false;
        _this.textIgnorePlacement = data['text-ignore-placement'] || false;
        _this.textOptional = data['text-optional'] || false;
        return _this;
    }
    Object.defineProperty(LayoutProperties.prototype, "json", {
        get: function () {
            var data = common_1.kebabize(this);
            data['symbol-z-order'] = this.symbolZOrder;
            delete data['symbol-zorder'];
            return data;
        },
        enumerable: false,
        configurable: true
    });
    return LayoutProperties;
}(base_layer_1.Serializable));
exports.LayoutProperties = LayoutProperties;
var SymbolLayer = /** @class */ (function (_super) {
    __extends(SymbolLayer, _super);
    function SymbolLayer(data) {
        var _this = _super.call(this, data) || this;
        _this.paint = new PaintProperties(data.paint || {});
        _this.layout = new LayoutProperties(data.layout || {});
        return _this;
    }
    return SymbolLayer;
}(base_layer_1.default));
exports.default = SymbolLayer;
