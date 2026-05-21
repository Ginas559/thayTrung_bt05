const {
    getCartService,
    addCartItemService,
    updateCartItemService,
    removeCartItemService,
    clearCartService,
    checkoutCartService,
    getMyOrdersService,
    getAllOrdersService,
} = require('../services/cart.service');

const sendMutationResponse = (res, payload, successMessage) => {
    if (payload?.EC !== 0) {
        return res.status(400).json({
            EC: payload?.EC || 1,
            EM: payload?.EM || 'Thao tác thất bại',
        });
    }

    return res.status(200).json({
        EC: 0,
        EM: payload?.EM || successMessage,
        DT: payload?.DT,
    });
};

const getCart = async (req, res) => {
    const data = await getCartService(req.user.email);
    return res.status(200).json(data);
};

const addCartItem = async (req, res) => {
    const { productId, bookId, qty } = req.body;
    const payload = await addCartItemService(req.user.email, productId || bookId, qty);
    return sendMutationResponse(res, payload, 'Đã thêm vào giỏ hàng');
};

const updateCartItem = async (req, res) => {
    const { qty } = req.body;
    const payload = await updateCartItemService(req.user.email, req.params.productId, qty);
    return sendMutationResponse(res, payload, 'Đã cập nhật giỏ hàng');
};

const removeCartItem = async (req, res) => {
    const payload = await removeCartItemService(req.user.email, req.params.productId);
    return sendMutationResponse(res, payload, 'Đã xóa sản phẩm khỏi giỏ hàng');
};

const clearCart = async (req, res) => {
    const payload = await clearCartService(req.user.email);
    return sendMutationResponse(res, payload, 'Đã xóa toàn bộ giỏ hàng');
};

const checkoutCart = async (req, res) => {
    const payload = await checkoutCartService(req.user.email, req.body?.shippingInfo, req.body?.paymentMethod);
    return sendMutationResponse(res, payload, 'Đặt hàng thành công');
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
    clearCart,
    checkoutCart,
    getMyOrders,
    getAllOrders,
};