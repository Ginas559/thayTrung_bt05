import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCategoriesApi, getKeyboardsApi } from '../util/api';
import { formatCurrency, getDiscountLabel } from '../util/format';

const priceRanges = [
    { label: '0đ - 500.000đ', minPrice: 0, maxPrice: 500000 },
    { label: '500.000đ - 1.000.000đ', minPrice: 500000, maxPrice: 1000000 },
    { label: '1.000.000đ - 2.000.000đ', minPrice: 1000000, maxPrice: 2000000 },
    { label: '2.000.000đ - 3.000.000đ', minPrice: 2000000, maxPrice: 3000000 },
    { label: '3.000.000đ+', minPrice: 3000000, maxPrice: '' },
];

const ratingOptions = [5, 4, 3];

const getFiltersFromSearchParams = (params) => ({
    q: params.get('q') || '',
    categoryIds: params.get('categoryIds')?.split(',').filter(Boolean) || [],
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    minRating: params.get('minRating') || '',
    inStock: params.get('inStock') === 'true',
    sort: params.get('sort') || 'latest',
});

const areFiltersEqual = (left, right) => (
    left.q === right.q
    && left.minPrice === right.minPrice
    && left.maxPrice === right.maxPrice
    && left.minRating === right.minRating
    && left.inStock === right.inStock
    && left.sort === right.sort
    && left.categoryIds.length === right.categoryIds.length
    && left.categoryIds.every((value, index) => value === right.categoryIds[index])
);

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [categories, setCategories] = useState([]);
    const [keyboards, setKeyboards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalItems, setTotalItems] = useState(0);
    const sentinelRef = useRef(null);
    const searchParamsString = searchParams.toString();

    const filters = useMemo(() => getFiltersFromSearchParams(searchParams), [searchParamsString]);

    const updateSearchParams = (updates) => {
        const nextParams = new URLSearchParams(searchParams);

        Object.entries(updates).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                if (value.length) {
                    nextParams.set(key, value.join(','));
                } else {
                    nextParams.delete(key);
                }
                return;
            }

            if (value === undefined || value === null || value === '') {
                nextParams.delete(key);
                return;
            }

            nextParams.set(key, String(value));
        });

        if (nextParams.toString() !== searchParamsString) {
            setSearchParams(nextParams, { replace: true });
        }
    };

    useEffect(() => {
        const loadCategories = async () => {
            const res = await getCategoriesApi();
            setCategories(Array.isArray(res) ? res : []);
        };

        loadCategories();
    }, []);

    // Reset pagination when filters change
    useEffect(() => {
        setKeyboards([]);
        setPage(1);
        setHasMore(true);
    }, [searchParamsString]);

    // Load a page of results when page or filters change
    useEffect(() => {
        const loadBooks = async () => {
            setLoading(true);
            const params = {
                q: filters.q || undefined,
                categoryIds: filters.categoryIds.length ? filters.categoryIds.join(',') : undefined,
                minPrice: filters.minPrice || undefined,
                maxPrice: filters.maxPrice || undefined,
                minRating: filters.minRating || undefined,
                inStock: filters.inStock ? 'true' : undefined,
                sort: filters.sort,
                page,
                limit: 10,
            };

            const res = await getKeyboardsApi(params);

            if (Array.isArray(res)) {
                // fallback for non-paginated responses
                setKeyboards(res);
                setTotalItems(res.length);
                setHasMore(false);
            } else if (res && Array.isArray(res.items)) {
                setKeyboards((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
                setTotalItems(res.total || 0);
                setHasMore(page < (res.totalPages || 0));
            } else {
                setHasMore(false);
            }

            setLoading(false);
        };

        loadBooks();
    }, [searchParamsString, page]);

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        if (!sentinelRef.current) return undefined;

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && !loading && hasMore) {
                setPage((p) => p + 1);
            }
        }, { rootMargin: '200px' });

        observer.observe(sentinelRef.current);

        return () => observer.disconnect();
    }, [loading, hasMore]);

    const selectedCategories = useMemo(() => new Set(filters.categoryIds), [filters.categoryIds]);

    const onToggleCategory = (categoryId) => {
        const exists = filters.categoryIds.includes(categoryId);
        const nextCategoryIds = exists
            ? filters.categoryIds.filter((id) => id !== categoryId)
            : [...filters.categoryIds, categoryId];

        updateSearchParams({ categoryIds: nextCategoryIds });
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            <div className="mb-6">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">Kết quả tìm kiếm cho: "{filters.q || 'Tất cả'}"</h1>
                <p className="mt-2 text-slate-500">Tìm thấy {keyboards.length} bàn phím</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <aside className="min-w-0 space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900">Khoảng giá</h3>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Từ</span>
                                <input
                                    value={filters.minPrice}
                                    onChange={(e) => updateSearchParams({ minPrice: e.target.value })}
                                    inputMode="numeric"
                                    placeholder="0"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-500 focus:bg-white"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Đến</span>
                                <input
                                    value={filters.maxPrice}
                                    onChange={(e) => updateSearchParams({ maxPrice: e.target.value })}
                                    inputMode="numeric"
                                    placeholder="3000000"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-500 focus:bg-white"
                                />
                            </label>
                        </div>
                        <div className="mt-3 text-xs text-slate-500">{filters.minPrice || 0}đ - {filters.maxPrice || '3.000.000'}đ</div>
                        <div className="mt-3 space-y-2">
                            {priceRanges.map((range) => (
                                <label key={range.label} className="flex items-center gap-3 rounded-2xl px-1 py-1 text-sm text-slate-700">
                                    <input
                                        type="radio"
                                        checked={filters.minPrice === String(range.minPrice) && String(filters.maxPrice) === String(range.maxPrice)}
                                        onChange={() => updateSearchParams({ minPrice: String(range.minPrice), maxPrice: String(range.maxPrice) })}
                                        className="accent-red-600"
                                    />
                                    <span>{range.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900">Thể loại</h3>
                        <div className="mt-4 space-y-2">
                            {categories.map((category) => (
                                <label key={category._id} className="flex items-center gap-3 rounded-2xl px-1 py-1 text-sm text-slate-700">
                                    <input type="checkbox" checked={selectedCategories.has(category._id)} onChange={() => onToggleCategory(category._id)} className="accent-red-600" />
                                    <span>{category.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900">Đánh giá</h3>
                        <div className="mt-4 space-y-2">
                            {ratingOptions.map((rating) => (
                                <label key={rating} className="flex items-center gap-3 rounded-2xl px-1 py-1 text-sm text-slate-700">
                                    <input type="radio" checked={filters.minRating === String(rating)} onChange={() => updateSearchParams({ minRating: String(rating) })} className="accent-red-600" />
                                    <span>{'★'.repeat(rating)} trở lên</span>
                                </label>
                            ))}
                            <label className="flex items-center gap-3 rounded-2xl px-1 py-1 text-sm text-slate-700">
                                <input type="radio" checked={filters.minRating === ''} onChange={() => updateSearchParams({ minRating: '' })} className="accent-red-600" />
                                <span>Tất cả</span>
                            </label>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900">Tình trạng</h3>
                        <label className="mt-4 flex items-center gap-3 text-sm text-slate-700">
                            <input type="checkbox" checked={filters.inStock} onChange={() => updateSearchParams({ inStock: !filters.inStock ? 'true' : '' })} className="accent-red-600" />
                            <span>Chỉ hiển thị bàn phím còn hàng</span>
                        </label>
                    </div>
                </aside>

                <section className="min-w-0">
                    <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                        <span className="font-semibold text-slate-700">{loading ? 'Đang tải...' : 'Sắp xếp'}</span>
                        <select value={filters.sort} onChange={(e) => updateSearchParams({ sort: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-500 focus:bg-white xl:w-auto">
                            <option value="latest">Mới nhất</option>
                            <option value="popular">Bán chạy</option>
                            <option value="price-asc">Giá tăng dần</option>
                            <option value="price-desc">Giá giảm dần</option>
                            <option value="rating">Đánh giá cao</option>
                        </select>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {keyboards.map((keyboard) => (
                            <Link key={keyboard._id} to={`/keyboard/${keyboard._id}`} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                                    <img src={keyboard.images?.[0]} alt={keyboard.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                    {keyboard.discount ? <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">Mới</span> : null}
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
                    <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
                        <div ref={sentinelRef} />
                        {loading
                            ? 'Đang tải thêm sản phẩm...'
                            : hasMore
                                ? `Đang hiển thị ${keyboards.length}${totalItems ? ` / ${totalItems}` : ''} sản phẩm. Kéo xuống cuối trang để tải thêm.`
                                : `Đã tải hết ${totalItems || keyboards.length} sản phẩm.`}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SearchPage;