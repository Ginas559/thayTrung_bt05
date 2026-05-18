const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const AUTH_USER_KEY = 'auth_user';

const safeGet = (key) => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
};

const safeSet = (key, value) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
};

const safeRemove = (key) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
};

const getAccessToken = () => safeGet(ACCESS_TOKEN_KEY);
const getRefreshToken = () => safeGet(REFRESH_TOKEN_KEY);
const getStoredAuthUser = () => {
    const raw = safeGet(AUTH_USER_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

const setAuthSession = ({ accessToken, refreshToken, user }) => {
    if (accessToken) safeSet(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) safeSet(REFRESH_TOKEN_KEY, refreshToken);
    if (user) safeSet(AUTH_USER_KEY, JSON.stringify(user));
};

const clearAuthSession = () => {
    safeRemove(ACCESS_TOKEN_KEY);
    safeRemove(REFRESH_TOKEN_KEY);
    safeRemove(AUTH_USER_KEY);
};

const createEmptyAuthState = () => ({
    isAuthenticated: false,
    user: getStoredAuthUser() || null,
});

export {
    clearAuthSession,
    createEmptyAuthState,
    getAccessToken,
    getRefreshToken,
    getStoredAuthUser,
    setAuthSession,
};
