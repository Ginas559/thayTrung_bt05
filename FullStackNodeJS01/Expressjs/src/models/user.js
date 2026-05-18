const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    isVerified: {
        type: Boolean,
        default: false,
    },
    refreshToken: String,
    registerOtp: String,
    registerOtpExpiresAt: Date,
    resetOtp: String,
    resetOtpExpiresAt: Date,
});

const User = mongoose.model('user', userSchema);
module.exports = User;