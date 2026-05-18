const Article = require('../models/article');
const { getArticlesService, getArticleDetailService } = require('../services/articleService');

const getArticles = async (req, res) => {
    const data = await getArticlesService(req.query);
    return res.status(200).json(data);
};

const getArticleDetail = async (req, res) => {
    const data = await getArticleDetailService(req.params.id, req.query);
    if (!data) {
        return res.status(404).json({ message: 'Article not found' });
    }
    return res.status(200).json(data);
};

const createArticle = async (req, res) => {
    const data = await Article.create(req.body);
    return res.status(200).json(data);
};

const updateArticle = async (req, res) => {
    const data = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json(data);
};

const deleteArticle = async (req, res) => {
    const data = await Article.findByIdAndDelete(req.params.id);
    return res.status(200).json(data);
};

module.exports = {
    getArticles,
    getArticleDetail,
    createArticle,
    updateArticle,
    deleteArticle,
};
