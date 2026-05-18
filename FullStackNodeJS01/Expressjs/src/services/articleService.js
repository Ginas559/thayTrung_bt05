const Article = require('../models/article');

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getArticlesService = async (query = {}) => {
    const {
        q,
        category,
        featured,
        latest,
        sort,
        all,
    } = query;

    const filter = {};

    if (all !== 'true') {
        filter.isPublished = true;
    }

    if (q) {
        const rawQuery = String(q).trim();
        const searchTerms = [...new Set([rawQuery, ...rawQuery.split(/\s+/).filter(Boolean)])];

        filter.$or = searchTerms.flatMap((term) => {
            const escapedTerm = escapeRegExp(term);

            return [
                { title: { $regex: escapedTerm, $options: 'i' } },
                { summary: { $regex: escapedTerm, $options: 'i' } },
                { content: { $regex: escapedTerm, $options: 'i' } },
                { tags: { $regex: escapedTerm, $options: 'i' } },
            ];
        });
    }

    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (latest === 'true') filter.createdAt = { $exists: true };

    const sortOption = (() => {
        switch (sort) {
            case 'oldest':
                return { createdAt: 1 };
            case 'featured':
                return { isFeatured: -1, createdAt: -1 };
            default:
                return { createdAt: -1 };
        }
    })();

    return Article.find(filter).sort(sortOption);
};

const getArticleDetailService = async (id, query = {}) => {
    const articleFilter = {
        _id: id,
    };

    if (query.all !== 'true') {
        articleFilter.isPublished = true;
    }

    const article = await Article.findOne(articleFilter);
    if (!article) return null;

    const related = await Article.find({
        _id: { $ne: article._id },
        category: article.category,
        ...(query.all !== 'true' ? { isPublished: true } : {}),
    })
        .limit(4)
        .sort({ createdAt: -1 });

    return { article, related };
};

module.exports = {
    getArticlesService,
    getArticleDetailService,
};
