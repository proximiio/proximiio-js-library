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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var eventable_1 = require("../../../eventable");
var floors_1 = require("../../../controllers/floors");
var ImageSourceManager = /** @class */ (function (_super) {
    __extends(ImageSourceManager, _super);
    function ImageSourceManager() {
        var _this = _super.call(this) || this;
        _this.sources = [];
        _this.layers = [];
        _this.floors = { data: [], total: 0 };
        _this.belowLayer = 'proximiio-floors';
        _this.enabled = true;
        return _this;
    }
    ImageSourceManager.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, (0, floors_1.getFloors)()];
                    case 1:
                        _a.floors = _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ImageSourceManager.prototype.setLevel = function (map, level, state) {
        var _this = this;
        this.layers.forEach(function (id) {
            try {
                if (state.style.getLayer(id)) {
                    state.style.removeLayer(id);
                }
            }
            catch (e) {
                console.log('unable to remove layer', id);
            }
        });
        this.sources.forEach(function (id) {
            try {
                if (state.style.getSource(id)) {
                    state.style.removeSource(id);
                }
            }
            catch (e) {
                console.log('unable to remove source', id);
            }
        });
        if (this.enabled) {
            var floors = this.floors.data.filter(function (floor) { return floor.hasFloorplan && floor.level === level; });
            floors.forEach(function (floor) {
                var source = {
                    type: 'image',
                    url: floor.floorplanImageUrl,
                    // tslint:disable-next-line:no-non-null-assertion
                    coordinates: floor.anchors,
                };
                var sourceId = "image-source-".concat(floor.id);
                state.style.addSource(sourceId, source);
                _this.sources.push(sourceId);
                var layer = {
                    id: "image-layer-".concat(floor.id),
                    type: 'raster',
                    source: sourceId,
                    layout: {
                        visibility: 'visible',
                    },
                };
                state.style.addLayer(layer, _this.belowLayer);
                _this.layers.push(layer.id);
            });
            map.setStyle(state.style);
        }
    };
    return ImageSourceManager;
}(eventable_1.Eventable));
exports.default = ImageSourceManager;
