import { useContext, useState } from 'react';
import { ShoppingCartOutlined, LogoutOutlined, SearchOutlined, CrownOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth.context';
import { clearAuthSession, createEmptyAuthState, getRefreshToken } from '../../util/auth.storage';
import { logoutApi } from '../../util/api';

const Header = () => {
    const navigate = useNavigate();
    const { auth, setAuth } = useContext(AuthContext);
    const location = useLocation();
    const [searchValue, setSearchValue] = useState('');

    const onLogout = async () => {
        try {
            const refreshToken = getRefreshToken();

            if (refreshToken) {
                await logoutApi(refreshToken);
            }
        } finally {
            clearAuthSession();
            setAuth(createEmptyAuthState());
        }

        navigate("/login");
    };

    const isAdmin = auth?.user?.role === "Admin";
    const onSubmitSearch = (event) => {
        event.preventDefault();
        if (searchValue.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
        } else {
            navigate('/search');
        }
    };

    return (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4 lg:px-6">
                    <Link to={isAdmin ? '/admin' : '/'} className="inline-flex items-center gap-3 whitespace-nowrap font-black text-slate-900">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-400 text-white shadow-lg shadow-red-500/20">⌨</span>
                    <span className="text-xl">Keyboard Store</span>
                </Link>

                <form onSubmit={onSubmitSearch} className="flex h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-500 shadow-sm order-3 w-full lg:order-none lg:w-auto">
                    <SearchOutlined />
                    <input
                        value={location.pathname.includes('admin') ? '' : searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        placeholder={location.pathname.includes('admin') ? 'Admin workspace' : 'Tìm kiếm bàn phím, hãng...'}
                        className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                </form>

                <Link to="/news" className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Tin tức
                </Link>

                <div className="ml-auto flex flex-wrap items-center gap-3">
                    {auth.isAuthenticated ? (
                        <>
                            <Link className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700" to={isAdmin ? '/admin' : '/cart'}>
                                {isAdmin ? <CrownOutlined /> : <ShoppingCartOutlined />}
                                <span>{isAdmin ? 'Quản trị' : 'Giỏ hàng'}</span>
                            </Link>
                            <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
                                <div className="grid h-10 w-10 place-items-center rounded-full bg-red-100 font-bold text-red-700">{auth?.user?.name?.charAt(0) || 'U'}</div>
                                <div>
                                    <div className="text-xs text-slate-500">Chào bạn,</div>
                                    <div className="font-bold text-slate-900">{auth?.user?.name || auth?.user?.email || 'Member'}</div>
                                </div>
                            </div>
                            <button className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={onLogout} type="button">
                                <LogoutOutlined />
                                <span>Đăng xuất</span>
                            </button>
                        </>
                    ) : (
                        <Link className="inline-flex items-center rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700" to="/login">
                            Đăng nhập
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;