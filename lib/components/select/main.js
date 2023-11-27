"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.Select = void 0;
var places_1 = require("../../controllers/places");
var floors_1 = require("../../controllers/floors");
var geo_1 = require("../../controllers/geo");
// @ts-ignore
var Autocomplete = require("@tarekraafat/autocomplete.js");
var rxjs_1 = require("rxjs");
var Select = /** @class */ (function () {
    /**
     *  @memberof Select
     *  @name constructor
     *  @param dataset { Datasets } predefined proximi.io dataset to search on, could be Places | Floors | Pois
     *  @param options { AutocompleteOptions } autocomplete.js options, check https://tarekraafat.github.io/autoComplete.js/#/configuration for more info
     *  @param useApiSearch { boolean } use this option if you want to use api to filter the results, necessary if you have 100+ places | floors, default false.
     *  @example
     *  const select = new Proximiio.Select('Places');
     */
    function Select(dataset, options, useApiSearch) {
        var _this = this;
        this.useApiSearch = false;
        this.onSelectListener = new rxjs_1.Subject();
        var selector = (options === null || options === void 0 ? void 0 : options.selector) ? "".concat(options.selector) : '#proximiioSelect';
        this.useApiSearch = useApiSearch !== undefined ? useApiSearch : false;
        this.ac = new Autocomplete(__assign({ data: this.getData(dataset), selector: selector }, options));
        document.querySelector(selector).addEventListener('selection', function (event) {
            var feedback = event.detail;
            document.querySelector(selector).blur();
            var selection = feedback.selection.value[feedback.selection.key];
            document.querySelector(selector).value = selection;
            _this.onSelectListener.next(feedback.selection.value);
        });
    }
    Select.prototype.getData = function (dataset) {
        if (dataset === 'Places') {
            return this.getPlaces();
        }
        if (dataset === 'Floors') {
            return this.getFloors();
        }
        if (dataset === 'Pois') {
            return this.getPois();
        }
    };
    Select.prototype.getPlaces = function () {
        var _this = this;
        return {
            src: function (query) { return __awaiter(_this, void 0, void 0, function () {
                var places, _a, error_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 5, , 6]);
                            if (!this.useApiSearch) return [3 /*break*/, 2];
                            return [4 /*yield*/, places_1.default.getPlaces(10, 0, undefined, undefined, 'name', query)];
                        case 1:
                            _a = _b.sent();
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, places_1.default.getPlaces(100)];
                        case 3:
                            _a = _b.sent();
                            _b.label = 4;
                        case 4:
                            places = _a;
                            return [2 /*return*/, places.data];
                        case 5:
                            error_1 = _b.sent();
                            return [2 /*return*/, error_1];
                        case 6: return [2 /*return*/];
                    }
                });
            }); },
            keys: ['name'],
            cache: false,
        };
    };
    Select.prototype.getFloors = function () {
        var _this = this;
        return {
            src: function (query) { return __awaiter(_this, void 0, void 0, function () {
                var floors, _a, error_2;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 5, , 6]);
                            if (!this.useApiSearch) return [3 /*break*/, 2];
                            return [4 /*yield*/, floors_1.default.getFloors(10, 0, undefined, undefined, 'name', query)];
                        case 1:
                            _a = _b.sent();
                            return [3 /*break*/, 4];
                        case 2: return [4 /*yield*/, floors_1.default.getFloors(100)];
                        case 3:
                            _a = _b.sent();
                            _b.label = 4;
                        case 4:
                            floors = _a;
                            return [2 /*return*/, floors.data];
                        case 5:
                            error_2 = _b.sent();
                            return [2 /*return*/, error_2];
                        case 6: return [2 /*return*/];
                    }
                });
            }); },
            keys: ['name'],
            cache: false,
        };
    };
    Select.prototype.getPois = function () {
        var _this = this;
        return {
            src: function (query) { return __awaiter(_this, void 0, void 0, function () {
                var error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, geo_1.default.getPois()];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_3 = _a.sent();
                            return [2 /*return*/, error_3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); },
            keys: ['getTitleWithLevel'],
            cache: false,
        };
    };
    /**
     * Listen to on select event
     *  @memberof Select
     *  @name getSelectListener
     *  @returns returns select listener
     *  @example
     *  const select = new Proximiio.Select('Places');
     *  select.getSelectListener().subscribe((place) => {
     *    console.log('place selected', place);
     *  });
     */
    Select.prototype.getSelectListener = function () {
        return this.onSelectListener.asObservable();
    };
    return Select;
}());
exports.Select = Select;
