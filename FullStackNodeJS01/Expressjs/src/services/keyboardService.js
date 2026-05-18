const Keyboard = require('../models/keyboard');
const Category = require('../models/category');

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getCategoriesService = async () => {
    return Category.find({}).sort({ name: 1 });
};

const getKeyboardsService = async (query = {}) => {
    const {
        q,
        categoryId,
        categoryIds,
        minPrice,
        maxPrice,
        minRating,
        inStock,
        sort,
        featured,
        latest,
        bestseller,
        promotion,
        page,
        limit,
    } = query;

    const filter = {};

    if (q) {
        const rawQuery = String(q).trim();
        const searchTerms = [...new Set([rawQuery, ...rawQuery.split(/\s+/).filter(Boolean)])];

        filter.$or = searchTerms.flatMap((term) => {
            const escapedTerm = escapeRegExp(term);

            return [
                { title: { $regex: escapedTerm, $options: 'i' } },
                { author: { $regex: escapedTerm, $options: 'i' } },
                { tags: { $regex: escapedTerm, $options: 'i' } },
            ];
        });
    }

    if (categoryId) filter.categoryId = categoryId;
    if (categoryIds) {
        const ids = String(categoryIds)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        if (ids.length) filter.categoryId = { $in: ids };
    }
    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minRating) filter.rating = { $gte: Number(minRating) };
    if (inStock === 'true') filter.stock = { $gt: 0 };
    if (featured === 'true') filter.isFeatured = true;
    if (latest === 'true') filter.isNewest = true;
    if (bestseller === 'true') filter.isBestSeller = true;
    if (promotion === 'true') filter.isPromotion = true;

    const sortOption = (() => {
        switch (sort) {
            case 'price-asc':
                return { price: 1 };
            case 'price-desc':
                return { price: -1 };
            case 'popular':
                return { sold: -1 };
            case 'views':
                return { viewCount: -1 };
            case 'rating':
                return { rating: -1 };
            default:
                return { createdAt: -1 };
        }
    })();

    // Always return a paginated response object so clients can rely on pagination metadata
    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(limit) || 10);

    const total = await Keyboard.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const items = await Keyboard.find(filter)
        .populate('categoryId')
        .sort(sortOption)
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize);

    return {
        items,
        total,
        page: pageNum,
        totalPages,
        pageSize,
    };
};

const getKeyboardDetailService = async (id) => {
    const keyboard = await Keyboard.findById(id).populate('categoryId');
    if (!keyboard) return null;

    const related = await Keyboard.find({
        categoryId: keyboard.categoryId?._id,
        _id: { $ne: keyboard._id },
    })
        .populate('categoryId')
        .limit(4)
        .sort({ sold: -1 });

    return { keyboard, related };
};

module.exports = {
    getCategoriesService,
    getKeyboardsService,
    getKeyboardDetailService,
};