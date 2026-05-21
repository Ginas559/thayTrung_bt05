import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Divider, Empty, Modal, Spin, Tag, notification } from 'antd';
import {
    ArrowLeftOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    MinusOutlined,
    PlusOutlined,
    ShoppingCartOutlined,
} from '@ant-design/icons';
import { AuthContext } from '../components/context/auth.context';
import { checkoutCartApi, clearCartApi, getCartApi, removeCartItemApi, updateCartItemApi } from '../util/api';
import { formatCurrency } from '../util/format';

const emptyCartState = (user = '') => ({
    user,
    items: [],
    totalItems: 0,
    totalQuantity: 0,
    subtotal: 0,
});

const getCartPayload = (payload, fallbackUser = '') => {
    if (!payload) {
        return emptyCartState(fallbackUser);
    }

    if (Array.isArray(payload.items)) {
        return {
            user: payload.user || fallbackUser,
            items: payload.items,
            totalItems: Number(payload.totalItems || 0),
            totalQuantity: Number(payload.totalQuantity || 0),
            subtotal: Number(payload.subtotal || 0),
        };
    }

    if (payload?.DT && Array.isArray(payload.DT.items)) {
        return getCartPayload(payload.DT, fallbackUser);
    }

    return emptyCartState(fallbackUser);
};

