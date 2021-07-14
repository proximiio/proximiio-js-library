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
exports.FeatureCollection = exports.Geometry = void 0;
var base_1 = require("./base");
var poi_type_1 = require("./poi_type");
var Geometry = /** @class */ (function () {
    function Geometry(data) {
        this.type = data.type;
        this.coordinates = data.coordinates;
    }
    return Geometry;
}());
exports.Geometry = Geometry;
var FeatureCollection = /** @class */ (function () {
    function FeatureCollection(data) {
        this.type = 'FeatureCollection';
        this.features = (data.features || []).map(function (f) { return new Feature(f).json; });
    }
    Object.defineProperty(FeatureCollection.prototype, "json", {
        get: function () {
            return {
                type: 'FeatureCollection',
                features: this.features.map(function (feature) { return feature.json; })
            };
        },
        enumerable: false,
        configurable: true
    });
    return FeatureCollection;
}());
exports.FeatureCollection = FeatureCollection;
var Feature = /** @class */ (function (_super) {
    __extends(Feature, _super);
    function Feature(data) {
        var _this = _super.call(this, data) || this;
        _this.type = 'Feature';
        _this.id = data.id;
        _this.geometry = new Geometry(data.geometry);
        _this.properties = data.properties || {};
        if (typeof _this.properties.title_i18n === 'string') {
            _this.properties.title_i18n = JSON.parse(_this.properties.title_i18n);
        }
        if (_this.isPoint) {
            if (!_this.properties.images) {
                _this.properties.images = [];
            }
            if (!_this.properties.range) {
                _this.properties.range = 3;
            }
        }
        if (typeof _this.properties.images === 'string') {
            _this.properties.images = JSON.parse(_this.properties.images);
        }
        if (_this.isLevelChanger && Array.isArray(_this.properties.levels)) {
            _this.properties.levels.forEach(function (level) { return _this.properties["__level_" + level] = true; });
        }
        if (_this.properties.type === 'text' && Array.isArray(_this.properties.textFont)) {
            _this.properties.textFont = _this.properties.textFont[0];
        }
        return _this;
    }
    Object.defineProperty(Feature.prototype, "isEditable", {
        get: function () {
            return this.isPoint || this.isLineString || this.isPolygon;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isPoint", {
        get: function () {
            return this.geometry.type === 'Point';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isPolygon", {
        get: function () {
            return this.geometry.type === 'Polygon' || this.geometry.type === 'MultiPolygon';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isLineString", {
        get: function () {
            return this.geometry.type === 'LineString' || this.geometry.type === 'MultiLineString';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isHazard", {
        get: function () {
            return this.properties.type === poi_type_1.POI_TYPE.HAZARD;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isLandmark", {
        get: function () {
            return this.properties.type === poi_type_1.POI_TYPE.LANDMARK;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isDoor", {
        get: function () {
            return this.properties.type === poi_type_1.POI_TYPE.DOOR;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isEntrance", {
        get: function () {
            return this.properties.type === poi_type_1.POI_TYPE.ENTRANCE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isDecisionPoint", {
        get: function () {
            return this.properties.type === poi_type_1.POI_TYPE.DECISION;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isTicketGate", {
        get: function () {
            return this.properties.type === poi_type_1.POI_TYPE.TICKET_GATE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isElevator", {
        get: function () {
            return this.properties.type === poi_type_1.POI_TYPE.ELEVATOR;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isEscalator", {
        get: function () {
            return this.properties.type === poi_type_1.POI_TYPE.ESCALATOR;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isStairCase", {
        get: function () {
            return this.properties.type === poi_type_1.POI_TYPE.STAIRCASE;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isLevelChanger", {
        get: function () {
            return this.isElevator || this.isEscalator || this.isStairCase;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isText", {
        get: function () {
            return this.properties.type === 'text';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isSynthetic", {
        get: function () {
            var keys = ['id', 'place_id', 'floor_id', 'level'];
            if (this.geometry.type === 'LineString' || this.geometry.type === 'MultiLineString') {
                keys.push('class');
            }
            return Object.keys(this.properties).map(function (key) { return !keys.includes(key); }).filter(function (i) { return i; }).length === 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isRoom", {
        get: function () {
            return this.properties.room;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "isRouting", {
        get: function () {
            return this.properties.usecase === 'routing';
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "getTitle", {
        get: function () {
            return this.properties.title;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "getTitleWithLevel", {
        get: function () {
            return this.properties.title + " - Level: " + this.properties.level;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Feature.prototype, "json", {
        get: function () {
            if (this.properties.cameFrom) {
                delete this.properties.cameFrom;
            }
            if (this.properties.fixedPointMap) {
                delete this.properties.fixedPointMap;
            }
            var clone = JSON.parse(JSON.stringify(this));
            if (clone.properties.metadata && typeof clone.properties.metadata !== 'object') {
                try {
                    clone.properties.metadata = JSON.parse(clone.properties.metadata);
                }
                catch (e) {
                    console.log('feature parsing failed:', clone.properties.metadata);
                }
            }
            Object.keys(clone.properties).forEach(function (key) {
                if (key.match('__level')) {
                    delete clone.properties.key;
                }
            });
            return clone;
        },
        enumerable: false,
        configurable: true
    });
    Feature.point = function (id, latitude, longitude, properties) {
        return new Feature({
            id: id,
            geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            properties: properties
        });
    };
    Feature.prototype.setTitle = function (title, lang) {
        if (lang === void 0) { lang = 'en'; }
        if (typeof this.properties.title_18n === 'undefined') {
            this.properties.title_18n = {};
        }
        this.properties.title_18n[lang] = title;
    };
    Feature.prototype.hasLevel = function (level) {
        if (this.isLevelChanger) {
            return this.properties.levels.includes(level);
        }
        else {
            return this.properties.level === level;
        }
    };
    return Feature;
}(base_1.default));
exports.default = Feature;
