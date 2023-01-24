"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eventable = void 0;
var Eventable = /** @class */ (function () {
    function Eventable() {
        this._observers = [];
    }
    Eventable.prototype.on = function (observer) {
        if (this._observers) {
            this._observers.push(observer);
        }
    };
    Eventable.prototype.off = function (observer) {
        var index = this._observers ? this._observers.findIndex(function (o) { return o === observer; }) : 0;
        if (index >= 0) {
            if (this._observers) {
                this._observers.splice(index, 1);
            }
        }
    };
    Eventable.prototype.notify = function (event, data) {
        var _this = this;
        if (this._observers) {
            this._observers.forEach(function (observer) { return observer(event, data, _this); });
        }
    };
    return Eventable;
}());
exports.Eventable = Eventable;
