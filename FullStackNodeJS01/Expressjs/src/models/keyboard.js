const mongoose = require('mongoose');

const keyboardSchema = new mongoose.Schema({
    title: String,
    slug: String,
    author: String,
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category'
    },
    description: String,
    price: Number,
    oldPrice: Number,
    discount: Number,
    stock: Number,
    sold: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    rating: Number,
    reviewCount: { type: Number, default: 0 },
    images: [String],
    tags: [String],
    isFeatured: Boolean,
    isNewest: Boolean,
    isBestSeller: Boolean,
    isPromotion: Boolean,
    createdAtLabel: String,
});

const Keyboard = mongoose.model('keyboard', keyboardSchema);

module.exports = Keyboard;