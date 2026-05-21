const mongoose = require('mongoose');
const Cart = require('../models/cart.model');
const Keyboard = require('../models/keyboard');
const Order = require('../models/order.model');
const User = require('../models/user');
const {
    ORDER_STATUSES,
    normalizeOrderStatus,
    validateStatusTransition,
    buildStatusHistoryEntry,
    normalizeStatusHistory,
} = require('./orderTracking.helper');

const SHIPPING_FEE = 30000;
const AUTO_CONFIRM_AFTER_MS = 30 * 60 * 1000;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MANAGER_ROLES = ['Admin', 'Moderator'];
const STAFF_STATUS_ALLOWLIST = ['CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'];
const LISTABLE_STATUS = ['ALL', ...ORDER_STATUSES];

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

const parsePaginationNumber = (value, fallback, maxValue = MAX_LIMIT) => {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isFinite(parsed) || parsed < 1) {
        return fallback;
    }

    return Math.min(parsed, maxValue);
};

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
    const orderStatus = normalizeOrderStatus(plainOrder.orderStatus || 'PENDING');

    return {
        ...plainOrder,
        orderStatus,
        statusHistory: normalizeStatusHistory(plainOrder.statusHistory, orderStatus, plainOrder.createdAt),
        userEmail: plainOrder.user?.email || plainOrder.userEmail || '',
        userName: plainOrder.user?.name || plainOrder.userName || '',
        userRole: plainOrder.user?.role || plainOrder.userRole || '',
    };
};

const normalizeOrderList = (orders = []) => orders.map(normalizeOrderResponse).filter(Boolean);

const buildPaginationResult = ({ items, total, page, limit }) => ({
    items: normalizeOrderList(items),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
});

