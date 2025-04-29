import { storage } from './storage.js';
import { dto } from '../connection/dto.js';
import { request, HTTP_POST, HTTP_GET, HTTP_STATUS_OK } from '../connection/request.js';

export const session = (() => {

    /**
     * @type {ReturnType<typeof storage>|null}
     */
    let ses = null;

    /**
     * @returns {string|null}
     */
    const getToken = () => ses.get('token');

    /**
     * @param {string} token
     * @returns {void}
     */
    const setToken = (token) => ses.set('token', token);

    /**
     * @param {object} body
     * @returns {Promise<boolean>}
     */
    const login = (body) => {
        return request(HTTP_POST, '/api/session')
            .body(body)
            .send(dto.tokenResponse)
            .then(
                (res) => {
                    if (res.code === HTTP_STATUS_OK) {
                        setToken(res.data.token);
                    }

                    return res.code === HTTP_STATUS_OK;
                },
                () => false
            );
    };

    /**
     * @returns {void}
     */
    const logout = () => ses.unset('token');

    /**
     * @returns {boolean}
     */
    const isAdmin = () => String(getToken() ?? '.').split('.').length === 3;

    /**
     * @returns {Promise<ReturnType<typeof dto.baseResponse<object>>}
     */
    const guest = () => {
        return request(HTTP_GET, '/api/config')
            .token(getToken())
            .send()
            .then((res) => {
                if (res.code !== HTTP_STATUS_OK) {
                    throw new Error('failed to get config.');
                }

                const config = storage('config');
                for (const [k, v] of Object.entries(res.data)) {
                    config.set(k, v);
                }

                return res;
            });
    };

    /**
     * @returns {object|null}
     */
    const decode = () => {
        if (!isAdmin()) {
            return null;
        }

        try {
            return JSON.parse(window.atob(getToken().split('.')[1]));
        } catch {
            return null;
        }
    };

    /**
     * @returns {void}
     */
    const init = () => {
        ses = storage('session');
    };

    return {
        init,
        guest,
        login,
        logout,
        decode,
        isAdmin,
        setToken,
        getToken,
    };
})();