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
var base_source_1 = require("./base_source");
var feature_1 = require("../../../models/feature");
var DataSource = /** @class */ (function (_super) {
    __extends(DataSource, _super);
    function DataSource(id, data) {
        var _this = _super.call(this, id, 'geojson') || this;
        _this.cluster = false;
        _this.clusterRadius = 50;
        _this.clusterMaxZoom = 19;
        _this.isEditable = true;
        _this.data = data || new feature_1.FeatureCollection({});
        return _this;
    }
    Object.defineProperty(DataSource.prototype, "source", {
        get: function () {
            return {
                type: this.type,
                data: this.data,
                cluster: this.cluster,
                clusterMaxZoom: this.clusterMaxZoom,
                clusterRadius: this.clusterRadius,
            };
        },
        enumerable: false,
        configurable: true
    });
    return DataSource;
}(base_source_1.default));
exports.default = DataSource;
