"use strict";
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
exports.getCurrentUser = exports.getUserConfig = exports.loginWithToken = exports.login = void 0;
var common_1 = require("../common");
var loggedUser = null;
/**
 *  @memberof Auth
 *  @name login
 *  @param email {string} email for authentication
 *  @param password {string} password for authentication
 *  @returns logged in user data
 *  @example
 *  Proximiio.Auth.login(myemail@gmail.com, mysecretpassword)
 *    .then(res => {
 *      const user = res;
 *    }).catch(err => {
 *      console.log('login failed', err);
 *    })
 */
var login = function (email, password) { return __awaiter(void 0, void 0, void 0, function () {
    var authData, loginRes, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!email) {
                    throw new Error("Please provide your email");
                }
                if (!password) {
                    throw new Error("Please provide your password");
                }
                authData = { email: email, password: password };
                return [4 /*yield*/, common_1.axios.post("core_auth/login", authData)];
            case 1:
                loginRes = _a.sent();
                if (loginRes.data) {
                    console.info("Logged in successfully as ".concat(loginRes.data.user.email));
                    common_1.axios.defaults.headers.common.Authorization = loginRes.data.token;
                    loggedUser = loginRes;
                }
                return [2 /*return*/, loginRes];
            case 2:
                e_1 = _a.sent();
                throw new Error("Login failed, ".concat(e_1.message));
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.login = login;
/**
 *  @memberof Auth
 *  @name loginWithToken
 *  @param token {string} token for authentication
 *  @returns logged in user data
 *  @example
 *  Proximiio.Auth.loginWithToken(mytoken)
 *    .then(res => {
 *      const user = res;
 *    }).catch(err => {
 *      console.log('login failed', err);
 *    })
 */
var loginWithToken = function (token) { return __awaiter(void 0, void 0, void 0, function () {
    var currentUser, e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!token) {
                    throw new Error("Please provide your token");
                }
                common_1.axios.defaults.headers.common.Authorization = token;
                return [4 /*yield*/, common_1.axios.get("core/current_user")];
            case 1:
                currentUser = _a.sent();
                if (currentUser.data) {
                    console.info("Logged in successfully as ".concat(currentUser.data.email));
                    loggedUser = currentUser;
                }
                return [2 /*return*/, currentUser];
            case 2:
                e_2 = _a.sent();
                throw new Error("Login failed, ".concat(e_2.message));
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.loginWithToken = loginWithToken;
/**
 *  @memberof Auth
 *  @name getUserConfig
 *  @returns logged in user config data
 *  @example
 *  Proximiio.Auth.getUserConfig()
 *    .then(res => {
 *      const config = res;
 *    }).catch(err => {
 *      console.log('fetching config failed', err);
 *    })
 */
var getUserConfig = function () { return __awaiter(void 0, void 0, void 0, function () {
    var config, e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, common_1.axios.get("config")];
            case 1:
                config = _a.sent();
                return [2 /*return*/, config.data];
            case 2:
                e_3 = _a.sent();
                throw new Error("Fetching config failed, ".concat(e_3.message));
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getUserConfig = getUserConfig;
var getCurrentUser = function () { return __awaiter(void 0, void 0, void 0, function () {
    var currentUser, _a, e_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                if (!loggedUser) return [3 /*break*/, 1];
                _a = loggedUser;
                return [3 /*break*/, 3];
            case 1: return [4 /*yield*/, common_1.axios.get("core/current_user")];
            case 2:
                _a = _b.sent();
                _b.label = 3;
            case 3:
                currentUser = _a;
                return [2 /*return*/, currentUser.data];
            case 4:
                e_4 = _b.sent();
                throw new Error("Fetching current user failed, ".concat(e_4.message));
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getCurrentUser = getCurrentUser;
exports.default = {
    login: exports.login,
    loginWithToken: exports.loginWithToken,
    getUserConfig: exports.getUserConfig,
    getCurrentUser: exports.getCurrentUser,
};
