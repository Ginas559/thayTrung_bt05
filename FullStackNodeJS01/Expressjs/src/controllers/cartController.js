const {
    getCartService,
    addCartItemService,
    updateCartItemService,
    removeCartItemService,
    checkoutCartService,
    getMyOrdersService,
    getAllOrdersService,
} = require('../services/cartService');

const getCart = async (req, res) => {
    const data = await getCartService(req.user.email);
    return res.status(200).json(data || { userEmail: req.user.email, items: [] });
};

const addCartItem = async (req, res) => {
    const { bookId, qty } = req.body;
    const data = await addCartItemService(req.user.email, bookId, qty);
    if (!data) return res.status(400).json({ message: 'Sản phẩm không còn đủ tồn kho' });
    return res.status(200).json(data);
};

const updateCartItem = async (req, res) => {
    const { qty } = req.body;
    const data = await updateCartItemService(req.user.email, req.params.bookId, qty);
    if (!data) return res.status(400).json({ message: 'Không thể cập nhật sản phẩm trong giỏ' });
    return res.status(200).json(data);
};

const removeCartItem = async (req, res) => {
    const data = await removeCartItemService(req.user.email, req.params.bookId);
    if (!data) return res.status(400).json({ message: 'Không thể xóa sản phẩm trong giỏ' });
    return res.status(200).json(data);
};

const checkoutCart = async (req, res) => {
    const data = await checkoutCartService(req.user.email);
    if (!data) return res.status(400).json({ message: 'Cart is empty' });
    if (data?.EC) return res.status(400).json({ message: data.EM });
    return res.status(200).json(data);
};

const getMyOrders = async (req, res) => {
    const data = await getMyOrdersService(req.user.email);
    return res.status(200).json(data);
};

const getAllOrders = async (req, res) => {
    const data = await getAllOrdersService();
    return res.status(200).json(data);
};

module.exports = {
    getCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    checkoutCart,
    getMyOrders,
    getAllOrders,
};