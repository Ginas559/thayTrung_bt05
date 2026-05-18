import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../components/context/auth.context';
import { getArticlesApi, getKeyboardsApi } from '../util/api';
import { formatCurrency, getDiscountLabel } from '../util/format';

const sectionConfig = [
    { key: 'promotion', title: 'Bàn Phím Khuyến Mãi', subtitle: 'Giá tốt nhất trong năm' },
    { key: 'latest', title: 'Bàn Phím Mới Nhất', subtitle: 'Vừa về kho, cập nhật liên tục' },
    { key: 'bestseller', title: 'Bán Chạy Nhất', subtitle: 'Được nhiều thành viên lựa chọn' },
];

const HomePage = () => {
    const { auth } = useContext(AuthContext);
    const [sections, setSections] = useState({
        promotion: [],
        latest: [],
        bestseller: [],
    });
    const [news, setNews] = useState([]);

    useEffect(() => {
        const fetchSections = async () => {
            const [promotion, latest, bestseller, articles] = await Promise.all([
                getKeyboardsApi({ promotion: true, sort: 'popular' }),
                getKeyboardsApi({ latest: true, sort: 'latest' }),
                getKeyboardsApi({ bestseller: true, sort: 'popular' }),
                getArticlesApi({ latest: true }),
            ]);

            setSections({
                promotion: promotion || [],
                latest: latest || [],
                bestseller: bestseller || [],
            });
            setNews(Array.isArray(articles) ? articles : []);
        };

        fetchSections();
    }, []);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-red-600 via-red-500 to-red-400 p-8 text-white shadow-2xl shadow-red-500/20 md:p-14">
                <div className="relative z-10 max-w-3xl">
                    <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-semibold tracking-wide text-white/90">Keyboard Store Member Area</span>
                    <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">Hội Bàn Phím Cơ</h1>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-white/90 md:text-lg">
                        {auth.isAuthenticated
                            ? `Xin chào ${auth?.user?.name || auth?.user?.email}. Hôm nay có khuyến mãi, bàn phím mới nhất và bestseller dành riêng cho bạn.`
                            : 'Giảm giá đến 50%, cập nhật bàn phím mới và bestseller mỗi ngày. Đăng nhập để xem thông tin thành viên và tiếp tục mua sắm.'}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link to="/search" className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-red-700 shadow-lg shadow-red-900/10 transition hover:scale-[1.01]">{auth.isAuthenticated ? 'Danh sách bàn phím' : 'Khám phá ngay'}</Link>
                        {auth?.isAuthenticated ? (
                            auth?.user?.role === 'Admin' ? (
                                <Link to="/admin" className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">Vào trang quản trị</Link>
                            ) : null
                        ) : (
                            <Link to="/login" className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">Đăng nhập</Link>
                        )}
                    </div>
                    {auth.isAuthenticated ? (
                        <div className="mt-8 grid gap-3 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur md:grid-cols-3">
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-white/70">Thành viên đăng nhập</div>
                                <div className="mt-1 font-bold">{auth?.user?.name || auth?.user?.email}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-white/70">Vai trò</div>
                                <div className="mt-1 font-bold">{auth?.user?.role || 'User'}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase tracking-[0.25em] text-white/70">Trạng thái</div>
                                <div className="mt-1 font-bold">Đang hoạt động</div>
                            </div>
                        </div>
                    ) : null}
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_36%),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:auto,96px_96px,96px_96px] opacity-60" />
            </section>

            {sectionConfig.map((section) => (
                <section className="mt-10" key={section.key}>
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <div className="text-sm font-extrabold tracking-[0.25em] text-red-600">{section.key.toUpperCase()}</div>
                            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{section.title}</h2>
                        </div>
                        <p className="text-sm text-slate-500">{section.subtitle}</p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {sections[section.key].map((keyboard) => (
                            <Link key={keyboard._id} to={`/keyboard/${keyboard._id}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
                                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                                    <img src={keyboard.images?.[0]} alt={keyboard.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                    {keyboard.discount ? <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white">{getDiscountLabel(keyboard.discount)}</span> : null}
                                </div>
                                <div className="p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{keyboard.categoryId?.name || ''}</div>
                                    <h3 className="mt-2 text-lg font-bold text-slate-900">{keyboard.title}</h3>
                                    <p className="mt-1 text-sm text-slate-500">{keyboard.author}</p>
                                    <div className="mt-2 text-sm font-semibold text-amber-500">{keyboard.rating?.toFixed(1)} / 5.0</div>
                                    <div className="mt-4 flex items-end justify-between gap-3">
                                        <div>
                                            <div className="text-lg font-black text-red-600">{formatCurrency(keyboard.price)}</div>
                                            <div className="text-sm text-slate-400 line-through">{formatCurrency(keyboard.oldPrice)}</div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            ))}

            <section className="mt-10">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <div className="text-sm font-extrabold tracking-[0.25em] text-red-600">NEWS</div>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Tin tức mới nhất</h2>
                    </div>
                    <Link to="/news" className="text-sm font-semibold text-red-700 hover:text-red-800">Xem tất cả</Link>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    {news.slice(0, 3).map((article) => (
                        <Link key={article._id} to={`/news/${article._id}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                                <img src={article.coverImage} alt={article.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                            </div>
                            <div className="p-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{article.category}</div>
                                <h3 className="mt-2 text-lg font-bold text-slate-900">{article.title}</h3>
                                <p className="mt-2 line-clamp-3 text-sm text-slate-500">{article.summary}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default HomePage;