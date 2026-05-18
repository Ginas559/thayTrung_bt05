import { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../components/context/auth.context';
import { addCartItemApi, getKeyboardDetailApi } from '../util/api';
import { formatCurrency, getDiscountLabel } from '../util/format';
import { notification } from 'antd';
import { Carousel } from 'antd';

const KeyboardDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    const carouselRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [related, setRelated] = useState([]);
    const [qty, setQty] = useState(1);
    const [selectedVariantId, setSelectedVariantId] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await getKeyboardDetailApi(id);
            setDetail(res?.keyboard || null);
            setRelated(Array.isArray(res?.related) ? res.related : []);
            const variants = res?.keyboard?.variants;
            if (Array.isArray(variants) && variants.length) {
                setSelectedVariantId(variants[0]._id || variants[0].id || null);
            } else {
                setSelectedVariantId(null);
            }
            setLoading(false);
        };

        load();
    }, [id]);

    const onAddToCart = async () => {
        if (!auth?.isAuthenticated) {
            navigate('/login');
            return;
        }

        // If backend supports variant, we might later send variantId. For now send keyboard id and qty.
        const res = await addCartItemApi(id, qty);
        if (res?.EC === 0) {
            notification.success({ message: 'Giỏ hàng', description: res?.EM || 'Đã thêm bàn phím vào giỏ hàng' });
        } else {
            notification.error({ message: 'Giỏ hàng', description: res?.EM || 'Không thể thêm sản phẩm' });
        }
    };

    const onBuyNow = async () => {
        await onAddToCart();
        navigate('/cart');
    };

    if (loading) {
        return <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">Đang tải chi tiết bàn phím...</div>;
    }

    if (!detail) {
        return <div className="mx-auto max-w-7xl px-4 py-10 lg:px-6">Không tìm thấy sản phẩm.</div>;
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            {/* Mobile sticky bar */}
            <div className="fixed bottom-0 left-0 right-0 z-50 block lg:hidden">
                <div className="mx-auto max-w-7xl px-4 py-3">
                    <div className="rounded-2xl bg-white p-3 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-slate-500">Tổng</div>
                                <div className="text-lg font-black text-red-600">{formatCurrency(detail.price)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={onAddToCart} disabled={detail.stock <= 0} className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white">Thêm vào giỏ</button>
                                <button type="button" onClick={onBuyNow} disabled={detail.stock <= 0} className="rounded-2xl border border-red-600 px-4 py-2 text-sm font-semibold text-red-600">Mua ngay</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                    {Array.isArray(detail.images) && detail.images.length > 1 ? (
                        <>
                            <Carousel ref={carouselRef} autoplay className="h-full w-full">
                                {detail.images.map((src, i) => (
                                    <div key={i} className="h-[420px] w-full">
                                        <img src={src} alt={`${detail.title}-${i}`} className="h-full w-full object-cover" />
                                    </div>
                                ))}
                            </Carousel>

                            <button type="button" onClick={() => carouselRef.current?.prev()} className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg">
                                <span className="text-red-600 text-2xl">‹</span>
                            </button>

                            <button type="button" onClick={() => carouselRef.current?.next()} className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg">
                                <span className="text-red-600 text-2xl">›</span>
                            </button>
                        </>
                    ) : (
                        <img src={detail.images?.[0]} alt={detail.title} className="h-full w-full object-cover" />
                    )}
                </div>
                <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.25em] text-red-600">Bàn phím</div>
                    <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900">{detail.title}</h1>
                    <p className="mt-3 text-base text-slate-500">{detail.author}</p>
                    <div className="mt-4 text-sm font-semibold text-amber-500">{detail.rating?.toFixed(1)} / 5.0</div>
                    <div className="mt-6 flex items-end gap-3">
                        <div className="text-3xl font-black text-red-600">{formatCurrency(detail.price)}</div>
                        {detail.oldPrice ? <div className="pb-1 text-lg text-slate-400 line-through">{formatCurrency(detail.oldPrice)}</div> : null}
                        {detail.discount ? <span className="mb-1 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white">{getDiscountLabel(detail.discount)}</span> : null}
                    </div>
                    <p className="mt-6 text-base leading-8 text-slate-600">{detail.description}</p>
                    <div className="mt-6 flex flex-wrap gap-3 items-center">
                        {/* Purchase box inside details column */}
                        <aside className="w-full lg:w-96">
                            <div className="sticky top-24 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="mb-3 text-sm text-slate-500">Giá</div>
                                <div className="mb-3 text-2xl font-black text-red-600">{formatCurrency(detail.price)}</div>

                                {Array.isArray(detail.variants) && detail.variants.length ? (
                                    <div className="mb-3">
                                        <div className="text-sm text-slate-600">Chọn phiên bản</div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {detail.variants.map((v) => (
                                                <button key={v._id || v.id} type="button" onClick={() => setSelectedVariantId(v._id || v.id)} className={`rounded-2xl border px-3 py-2 text-sm ${selectedVariantId === (v._id || v.id) ? 'bg-red-600 text-white' : 'bg-white text-slate-700'}`}>
                                                    {v.name} {v.price ? `- ${formatCurrency(v.price)}` : ''}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}

                                <div className="mb-3">
                                    <div className="text-sm text-slate-600">Số lượng</div>
                                    <div className="mt-2 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                        <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-9 w-9 rounded-md bg-slate-100 text-lg">-</button>
                                        <input type="number" min="1" value={qty} onChange={(event) => {
                                            const v = Number(event.target.value || 1);
                                            if (detail.stock && v > detail.stock) {
                                                setQty(detail.stock);
                                            } else {
                                                setQty(Math.max(1, v));
                                            }
                                        }} className="w-20 bg-transparent text-center outline-none" />
                                        <button type="button" onClick={() => setQty((q) => {
                                            const next = q + 1;
                                            if (detail.stock) return Math.min(detail.stock, next);
                                            return next;
                                        })} className="h-9 w-9 rounded-md bg-slate-100 text-lg">+</button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button type="button" onClick={onAddToCart} disabled={detail.stock <= 0} className="inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Thêm vào giỏ</button>
                                    <button type="button" onClick={onBuyNow} disabled={detail.stock <= 0} className="inline-flex w-full items-center justify-center rounded-2xl border border-red-600 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">Mua ngay</button>
                                </div>

                                <div className="mt-3 text-sm text-slate-600">
                                    <div>Kho: <span className="font-semibold">{detail.stock ?? 'N/A'}</span></div>
                                    <div>Đã bán: <span className="font-semibold">{detail.sold ?? 0}</span></div>
                                </div>
                            </div>
                        </aside>
                        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                            <span className="text-sm font-semibold text-slate-700 mr-2">Số lượng</span>
                            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-9 w-9 rounded-md bg-slate-100 text-lg">-</button>
                            <input type="number" min="1" value={qty} onChange={(event) => {
                                const v = Number(event.target.value || 1);
                                if (detail.stock && v > detail.stock) {
                                    setQty(detail.stock);
                                } else {
                                    setQty(Math.max(1, v));
                                }
                            }} className="w-20 bg-transparent text-center outline-none" />
                            <button type="button" onClick={() => setQty((q) => {
                                const next = q + 1;
                                if (detail.stock) return Math.min(detail.stock, next);
                                return next;
                            })} className="h-9 w-9 rounded-md bg-slate-100 text-lg">+</button>
                        </div>

                        <button type="button" onClick={onAddToCart} disabled={detail.stock <= 0} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Thêm vào giỏ</button>

                        <div className="ml-4 text-sm text-slate-600">
                            <div>Kho: <span className="font-semibold">{detail.stock ?? 'N/A'}</span></div>
                            <div>Đã bán: <span className="font-semibold">{detail.sold ?? 0}</span></div>
                        </div>
                    </div>
                </div>
            </div>

                    <section className="mt-10">
                        <h2 className="text-2xl font-black text-slate-900">Thông số kỹ thuật</h2>
                        <div className="mt-5 grid gap-6 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="mb-3 font-semibold text-slate-700">Tổng quan</h3>
                                <p className="text-sm text-slate-600">{detail.description}</p>
                                <div className="mt-4 text-sm text-slate-700">
                                    <div>Hãng: <span className="font-semibold">{detail.author || '---'}</span></div>
                                    <div>Danh mục: <span className="font-semibold">{detail.categoryId?.name || '---'}</span></div>
                                    <div>Kho: <span className="font-semibold">{detail.stock ?? '---'}</span></div>
                                    <div>Đã bán: <span className="font-semibold">{detail.sold ?? 0}</span></div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h3 className="mb-3 font-semibold text-slate-700">Thông số kỹ thuật</h3>
                                <table className="w-full text-sm text-slate-700">
                                    <tbody>
                                        <tr className="border-t"><td className="py-2 font-medium">Loại sản phẩm</td><td className="py-2">{detail.categoryId?.name || '---'}</td></tr>
                                        <tr className="border-t"><td className="py-2 font-medium">Số phím</td><td className="py-2">{detail.specs?.keys || '---'}</td></tr>
                                        <tr className="border-t"><td className="py-2 font-medium">Kết nối</td><td className="py-2">{detail.specs?.connect || '---'}</td></tr>
                                        <tr className="border-t"><td className="py-2 font-medium">Đèn LED</td><td className="py-2">{detail.specs?.led || '---'}</td></tr>
                                        <tr className="border-t"><td className="py-2 font-medium">Thời gian dùng</td><td className="py-2">{detail.specs?.battery || '---'}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    {related.length ? (
                <section className="mt-10">
                    <h2 className="text-2xl font-black text-slate-900">Sản phẩm liên quan</h2>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {related.map((item) => (
                            <button key={item._id} type="button" onClick={() => navigate(`/keyboard/${item._id}`)} className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                                <img src={item.images?.[0]} alt={item.title} className="aspect-[4/5] w-full object-cover" />
                                <div className="p-4">
                                    <div className="text-xs uppercase tracking-wide text-slate-400">{item.categoryId?.name || ''}</div>
                                    <div className="mt-2 font-bold text-slate-900">{item.title}</div>
                                    <div className="mt-2 text-red-600">{formatCurrency(item.price)}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
};

export default KeyboardDetailPage;