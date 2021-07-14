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
exports.FloorModel = void 0;
var base_1 = require("./base");
var FloorModel = /** @class */ (function (_super) {
    __extends(FloorModel, _super);
    function FloorModel(data) {
        var _this = _super.call(this, data) || this;
        _this.name = data.name;
        _this.placeId = data.place_id;
        _this.placeName = data.place_name;
        _this.floorplanImageUrl = data.floorplan_image_url;
        _this.level = data.level || 0;
        if (data.anchors) {
            _this.anchors = [
                [data.anchors[0].lng, data.anchors[0].lat],
                [data.anchors[1].lng, data.anchors[1].lat],
                [data.anchors[3].lng, data.anchors[3].lat],
                [data.anchors[2].lng, data.anchors[2].lat]
            ];
        }
        _this.editor = data.editor;
        _this.geopoint = data.geopoint;
        _this.remoteId = data.remote_id;
        return _this;
    }
    Object.defineProperty(FloorModel.prototype, "hasFloorplan", {
        get: function () {
            return !!(this.floorplanImageUrl && this.floorplanImageUrl.length > 1 && this.anchors);
        },
        enumerable: false,
        configurable: true
    });
    return FloorModel;
}(base_1.default));
exports.FloorModel = FloorModel;
