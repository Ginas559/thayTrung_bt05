require("dotenv").config();
const User = require("../models/user");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { sendOtpMail } = require("./mailService");
const saltRounds = 10;

const JWT_SECRET = process.env.JWT_SECRET || "keyboardstore_access_secret";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "1h";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}_refresh`;
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || "7d";

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const buildUserPayload = (user) => ({
    email: user.email,
    name: user.name,
    role: user.role || "User"
});

const buildTokenPair = (user) => {
    const payload = buildUserPayload(user);
    const access_token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRE });
    const refresh_token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE });

    return { access_token, refresh_token };
};

const createUserService = async (name, email, password, role = "User") => {
    try {
        // 1. Kiểm tra user đã tồn tại chưa
        const user = await User.findOne({ email });
        if (user && user.isVerified) {
            console.log(`>>> user exist, chọn 1 email khác: ${email}`);
            return { EC: 1, EM: "Email đã tồn tại" };
        }

        // 2. Hash mật khẩu
        const hashPassword = await bcrypt.hash(password, saltRounds);

        // 3. Tạo OTP xác thực đăng ký
        const otp = generateOtp();
        const registerOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        let result;

        if (user) {
            user.name = name;
            user.password = hashPassword;
            user.role = user.role || role;
            user.isVerified = false;
            user.registerOtp = otp;
            user.registerOtpExpiresAt = registerOtpExpiresAt;
            user.resetOtp = null;
            user.resetOtpExpiresAt = null;
            result = await user.save();
        } else {
            // 4. Lưu user chờ xác thực vào DB
            result = await User.create({
                name: name,
                email: email,
                password: hashPassword,
                role,
                isVerified: false,
                refreshToken: null,
                registerOtp: otp,
                registerOtpExpiresAt,
                resetOtp: null,
                resetOtpExpiresAt: null,
            });
        }

        await sendOtpMail(user?.email || email, otp, {
            purpose: "xác thực đăng ký",
            subject: "Keyboard Store OTP xác thực đăng ký",
            heading: "Mã OTP xác thực tài khoản",
            description: `Bạn vừa đăng ký tài khoản <strong>${email}</strong>.`,
        });

        return {
            EC: 0,
            EM: "Đã gửi OTP xác thực về email của bạn",
            user: buildUserPayload(result),
        };
    } catch (error) {
        console.log(error);
        return { EC: 1, EM: error.message || "Đăng ký thất bại" };
    }
}

const verifyRegisterOtpService = async (email, otp) => {
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return { EC: 1, EM: "Email không tồn tại" };
        }

        if (user.isVerified) {
            return { EC: 1, EM: "Tài khoản đã được xác thực" };
        }

        if (!user.registerOtp || !user.registerOtpExpiresAt) {
            return { EC: 1, EM: "Vui lòng yêu cầu OTP mới" };
        }

        if (user.registerOtp !== otp) {
            return { EC: 1, EM: "OTP không đúng" };
        }

        if (new Date(user.registerOtpExpiresAt).getTime() < Date.now()) {
            return { EC: 1, EM: "OTP đã hết hạn" };
        }

        user.isVerified = true;
        user.registerOtp = null;
        user.registerOtpExpiresAt = null;
        await user.save();

        return { EC: 0, EM: "Xác thực email thành công" };
    } catch (error) {
        return { EC: 1, EM: error.message || "Xác thực OTP thất bại" };
    }
};

const loginService = async (email1, password) => {
    try {
        const user = await User.findOne({ email: email1 });
        if (user) {
            if (user.isVerified === false) {
                return { EC: 3, EM: "Tài khoản chưa xác thực email" };
            }

            const isMatchPassword = await bcrypt.compare(password, user.password);
            if (!isMatchPassword) {
                return { EC: 2, EM: "Email/Password không hợp lệ" }
            } else {
                const { access_token, refresh_token } = buildTokenPair(user);
                user.refreshToken = refresh_token;
                await user.save();

                return {
                    EC: 0,
                    EM: "Đăng nhập thành công",
                    access_token,
                    refresh_token,
                    user: buildUserPayload(user)
                };
            }
        } else {
            return { EC: 1, EM: "Email/Password không hợp lệ" }
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}

const requestPasswordResetService = async (email) => {
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return { EC: 1, EM: "Email không tồn tại" };
        }

    const otp = generateOtp();
        user.resetOtp = otp;
        user.resetOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await sendOtpMail(user.email, otp);

        return { EC: 0, EM: "Đã gửi OTP về email của bạn" };
    } catch (error) {
        return { EC: 1, EM: error.message || "Không thể gửi OTP" };
    }
};

const resetPasswordService = async (email, otp, password) => {
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return { EC: 1, EM: "Email không tồn tại" };
        }

        if (!user.resetOtp || !user.resetOtpExpiresAt) {
            return { EC: 1, EM: "Vui lòng yêu cầu OTP mới" };
        }

        if (user.resetOtp !== otp) {
            return { EC: 1, EM: "OTP không đúng" };
        }

        if (new Date(user.resetOtpExpiresAt).getTime() < Date.now()) {
            return { EC: 1, EM: "OTP đã hết hạn" };
        }

        const hashPassword = await bcrypt.hash(password, saltRounds);
        user.password = hashPassword;
        user.resetOtp = null;
        user.resetOtpExpiresAt = null;
        user.refreshToken = null;
        await user.save();

        return { EC: 0, EM: "Đặt lại mật khẩu thành công" };
    } catch (error) {
        return { EC: 1, EM: "Đặt lại mật khẩu thất bại" };
    }
};

const refreshTokenService = async (refreshToken) => {
    try {
        if (!refreshToken) {
            return { EC: 1, EM: "Thiếu refresh token" };
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User.findOne({ email: decoded.email });

        if (!user || user.refreshToken !== refreshToken) {
            return { EC: 1, EM: "Refresh token không hợp lệ" };
        }

        const { access_token, refresh_token: newRefreshToken } = buildTokenPair(user);
        user.refreshToken = newRefreshToken;
        await user.save();

        return {
            EC: 0,
            access_token,
            refresh_token: newRefreshToken,
            user: buildUserPayload(user)
        };
    } catch (error) {
        return { EC: 1, EM: "Refresh token không hợp lệ hoặc đã hết hạn" };
    }
}

const logoutService = async (refreshToken) => {
    try {
        if (!refreshToken) {
            return { EC: 0, EM: "Đăng xuất thành công" };
        }

        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const user = await User.findOne({ email: decoded.email });

        if (user && user.refreshToken === refreshToken) {
            user.refreshToken = null;
            await user.save();
        }

        return { EC: 0, EM: "Đăng xuất thành công" };
    } catch (error) {
        return { EC: 0, EM: "Đăng xuất thành công" };
    }
}

const getUserService = async () => {
    try {
        // Lấy tất cả user nhưng loại bỏ trường password
        let result = await User.find({}).select("-password -refreshToken");
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
}

module.exports = {
    createUserService,
    verifyRegisterOtpService,
    loginService,
    requestPasswordResetService,
    resetPasswordService,
    refreshTokenService,
    logoutService,
    getUserService
}