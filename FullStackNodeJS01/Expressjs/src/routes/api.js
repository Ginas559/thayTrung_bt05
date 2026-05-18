const express = require('express');
const { createUser, verifyRegisterOtp, handleLogin, handleRequestPasswordReset, handleResetPassword, handleRefreshToken, handleLogout, getUser, getAccount } = require('../controllers/userController');
const {
    getCategories,
    getKeyboards,
    getKeyboardDetail,
    createKeyboard,
    updateKeyboard,
    deleteKeyboard,
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/keyboardController');
const {
    getArticles,
    getArticleDetail,
    createArticle,
    updateArticle,
    deleteArticle,
} = require('../controllers/articleController');
const {
    getCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    checkoutCart,
    getMyOrders,
    getAllOrders,
} = require('../controllers/cartController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const delay = require('../middleware/delay');

const routerAPI = express.Router();

routerAPI.use(auth);

// routerAPI.get("/", (req, res) => {
//     return res.status(200).json("Hello world api");
// });

routerAPI.post("/register", createUser);
routerAPI.post("/register/verify", verifyRegisterOtp);
routerAPI.post("/login", handleLogin);
routerAPI.post("/forgot-password/request", handleRequestPasswordReset);
routerAPI.post("/forgot-password/reset", handleResetPassword);
routerAPI.post("/refresh-token", handleRefreshToken);
routerAPI.post("/logout", handleLogout);

routerAPI.get("/user", admin, getUser);
routerAPI.get("/account", delay, getAccount);
routerAPI.get("/categories", getCategories);
routerAPI.get("/keyboards", getKeyboards);
routerAPI.get("/keyboards/:id", getKeyboardDetail);
routerAPI.get("/books", getKeyboards);
routerAPI.get("/books/:id", getKeyboardDetail);
routerAPI.get("/articles", getArticles);
routerAPI.get("/articles/:id", getArticleDetail);

routerAPI.get("/cart", getCart);
routerAPI.post("/cart/items", addCartItem);
routerAPI.patch("/cart/items/:bookId", updateCartItem);
routerAPI.delete("/cart/items/:bookId", removeCartItem);
routerAPI.post("/cart/checkout", checkoutCart);
routerAPI.get("/orders/me", getMyOrders);

routerAPI.get("/admin/orders", admin, getAllOrders);
routerAPI.post("/admin/keyboards", admin, createKeyboard);
routerAPI.put("/admin/keyboards/:id", admin, updateKeyboard);
routerAPI.delete("/admin/keyboards/:id", admin, deleteKeyboard);
routerAPI.post("/admin/books", admin, createKeyboard);
routerAPI.put("/admin/books/:id", admin, updateKeyboard);
routerAPI.delete("/admin/books/:id", admin, deleteKeyboard);
routerAPI.post("/admin/categories", admin, createCategory);
routerAPI.put("/admin/categories/:id", admin, updateCategory);
routerAPI.delete("/admin/categories/:id", admin, deleteCategory);
routerAPI.post("/admin/articles", admin, createArticle);
routerAPI.put("/admin/articles/:id", admin, updateArticle);
routerAPI.delete("/admin/articles/:id", admin, deleteArticle);

module.exports = routerAPI;