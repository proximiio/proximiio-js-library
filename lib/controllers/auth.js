var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { axios } from '../common';
let loggedUser = null;
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
export const login = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!email) {
            throw new Error(`Please provide your email`);
        }
        if (!password) {
            throw new Error(`Please provide your password`);
        }
        const authData = { email, password };
        const loginRes = yield axios.post(`core_auth/login`, authData);
        if (loginRes.data) {
            console.info(`Logged in successfully as ${loginRes.data.user.email}`);
            axios.defaults.headers.common.Authorization = loginRes.data.token;
            loggedUser = loginRes;
        }
        return loginRes;
    }
    catch (e) {
        console.error(`Login failed, ${e.message}`);
        throw e; // Re-throw the original error
    }
});
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
export const loginWithToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!token) {
            throw new Error(`Please provide your token`);
        }
        axios.defaults.headers.common.Authorization = token;
        const currentUser = yield axios.get(`core/current_user`);
        if (currentUser.data) {
            console.info(`Logged in successfully as ${currentUser.data.email}`);
            loggedUser = currentUser;
        }
        return currentUser;
    }
    catch (e) {
        console.error(`Login failed, ${e.message}`);
        throw e; // Re-throw the original error
    }
});
/**
 *  @memberof Auth
 *  @name setToken
 *  @param token {string} token for authentication
 *  @example
 *  Proximiio.Auth.setToken(mytoken).then(res => {
 *    // authenticated
 *  });
 */
export const setToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    axios.defaults.headers.common.Authorization = token;
    return `Token set successfully: ${token}`;
});
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
export const getUserConfig = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield axios.get(`config`);
        return config.data;
    }
    catch (e) {
        console.error(`Fetching config failed, ${e.message}`);
        throw e; // Re-throw the original error
    }
});
export const getCurrentUser = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = loggedUser ? loggedUser : yield axios.get(`core/current_user`);
        return currentUser.data;
    }
    catch (e) {
        console.error(`Fetching current user failed, ${e.message}`);
        throw e; // Re-throw the original error
    }
});
export default {
    login,
    loginWithToken,
    setToken,
    getUserConfig,
    getCurrentUser,
};
