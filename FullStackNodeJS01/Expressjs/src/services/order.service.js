const mongoose = require('mongoose');
const Cart = require('../models/cart.model');
const Keyboard = require('../models/keyboard');
const Order = require('../models/order.model');
const User = require('../models/user');

const SHIPPING_FEE = 30000;
const ALLOWED_ORDER_STATUS = ['PENDING', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
const STAFF_STATUS_ALLOWLIST = ['PENDING', 'PROCESSING', 'SHIPPING'];

const normalizeText = (value) => String(value || '').trim();

const normalizeQuantity = (value) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return null;
    }

    const quantity = Math.floor(parsed);
    return quantity >= 1 ? quantity : null;
};

const isValidObjectId = (value) => mongoose.isValidObjectId(value);

const emptyOrderSummary = () => ({
    subtotal: 0,
    shippingFee: SHIPPING_FEE,
    totalAmount: SHIPPING_FEE,
    items: [],
});

const getRawProductId = (item) => String(item?.product?._id || item?.product || item?.bookId?._id || item?.bookId || '').trim();

const resolveUserByEmail = async (email) => {
    const normalizedEmail = normalizeText(email);

    if (!normalizedEmail) {
        return null;
    }

    return User.findOne({ email: normalizedEmail }).select('_id email name role').lean();
};

const findCartByUser = (userEmail) => Cart.findOne({ user: normalizeText(userEmail) });

const fetchProductsByIds = async (productIds) => {
    if (!Array.isArray(productIds) || !productIds.length) {
        return new Map();
    }

    const products = await Keyboard.find({ _id: { $in: productIds } })
        .populate('categoryId', 'name')
        .select('_id title images price author stock categoryId')
        .lean();

    return new Map(products.map((product) => [String(product._id), product]));
};

const buildOrderSnapshot = (product) => ({
    name: normalizeText(product?.title),
    image: Array.isArray(product?.images) ? String(product.images[0] || '') : '',
    price: Number(product?.price || 0),
    brand: normalizeText(product?.author),
    category: normalizeText(product?.categoryId?.name),
});

const buildResolvedCartItems = async (userEmail) => {
    const cartDoc = await findCartByUser(userEmail);

    if (!cartDoc || !Array.isArray(cartDoc.items) || !cartDoc.items.length) {
        return { cartDoc: null, resolvedItems: [], summary: emptyOrderSummary() };
    }

    const rawItems = cartDoc.items;
    const productIds = [...new Set(rawItems.map(getRawProductId).filter(Boolean))];
    const productMap = await fetchProductsByIds(productIds);

    const resolvedItems = [];
    let subtotal = 0;

    for (const item of rawItems) {
        const productId = getRawProductId(item);

        if (!productId) {
            continue;
        }

        const product = productMap.get(productId);

        if (!product) {
            return { cartDoc, resolvedItems: [], summary: emptyOrderSummary(), error: 'Sản phẩm không còn khả dụng' };
        }

        const quantity = normalizeQuantity(item?.quantity ?? item?.qty);

        if (!quantity) {
            return { cartDoc, resolvedItems: [], summary: emptyOrderSummary(), error: 'Số lượng sản phẩm trong giỏ không hợp lệ' };
        }

        if (Number(product.stock || 0) <= 0) {
            return { cartDoc, resolvedItems: [], summary: emptyOrderSummary(), error: `Sản phẩm ${product.title || productId} hiện đã hết hàng` };
        }

        if (quantity > Number(product.stock || 0)) {
            return { cartDoc, resolvedItems: [], summary: emptyOrderSummary(), error: `Sản phẩm ${product.title || productId} không đủ tồn kho` };
        }

        const snapshot = buildOrderSnapshot(product);
        const lineSubtotal = Number(snapshot.price || 0) * quantity;

        subtotal += lineSubtotal;
        resolvedItems.push({
            product: productId,
            quantity,
            snapshot,
            stock: Number(product.stock || 0),
            lineSubtotal,
        });
    }

    const summary = {
        subtotal,
        shippingFee: SHIPPING_FEE,
        totalAmount: subtotal + SHIPPING_FEE,
        items: resolvedItems,
    };

    return { cartDoc, resolvedItems, summary };
};

const normalizeOrderResponse = (orderDoc) => {
    if (!orderDoc) {
        return null;
    }

    const plainOrder = typeof orderDoc.toObject === 'function' ? orderDoc.toObject() : { ...orderDoc };

    return {
        ...plainOrder,
        userEmail: plainOrder.user?.email || plainOrder.userEmail || '',
        userName: plainOrder.user?.name || plainOrder.userName || '',
        userRole: plainOrder.user?.role || plainOrder.userRole || '',
    };
};

const normalizeOrderList = (orders = []) => orders.map(normalizeOrderResponse).filter(Boolean);

const getCheckoutPreviewService = async (userEmail) => {
    const user = await resolveUserByEmail(userEmail);

    if (!user) {
        return { EC: 1, EM: 'Người dùng không tồn tại' };
    }

    const { error, summary } = await buildResolvedCartItems(user.email);

    if (error) {
        return { EC: 1, EM: error };
    }

    return {
        EC: 0,
        EM: 'Lấy thông tin thanh toán thành công',
        DT: summary,
    };
};

const rollbackStockChanges = async (items = []) => {
    for (const item of items) {
        await Keyboard.findByIdAndUpdate(item.product, {
            $inc: {
                stock: item.quantity,
                sold: -item.quantity,
            },
        });
    }
};

