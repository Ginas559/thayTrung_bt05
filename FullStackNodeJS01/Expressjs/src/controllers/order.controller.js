const {
    getCheckoutPreviewService,
    checkoutOrderService,
    getMyOrdersService,
    getAllOrdersService,
    getOrderByIdService,
    cancelOrderService,
    approveCancelRequestService,
    updateOrderStatusService,
} = require('../services/order.service');

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

const getCheckoutPreview = async (req, res) => {
    const data = await getCheckoutPreviewService(req.user.email);
    return res.status(data?.EC === 0 ? 200 : 400).json(data);
};

const checkoutOrder = async (req, res) => {
    const { shippingInfo = {}, paymentMethod = 'COD' } = req.body || {};
    const payload = await checkoutOrderService(req.user.email, shippingInfo, paymentMethod);
    return sendMutationResponse(res, payload, 'Đặt hàng thành công');
};

const getMyOrders = async (req, res) => {
    const data = await getMyOrdersService(req.user.email, req.query || {});
    return res.status(data?.EC === 0 ? 200 : 400).json(data);
};

const getAllOrders = async (req, res) => {
    const data = await getAllOrdersService(req.query || {});
    return res.status(data?.EC === 0 ? 200 : 400).json(data);
};

const getOrderById = async (req, res) => {
    const payload = await getOrderByIdService(req.user.email, req.params.id);

    if (payload?.EC !== 0) {
        return res.status(400).json(payload);
    }

    return res.status(200).json(payload?.DT);
};

const cancelOrder = async (req, res) => {
    const payload = await cancelOrderService(req.user.email, req.params.id, req.body?.cancelReason);
    return sendMutationResponse(res, payload, 'Hủy đơn hàng thành công');
};

const approveCancelOrder = async (req, res) => {
    const payload = await approveCancelRequestService(req.user.email, req.params.id, req.body?.note);
    return sendMutationResponse(res, payload, 'Đã duyệt hủy đơn thành công');
};

const updateOrderStatus = async (req, res) => {
    const payload = await updateOrderStatusService(req.user.email, req.params.id, req.body?.orderStatus, req.body?.note);
    return sendMutationResponse(res, payload, 'Cập nhật trạng thái đơn hàng thành công');
};

module.exports = {
    getCheckoutPreview,
    checkoutOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    cancelOrder,
    approveCancelOrder,
    updateOrderStatus,
};