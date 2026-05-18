const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
    {
        title: String,
        slug: String,
        summary: String,
        content: String,
        coverImage: String,
        images: [String],
        tags: [String],
        category: String,
        author: String,
        isFeatured: Boolean,
        isPublished: Boolean,
    },
    {
        timestamps: true,
    }
);

const Article = mongoose.model('article', articleSchema);

module.exports = Article;
