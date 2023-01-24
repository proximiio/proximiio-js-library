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
var eventable_1 = require("../../../eventable");
var BaseSource = /** @class */ (function (_super) {
    __extends(BaseSource, _super);
    function BaseSource(id, type) {
        var _this = _super.call(this) || this;
        _this.id = id;
        _this.type = type;
        return _this;
    }
    Object.defineProperty(BaseSource.prototype, "source", {
        get: function () {
            return {
                type: this.type,
            };
        },
        enumerable: false,
        configurable: true
    });
    return BaseSource;
}(eventable_1.Eventable));
exports.default = BaseSource;
