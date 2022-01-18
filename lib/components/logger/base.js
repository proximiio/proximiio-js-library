"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var uuid_1 = require("uuid");
var BaseLogger = /** @class */ (function () {
    function BaseLogger(data) {
        this.id = data.id ? data.id : uuid_1.v4() + ":" + uuid_1.v4();
        this.organization_id = data.organization_id;
        this.organization_name = data.organization_name;
        this.visitor_id = data.visitor_id ? data.visitor_id : uuid_1.v4();
        this.createdAt = data.createdAt ? data.createdAt : new Date();
    }
    return BaseLogger;
}());
exports.default = BaseLogger;
