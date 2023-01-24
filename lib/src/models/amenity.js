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
exports.AmenityModel = void 0;
var base_1 = require("./base");
var AmenityModel = /** @class */ (function (_super) {
    __extends(AmenityModel, _super);
    function AmenityModel(data) {
        var _this = _super.call(this, data) || this;
        _this.category = data.category;
        _this.iconOffset = data.iconOffset;
        _this.list = data.list;
        _this.title = data.title;
        _this.description = data.description;
        _this.icon = data.icon;
        return _this;
    }
    Object.defineProperty(AmenityModel.prototype, "hasIcon", {
        get: function () {
            return !!this.icon;
        },
        enumerable: false,
        configurable: true
    });
    return AmenityModel;
}(base_1.default));
exports.AmenityModel = AmenityModel;
