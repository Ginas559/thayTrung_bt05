import { createUserApi, verifyRegisterOtpApi } from '../util/api';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { notification } from 'antd';
import { useState } from 'react';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('register');
    const [pendingEmail, setPendingEmail] = useState('');
    const [pendingName, setPendingName] = useState('');

    const onFinish = async (values) => {
        if (step === 'register') {
            const { name, email, password } = values;
            setLoading(true);
            const res = await createUserApi(name, email, password);
            setLoading(false);

            if (res && res.EC === 0) {
                notification.success({
                    message: "Đăng ký",
                    description: res?.EM || "Đã gửi OTP xác thực về email của bạn"
                });
                setPendingEmail(email);
                setPendingName(name);
                setStep('verify');
            } else {
                notification.error({
                    message: "Đăng ký",
                    description: res?.EM || "Đăng ký thất bại"
                });
            }
        } else {
            const { otp } = values;
            setLoading(true);
            const res = await verifyRegisterOtpApi(pendingEmail, otp);
            setLoading(false);

            if (res && res.EC === 0) {
                notification.success({
                    message: "Xác thực",
                    description: res?.EM || "Xác thực email thành công"
                });
                navigate("/login");
            } else {
                notification.error({
                    message: "Xác thực",
                    description: res?.EM || "Xác thực OTP thất bại"
                });
            }
        }
    };

    return (
        <div className="mx-auto flex min-h-[calc(100vh-90px)] max-w-7xl items-center justify-center px-4 py-10">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 lg:grid-cols-2">
                <div className="bg-gradient-to-br from-slate-900 to-slate-700 p-8 text-white md:p-12">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Keyboard Store</p>
                    <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Tạo tài khoản để mua bàn phím và theo dõi đơn hàng.</h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-slate-200">Sau khi đăng ký, bạn có thể đăng nhập để xem trang chủ có khuyến mãi, thêm bàn phím vào giỏ và đặt hàng.</p>
                </div>

                <div className="p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-slate-900">Đăng ký tài khoản</h2>
                    <p className="mt-2 text-sm text-slate-500">Thông tin đầy đủ để bắt đầu mua sách.</p>

                    {step === 'verify' && (
                        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                            OTP đã được gửi tới <strong>{pendingEmail}</strong>. Vui lòng nhập mã để hoàn tất đăng ký.
                        </div>
                    )}

                    <form onSubmit={(event) => { event.preventDefault(); if (step === 'register') { onFinish({ email: event.currentTarget.email.value, password: event.currentTarget.password.value, name: event.currentTarget.name.value }); } else { onFinish({ otp: event.currentTarget.otp.value }); } }} className="mt-8 space-y-5">
                        {step === 'register' ? (
                            <>
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                            <input name="email" type="email" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white" />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                            <input name="password" type="password" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white" />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Name</span>
                            <input name="name" type="text" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white" />
                        </label>
                            </>
                        ) : (
                            <>
                                <label className="block">
                                    <span className="mb-2 block text-sm font-semibold text-slate-700">OTP</span>
                                    <input name="otp" type="text" inputMode="numeric" maxLength="6" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white" />
                                </label>
                                <div className="flex items-center justify-between text-sm">
                                    <button type="button" onClick={() => setStep('register')} className="font-semibold text-slate-700 hover:text-slate-900">Quay lại sửa thông tin</button>
                                    <span className="text-slate-500">{pendingName}</span>
                                </div>
                            </>
                        )}

                        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Đang xử lý...' : step === 'register' ? 'Gửi OTP' : 'Xác thực OTP'}</button>
                    </form>

                    <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                        <Link to="/" className="inline-flex items-center gap-2 font-semibold text-slate-700 hover:text-slate-900"><ArrowLeftOutlined /> Quay lại trang chủ</Link>
                        <Link to="/login" className="font-semibold text-red-700 hover:text-red-800">Đăng nhập</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;