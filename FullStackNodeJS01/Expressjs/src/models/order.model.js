const mongoose = require('mongoose');

const shippingInfoSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        note: { type: String, default: '', trim: true },
    },
    { _id: false },
);

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'keyboard',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        snapshot: {
            name: { type: String, default: '', trim: true },
            image: { type: String, default: '', trim: true },
            price: { type: Number, default: 0, min: 0 },
            brand: { type: String, default: '', trim: true },
            category: { type: String, default: '', trim: true },
        },
    },
    { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCEL_REQUESTED', 'CANCELLED'],
            required: true,
            trim: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            default: null,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
        note: {
            type: String,
            default: '',
            trim: true,
        },
    },
    { _id: false },
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
            index: true,
        },
        items: {
            type: [orderItemSchema],
            default: [],
        },
        shippingInfo: {
            type: shippingInfoSchema,
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ['COD'],
            default: 'COD',
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ['UNPAID', 'PAID'],
            default: 'UNPAID',
            index: true,
        },
        orderStatus: {
            type: String,
            enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCEL_REQUESTED', 'CANCELLED'],
            default: 'PENDING',
            index: true,
        },
        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        shippingFee: {
            type: Number,
            required: true,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },
        confirmedAt: {
            type: Date,
            default: null,
        },
        preparingAt: {
            type: Date,
            default: null,
        },
        shippingAt: {
            type: Date,
            default: null,
        },
        deliveredAt: {
            type: Date,
            default: null,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
        cancelReason: {
            type: String,
            default: '',
            trim: true,
        },
    },
    { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('order', orderSchema);

module.exports = Order;