const buildListQuery = async ({ userId = null, status = 'ALL', page = DEFAULT_PAGE, limit = DEFAULT_LIMIT }) => {
    const normalizedStatus = String(status || 'ALL').trim().toUpperCase();

    if (!LISTABLE_STATUS.includes(normalizedStatus)) {
        return { error: 'Trạng thái bộ lọc không hợp lệ' };
    }

    const filter = {};

    if (userId) {
        filter.user = userId;
    }

    if (normalizedStatus !== 'ALL') {
        filter.orderStatus = normalizedStatus;
    }

    const safePage = parsePaginationNumber(page, DEFAULT_PAGE);
    const safeLimit = parsePaginationNumber(limit, DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (safePage - 1) * safeLimit;

    const [total, items] = await Promise.all([
        Order.countDocuments(filter),
        Order.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .populate('user', 'email name role')
            .lean(),
    ]);

    return {
        items,
        total,
        page: safePage,
        limit: safeLimit,
    };
};

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

const restoreOrderStock = async (items = []) => {
    for (const item of items) {
        if (!item?.product || !item?.quantity) {
            continue;
        }

        await Keyboard.findByIdAndUpdate(item.product, {
            $inc: {
                stock: item.quantity,
                sold: -item.quantity,
            },
        });
    }
};

const applyStatusChange = (orderDoc, nextStatus, actorId = null, note = '') => {
    const normalizedStatus = normalizeOrderStatus(nextStatus);
    const now = new Date();

    orderDoc.orderStatus = normalizedStatus;
    orderDoc.statusHistory = Array.isArray(orderDoc.statusHistory) ? orderDoc.statusHistory : [];
    orderDoc.statusHistory.push(buildStatusHistoryEntry(normalizedStatus, actorId, note, now));

    if (normalizedStatus === 'CONFIRMED' && !orderDoc.confirmedAt) {
        orderDoc.confirmedAt = now;
    }

    if (normalizedStatus === 'PREPARING' && !orderDoc.preparingAt) {
        orderDoc.preparingAt = now;
    }

    if (normalizedStatus === 'SHIPPING' && !orderDoc.shippingAt) {
        orderDoc.shippingAt = now;
    }

    if (normalizedStatus === 'DELIVERED' && !orderDoc.deliveredAt) {
        orderDoc.deliveredAt = now;
    }

    if (normalizedStatus === 'CANCELLED' && !orderDoc.cancelledAt) {
        orderDoc.cancelledAt = now;
    }

    return orderDoc;
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

    const now = new Date();
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
        statusHistory: [buildStatusHistoryEntry('PENDING', user._id, 'Đơn hàng được tạo', now)],
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
        .populate('statusHistory.updatedBy', 'email name role')
        .lean();

    return {
        EC: 0,
        EM: 'Đặt hàng thành công',
        DT: normalizeOrderResponse(populatedOrder),
    };
};

const getMyOrdersService = async (userEmail, query = {}) => {
    const user = await resolveUserByEmail(userEmail);

    if (!user) {
        return { EC: 1, EM: 'Người dùng không tồn tại' };
    }

    const listResult = await buildListQuery({
        userId: user._id,
        status: query.status,
        page: query.page,
        limit: query.limit,
    });

    if (listResult.error) {
        return { EC: 1, EM: listResult.error };
    }

    return {
        EC: 0,
        EM: 'Lấy danh sách đơn hàng thành công',
        DT: buildPaginationResult(listResult),
    };
};

const getAllOrdersService = async (query = {}) => {
    const listResult = await buildListQuery({
        status: query.status,
        page: query.page,
        limit: query.limit,
    });

    if (listResult.error) {
        return { EC: 1, EM: listResult.error };
    }

    return {
        EC: 0,
        EM: 'Lấy danh sách đơn hàng thành công',
        DT: buildPaginationResult(listResult),
    };
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
        .populate('statusHistory.updatedBy', 'email name role')
        .lean();

    if (!order) {
        return { EC: 1, EM: 'Không tìm thấy đơn hàng' };
    }

    const isOwner = String(order.user?._id || order.user) === String(user._id);
    const isManager = MANAGER_ROLES.includes(user.role);

    if (!isOwner && !isManager) {
        return { EC: 1, EM: 'Bạn không có quyền xem đơn hàng này' };
    }

    return {
        EC: 0,
        EM: 'Lấy chi tiết đơn hàng thành công',
        DT: normalizeOrderResponse(order),
    };
};

const cancelOrderService = async (userEmail, orderId, cancelReason = '') => {
    if (!isValidObjectId(orderId)) {
        return { EC: 1, EM: 'Mã đơn hàng không hợp lệ' };
    }

    const user = await resolveUserByEmail(userEmail);

    if (!user) {
        return { EC: 1, EM: 'Người dùng không tồn tại' };
    }

    const order = await Order.findById(orderId);

    if (!order) {
        return { EC: 1, EM: 'Không tìm thấy đơn hàng' };
    }

    if (String(order.user) !== String(user._id)) {
        return { EC: 1, EM: 'Bạn không có quyền hủy đơn hàng này' };
    }

    const currentStatus = normalizeOrderStatus(order.orderStatus);
    const note = normalizeText(cancelReason) || 'Người dùng yêu cầu hủy đơn';

    if (['SHIPPING', 'DELIVERED', 'CANCELLED'].includes(currentStatus)) {
        return { EC: 1, EM: 'Đơn hàng đang giao hoặc đã giao không thể hủy' };
    }

    if (currentStatus === 'PENDING' || currentStatus === 'CONFIRMED') {
        const transition = validateStatusTransition(currentStatus, 'CANCELLED');

        if (!transition.valid) {
            return { EC: 1, EM: transition.message };
        }

        applyStatusChange(order, 'CANCELLED', user._id, note);
        order.cancelReason = note;
        await order.save();
        await restoreOrderStock(order.items);

        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'email name role')
            .populate('statusHistory.updatedBy', 'email name role')
            .lean();

        return {
            EC: 0,
            EM: 'Đơn hàng đã được hủy',
            DT: normalizeOrderResponse(populatedOrder),
        };
    }

    if (currentStatus === 'PREPARING') {
        const transition = validateStatusTransition(currentStatus, 'CANCEL_REQUESTED');

        if (!transition.valid) {
            return { EC: 1, EM: transition.message };
        }

        applyStatusChange(order, 'CANCEL_REQUESTED', user._id, note);
        order.cancelReason = note;
        await order.save();

        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'email name role')
            .populate('statusHistory.updatedBy', 'email name role')
            .lean();

        return {
            EC: 0,
            EM: 'Yêu cầu hủy đơn đã được gửi',
            DT: normalizeOrderResponse(populatedOrder),
        };
    }

    return { EC: 1, EM: 'Không thể hủy đơn hàng ở trạng thái hiện tại' };
};

