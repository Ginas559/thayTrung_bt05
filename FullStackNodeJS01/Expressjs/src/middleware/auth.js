require("dotenv").config();
const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
    const white_lists = ["/", "/register", "/login", "/forgot-password/request", "/forgot-password/reset", "/refresh-token", "/logout", "/categories", "/books", "/keyboards", "/articles"];
    // Bỏ qua kiểm tra nếu route nằm trong danh sách trắng
    const isWhiteList = white_lists.some((item) => {
        return req.path === item || req.path.startsWith(`${item}/`);
    });

    if (isWhiteList) {
        next();
    } else {
        if (req?.headers?.authorization?.split(' ')?.[1]) {
            const token = req.headers.authorization.split(' ')[1];

            // Verify token
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = {
                    email: decoded.email,
                    name: decoded.name,
                    role: decoded.role || "User",
                }
                console.log(">>> check token: ", decoded);
                next();
            } catch (error) {
                return res.status(401).json({
                    message: "Token bị hết hạn/hoặc không hợp lệ"
                })
            }
        } else {
            return res.status(401).json({
                message: "Bạn cần đăng nhập để truy cập tài nguyên này"
            })
        }
    }
}

module.exports = auth;