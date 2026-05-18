import { useContext, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../components/context/auth.context';
import { getArticlesApi, getKeyboardsApi } from '../util/api';
import { formatCurrency, getDiscountLabel } from '../util/format';

const sectionConfig = [
    { key: 'promotion', title: 'Bàn Phím Khuyến Mãi', subtitle: 'Giá tốt nhất trong năm' },
    { key: 'latest', title: 'Bàn Phím Mới Nhất', subtitle: 'Vừa về kho, cập nhật liên tục' },
    { key: 'bestseller', title: 'Bán Chạy Nhất', subtitle: 'Được nhiều thành viên lựa chọn' },
    { key: 'most-viewed', title: 'Xem Nhiều Nhất', subtitle: 'Những sản phẩm được quan tâm nhiều' },
];

const HomePage = () => {
    const { auth } = useContext(AuthContext);
    const [sections, setSections] = useState({
        promotion: [],
        latest: [],
        bestseller: [],
        'most-viewed': [],
    });
    const [pages, setPages] = useState({
        bestseller: 1,
        'most-viewed': 1,
    });
    const [totalPages, setTotalPages] = useState({
        bestseller: 1,
        'most-viewed': 1,
    });
    const [animating, setAnimating] = useState({
        bestseller: false,
        'most-viewed': false,
    });
    const [news, setNews] = useState([]);
    const bestsellerRef = useRef(null);
    const mostViewedRef = useRef(null);
    const carouselBestsellerRef = useRef(null);
    const carouselMostViewedRef = useRef(null);

    useEffect(() => {
        const fetchSections = async () => {
            const [promotion, latest, articles] = await Promise.all([
                getKeyboardsApi({ promotion: true, sort: 'popular' }),
                getKeyboardsApi({ latest: true, sort: 'latest' }),
                getArticlesApi({ latest: true }),
            ]);

            setSections((prev) => ({
                ...prev,
                promotion: Array.isArray(promotion) ? promotion : (promotion?.items || []),
                latest: Array.isArray(latest) ? latest : (latest?.items || []),
            }));
            setNews(Array.isArray(articles) ? articles : []);
        };

        fetchSections();
    }, []);

    // Fetch paginated data for bestseller and most-viewed when page changes
    useEffect(() => {
        const fetchBestsellerPage = async () => {
            const page = pages.bestseller || 1;
            // Fetch top-sold keyboards with pageSize = 10 to match requirement
            const res = await getKeyboardsApi({ sort: 'popular', page, limit: 10 });
            if (Array.isArray(res)) {
                setSections((prev) => ({ ...prev, bestseller: res }));
                setTotalPages((t) => ({ ...t, bestseller: 1 }));
            } else if (res && res.items) {
                setSections((prev) => ({ ...prev, bestseller: res.items || [] }));
                setTotalPages((t) => ({ ...t, bestseller: res.totalPages || 1 }));
            }
        };

        const fetchMostViewedPage = async () => {
            const page = pages['most-viewed'] || 1;
            const res = await getKeyboardsApi({ sort: 'views', page, limit: 10 });
            if (Array.isArray(res)) {
                setSections((prev) => ({ ...prev, 'most-viewed': res }));
                setTotalPages((t) => ({ ...t, 'most-viewed': 1 }));
            } else if (res && res.items) {
                setSections((prev) => ({ ...prev, 'most-viewed': res.items || [] }));
                setTotalPages((t) => ({ ...t, 'most-viewed': res.totalPages || 1 }));
            }
        };

        fetchBestsellerPage();
        fetchMostViewedPage();
    }, [pages.bestseller, pages['most-viewed']]);

    const scrollThenSetPage = (key, nextPage, container) => {
        if (!container) {
            setPages((p) => ({ ...p, [key]: nextPage }));
            return;
        }

        const pageWidth = container.clientWidth || 0;
        const start = container.scrollLeft || 0;
        const target = Math.max(0, Math.min(container.scrollWidth - pageWidth, start + (nextPage > pages[key] ? pageWidth : -pageWidth)));

        // animate scroll
        try {
            container.scrollTo({ left: target, behavior: 'smooth' });
        } catch {
            // fallback: set directly
            container.scrollLeft = target;
        }

        setAnimating((a) => ({ ...a, [key]: true }));

        // after animation, update page and reset scroll to 0 to display new page items
        setTimeout(() => {
            setPages((p) => ({ ...p, [key]: nextPage }));
            setAnimating((a) => ({ ...a, [key]: false }));
            // reset scroll so new items appear at start
            container.scrollTo?.({ left: 0, behavior: 'smooth' });
        }, 420);
    };

    const gotoPrev = (key) => {
        const current = pages[key] || 1;
        if (current <= 1) return;
        const next = Math.max(1, current - 1);
        const container = key === 'bestseller' ? carouselBestsellerRef.current : carouselMostViewedRef.current;
        scrollThenSetPage(key, next, container);
    };

    const gotoNext = (key) => {
        const current = pages[key] || 1;
        const max = totalPages[key] || 1;
        if (current >= max) return;
        const next = Math.min(max, current + 1);
        const container = key === 'bestseller' ? carouselBestsellerRef.current : carouselMostViewedRef.current;
        scrollThenSetPage(key, next, container);
    };

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
                    <div className="mt-8 flex flex-wrap gap-3 items-center">
                        <Link to="/search" className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-red-700 shadow-lg shadow-red-900/10 transition hover:scale-[1.01]">{auth.isAuthenticated ? 'Danh sách bàn phím' : 'Khám phá ngay'}</Link>
                        <button onClick={() => bestsellerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="inline-flex items-center justify-center rounded-md bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-white">Bán chạy</button>
                        <button onClick={() => mostViewedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="inline-flex items-center justify-center rounded-md bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-white">Xem nhiều</button>
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
                <section ref={section.key === 'bestseller' ? bestsellerRef : section.key === 'most-viewed' ? mostViewedRef : undefined} className="mt-10" key={section.key}>
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-extrabold tracking-[0.25em] text-red-600">{section.key.toUpperCase()}</div>
                                        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{section.title}</h2>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-sm text-slate-500">{section.subtitle}</p>
                                        {['bestseller', 'most-viewed'].includes(section.key) ? (
                                            <div className="ml-4 inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1 text-sm font-medium shadow-sm">
                                                <button onClick={() => gotoPrev(section.key)} disabled={(pages[section.key] || 1) <= 1} aria-label="Prev page" className="rounded-full bg-slate-50 p-1 shadow-sm disabled:opacity-40">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <div className="px-2 text-slate-700">Trang {pages[section.key] || 1}/{totalPages[section.key] || 1}</div>
                                                <button onClick={() => gotoNext(section.key)} disabled={(pages[section.key] || 1) >= (totalPages[section.key] || 1)} aria-label="Next page" className="rounded-full bg-slate-50 p-1 shadow-sm disabled:opacity-40">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                            {/* For bestseller and most-viewed sections we render a horizontal scroll list */}
                            {['bestseller', 'most-viewed'].includes(section.key) ? (
                                <div className="relative group">
                                    <div ref={section.key === 'bestseller' ? carouselBestsellerRef : section.key === 'most-viewed' ? carouselMostViewedRef : undefined} className={`flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth py-2 transform transition-all duration-500 ease-in-out ${animating[section.key] ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                                        {sections[section.key].map((keyboard) => (
                                            <Link key={keyboard._id} to={`/keyboard/${keyboard._id}`} className="w-[220px] snap-start flex-shrink-0 group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
                                                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                                                    <img src={keyboard.images?.[0]} alt={keyboard.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                                </div>
                                                <div className="p-3">
                                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{keyboard.categoryId?.name || ''}</div>
                                                    <h3 className="mt-2 text-sm font-bold text-slate-900 line-clamp-2">{keyboard.title}</h3>
                                                    <div className="mt-2 text-sm font-semibold text-amber-500">{keyboard.rating?.toFixed(1)} / 5.0</div>
                                                    <div className="mt-3 text-lg font-black text-red-600">{formatCurrency(keyboard.price)}</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>

                                    {/* Overlay arrows (hover) */}
                                    <button onClick={() => gotoPrev(section.key)} disabled={(pages[section.key] || 1) <= 1} aria-label="Previous" className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md disabled:opacity-40 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <button onClick={() => gotoNext(section.key)} disabled={(pages[section.key] || 1) >= (totalPages[section.key] || 1)} aria-label="Next" className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md disabled:opacity-40 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    
                                </div>
                            ) : (
                                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                                    {sections[section.key].map((keyboard) => (
                                        <Link key={keyboard._id} to={`/keyboard/${keyboard._id}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
                                            <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                                                <img src={keyboard.images?.[0]} alt={keyboard.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
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
                            )}
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