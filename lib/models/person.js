"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("../common");
var PersonModel = /** @class */ (function () {
    function PersonModel(data) {
        this.id = data.id ? data.id : common_1.uuidv4();
        this.lat = data.lat;
        this.lng = data.lng;
        this.level = data.level;
    }
    PersonModel.prototype.updatePosition = function (data) {
        this.lat = data.lat;
        this.lng = data.lng;
        this.level = data.level;
    };
    return PersonModel;
}());
exports.default = PersonModel;
