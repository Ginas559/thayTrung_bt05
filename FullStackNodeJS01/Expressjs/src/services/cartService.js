const Cart = require('../models/cart');
const Keyboard = require('../models/keyboard');
const Order = require('../models/order');

const normalizeQty = (qty, fallback = 1) => {
    const parsed = Number(qty);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return Math.floor(parsed);
};

const getCartService = async (userEmail) => {
    return Cart.findOne({ userEmail }).populate('items.bookId');
};

const addCartItemService = async (userEmail, keyboardId, qty = 1) => {
    const keyboard = await Keyboard.findById(keyboardId);
    if (!keyboard || keyboard.stock <= 0) return null;

    let cart = await Cart.findOne({ userEmail });
    if (!cart) {
        cart = await Cart.create({ userEmail, items: [] });
    }

    const nextQty = normalizeQty(qty);

    const existingItem = cart.items.find((item) => String(item.bookId) === String(keyboardId));
    if (existingItem) {
        existingItem.qty = Math.min(keyboard.stock, existingItem.qty + nextQty);
        existingItem.priceSnapshot = keyboard.price;
    } else {
        cart.items.push({ bookId: keyboardId, qty: Math.min(keyboard.stock, nextQty), priceSnapshot: keyboard.price });
    }

    await cart.save();
    return Cart.findOne({ userEmail }).populate('items.bookId');
};

const updateCartItemService = async (userEmail, keyboardId, qty) => {
    const cart = await Cart.findOne({ userEmail });
    if (!cart) return null;

    const item = cart.items.find((entry) => String(entry.bookId) === String(keyboardId));
    if (!item) return null;

    const keyboard = await Keyboard.findById(keyboardId);
    if (!keyboard || keyboard.stock <= 0) {
        cart.items = cart.items.filter((entry) => String(entry.bookId) !== String(keyboardId));
        await cart.save();
        return Cart.findOne({ userEmail }).populate('items.bookId');
    }

    const nextQty = Math.min(keyboard.stock, normalizeQty(qty));

    if (Number(qty) <= 0) {
        cart.items = cart.items.filter((entry) => String(entry.bookId) !== String(keyboardId));
    } else {
        item.qty = nextQty;
    }

    await cart.save();
    return Cart.findOne({ userEmail }).populate('items.bookId');
};

const removeCartItemService = async (userEmail, keyboardId) => {
    const cart = await Cart.findOne({ userEmail });
    if (!cart) return null;

    cart.items = cart.items.filter((entry) => String(entry.bookId) !== String(keyboardId));
    await cart.save();
    return Cart.findOne({ userEmail }).populate('items.bookId');
};

const checkoutCartService = async (userEmail) => {
    const cart = await Cart.findOne({ userEmail }).populate('items.bookId');
    if (!cart || !cart.items.length) return null;

    for (const item of cart.items) {
        if (!item.bookId || item.bookId.stock < item.qty) {
            return { EC: 2, EM: 'Sản phẩm không đủ tồn kho' };
        }
    }

    const items = cart.items.map((item) => ({
        bookId: item.bookId._id,
        title: item.bookId.title,
        qty: item.qty,
        price: item.priceSnapshot || item.bookId.price,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.qty * item.price, 0);

    for (const item of cart.items) {
        item.bookId.stock -= item.qty;
        item.bookId.sold += item.qty;
        await item.bookId.save();
    }

    const order = await Order.create({
        userEmail,
        items,
        totalAmount,
        status: 'Pending',
        paymentMethod: 'COD',
    });

    cart.items = [];
    await cart.save();

    return order;
};

const getMyOrdersService = async (userEmail) => {
    return Order.find({ userEmail }).sort({ createdAt: -1 });
};

const getAllOrdersService = async () => {
    return Order.find({}).sort({ createdAt: -1 });
};

module.exports = {
    getCartService,
    addCartItemService,
    updateCartItemService,
    removeCartItemService,
    checkoutCartService,
    getMyOrdersService,
    getAllOrdersService,
};