"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("../../common");
var BaseLogger = /** @class */ (function () {
    function BaseLogger(data) {
        this.id = data.id ? data.id : common_1.uuidv4 + ":" + common_1.uuidv4;
        this.organization_id = data.organization_id;
        this.organization_name = data.organization_name;
        this.visitor_id = data.visitor_id ? data.visitor_id : "" + common_1.uuidv4;
        this.createdAt = data.createdAt ? data.createdAt : new Date();
    }
    return BaseLogger;
}());
exports.default = BaseLogger;
