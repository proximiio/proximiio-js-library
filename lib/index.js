"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var auth_1 = require("./controllers/auth");
var places_1 = require("./controllers/places");
var floors_1 = require("./controllers/floors");
var main_1 = require("./components/map/main");
var main_2 = require("./components/select/main");
exports.default = {
    Auth: auth_1.default,
    Places: places_1.default,
    Floors: floors_1.default,
    Map: main_1.Map,
    Select: main_2.Select
};
