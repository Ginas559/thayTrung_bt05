const mongoose = require('mongoose');
const Cart = require('../models/cart.model');
const Keyboard = require('../models/keyboard');
const orderService = require('./order.service');

const normalizeUserKey = (userEmail) => String(userEmail || '').trim();

const isValidProductId = (value) => mongoose.isValidObjectId(value);

const normalizeQuantity = (value) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return null;
    }

    const quantity = Math.floor(parsed);
    return quantity >= 1 ? quantity : null;
};

const emptyCartPayload = (user) => ({
    user,
    items: [],
    totalItems: 0,
    totalQuantity: 0,
    subtotal: 0,
});

const buildSnapshot = (product, fallback = {}) => ({
    name: fallback.name || product?.title || '',
    image: fallback.image || product?.images?.[0] || '',
    price: Number.isFinite(Number(fallback.price)) ? Number(fallback.price) : Number(product?.price || 0),
    brand: fallback.brand || product?.author || '',
});

const getRawProductId = (item) => String(item?.product?._id || item?.product || item?.bookId?._id || item?.bookId || '').trim();

const fetchProductsByIds = async (productIds) => {
    if (!Array.isArray(productIds) || !productIds.length) {
        return new Map();
    }

    const products = await Keyboard.find({ _id: { $in: productIds } })
        .select('_id title images price author stock')
        .lean();

    return new Map(products.map((product) => [String(product._id), product]));
};

const normalizeStoredItem = (item, productMap) => {
    const productId = getRawProductId(item);

    if (!productId) {
        return null;
    }

    const product = productMap.get(productId);
    const legacySnapshot = item?.snapshot || {};

    return {
        product: productId,
        quantity: normalizeQuantity(item?.quantity ?? item?.qty) || 1,
        snapshot: buildSnapshot(product, {
            name: legacySnapshot.name || item?.bookId?.title || '',
            image: legacySnapshot.image || item?.bookId?.images?.[0] || '',
            price: legacySnapshot.price ?? item?.priceSnapshot ?? item?.bookId?.price ?? 0,
            brand: legacySnapshot.brand || item?.bookId?.author || '',
        }),
    };
};

const normalizeResponseItem = (item, productMap) => {
    const storedItem = normalizeStoredItem(item, productMap);

    if (!storedItem) {
        return null;
    }

    const product = productMap.get(storedItem.product);
    const stock = Number.isFinite(Number(product?.stock)) ? Number(product.stock) : 0;
    const subtotal = Number(storedItem.snapshot.price || 0) * storedItem.quantity;

    return {
        product: storedItem.product,
        quantity: storedItem.quantity,
        snapshot: storedItem.snapshot,
        stock,
        subtotal,
        lowStockMessage: stock > 0 && stock - storedItem.quantity <= 2 ? `Chỉ còn ${stock} sản phẩm` : null,
    };
};

const normalizeCartResponse = async (cartDoc, user) => {
    if (!cartDoc) {
        return emptyCartPayload(user);
    }

    const rawItems = Array.isArray(cartDoc.items) ? cartDoc.items : [];
    const productIds = [...new Set(rawItems.map(getRawProductId).filter(Boolean))];
    const productMap = await fetchProductsByIds(productIds);

    const items = rawItems.map((item) => normalizeResponseItem(item, productMap)).filter(Boolean);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
        user: cartDoc.user || user,
        items,
        totalItems: items.length,
        totalQuantity,
        subtotal,
    };
};

const normalizeCartForSave = async (cartDoc) => {
    const rawItems = Array.isArray(cartDoc.items) ? cartDoc.items : [];
    const productIds = [...new Set(rawItems.map(getRawProductId).filter(Boolean))];
    const productMap = await fetchProductsByIds(productIds);

    cartDoc.items = rawItems.map((item) => normalizeStoredItem(item, productMap)).filter(Boolean);

    return { cartDoc, productMap };
};

const findCartByUser = (userEmail) => Cart.findOne({ user: normalizeUserKey(userEmail) });

const getOrCreateCartDoc = async (userEmail) => {
    const user = normalizeUserKey(userEmail);
    let cartDoc = await findCartByUser(user);

    if (!cartDoc) {
        cartDoc = await Cart.create({ user, items: [] });
    }

    return cartDoc;
};

const loadProductOrThrow = async (productId) => {
    const product = await Keyboard.findById(productId)
        .select('_id title images price author stock')
        .lean();

    if (!product) {
        return null;
    }

    return product;
};

const getCartService = async (userEmail) => {
    const user = normalizeUserKey(userEmail);
    const cartDoc = await findCartByUser(user).lean();

    return normalizeCartResponse(cartDoc, user);
};