const approveCancelRequestService = async (userEmail, orderId, note = '') => {
    if (!isValidObjectId(orderId)) {
        return { EC: 1, EM: 'Mã đơn hàng không hợp lệ' };
    }

    const user = await resolveUserByEmail(userEmail);

    if (!user) {
        return { EC: 1, EM: 'Người dùng không tồn tại' };
    }

    if (user.role !== 'Admin') {
        return { EC: 1, EM: 'Bạn không có quyền duyệt yêu cầu hủy đơn' };
    }

    const order = await Order.findById(orderId);

    if (!order) {
        return { EC: 1, EM: 'Không tìm thấy đơn hàng' };
    }

    const currentStatus = normalizeOrderStatus(order.orderStatus);

    if (currentStatus !== 'CANCEL_REQUESTED') {
        return { EC: 1, EM: 'Đơn hàng chưa ở trạng thái chờ hủy' };
    }

    const transition = validateStatusTransition(currentStatus, 'CANCELLED');

    if (!transition.valid) {
        return { EC: 1, EM: transition.message };
    }

    const cancelNote = normalizeText(note) || normalizeText(order.cancelReason) || 'Admin duyệt yêu cầu hủy đơn';
    applyStatusChange(order, 'CANCELLED', user._id, cancelNote);
    order.cancelReason = cancelNote;
    await order.save();
    await restoreOrderStock(order.items);

    const populatedOrder = await Order.findById(order._id)
        .populate('user', 'email name role')
        .populate('statusHistory.updatedBy', 'email name role')
        .lean();

    return {
        EC: 0,
        EM: 'Đã duyệt hủy đơn thành công',
        DT: normalizeOrderResponse(populatedOrder),
    };
};

const updateOrderStatusService = async (userEmail, orderId, nextStatus, note = '') => {
    if (!isValidObjectId(orderId)) {
        return { EC: 1, EM: 'Mã đơn hàng không hợp lệ' };
    }

    const normalizedStatus = normalizeOrderStatus(nextStatus);

    if (!ORDER_STATUSES.includes(normalizedStatus) || normalizedStatus === 'CANCEL_REQUESTED') {
        return { EC: 1, EM: 'Trạng thái đơn hàng không hợp lệ' };
    }

    const user = await resolveUserByEmail(userEmail);

    if (!user) {
        return { EC: 1, EM: 'Người dùng không tồn tại' };
    }

    if (!MANAGER_ROLES.includes(user.role)) {
        return { EC: 1, EM: 'Bạn không có quyền cập nhật đơn hàng' };
    }

    if (user.role === 'Moderator' && !STAFF_STATUS_ALLOWLIST.includes(normalizedStatus)) {
        return { EC: 1, EM: 'Staff chỉ được cập nhật sang CONFIRMED, PREPARING, SHIPPING hoặc DELIVERED' };
    }

    const order = await Order.findById(orderId);

    if (!order) {
        return { EC: 1, EM: 'Không tìm thấy đơn hàng' };
    }

    const currentStatus = normalizeOrderStatus(order.orderStatus);
    const transition = validateStatusTransition(currentStatus, normalizedStatus);

    if (!transition.valid) {
        return { EC: 1, EM: transition.message };
    }

    const statusNote = normalizeText(note) || `Cập nhật trạng thái sang ${normalizedStatus}`;
    applyStatusChange(order, normalizedStatus, user._id, statusNote);
    await order.save();

    if (normalizedStatus === 'CANCELLED') {
        await restoreOrderStock(order.items);
    }

    const populatedOrder = await Order.findById(order._id)
        .populate('user', 'email name role')
        .populate('statusHistory.updatedBy', 'email name role')
        .lean();

    return {
        EC: 0,
        EM: 'Cập nhật trạng thái đơn hàng thành công',
        DT: normalizeOrderResponse(populatedOrder),
    };
};

const autoConfirmPendingOrdersService = async () => {
    const cutoff = new Date(Date.now() - AUTO_CONFIRM_AFTER_MS);
    const pendingOrders = await Order.find({
        orderStatus: 'PENDING',
        createdAt: { $lte: cutoff },
    });

    let updatedCount = 0;

    for (const order of pendingOrders) {
        const transition = validateStatusTransition(order.orderStatus, 'CONFIRMED');

        if (!transition.valid) {
            continue;
        }

        applyStatusChange(order, 'CONFIRMED', null, 'Tự động xác nhận sau 30 phút');
        await order.save();
        updatedCount += 1;
    }

    return {
        checked: pendingOrders.length,
        updatedCount,
    };
};

module.exports = {
    getCheckoutPreviewService,
    checkoutOrderService,
    getMyOrdersService,
    getAllOrdersService,
    getOrderByIdService,
    cancelOrderService,
    approveCancelRequestService,
    updateOrderStatusService,
    autoConfirmPendingOrdersService,
    SHIPPING_FEE,
    ORDER_STATUSES,
};