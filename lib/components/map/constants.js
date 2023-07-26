"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EDIT_FEATURE_DIALOG = exports.NEW_FEATURE_DIALOG = exports.METADATA_POLYGON_EDITING = exports.DEFAULT_FONT = exports.FONTS = void 0;
exports.FONTS = [
    'Klokantech Noto Sans Bold',
    'Klokantech Noto Sans CJK Bold',
    'Klokantech Noto Sans CJK Regular',
    'Klokantech Noto Sans Italic',
    'Klokantech Noto Sans Regular',
    'Noto Sans Bold',
    'Noto Sans Bold Italic',
    'Noto Sans Italic',
    'Noto Sans Regular',
    'Open Sans Bold',
    'Open Sans Italic',
    'Open Sans Regular',
    'Open Sans Semibold',
    'Open Sans Semibold Italic',
];
exports.DEFAULT_FONT = 'Klokantech Noto Sans Regular';
exports.METADATA_POLYGON_EDITING = 'proximiio:polygon-editing';
var NEW_FEATURE_DIALOG = function (e, currentFloor) {
    return "\n    <h1>Add New Feature</h1>\n    <form name=\"form\" id=\"modal-form\" class=\"modal-form\" autocomplete=\"off\" role=\"main\">\n      <div>\n        <label class=\"label-id\">\n          <input type=\"text\" class=\"text\" name=\"id\" placeholder=\"ID\" />\n          <span>ID</span>\n        </label>\n      </div>\n      \n      <div>\n        <label class=\"label-title\">\n          <input type=\"text\" class=\"text\" name=\"title\" placeholder=\"Title\" required />\n          <span class=\"required\">Title</span>\n        </label>\n      </div>\n      \n      <div>\n        <label class=\"label-level\">\n          <input type=\"number\" class=\"text\" name=\"level\" placeholder=\"Level\" value='".concat(currentFloor ? currentFloor : 0, "' required />\n          <span class=\"required\">Level</span>\n        </label>\n      </div>\n  \n      <div>\n        <label class=\"label-lat\">\n          <input type=\"text\" class=\"text\" name=\"lat\" placeholder=\"Latitude\" value='").concat(e.lngLat.lat, "' required />\n          <span class=\"required\">Latitude</span>\n        </label>\n      </div>\n      \n      <div>\n        <label class=\"label-lng\">\n          <input type=\"text\" class=\"text\" name=\"lng\" placeholder=\"Longitude\" value='").concat(e.lngLat.lng, "' required />\n          <span class=\"required\">Longitude</span>\n        </label>\n      </div>\n      \n      <div>\n        <label class=\"label-icon\">\n          <input type=\"file\" class=\"text\" name=\"icon\" placeholder=\"Icon\" accept=\"image/*\"/>\n          <span>Icon</span>\n        </label>\n      </div>\n    </form>\n  ");
};
exports.NEW_FEATURE_DIALOG = NEW_FEATURE_DIALOG;
var EDIT_FEATURE_DIALOG = function (e, feature) {
    var _a, _b, _c;
    return "\n    <h1>Edit Feature</h1>\n    <form name=\"form\" id=\"modal-form\" class=\"modal-form\" autocomplete=\"off\" role=\"main\">\n      <div>\n        <label class=\"label-id\">\n          <input type=\"text\" class=\"text\" name=\"id\" placeholder=\"ID\" value='".concat((_a = feature === null || feature === void 0 ? void 0 : feature.properties) === null || _a === void 0 ? void 0 : _a.id, "' readonly style=\"pointer-events: none;background-color: #E9ECEF\"/>\n          <span>ID</span>\n        </label>\n      </div>\n      \n      <div>\n        <label class=\"label-title\">\n          <input type=\"text\" class=\"text\" name=\"title\" placeholder=\"Title\" value='").concat((_b = feature === null || feature === void 0 ? void 0 : feature.properties) === null || _b === void 0 ? void 0 : _b.title, "' required />\n          <span class=\"required\">Title</span>\n        </label>\n      </div>\n      \n      <div>\n        <label class=\"label-level\">\n          <input type=\"number\" class=\"text\" name=\"level\" placeholder=\"Level\" value='").concat((_c = feature === null || feature === void 0 ? void 0 : feature.properties) === null || _c === void 0 ? void 0 : _c.level, "' required />\n          <span class=\"required\">Level</span>\n        </label>\n      </div>\n  \n      <div>\n        <label class=\"label-lat\">\n          <input type=\"text\" class=\"text\" name=\"lat\" placeholder=\"Latitude\" value='").concat(e.lngLat.lat, "' required />\n          <span class=\"required\">Latitude</span>\n        </label>\n      </div>\n      \n      <div>\n        <label class=\"label-lng\">\n          <input type=\"text\" class=\"text\" name=\"lng\" placeholder=\"Longitude\" value='").concat(e.lngLat.lng, "' required />\n          <span class=\"required\">Longitude</span>\n        </label>\n      </div>\n      \n      <div>\n        <label class=\"label-icon\">\n          <input type=\"file\" class=\"text\" name=\"icon\" placeholder=\"Icon\" accept=\"image/*\"/>\n          <span>Icon</span>\n        </label>\n      </div>\n    </form>\n  ");
};
exports.EDIT_FEATURE_DIALOG = EDIT_FEATURE_DIALOG;