const checkoutOrderService = async (userEmail, shippingInfo = {}, paymentMethod = 'COD') => {
    if (normalizeText(paymentMethod) !== 'COD') {
        return { EC: 1, EM: 'Phương thức thanh toán không hợp lệ' };
    }

    const user = await resolveUserByEmail(userEmail);

    if (!user) {
        return { EC: 1, EM: 'Người dùng không tồn tại' };
    }

    const fullName = normalizeText(shippingInfo.fullName);
    const phone = normalizeText(shippingInfo.phone);
    const address = normalizeText(shippingInfo.address);
    const note = normalizeText(shippingInfo.note);

    if (!fullName || !phone || !address) {
        return { EC: 1, EM: 'Vui lòng nhập đầy đủ thông tin giao hàng' };
    }

    if (phone.length < 8) {
        return { EC: 1, EM: 'Số điện thoại không hợp lệ' };
    }

    const { cartDoc, resolvedItems, summary, error } = await buildResolvedCartItems(user.email);

    if (error) {
        return { EC: 1, EM: error };
    }

    if (!cartDoc || !resolvedItems.length) {
        return { EC: 1, EM: 'Giỏ hàng trống' };
    }

    const orderItems = resolvedItems.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        snapshot: item.snapshot,
    }));

    const order = await Order.create({
        user: user._id,
        items: orderItems,
        shippingInfo: {
            fullName,
            phone,
            address,
            note,
        },
        paymentMethod: 'COD',
        paymentStatus: 'UNPAID',
        orderStatus: 'PENDING',
        subtotal: summary.subtotal,
        shippingFee: summary.shippingFee,
        totalAmount: summary.totalAmount,
    });

    const appliedItems = [];

    try {
        for (const item of resolvedItems) {
            const updatedProduct = await Keyboard.findOneAndUpdate(
                { _id: item.product, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity, sold: item.quantity } },
                { new: true },
            ).lean();

            if (!updatedProduct) {
                throw new Error(`Sản phẩm ${item.snapshot.name || item.product} không đủ tồn kho`);
            }

            appliedItems.push(item);
        }

        cartDoc.items = [];
        await cartDoc.save();
    } catch (errorMessage) {
        await rollbackStockChanges(appliedItems);
        await Order.findByIdAndDelete(order._id);

        return {
            EC: 1,
            EM: errorMessage?.message || 'Không thể hoàn tất đơn hàng',
        };
    }

    const populatedOrder = await Order.findById(order._id)
        .populate('user', 'email name role')
        .lean();

    return {
        EC: 0,
        EM: 'Đặt hàng thành công',
        DT: normalizeOrderResponse(populatedOrder),
    };
};

const getMyOrdersService = async (userEmail) => {
    const user = await resolveUserByEmail(userEmail);

    if (!user) {
        return [];
    }

    const orders = await Order.find({ user: user._id })
        .sort({ createdAt: -1 })
        .populate('user', 'email name role')
        .lean();

    return normalizeOrderList(orders);
};

const getAllOrdersService = async () => {
    const orders = await Order.find({})
        .sort({ createdAt: -1 })
        .populate('user', 'email name role')
        .lean();

    return normalizeOrderList(orders);
};

const getOrderByIdService = async (userEmail, orderId) => {
    if (!isValidObjectId(orderId)) {
        return { EC: 1, EM: 'Mã đơn hàng không hợp lệ' };
    }

    const user = await resolveUserByEmail(userEmail);

    if (!user) {
        return { EC: 1, EM: 'Người dùng không tồn tại' };
    }

    const order = await Order.findById(orderId)
        .populate('user', 'email name role')
        .lean();

    if (!order) {
        return { EC: 1, EM: 'Không tìm thấy đơn hàng' };
    }

    const isOwner = String(order.user?._id || order.user) === String(user._id);
    const isManager = ['Admin', 'Moderator'].includes(user.role);

    if (!isOwner && !isManager) {
        return { EC: 1, EM: 'Bạn không có quyền xem đơn hàng này' };
    }

    return {
        EC: 0,
        EM: 'Lấy chi tiết đơn hàng thành công',
        DT: normalizeOrderResponse(order),
    };
};

const updateOrderStatusService = async (userEmail, orderId, nextStatus) => {
    if (!isValidObjectId(orderId)) {
        return { EC: 1, EM: 'Mã đơn hàng không hợp lệ' };
    }

    const normalizedStatus = normalizeText(nextStatus).toUpperCase();

    if (!ALLOWED_ORDER_STATUS.includes(normalizedStatus)) {
        return { EC: 1, EM: 'Trạng thái đơn hàng không hợp lệ' };
    }

    const user = await resolveUserByEmail(userEmail);

    if (!user) {
        return { EC: 1, EM: 'Người dùng không tồn tại' };
    }

    if (!['Admin', 'Moderator'].includes(user.role)) {
        return { EC: 1, EM: 'Bạn không có quyền cập nhật đơn hàng' };
    }

    if (user.role === 'Moderator' && !STAFF_STATUS_ALLOWLIST.includes(normalizedStatus)) {
        return { EC: 1, EM: 'Staff chỉ được cập nhật sang PENDING, PROCESSING hoặc SHIPPING' };
    }

    const order = await Order.findById(orderId).populate('user', 'email name role');

    if (!order) {
        return { EC: 1, EM: 'Không tìm thấy đơn hàng' };
    }

    order.orderStatus = normalizedStatus;
    await order.save();

    return {
        EC: 0,
        EM: 'Cập nhật trạng thái đơn hàng thành công',
        DT: normalizeOrderResponse(order),
    };
};

module.exports = {
    getCheckoutPreviewService,
    checkoutOrderService,
    getMyOrdersService,
    getAllOrdersService,
    getOrderByIdService,
    updateOrderStatusService,
    SHIPPING_FEE,
    ALLOWED_ORDER_STATUS,
};