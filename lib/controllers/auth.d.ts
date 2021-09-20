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
export declare const login: (email: string, password: string) => Promise<import("axios").AxiosResponse<any>>;
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
export declare const loginWithToken: (token: string) => Promise<import("axios").AxiosResponse<any>>;
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
export declare const getUserConfig: () => Promise<any>;
declare const _default: {
    login: (email: string, password: string) => Promise<import("axios").AxiosResponse<any>>;
    loginWithToken: (token: string) => Promise<import("axios").AxiosResponse<any>>;
    getUserConfig: () => Promise<any>;
};
export default _default;
