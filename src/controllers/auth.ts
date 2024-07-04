import { axios } from '../common';
import { LoginDataModel } from '../models/auth-data';

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

export const login = async (email: string, password: string) => {
  try {
    if (!email) {
      throw new Error(`Please provide your email`);
    }
    if (!password) {
      throw new Error(`Please provide your password`);
    }

    const authData: LoginDataModel = { email, password };
    const loginRes = await axios.post(`core_auth/login`, authData);
    if (loginRes.data) {
      console.info(`Logged in successfully as ${loginRes.data.user.email}`);
      axios.defaults.headers.common.Authorization = loginRes.data.token;
      loggedUser = loginRes;
    }
    return loginRes;
  } catch (e) {
    console.error(`Login failed, ${e.message}`);
    throw e; // Re-throw the original error
  }
};

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

export const loginWithToken = async (token: string) => {
  try {
    if (!token) {
      throw new Error(`Please provide your token`);
    }
    axios.defaults.headers.common.Authorization = token;

    const currentUser = await axios.get(`core/current_user`);
    if (currentUser.data) {
      console.info(`Logged in successfully as ${currentUser.data.email}`);
      loggedUser = currentUser;
    }
    return currentUser;
  } catch (e) {
    console.error(`Login failed, ${e.message}`);
    throw e; // Re-throw the original error
  }
};

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

export const getUserConfig = async () => {
  try {
    const config = await axios.get(`config`);
    return config.data;
  } catch (e) {
    console.error(`Fetching config failed, ${e.message}`);
    throw e; // Re-throw the original error
  }
};

export const getCurrentUser = async () => {
  try {
    const currentUser = loggedUser ? loggedUser : await axios.get(`core/current_user`);
    return currentUser.data;
  } catch (e) {
    console.error(`Fetching current user failed, ${e.message}`);
    throw e; // Re-throw the original error
  }
};

export default {
  login,
  loginWithToken,
  getUserConfig,
  getCurrentUser,
};