const addCartItemService = async (userEmail, productId, qty = 1) => {
    if (!isValidProductId(productId)) {
        return { EC: 1, EM: 'Mã sản phẩm không hợp lệ' };
    }

    const quantity = normalizeQuantity(qty);
    if (!quantity) {
        return { EC: 1, EM: 'Số lượng phải lớn hơn hoặc bằng 1' };
    }

    const product = await loadProductOrThrow(productId);
    if (!product) {
        return { EC: 1, EM: 'Sản phẩm không tồn tại' };
    }

    if (Number(product.stock || 0) <= 0) {
        return { EC: 1, EM: 'Sản phẩm hiện đã hết hàng' };
    }

    const user = normalizeUserKey(userEmail);
    const cartDoc = await getOrCreateCartDoc(user);
    await normalizeCartForSave(cartDoc);

    const existingItem = cartDoc.items.find((item) => String(item.product) === String(productId));
    const currentQuantity = existingItem ? Number(existingItem.quantity || 0) : 0;
    const nextQuantity = currentQuantity + quantity;

    if (nextQuantity > Number(product.stock || 0)) {
        return { EC: 1, EM: `Chỉ còn ${product.stock} sản phẩm trong kho` };
    }

    const snapshot = buildSnapshot(product);

    if (existingItem) {
        existingItem.quantity = nextQuantity;
        existingItem.snapshot = snapshot;
    } else {
        cartDoc.items.push({
            product: productId,
            quantity,
            snapshot,
        });
    }

    await cartDoc.save();

    const normalizedCart = await normalizeCartResponse(cartDoc.toObject(), user);

    return {
        EC: 0,
        EM: 'Đã thêm vào giỏ hàng',
        DT: normalizedCart,
    };
};

const updateCartItemService = async (userEmail, productId, qty) => {
    if (!isValidProductId(productId)) {
        return { EC: 1, EM: 'Mã sản phẩm không hợp lệ' };
    }

    const quantity = normalizeQuantity(qty);
    if (!quantity) {
        return { EC: 1, EM: 'Số lượng phải lớn hơn hoặc bằng 1' };
    }

    const user = normalizeUserKey(userEmail);
    const cartDoc = await findCartByUser(user);

    if (!cartDoc) {
        return { EC: 1, EM: 'Giỏ hàng không tồn tại' };
    }

    await normalizeCartForSave(cartDoc);

    const item = cartDoc.items.find((entry) => String(entry.product) === String(productId));
    if (!item) {
        return { EC: 1, EM: 'Sản phẩm không tồn tại trong giỏ hàng' };
    }

    const product = await loadProductOrThrow(productId);
    if (!product) {
        return { EC: 1, EM: 'Sản phẩm không còn khả dụng' };
    }

    if (Number(product.stock || 0) <= 0) {
        return { EC: 1, EM: 'Sản phẩm hiện đã hết hàng' };
    }

    if (quantity > Number(product.stock || 0)) {
        return { EC: 1, EM: `Chỉ còn ${product.stock} sản phẩm trong kho` };
    }

    item.quantity = quantity;
    item.snapshot = buildSnapshot(product, item.snapshot);

    await cartDoc.save();

    const normalizedCart = await normalizeCartResponse(cartDoc.toObject(), user);

    return {
        EC: 0,
        EM: 'Đã cập nhật giỏ hàng',
        DT: normalizedCart,
    };
};

const removeCartItemService = async (userEmail, productId) => {
    if (!isValidProductId(productId)) {
        return { EC: 1, EM: 'Mã sản phẩm không hợp lệ' };
    }

    const user = normalizeUserKey(userEmail);
    const cartDoc = await findCartByUser(user);

    if (!cartDoc) {
        return { EC: 1, EM: 'Giỏ hàng không tồn tại' };
    }

    await normalizeCartForSave(cartDoc);

    const beforeCount = cartDoc.items.length;
    cartDoc.items = cartDoc.items.filter((entry) => String(entry.product) !== String(productId));

    if (cartDoc.items.length === beforeCount) {
        return { EC: 1, EM: 'Sản phẩm không tồn tại trong giỏ hàng' };
    }

    await cartDoc.save();

    const normalizedCart = await normalizeCartResponse(cartDoc.toObject(), user);

    return {
        EC: 0,
        EM: 'Đã xóa sản phẩm khỏi giỏ hàng',
        DT: normalizedCart,
    };
};

const clearCartService = async (userEmail) => {
    const user = normalizeUserKey(userEmail);
    const cartDoc = await findCartByUser(user);

    if (!cartDoc) {
        return {
            EC: 0,
            EM: 'Giỏ hàng đã trống',
            DT: emptyCartPayload(user),
        };
    }

    cartDoc.items = [];
    await cartDoc.save();

    return {
        EC: 0,
        EM: 'Đã xóa toàn bộ giỏ hàng',
        DT: emptyCartPayload(user),
    };
};

const checkoutCartService = async (userEmail, shippingInfo = {}, paymentMethod = 'COD') => {
    return orderService.checkoutOrderService(userEmail, shippingInfo, paymentMethod);
};

const getMyOrdersService = async (userEmail) => orderService.getMyOrdersService(userEmail);

const getAllOrdersService = async () => orderService.getAllOrdersService();

module.exports = {
    getCartService,
    addCartItemService,
    updateCartItemService,
    removeCartItemService,
    clearCartService,
    checkoutCartService,
    getMyOrdersService,
    getAllOrdersService,
};