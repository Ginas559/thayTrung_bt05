import axios, { authClient } from './axios.customize';

const createUserApi = (name, email, password) => {
    const URL_API = "/v1/api/register";
    const data = {
        name, email, password
    }

    return authClient.post(URL_API, data)
}

const verifyRegisterOtpApi = (email, otp) => {
    const URL_API = "/v1/api/register/verify";
    return authClient.post(URL_API, { email, otp });
}

const loginApi = (email, password) => {
    const URL_API = "/v1/api/login";
    const data = {
        email, password
    }

    return authClient.post(URL_API, data)
}

const requestPasswordResetApi = (email) => {
    const URL_API = "/v1/api/forgot-password/request";
    return authClient.post(URL_API, { email });
}

const resetPasswordApi = (email, otp, password) => {
    const URL_API = "/v1/api/forgot-password/reset";
    return authClient.post(URL_API, { email, otp, password });
}

const refreshTokenApi = (refreshToken) => {
    const URL_API = "/v1/api/refresh-token";
    return authClient.post(URL_API, { refresh_token: refreshToken });
}

const logoutApi = (refreshToken) => {
    const URL_API = "/v1/api/logout";
    return authClient.post(URL_API, { refresh_token: refreshToken });
}

const getAccountApi = () => {
    const URL_API = "/v1/api/account";
    return axios.get(URL_API)
}

const getUserApi = () => {
    const URL_API = "/v1/api/user";
    return axios.get(URL_API)
}

const getCategoriesApi = () => {
    const URL_API = "/v1/api/categories";
    return axios.get(URL_API);
};

const getKeyboardsApi = (params = {}) => {
    const URL_API = "/v1/api/keyboards";
    return axios.get(URL_API, { params });
};

const getKeyboardDetailApi = (id) => {
    const URL_API = `/v1/api/keyboards/${id}`;
    return axios.get(URL_API);
};

const getArticlesApi = (params = {}) => {
    const URL_API = '/v1/api/articles';
    return axios.get(URL_API, { params });
};

const getArticleDetailApi = (id, params = {}) => {
    const URL_API = `/v1/api/articles/${id}`;
    return axios.get(URL_API, { params });
};

const getCartApi = () => axios.get('/v1/api/cart');
const addCartItemApi = (bookId, qty = 1) => axios.post('/v1/api/cart/items', { bookId, qty });
const updateCartItemApi = (bookId, qty) => axios.patch(`/v1/api/cart/items/${bookId}`, { qty });
const removeCartItemApi = (bookId) => axios.delete(`/v1/api/cart/items/${bookId}`);
const checkoutCartApi = () => axios.post('/v1/api/cart/checkout', {});
const getMyOrdersApi = () => axios.get('/v1/api/orders/me');

const getAdminOrdersApi = () => axios.get('/v1/api/admin/orders');
const createKeyboardApi = (data) => axios.post('/v1/api/admin/keyboards', data);
const updateKeyboardApi = (id, data) => axios.put(`/v1/api/admin/keyboards/${id}`, data);
const deleteKeyboardApi = (id) => axios.delete(`/v1/api/admin/keyboards/${id}`);
const createCategoryApi = (data) => axios.post('/v1/api/admin/categories', data);
const updateCategoryApi = (id, data) => axios.put(`/v1/api/admin/categories/${id}`, data);
const deleteCategoryApi = (id) => axios.delete(`/v1/api/admin/categories/${id}`);
const createArticleApi = (data) => axios.post('/v1/api/admin/articles', data);
const updateArticleApi = (id, data) => axios.put(`/v1/api/admin/articles/${id}`, data);
const deleteArticleApi = (id) => axios.delete(`/v1/api/admin/articles/${id}`);

export {
    createUserApi,
    verifyRegisterOtpApi,
    loginApi,
    requestPasswordResetApi,
    resetPasswordApi,
    refreshTokenApi,
    logoutApi,
    getAccountApi,
    getUserApi,
    getCategoriesApi,
    getKeyboardsApi,
    getKeyboardDetailApi,
    getArticlesApi,
    getArticleDetailApi,
    getCartApi,
    addCartItemApi,
    updateCartItemApi,
    removeCartItemApi,
    checkoutCartApi,
    getMyOrdersApi,
    getAdminOrdersApi,
    createKeyboardApi,
    updateKeyboardApi,
    deleteKeyboardApi,
    createCategoryApi,
    updateCategoryApi,
    deleteCategoryApi,
    createArticleApi,
    updateArticleApi,
    deleteArticleApi,
}