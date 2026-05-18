import { useContext, useState } from 'react';
import { loginApi } from '../util/api';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/context/auth.context';
import { notification } from 'antd';
import { setAuthSession } from '../util/auth.storage';

const LoginPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { setAuth } = useContext(AuthContext);

    const onFinish = async (values) => {
        const { email, password } = values;
        setLoading(true);
        const res = await loginApi(email, password);
        setLoading(false);

        if (res && res.EC === 0) {
            setAuthSession({
                accessToken: res.access_token,
                refreshToken: res.refresh_token,
                user: res.user,
            });
            notification.success({
                message: "Đăng nhập",
                description: res?.EM || "Đăng nhập thành công"
            });
            setAuth({
                isAuthenticated: true,
                user: {
                    email: res?.user?.email ?? "",
                    name: res?.user?.name ?? "",
                    role: res?.user?.role ?? "User"
                }
            });
            navigate(res?.user?.role === "Admin" ? "/admin" : "/");
        } else {
            notification.error({
                message: "Đăng nhập",
                description: res?.EM ?? "error"
            });
        }
    };

    return (
        <div className="mx-auto flex min-h-[calc(100vh-90px)] max-w-7xl items-center justify-center px-4 py-10">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl shadow-slate-200/60 lg:grid-cols-2">
                <div className="bg-gradient-to-br from-red-600 to-red-400 p-8 text-white md:p-12">
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-100">Keyboard Store</p>
                    <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Đăng nhập để xem khuyến mãi, giỏ hàng và đơn hàng.</h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-white/90">Tài khoản thành viên sẽ được đưa về trang chủ bán bàn phím. Tài khoản admin sẽ vào khu quản trị để tạo, sửa, xem và tìm kiếm dữ liệu.</p>
                </div>

                <div className="p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-slate-900">Đăng nhập</h2>
                    <p className="mt-2 text-sm text-slate-500">Sử dụng email và mật khẩu đã đăng ký.</p>

                    <form onSubmit={(event) => { event.preventDefault(); onFinish({ email: event.currentTarget.email.value, password: event.currentTarget.password.value }); }} className="mt-8 space-y-5">
                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                            <input name="email" type="email" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white" />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
                            <input name="password" type="password" required className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-red-500 focus:bg-white" />
                        </label>

                        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        <Link to="/forgot-password" className="font-semibold text-red-700 hover:text-red-800">Quên mật khẩu?</Link>
                    </p>

                    <p className="mt-4 text-center text-sm text-slate-500">
                        Chưa có tài khoản? <Link to="/register" className="font-semibold text-red-700 hover:text-red-800">Đăng ký tại đây</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;