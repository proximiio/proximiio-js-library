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
var data_source_1 = require("./data_source");
var feature_1 = require("../../../models/feature");
var SyntheticSource = /** @class */ (function (_super) {
    __extends(SyntheticSource, _super);
    function SyntheticSource(data) {
        var _this = _super.call(this, 'synthetic') || this;
        _this.data = data || new feature_1.FeatureCollection({});
        return _this;
    }
    SyntheticSource.prototype.get = function (id) {
        return this.data.features.find(function (f) { return f.properties.id === id; });
    };
    return SyntheticSource;
}(data_source_1.default));
exports.default = SyntheticSource;
