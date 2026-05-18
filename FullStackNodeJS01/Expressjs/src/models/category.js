const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: String,
    slug: String,
    description: String,
});

const Category = mongoose.model('category', categorySchema);

module.exports = Category;