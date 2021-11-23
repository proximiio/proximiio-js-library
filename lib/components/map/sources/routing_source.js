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
        while (_) try {
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
var data_source_1 = require("./data_source");
var feature_1 = require("../../../models/feature");
var routing_1 = require("../routing");
var RoutingSource = /** @class */ (function (_super) {
    __extends(RoutingSource, _super);
    function RoutingSource() {
        var _this = _super.call(this, 'route') || this;
        _this.isEditable = false;
        _this.changes = [];
        _this.routing = new routing_1.default();
        return _this;
    }
    RoutingSource.prototype.toggleAccessible = function (value) {
        this.routing.toggleOnlyAccessible(value);
    };
    RoutingSource.prototype.update = function (start, finish) {
        return __awaiter(this, void 0, void 0, function () {
            var route, levelPaths_1, lines_1, levels;
            return __generator(this, function (_a) {
                this.start = start;
                this.finish = finish;
                this.data = new feature_1.FeatureCollection({
                    features: [this.start, this.finish].concat(this.lines || []).filter(function (i) { return i; }),
                });
                this.notify('feature-updated');
                if (start && finish) {
                    this.notify('loading-start');
                    route = this.routing.route(start, finish);
                    levelPaths_1 = route.levelPaths;
                    // @ts-ignore
                    this.route = route.levelPaths;
                    // @ts-ignore
                    this.points = route.points.map(function (i) {
                        return new feature_1.default(i);
                    });
                    if (levelPaths_1) {
                        lines_1 = [];
                        levels = Object.keys(levelPaths_1);
                        levels.forEach(function (level) {
                            var path = levelPaths_1[level];
                            path.id = "routing-path-" + level;
                            path.properties.amenity = 'chevron_right';
                            path.properties.level = level;
                            lines_1.push(path);
                        });
                        this.lines = lines_1.sort(function (a, b) { return (+a.properties.level > +b.properties.level ? 1 : -1); });
                    }
                    else {
                        this.lines = [];
                        this.notify('route-undefined');
                    }
                    // Older api routing
                    // this.route = await getRoute(start, finish)
                    // this.lines = Object.keys(this.route.levelPaths).map(key => this.route.levelPaths[key]).map(line => {
                    //   line.properties.amenity = 'chevron_right'
                    //   return line
                    // })
                    this.data = new feature_1.FeatureCollection({
                        features: [this.start, this.finish].concat(this.lines || []).filter(function (i) { return i; }),
                    });
                    this.notify('loading-finished');
                    this.notify('feature-updated');
                }
                return [2 /*return*/];
            });
        });
    };
    RoutingSource.prototype.cancel = function () {
        this.start = undefined;
        this.finish = undefined;
        this.lines = undefined;
        this.route = undefined;
        this.data = new feature_1.FeatureCollection({
            features: [this.start, this.finish].concat(this.lines || []).filter(function (i) { return i; }),
        });
        this.notify('feature-updated');
    };
    return RoutingSource;
}(data_source_1.default));
exports.default = RoutingSource;
