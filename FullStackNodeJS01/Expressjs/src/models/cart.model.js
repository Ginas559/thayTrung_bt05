const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
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
            name: { type: String, default: '' },
            image: { type: String, default: '' },
            price: { type: Number, default: 0 },
            brand: { type: String, default: '' },
        },
    },
    { _id: false },
);

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },
        items: {
            type: [cartItemSchema],
            default: [],
        },
    },
    { timestamps: true },
);

cartSchema.index({ 'items.product': 1 });

const Cart = mongoose.models.cart || mongoose.model('cart', cartSchema);

module.exports = Cart;