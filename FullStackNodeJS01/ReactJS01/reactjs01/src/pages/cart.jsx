import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import { AuthContext } from '../components/context/auth.context';
import { checkoutCartApi, getCartApi, removeCartItemApi, updateCartItemApi } from '../util/api';
import { formatCurrency } from '../util/format';

const CartPage = () => {
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);
    const [cart, setCart] = useState(null);

    const loadCart = async () => {
        const res = await getCartApi();
        setCart(res || null);
    };

    useEffect(() => {
        if (!auth?.isAuthenticated) {
            navigate('/login');
            return;
        }

        loadCart();
    }, [auth?.isAuthenticated, navigate]);

    const onChangeQty = async (itemId, qty) => {
        await updateCartItemApi(itemId, qty);
        await loadCart();
    };

    const onRemove = async (itemId) => {
        await removeCartItemApi(itemId);
        await loadCart();
    };

    const onCheckout = async () => {
        const res = await checkoutCartApi();
        if (res?.EC === 0) {
            notification.success({ message: 'Thanh toán', description: res?.EM || 'Đặt hàng thành công' });
            await loadCart();
        } else {
            notification.error({ message: 'Thanh toán', description: res?.EM || 'Không thể thanh toán' });
        }
    };

    const items = cart?.items || [];
    const totalAmount = items.reduce((sum, item) => sum + item.qty * (item.priceSnapshot || item.bookId?.price || 0), 0);

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Giỏ hàng bàn phím</h1>
            <p className="mt-2 text-slate-500">Kiểm tra lại sản phẩm trước khi đặt hàng.</p>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
                <section className="space-y-4">
                    {items.length ? items.map((item) => (
                        <div key={String(item.bookId?._id || item.bookId)} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
                            <img src={item.bookId?.images?.[0]} alt={item.bookId?.title} className="h-28 w-24 rounded-2xl object-cover" />
                            <div className="flex-1">
                                <div className="text-sm font-semibold uppercase tracking-wide text-slate-400">{item.bookId?.categoryId?.name || ''}</div>
                                <h2 className="mt-1 text-lg font-bold text-slate-900">{item.bookId?.title}</h2>
                                <p className="text-sm text-slate-500">{item.bookId?.author}</p>
                                <div className="mt-2 font-semibold text-red-600">{formatCurrency(item.priceSnapshot || item.bookId?.price || 0)}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <input type="number" min="1" value={item.qty} onChange={(event) => onChangeQty(item.bookId?._id || item.bookId, Number(event.target.value || 1))} className="w-20 rounded-2xl border border-slate-200 px-3 py-2" />
                                <button type="button" onClick={() => onRemove(item.bookId?._id || item.bookId)} className="rounded-2xl bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700">Xóa</button>
                            </div>
                        </div>
                    )) : (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
                            Giỏ hàng đang trống. <Link to="/search" className="font-semibold text-red-700">Xem bàn phím ngay</Link>
                        </div>
                    )}
                </section>

                <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Tổng đơn</h2>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                        <span>Sản phẩm</span>
                        <span>{items.length}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                        <span>Tổng tiền</span>
                        <span>{formatCurrency(totalAmount)}</span>
                    </div>
                    <button type="button" onClick={onCheckout} disabled={!items.length} className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Thanh toán</button>
                </aside>
            </div>
        </div>
    );
};

export default CartPage;
