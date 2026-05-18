const { createUserService, verifyRegisterOtpService, loginService, requestPasswordResetService, resetPasswordService, refreshTokenService, logoutService, getUserService } = require("../services/userService");

const createUser = async (req, res) => {
    const { name, email, password } = req.body;
    const data = await createUserService(name, email, password);
    return res.status(data?.EC === 0 ? 200 : 400).json(data);
}

const verifyRegisterOtp = async (req, res) => {
    const { email, otp } = req.body;
    const data = await verifyRegisterOtpService(email, otp);
    return res.status(data?.EC === 0 ? 200 : 400).json(data);
};

const handleLogin = async (req, res) => {
    const { email, password } = req.body;
    const data = await loginService(email, password);
    return res.status(200).json(data);
}

const handleRequestPasswordReset = async (req, res) => {
    const { email } = req.body;
    const data = await requestPasswordResetService(email);
    return res.status(data?.EC === 0 ? 200 : 400).json(data);
}

const handleResetPassword = async (req, res) => {
    const { email, otp, password } = req.body;
    const data = await resetPasswordService(email, otp, password);
    return res.status(data?.EC === 0 ? 200 : 400).json(data);
}

const handleRefreshToken = async (req, res) => {
    const { refresh_token } = req.body;
    const data = await refreshTokenService(refresh_token);

    if (data?.EC === 0) {
        return res.status(200).json(data);
    }

    return res.status(401).json(data);
}

const handleLogout = async (req, res) => {
    const { refresh_token } = req.body;
    const data = await logoutService(refresh_token);
    return res.status(200).json(data);
}

const getUser = async (req, res) => {
    const data = await getUserService();
    return res.status(200).json(data);
}

const getAccount = async (req, res) => {
    // req.user được gán từ middleware auth.js
    return res.status(200).json(req.user);
}

module.exports = {
    createUser,
    verifyRegisterOtp,
    handleLogin,
    handleRequestPasswordReset,
    handleResetPassword,
    handleRefreshToken,
    handleLogout,
    getUser,
    getAccount
}