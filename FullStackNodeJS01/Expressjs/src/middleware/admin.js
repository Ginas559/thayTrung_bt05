const admin = (req, res, next) => {
    if (req?.user?.role !== 'Admin') {
        return res.status(403).json({ message: 'Forbidden: admin only' });
    }
    next();
};

module.exports = admin;