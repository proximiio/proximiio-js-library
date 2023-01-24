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
var ClusterSource = /** @class */ (function (_super) {
    __extends(ClusterSource, _super);
    function ClusterSource() {
        var _this = _super.call(this, 'clusters') || this;
        _this.cluster = true;
        _this.data = new feature_1.FeatureCollection({});
        return _this;
    }
    return ClusterSource;
}(data_source_1.default));
exports.default = ClusterSource;
