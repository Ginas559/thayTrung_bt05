import { useContext, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Divider, Empty, Spin, Tag, notification } from 'antd';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { AuthContext } from '../components/context/auth.context';
import { getOrderDetailApi } from '../util/api';
import { formatCurrency } from '../util/format';

const statusColorMap = {
    PENDING: 'gold',
    PROCESSING: 'blue',
    SHIPPING: 'cyan',
    DELIVERED: 'green',
    CANCELLED: 'red',
};

const OrderSuccessPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const { auth, appLoading } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(location.state?.order || null);
    const [error, setError] = useState('');

    const isAuthenticated = Boolean(auth?.isAuthenticated);

    useEffect(() => {
        const loadOrder = async () => {
            if (order && String(order?._id) === String(params.id)) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const response = await getOrderDetailApi(params.id);

                if (response?.EC !== undefined && response?.EC !== 0) {
                    throw new Error(response?.EM || 'Không thể tải chi tiết đơn hàng');
                }

                setOrder(response?.DT || response || null);
            } catch (fetchError) {
                setOrder(null);
                setError(fetchError?.message || 'Không thể tải chi tiết đơn hàng');
                notification.error({
                    message: 'Đơn hàng',
                    description: fetchError?.message || 'Không thể tải chi tiết đơn hàng',
                });
            } finally {
                setLoading(false);
            }
        };

        if (!appLoading && isAuthenticated) {
            loadOrder();
        }
    }, [appLoading, isAuthenticated, location.state, order, params.id]);

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

    if (error || !order) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
                <Card className="rounded-[28px] border-dashed border-slate-300 shadow-sm" bodyStyle={{ padding: 32 }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={(
                            <div>
                                <div className="text-lg font-bold text-slate-900">Không tìm thấy đơn hàng</div>
                                <div className="mt-2 text-slate-500">{error || 'Đơn hàng đã được tạo nhưng chưa thể hiển thị.'}</div>
                            </div>
                        )}
                    >
                        <Button type="primary" size="large" onClick={() => navigate('/orders')}>
                            Quay lại đơn hàng của tôi
                        </Button>
                    </Empty>
                </Card>
            </div>
        );
    }

    const items = Array.isArray(order.items) ? order.items : [];

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
            <Card className="rounded-[32px] border-slate-200 shadow-sm" bodyStyle={{ padding: 28 }}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
                            <CheckCircleOutlined />
                            Đặt hàng thành công
                        </div>
                        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">#{order._id}</h1>
                        <p className="mt-2 text-slate-500">Đơn hàng đã được tạo với snapshot sản phẩm tại thời điểm checkout.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Tag color="red">{order.paymentMethod || 'COD'}</Tag>
                        <Tag color={statusColorMap[order.orderStatus] || 'blue'}>{order.orderStatus || 'PENDING'}</Tag>
                        <Tag color={order.paymentStatus === 'PAID' ? 'green' : 'gold'}>{order.paymentStatus || 'UNPAID'}</Tag>
                    </div>
                </div>

                <Divider className="my-6" />

                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-4">
                        <Card className="rounded-[24px] border-slate-200 bg-slate-50 shadow-none" bodyStyle={{ padding: 20 }}>
                            <div className="text-sm uppercase tracking-[0.22em] text-slate-400">Thông tin giao hàng</div>
                            <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                                <div>
                                    <div className="text-slate-500">Họ tên</div>
                                    <div className="mt-1 font-semibold text-slate-900">{order.shippingInfo?.fullName || '---'}</div>
                                </div>
                                <div>
                                    <div className="text-slate-500">Số điện thoại</div>
                                    <div className="mt-1 font-semibold text-slate-900">{order.shippingInfo?.phone || '---'}</div>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="text-slate-500">Địa chỉ</div>
                                    <div className="mt-1 font-semibold text-slate-900">{order.shippingInfo?.address || '---'}</div>
                                </div>
                                {order.shippingInfo?.note ? (
                                    <div className="md:col-span-2">
                                        <div className="text-slate-500">Ghi chú</div>
                                        <div className="mt-1 font-semibold text-slate-900">{order.shippingInfo.note}</div>
                                    </div>
                                ) : null}
                            </div>
                        </Card>

                        <Card className="rounded-[24px] border-slate-200 shadow-sm" bodyStyle={{ padding: 20 }}>
                            <div className="text-sm uppercase tracking-[0.22em] text-slate-400">Danh sách sản phẩm</div>
                            <div className="mt-4 space-y-3">
                                {items.map((item, index) => (
                                    <div key={`${order._id}-${item.product || index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[72px_1fr_auto] md:items-center">
                                        <div className="h-18 w-18 overflow-hidden rounded-2xl bg-white">
                                            <img src={item.snapshot?.image || 'https://placehold.co/144x144?text=Order'} alt={item.snapshot?.name || 'Sản phẩm'} className="h-full w-full object-cover" />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-slate-900">{item.snapshot?.name || 'Sản phẩm'}</div>
                                            <div className="mt-1 text-xs text-slate-500">{item.snapshot?.category || 'N/A'}</div>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                                <span className="rounded-full bg-slate-50 px-2 py-1 shadow-sm ring-1 ring-slate-200">SL: {item.quantity}</span>
                                                <span className="rounded-full bg-slate-50 px-2 py-1 shadow-sm ring-1 ring-slate-200">Đơn giá: {formatCurrency(item.snapshot?.price || 0)}</span>
                                            </div>
                                        </div>

                                        <div className="text-right text-sm font-semibold text-slate-900">
                                            <div className="text-xs font-normal text-slate-500">Tạm tính</div>
                                            <div>{formatCurrency(Number(item.snapshot?.price || 0) * Number(item.quantity || 0))}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <aside className="h-fit space-y-4 lg:sticky lg:top-24">
                        <Card className="rounded-[24px] border-slate-200 shadow-sm" bodyStyle={{ padding: 20 }}>
                            <div className="text-sm uppercase tracking-[0.22em] text-slate-400">Thanh toán</div>
                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span>Tạm tính</span>
                                    <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Phí ship</span>
                                    <span className="font-semibold text-slate-900">{formatCurrency(order.shippingFee || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between text-base">
                                    <span className="font-medium text-slate-700">Tổng thanh toán</span>
                                    <span className="text-lg font-black text-red-600">{formatCurrency(order.totalAmount || 0)}</span>
                                </div>
                            </div>
                        </Card>

                        <div className="flex flex-col gap-3">
                            <Button type="primary" size="large" onClick={() => navigate('/orders')}>
                                Xem đơn hàng của tôi
                            </Button>
                            <Button size="large" onClick={() => navigate('/search')}>
                                Tiếp tục mua sắm
                            </Button>
                        </div>
                    </aside>
                </div>
            </Card>
        </div>
    );
};

export default OrderSuccessPage;