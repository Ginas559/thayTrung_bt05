const {
    getCategoriesService,
    getKeyboardsService,
    getKeyboardDetailService,
} = require('../services/keyboardService');
const Keyboard = require('../models/keyboard');
const Category = require('../models/category');

const getCategories = async (req, res) => {
    const data = await getCategoriesService();
    return res.status(200).json(data);
};

const getKeyboards = async (req, res) => {
    const data = await getKeyboardsService(req.query);
    return res.status(200).json(data);
};

const getKeyboardDetail = async (req, res) => {
    const data = await getKeyboardDetailService(req.params.id);
    if (!data) {
        return res.status(404).json({ message: 'Keyboard not found' });
    }
    return res.status(200).json(data);
};

const createKeyboard = async (req, res) => {
    const data = await Keyboard.create(req.body);
    return res.status(200).json(data);
};

const updateKeyboard = async (req, res) => {
    const data = await Keyboard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json(data);
};

const deleteKeyboard = async (req, res) => {
    const data = await Keyboard.findByIdAndDelete(req.params.id);
    return res.status(200).json(data);
};

const createCategory = async (req, res) => {
    const data = await Category.create(req.body);
    return res.status(200).json(data);
};

const updateCategory = async (req, res) => {
    const data = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json(data);
};

const deleteCategory = async (req, res) => {
    const data = await Category.findByIdAndDelete(req.params.id);
    return res.status(200).json(data);
};

module.exports = {
    getCategories,
    getKeyboards,
    getKeyboardDetail,
    createKeyboard,
    updateKeyboard,
    deleteKeyboard,
    createCategory,
    updateCategory,
    deleteCategory,
};