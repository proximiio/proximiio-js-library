import { axios } from '../common';
import { LoginDataModel } from '../models/auth-data';

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
    }
    return loginRes;
  } catch (e) {
    throw new Error(`Login failed, ${e.message}`);
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
    }
    return currentUser;
  } catch (e) {
    throw new Error(`Login failed, ${e.message}`);
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
    throw new Error(`Fetching config failed, ${e.message}`);
  }
};

export default {
  login,
  loginWithToken,
  getUserConfig,
};
