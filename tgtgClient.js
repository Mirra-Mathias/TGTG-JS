const axios = require("axios");
const urljoin = require("url-join");
const {randomBytes} = require("crypto");

const BASE_URL = "https://apptoogoodtogo.com/api/";
const API_ITEM_ENDPOINT = "item/v7/";
const AUTH_BY_EMAIL_ENDPOINT = "auth/v3/authByEmail";
const AUTH_POLLING_ENDPOINT = "auth/v3/authByRequestPollingId";
const REFRESH_ENDPOINT = "auth/v3/token/refresh";
const DEFAULT_APK_VERSION = "22.5.5";
const USER_AGENTS = [
    "TGTG/{} Dalvik/2.1.0 (Linux; U; Android 9; Nexus 5 Build/M4B30Z)",
    "TGTG/{} Dalvik/2.1.0 (Linux; U; Android 10; SM-G935F Build/NRD90M)",
    "TGTG/{} Dalvik/2.1.0 (Linux; Android 12; SM-G920V Build/MMB29K)",
];
const DEFAULT_ACCESS_TOKEN_LIFETIME = 3600 * 4;
const MAX_POLLING_TRIES = 24;
const POLLING_WAIT_TIME = 5;

class TgtgClient {
    constructor(options = {}) {
        this.base_url = options.url || BASE_URL;
        this.email = options.email;
        this.access_token = options.access_token;
        this.refresh_token = options.refresh_token;
        this.user_id = options.user_id;
        this.cookie = options.cookie;
        this.last_time_token_refreshed = options.last_time_token_refreshed;
        this.access_token_lifetime = options.access_token_lifetime || DEFAULT_ACCESS_TOKEN_LIFETIME;
        this.device_type = options.device_type || "ANDROID";
        this.user_agent = options.user_agent || this._get_user_agent();
        this.language = options.language || "en-UK";
        this.proxies = options.proxies;
        this.timeout = options.timeout;
    }

    _get_user_agent() {
        const version = DEFAULT_APK_VERSION;
        return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)].replace("{}", version);
    }

    _get_url(path) {
        return urljoin(this.base_url, path);
    }

    async get_credentials() {
        await this.login();
        return {
            access_token: this.access_token,
            refresh_token: this.refresh_token,
            user_id: this.user_id,
            cookie: this.cookie,
        };
    }

    _headers() {
        const headers = {
            accept: "application/json",
            "Accept-Encoding": "gzip",
            "accept-language": this.language,
            "content-type": "application/json; charset=utf-8",
            "user-agent": this.user_agent,
        };
        if (this.cookie) {
            headers["Cookie"] = this.cookie;
        }
        if (this.access_token) {
            headers["authorization"] = `Bearer ${this.access_token}`;
        }
        return headers;
    }

    async _request(method, path, options = {}) {
        const url = this._get_url(path);
        const headers = this._headers();
        const {data, params} = options;
        try {
            const response = await axios({
                method: method,
                url: url,
                headers: headers,
                data: data,
                params: params,
                timeout: this.timeout,
            });

            return response.data;
        } catch (error) {
            if (error.response) {
                console.error("Error:", error.response.data);
            } else if (error.request) {
                console.error("Error:", error.message);
            } else {
                console.error("Error:", error.message);
            }
            throw error;
        }
    }

    async _post(path, data) {
        return this._request("post", path, {data: data});
    }

    async _get(path, params) {
        return this._request("get", path, {params: params});
    }

    async login() {
        if (this.access_token && this.refresh_token) {
            const now = Date.now() / 1000;
            const time_since_last_refresh = now - this.last_time_token_refreshed;
            if (time_since_last_refresh > this.access_token_lifetime) {
                await this.refresh_access_token();
            }
        } else {
            const requestData = {
                email: this.email,
                device_type: this.device_type,
                device_id: randomBytes(16).toString("hex"),
                app_version: DEFAULT_APK_VERSION,
            };
            const response = await this._post(AUTH_BY_EMAIL_ENDPOINT, requestData);
            const polling_id = response.polling_id;
            this.cookie = response.cookie;

            let tries = 0;
            while (tries < MAX_POLLING_TRIES) {
                await new Promise((resolve) => setTimeout(resolve, POLLING_WAIT_TIME * 1000));
                tries += 1;

                try {
                    const authResponse = await this._get(AUTH_POLLING_ENDPOINT, {polling_id: polling_id});
                    this.access_token = authResponse.access_token;
                    this.refresh_token = authResponse.refresh_token;
                    this.user_id = authResponse.startup_data.user.user_id;
                    this.last_time_token_refreshed = Date.now() / 1000;
                    break;
                } catch (error) {
                    console.error("Error:", error.message);
                }
            }
        }
    }

    async refresh_access_token() {
        const requestData = {
            refresh_token: this.refresh_token,
        };
        const response = await this._post(REFRESH_ENDPOINT, requestData);
        this.access_token = response.access_token;
        this.refresh_token = response.refresh_token;
        this.user_id = response.user_id;
        this.last_time_token_refreshed = Date.now() / 1000;
    }

    async get_items(latitude, longitude, radius) {
        const requestData = {
            user_id: this.user_id,
            origin: {
                latitude: latitude,
                longitude: longitude,
            },
            radius: radius,
        };
        const response = await this._post(API_ITEM_ENDPOINT, requestData);
        return response.items;
    }

// Other methods for the TgtgClient class, such as get_active_orders, get_inactive_orders, create_order, etc.
}

module.exports = TgtgClient;