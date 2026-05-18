const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'keyboard'
    },
    qty: {
        type: Number,
        default: 1,
    },
    priceSnapshot: Number,
});

const cartSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        unique: true,
        index: true,
    },
    items: [cartItemSchema],
}, { timestamps: true });

const Cart = mongoose.model('cart', cartSchema);

module.exports = Cart;