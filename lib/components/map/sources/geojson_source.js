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
var data_source_1 = require("./data_source");
var feature_1 = require("../../../models/feature");
var GeoJSONSource = /** @class */ (function (_super) {
    __extends(GeoJSONSource, _super);
    function GeoJSONSource(features) {
        var _this = _super.call(this, 'main') || this;
        _this.language = 'en';
        return _this;
    }
    GeoJSONSource.prototype.fetch = function (data) {
        this.data = new feature_1.FeatureCollection(data);
        this.mapLanguage();
    };
    GeoJSONSource.prototype.create = function (feature) {
        this.data.features.push(feature);
    };
    GeoJSONSource.prototype.update = function (feature) {
        var foundIndex = this.data.features.findIndex(function (x) { return x.id === feature.id || x.properties.id === feature.id; });
        this.data.features[foundIndex] = feature;
    };
    GeoJSONSource.prototype.delete = function (id) {
        var foundIndex = this.data.features.findIndex(function (x) { return x.id === id || x.properties.id === id; });
        this.data.features.splice(foundIndex, 1);
    };
    GeoJSONSource.prototype.mapLanguage = function () {
        var _this = this;
        var features = this.data.features.filter(function (f) { return typeof f.properties.title_i18n === 'object'; });
        features.forEach(function (feature) { return _this.mapFeatureLanguage(feature, _this.language); });
    };
    GeoJSONSource.prototype.mapFeatureLanguage = function (feature, language) {
        if (typeof feature.properties.title_i18n === 'string') {
            feature.properties.title_i18n = JSON.parse(feature.properties.title_i18n);
        }
        if (typeof feature.properties.title_i18n === 'object') {
            feature.properties.title = feature.properties.title_i18n[language]
                ? feature.properties.title_i18n[language]
                : feature.properties.title;
        }
    };
    GeoJSONSource.prototype.query = function (query, level) {
        if (level === void 0) { level = 0; }
        return this.data.features.filter(function (f) { return f.properties.title && f.properties.title.toLowerCase().match(query.toLowerCase()); });
    };
    GeoJSONSource.prototype.get = function (id) {
        return this.data.features.find(function (f) { return f.id === id; });
    };
    GeoJSONSource.prototype.getInternal = function (id) {
        return this.data.features.find(function (f) { return f.properties.id === id; });
    };
    Object.defineProperty(GeoJSONSource.prototype, "collection", {
        get: function () {
            return {
                type: 'FeatureCollection',
                features: this.data.features.map(function (f) { return f.json; }),
            };
        },
        enumerable: false,
        configurable: true
    });
    return GeoJSONSource;
}(data_source_1.default));
exports.default = GeoJSONSource;
