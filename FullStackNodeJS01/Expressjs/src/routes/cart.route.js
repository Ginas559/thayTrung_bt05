const express = require('express');
const {
    getCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
    checkoutCart,
} = require('../controllers/cart.controller');

const router = express.Router();

router.get('/', getCart);
router.post('/items', addCartItem);
router.patch('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);
router.post('/checkout', checkoutCart);

module.exports = router;