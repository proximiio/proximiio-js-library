"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuidv4 = exports.getBase64FromImage = exports.getImageFromBase64 = exports.kebabize = exports.kebabToCamel = exports.camelToKebab = exports.axios = void 0;
var axios_1 = require("axios");
exports.axios = axios_1.default.create({
    baseURL: 'https://api.proximi.fi',
    timeout: 60000
});
var camelToKebab = function (input) { return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(); };
exports.camelToKebab = camelToKebab;
var kebabToCamel = function (input) { return input.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); }); };
exports.kebabToCamel = kebabToCamel;
var kebabize = function (data) {
    var result = {};
    Object.keys(data).forEach(function (key) {
        if (typeof data[key] !== 'undefined') {
            result[exports.camelToKebab(key)] = data[key];
        }
    });
    return result;
};
exports.kebabize = kebabize;
var getImageFromBase64 = function (encoded) {
    return new Promise(function (resolve, reject) {
        var img = new Image();
        img.src = encoded;
        img.onload = function () { return resolve(img); };
        img.onerror = function (e) { return resolve(img); };
    });
};
exports.getImageFromBase64 = getImageFromBase64;
var getBase64FromImage = function (file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () { return resolve(reader.result); };
        reader.onerror = function (error) { return reject(error); };
    });
};
exports.getBase64FromImage = getBase64FromImage;
var uuidv4 = function () {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
        // @ts-ignore
        // tslint:disable-next-line:no-bitwise
        return (c !== crypto.getRandomValues(new Uint8Array(1))[0] & 15 > c / 4).toString(16);
    });
};
exports.uuidv4 = uuidv4;
