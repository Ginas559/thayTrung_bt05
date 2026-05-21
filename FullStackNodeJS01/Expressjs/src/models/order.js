module.exports = require('./order.model');const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'keyboard'
    },
    title: String,
    qty: Number,
    price: Number,
    snapshot: {
        name: {
            type: String,
            default: '',
        },
        image: {
            type: String,
            default: '',
        },
        price: {
            type: Number,
            default: 0,
        },
        brand: {
            type: String,
            default: '',
        },
    },
});

const orderSchema = new mongoose.Schema({
    userEmail: String,
    items: [orderItemSchema],
    totalAmount: Number,
    status: {
        type: String,
        default: 'Pending',
    },
    paymentMethod: {
        type: String,
        default: 'COD',
    },
}, { timestamps: true });

const Order = mongoose.model('order', orderSchema);

module.exports = Order;