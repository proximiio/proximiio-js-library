"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BaseModel = /** @class */ (function () {
    function BaseModel(data) {
        this.id = data.id || (data.properties ? data.properties.id : undefined);
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
    Object.defineProperty(BaseModel.prototype, "exists", {
        get: function () {
            return typeof this.id !== 'undefined';
        },
        enumerable: false,
        configurable: true
    });
    return BaseModel;
}());
exports.default = BaseModel;
