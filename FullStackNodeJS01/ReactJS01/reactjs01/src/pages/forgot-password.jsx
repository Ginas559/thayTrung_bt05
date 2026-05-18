import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import { requestPasswordResetApi, resetPasswordApi } from '../util/api';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState('request');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
            if (step === 'request') {
                const res = await requestPasswordResetApi(email);
                if (res?.EC === 0) {
                    notification.success({ message: 'Quên mật khẩu', description: res?.EM || 'Đã gửi mã OTP' });
                    setStep('reset');
                } else {
                    notification.error({ message: 'Quên mật khẩu', description: res?.EM || 'Không thể gửi OTP' });
                }
            } else {
                const form = new FormData(event.currentTarget);
                const otp = form.get('otp');
                const password = form.get('password');
                const res = await resetPasswordApi(email, otp, password);
                if (res?.EC === 0) {
                    notification.success({ message: 'Quên mật khẩu', description: res?.EM || 'Đặt lại mật khẩu thành công' });
                    navigate('/login');
                } else {
                    notification.error({ message: 'Quên mật khẩu', description: res?.EM || 'Đặt lại mật khẩu thất bại' });
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto flex min-h-[calc(100vh-90px)] max-w-4xl items-center justify-center px-4 py-10">
            <div className="w-full rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/60 md:p-12">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-600">Keyboard Store</p>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">Khôi phục mật khẩu</h1>
                <p className="mt-2 text-sm text-slate-500">Nhập email để nhận OTP, sau đó đặt lại mật khẩu mới.</p>

                <form onSubmit={onSubmit} className="mt-8 space-y-4">
                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white" />
                    </label>
                    {step === 'reset' ? (
                        <>
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-slate-700">OTP</span>
                                <input name="otp" type="text" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white" />
                            </label>
                            <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-slate-700">Mật khẩu mới</span>
                                <input name="password" type="password" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white" />
                            </label>
                        </>
                    ) : null}
                    <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {loading ? 'Đang xử lý...' : step === 'request' ? 'Gửi OTP' : 'Đặt lại mật khẩu'}
                    </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                    <Link to="/login" className="font-semibold text-red-700 hover:text-red-800">Quay lại đăng nhập</Link>
                    <Link to="/register" className="font-semibold text-slate-700 hover:text-slate-900">Đăng ký</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
