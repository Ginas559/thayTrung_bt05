import axios from "axios";
import { clearAuthSession, getAccessToken, getRefreshToken, setAuthSession } from "./auth.storage";

// Use the explicit backend URL when provided; otherwise fall back to the current origin for deployment setups.
const baseURL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

const instance = axios.create({
    baseURL
});

export const authClient = axios.create({
    baseURL
});

authClient.interceptors.response.use(function (response) {
    if (response && response.data) return response.data;
    return response;
}, function (error) {
    if (error?.response?.data) return error.response.data;
    return Promise.reject(error);
});

let refreshTokenPromise = null;

const refreshAccessToken = async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
        throw new Error("Missing refresh token");
    }

    if (!refreshTokenPromise) {
        refreshTokenPromise = authClient
            .post("/v1/api/refresh-token", { refresh_token: refreshToken })
            .finally(() => {
                refreshTokenPromise = null;
            });
    }

    const data = await refreshTokenPromise;

    if (!data?.access_token) {
        throw new Error("Refresh token response missing access token");
    }

    setAuthSession({
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? refreshToken,
        user: data.user
    });

    return data.access_token;
};

// Alter defaults after instance has been created
// Add a request interceptor
instance.interceptors.request.use(function (config) {
    // Do something before request is sent
    const accessToken = getAccessToken();

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
});

// Add a response interceptor
instance.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    if (response && response.data) return response.data;
    return response;
}, async function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    const status = error?.response?.status;
    const originalRequest = error?.config;

    const shouldRefreshToken =
        status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes("/refresh-token") &&
        !originalRequest.url?.includes("/logout");

    if (shouldRefreshToken && getRefreshToken()) {
        originalRequest._retry = true;

        try {
            await refreshAccessToken();
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
            return instance(originalRequest);
        } catch {
            clearAuthSession();
        }
    }

    if (error?.response?.data) return error?.response?.data;
    return Promise.reject(error);
});

export default instance;