require("dotenv").config();
const nodemailer = require("nodemailer");

const createTransporter = () => {
    const {
        SMTP_HOST,
        SMTP_PORT,
        SMTP_SECURE,
        SMTP_USER,
        SMTP_PASS,
        EMAIL_USER,
        EMAIL_PASS,
    } = process.env;

    const host = SMTP_HOST || 'smtp.gmail.com';
    const port = Number(SMTP_PORT || 465);
    const secure = SMTP_SECURE ? SMTP_SECURE === "true" : true;
    const user = SMTP_USER || EMAIL_USER;
    const pass = SMTP_PASS || EMAIL_PASS;

    if (!user || !pass) {
        throw new Error("Thiếu cấu hình email trong file .env");
    }

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass,
        },
    });
};

const sendOtpMail = async (to, otp, options = {}) => {
    const transporter = createTransporter();
    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;
    const purpose = options.purpose || "đặt lại mật khẩu";
    const subject = options.subject || `Keyboard Store OTP ${purpose}`;
    const heading = options.heading || `Mã OTP ${purpose}`;
    const description = options.description || `Bạn vừa yêu cầu OTP cho tài khoản <strong>${to}</strong>.`;

    await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
                <h2 style="margin: 0 0 12px;">${heading}</h2>
                <p>${description}</p>
                <p>Mã OTP của bạn là:</p>
                <div style="display: inline-block; padding: 12px 18px; border-radius: 12px; background: #ecfdf5; color: #047857; font-size: 24px; font-weight: 700; letter-spacing: 0.2em;">${otp}</div>
                <p style="margin-top: 16px;">Mã này sẽ hết hạn sau 10 phút.</p>
            </div>
        `,
    });
};

module.exports = { sendOtpMail };