const CartPage = () => {
    const navigate = useNavigate();
    const { auth, appLoading } = useContext(AuthContext);
    const [cart, setCart] = useState(emptyCartState());
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [clearingLoading, setClearingLoading] = useState(false);
    const [pendingIds, setPendingIds] = useState({});
    const cartSnapshotRef = useRef(emptyCartState());

    const isAuthenticated = Boolean(auth?.isAuthenticated);

    const markPending = (productId, value) => {
        setPendingIds((current) => ({
            ...current,
            [productId]: value,
        }));
    };

    const isItemPending = (productId) => Boolean(pendingIds[productId]);

    const replaceCart = (nextPayload) => {
        const normalized = getCartPayload(nextPayload, auth?.user?.email || '');
        setCart(normalized);
        cartSnapshotRef.current = normalized;
    };

    const loadCart = async () => {
        setLoading(true);
        try {
            const res = await getCartApi();
            replaceCart(res);
        } catch (error) {
            notification.error({
                message: 'Giỏ hàng',
                description: error?.message || 'Không thể tải giỏ hàng',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (appLoading) {
            return;
        }

        if (!isAuthenticated) {
            return;
        }

        loadCart();
    }, [appLoading, isAuthenticated]);

    const cartItems = cart?.items || [];

    const mutateItem = async (productId, nextQty) => {
        const previousCart = cartSnapshotRef.current;
        const targetItem = previousCart.items.find((item) => String(item.product) === String(productId));

        if (!targetItem) {
            return;
        }

        const optimisticItems = previousCart.items.map((item) => {
            if (String(item.product) !== String(productId)) {
                return item;
            }

            return {
                ...item,
                quantity: nextQty,
            };
        });

        const optimisticCart = {
            ...previousCart,
            items: optimisticItems,
        };

        cartSnapshotRef.current = optimisticCart;
        setCart(optimisticCart);
        markPending(productId, true);

        try {
            const res = await updateCartItemApi(productId, nextQty);

            if (res?.EC !== 0) {
                throw new Error(res?.EM || 'Không thể cập nhật giỏ hàng');
            }

            replaceCart(res?.DT || res);
            notification.success({
                message: 'Giỏ hàng',
                description: res?.EM || 'Đã cập nhật số lượng',
            });
        } catch (error) {
            cartSnapshotRef.current = previousCart;
            setCart(previousCart);
            notification.error({
                message: 'Giỏ hàng',
                description: error?.message || 'Không thể cập nhật sản phẩm',
            });
        } finally {
            markPending(productId, false);
        }
    };

    const onDecrease = async (item) => {
        if (isItemPending(item.product)) {
            return;
        }

        const nextQty = Math.max(1, Number(item.quantity || 1) - 1);

        if (nextQty === item.quantity) {
            return;
        }

        await mutateItem(item.product, nextQty);
    };

    const onIncrease = async (item) => {
        if (isItemPending(item.product)) {
            return;
        }

        if (Number(item.stock || 0) > 0 && Number(item.quantity || 0) >= Number(item.stock || 0)) {
            notification.warning({
                message: 'Giỏ hàng',
                description: item.lowStockMessage || 'Đã đạt số lượng tối đa trong kho',
            });
            return;
        }

        await mutateItem(item.product, Number(item.quantity || 0) + 1);
    };

    const onRemove = async (item) => {
        if (isItemPending(item.product)) {
            return;
        }

        const previousCart = cartSnapshotRef.current;
        const optimisticCart = {
            ...previousCart,
            items: previousCart.items.filter((entry) => String(entry.product) !== String(item.product)),
        };

        cartSnapshotRef.current = optimisticCart;
        setCart(optimisticCart);
        markPending(item.product, true);

        try {
            const res = await removeCartItemApi(item.product);

            if (res?.EC !== 0) {
                throw new Error(res?.EM || 'Không thể xóa sản phẩm');
            }

            replaceCart(res?.DT || res);
            notification.success({
                message: 'Giỏ hàng',
                description: res?.EM || 'Đã xóa sản phẩm khỏi giỏ',
            });
        } catch (error) {
            cartSnapshotRef.current = previousCart;
            setCart(previousCart);
            notification.error({
                message: 'Giỏ hàng',
                description: error?.message || 'Không thể xóa sản phẩm',
            });
        } finally {
            markPending(item.product, false);
        }
    };

    const onClearCart = () => {
        Modal.confirm({
            title: 'Xóa toàn bộ giỏ hàng?',
            icon: <ExclamationCircleOutlined />,
            content: 'Hành động này sẽ xóa toàn bộ sản phẩm khỏi giỏ hàng của bạn.',
            okText: 'Xóa hết',
            okButtonProps: { danger: true },
            cancelText: 'Hủy',
            onOk: async () => {
                setClearingLoading(true);
                const previousCart = cartSnapshotRef.current;

                try {
                    const res = await clearCartApi();

                    if (res?.EC !== 0) {
                        throw new Error(res?.EM || 'Không thể xóa giỏ hàng');
                    }

                    const nextCart = res?.DT || emptyCartState(auth?.user?.email || '');
                    cartSnapshotRef.current = nextCart;
                    setCart(nextCart);

                    notification.success({
                        message: 'Giỏ hàng',
                        description: res?.EM || 'Đã xóa toàn bộ giỏ hàng',
                    });
                } catch (error) {
                    cartSnapshotRef.current = previousCart;
                    setCart(previousCart);
                    notification.error({
                        message: 'Giỏ hàng',
                        description: error?.message || 'Không thể xóa giỏ hàng',
                    });
                } finally {
                    setClearingLoading(false);
                }
            },
        });
    };

    const onCheckout = async () => {
        setCheckoutLoading(true);
        try {
            const res = await checkoutCartApi();

            if (res?.EC !== 0) {
                throw new Error(res?.EM || 'Không thể thanh toán');
            }

            notification.success({
                message: 'Thanh toán',
                description: res?.EM || 'Đặt hàng thành công',
            });

            await loadCart();
        } catch (error) {
            notification.error({
                message: 'Thanh toán',
                description: error?.message || 'Không thể thanh toán',
            });
        } finally {
            setCheckoutLoading(false);
        }
    };

    const lowStockCount = useMemo(() => {
        return cartItems.filter((item) => Number(item.stock || 0) > 0 && Number(item.quantity || 0) >= Number(item.stock || 0) - 2).length;
    }, [cartItems]);

    if (appLoading || loading) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-10 lg:px-6">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/search')} className="px-0 text-slate-600">
                            Tiếp tục mua sắm
                        </Button>
                    </div>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Giỏ hàng của bạn</h1>
                    <p className="mt-2 text-slate-500">Giỏ hàng lưu trực tiếp trong MongoDB để đồng bộ ổn định giữa các lần truy cập.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Tag color="red">{cart.totalItems} sản phẩm</Tag>
                    <Tag color="gold">{cart.totalQuantity} số lượng</Tag>
                </div>
            </div>

            {lowStockCount > 0 ? (
                <Alert
                    className="mb-6"
                    type="warning"
                    showIcon
                    message="Tồn kho sắp chạm giới hạn"
                    description="Một số sản phẩm trong giỏ đang gần chạm mức tồn kho, bạn nên kiểm tra lại số lượng trước khi thanh toán."
                />
            ) : null}

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
                <section className="space-y-4">
                    {cartItems.length ? cartItems.map((item) => {
                        const stockMessage = item.lowStockMessage;
                        const isPending = isItemPending(item.product);

                        return (
                            <Card
                                key={item.product}
                                className="overflow-hidden rounded-[28px] border-slate-200 shadow-sm"
                                bodyStyle={{ padding: 20 }}
                            >
                                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                                    <div className="relative h-40 w-full overflow-hidden rounded-3xl bg-slate-100 md:h-32 md:w-28 md:flex-shrink-0">
                                        <img
                                            src={item.snapshot?.image || 'https://placehold.co/400x400?text=Keyboard'}
                                            alt={item.snapshot?.name || 'Sản phẩm'}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-red-600">
                                                    {item.snapshot?.brand || 'Keyboard Store'}
                                                </div>
                                                <h2 className="mt-1 truncate text-lg font-bold text-slate-900">
                                                    {item.snapshot?.name || 'Sản phẩm không còn khả dụng'}
                                                </h2>
                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    {stockMessage ? <Tag color="orange">{stockMessage}</Tag> : null}
                                                    {Number(item.stock || 0) <= 0 ? <Tag color="red">Ngừng kinh doanh</Tag> : null}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-sm text-slate-500">Đơn giá</div>
                                                <div className="text-lg font-black text-red-600">
                                                    {formatCurrency(item.snapshot?.price || 0)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-end">
                                            <div>
                                                <div className="text-sm text-slate-500">Số lượng</div>
                                                <div className="mt-2 inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                                                    <Button
                                                        type="text"
                                                        icon={<MinusOutlined />}
                                                        onClick={() => onDecrease(item)}
                                                        loading={isPending}
                                                        disabled={isPending || Number(item.quantity || 1) <= 1}
                                                        className="h-10 w-10"
                                                    />
                                                    <div className="min-w-14 px-3 text-center text-sm font-semibold text-slate-900">
                                                        {item.quantity}
                                                    </div>
                                                    <Button
                                                        type="text"
                                                        icon={<PlusOutlined />}
                                                        onClick={() => onIncrease(item)}
                                                        loading={isPending}
                                                        disabled={isPending || (Number(item.stock || 0) > 0 && Number(item.quantity || 0) >= Number(item.stock || 0))}
                                                        className="h-10 w-10"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="text-sm text-slate-500">Tạm tính</div>
                                                <div className="mt-2 text-xl font-black text-slate-900">
                                                    {formatCurrency(item.subtotal || 0)}
                                                </div>
                                            </div>

                                            <div className="flex justify-end">
                                                <Button
                                                    danger
                                                    type="text"
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => onRemove(item)}
                                                    loading={isPending}
                                                    disabled={isPending}
                                                >
                                                    Xóa
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    }) : (
                        <Card className="rounded-[28px] border-dashed border-slate-300 shadow-sm" bodyStyle={{ padding: 32 }}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={(
                                    <div>
                                        <div className="text-lg font-bold text-slate-900">Giỏ hàng trống</div>
                                        <div className="mt-2 text-slate-500">Bạn chưa thêm sản phẩm nào vào giỏ.</div>
                                    </div>
                                )}
                            >
                                <Button type="primary" size="large" onClick={() => navigate('/search')}>
                                    Tiếp tục mua sắm
                                </Button>
                            </Empty>
                        </Card>
                    )}
                </section>

                <aside className="h-fit space-y-4 lg:sticky lg:top-24">
                    <Card className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 20 }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm uppercase tracking-[0.22em] text-slate-400">Tổng đơn</div>
                                <h2 className="mt-1 text-xl font-bold text-slate-900">Cart Summary</h2>
                            </div>
                            <ShoppingCartOutlined className="text-2xl text-red-500" />
                        </div>

                        <Divider className="my-4" />

                        <div className="space-y-3 text-sm text-slate-600">
                            <div className="flex items-center justify-between">
                                <span>Số sản phẩm</span>
                                <span className="font-semibold text-slate-900">{cart.totalItems}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Tổng số lượng</span>
                                <span className="font-semibold text-slate-900">{cart.totalQuantity}</span>
                            </div>
                            <div className="flex items-center justify-between text-base">
                                <span className="font-medium text-slate-700">Subtotal</span>
                                <span className="text-lg font-black text-red-600">{formatCurrency(cart.subtotal || 0)}</span>
                            </div>
                        </div>

                        <Divider className="my-4" />

                        <div className="space-y-3">
                            <Button
                                type="primary"
                                size="large"
                                block
                                loading={checkoutLoading}
                                disabled={!cartItems.length}
                                onClick={onCheckout}
                            >
                                Thanh toán
                            </Button>
                            <Button
                                danger
                                size="large"
                                block
                                loading={clearingLoading}
                                disabled={!cartItems.length}
                                onClick={onClearCart}
                            >
                                Xóa toàn bộ giỏ hàng
                            </Button>
                        </div>
                    </Card>

                    <Card className="rounded-[28px] border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-red-900 text-white shadow-xl" bodyStyle={{ padding: 20 }}>
                        <div className="text-sm uppercase tracking-[0.22em] text-white/60">Lưu ý</div>
                        <p className="mt-3 text-sm leading-7 text-white/80">
                            Giá và tồn kho được xác thực ở backend. Snapshot trong cart giúp giỏ hàng vẫn ổn định ngay cả khi sản phẩm thay đổi hoặc bị xóa.
                        </p>
                    </Card>
                </aside>
            </div>
        </div>
    );
};

export default CartPage;
