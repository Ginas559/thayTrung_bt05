const express = require('express');
const {
    getCheckoutPreview,
    checkoutOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
} = require('../controllers/order.controller');

const router = express.Router();

const allowRoles = (...roles) => (req, res, next) => {
    if (roles.includes(req?.user?.role)) {
        return next();
    }

    return res.status(403).json({ message: 'Forbidden' });
};

router.get('/checkout/preview', getCheckoutPreview);
router.post('/checkout', checkoutOrder);
router.get('/my-orders', getMyOrders);
router.get('/me', getMyOrders);
router.get('/', allowRoles('Admin', 'Moderator'), getAllOrders);
router.get('/:id', getOrderById);
router.patch('/:id/status', allowRoles('Admin', 'Moderator'), updateOrderStatus);

module.exports = router;