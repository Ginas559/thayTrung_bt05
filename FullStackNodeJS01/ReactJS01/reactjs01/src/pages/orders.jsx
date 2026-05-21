import { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Card, Empty, Pagination, Select, Skeleton, Tag, notification } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, LoadingOutlined, ShoppingOutlined } from '@ant-design/icons';
import { AuthContext } from '../components/context/auth.context';
import { getMyOrdersApi } from '../util/api';
import { formatCurrency } from '../util/format';

const ORDER_STATUS_OPTIONS = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCEL_REQUESTED', 'CANCELLED'];

const statusColorMap = {
    PENDING: 'gold',
    CONFIRMED: 'blue',
    PREPARING: 'processing',
    SHIPPING: 'cyan',
    DELIVERED: 'green',
    CANCEL_REQUESTED: 'orange',
    CANCELLED: 'red',
};

const normalizeResponseList = (response) => response?.DT?.items || response?.items || [];

const OrdersPage = () => {
    const navigate = useNavigate();
    const { auth, appLoading } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(6);
    const [total, setTotal] = useState(0);
    const [status, setStatus] = useState('ALL');

    const isAuthenticated = Boolean(auth?.isAuthenticated);

    useEffect(() => {
        const loadOrders = async () => {
            setLoading(true);

            try {
                const response = await getMyOrdersApi({ page, limit, status });

                if (response?.EC !== 0) {
                    throw new Error(response?.EM || 'Không thể tải danh sách đơn hàng');
                }

                const payload = response?.DT || {};
                setOrders(normalizeResponseList(response));
                setTotal(Number(payload?.total || 0));
            } catch (error) {
                setOrders([]);
                setTotal(0);
                notification.error({
                    message: 'Đơn hàng của tôi',
                    description: error?.message || 'Không thể tải danh sách đơn hàng',
                });
            } finally {
                setLoading(false);
            }
        };

        if (!appLoading && isAuthenticated) {
            loadOrders();
        }
    }, [appLoading, isAuthenticated, page, limit, status]);

    const orderCount = useMemo(() => total, [total]);

    if (appLoading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
                <Skeleton active paragraph={{ rows: 8 }} />
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
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} className="px-0 text-slate-600">
                        Quay lại trang chủ
                    </Button>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Đơn hàng của tôi</h1>
                    <p className="mt-2 max-w-2xl text-slate-500">Lịch sử mua hàng có phân trang, lọc trạng thái và dữ liệu snapshot để đối chiếu sau này.</p>
                </div>

                <Tag color="red" icon={<ShoppingOutlined />}>{orderCount} đơn hàng</Tag>
            </div>

            <Card className="mb-4 rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 20 }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <Select
                            value={status}
                            onChange={(value) => {
                                setStatus(value);
                                setPage(1);
                            }}
                            style={{ minWidth: 220 }}
                            options={ORDER_STATUS_OPTIONS.map((item) => ({ value: item, label: item === 'ALL' ? 'Tất cả trạng thái' : item }))}
                        />
                        <Tag color="gold" icon={<ClockCircleOutlined />}>{orderCount} kết quả</Tag>
                    </div>
                    <Button onClick={() => navigate('/search')}>Mua thêm</Button>
                </div>
            </Card>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Card key={`order-skeleton-${index}`} className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 20 }}>
                            <Skeleton active paragraph={{ rows: 4 }} />
                        </Card>
                    ))}
                </div>
            ) : orders.length ? (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const items = Array.isArray(order.items) ? order.items : [];
                        const firstItem = items[0]?.snapshot || {};

                        return (
                            <Card key={order._id} className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 20 }}>
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-red-600">Đơn hàng</div>
                                        <h2 className="mt-2 text-xl font-bold text-slate-900">#{order._id}</h2>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                            <span>{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}</span>
                                            <span>•</span>
                                            <span>{order.shippingInfo?.fullName || 'Khách hàng'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Tag color={statusColorMap[order.orderStatus] || 'blue'}>{order.orderStatus || 'PENDING'}</Tag>
                                        <Tag color="gold">{order.paymentMethod || 'COD'}</Tag>
                                        <Tag color={order.paymentStatus === 'PAID' ? 'green' : 'gold'} icon={<ClockCircleOutlined />}>{formatCurrency(order.totalAmount || 0)}</Tag>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-3">
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Người nhận</div>
                                        <div className="mt-2 font-semibold text-slate-900">{order.shippingInfo?.fullName || '---'}</div>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Sản phẩm</div>
                                        <div className="mt-2 font-semibold text-slate-900">{items.length} item</div>
                                    </div>
                                    <div className="rounded-2xl bg-slate-50 p-4">
                                        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Giá trị đơn hàng</div>
                                        <div className="mt-2 font-semibold text-slate-900">{formatCurrency(order.totalAmount || 0)}</div>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4 md:grid-cols-[88px_1fr]">
                                    <div className="h-22 w-22 overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200">
                                        <img
                                            src={firstItem.image || 'https://placehold.co/176x176?text=Order'}
                                            alt={firstItem.name || 'Sản phẩm'}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-900">{firstItem.name || 'Snapshot sản phẩm'}</div>
                                        <div className="mt-1 text-sm text-slate-500">{items.length ? `+ ${items.length - 1} sản phẩm khác` : 'Không có item'}</div>
                                        <div className="mt-2 text-xs text-slate-400">Snapshot giữ nguyên tên, ảnh và giá tại thời điểm checkout.</div>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                                    <div className="text-sm text-slate-500">Tổng tiền đơn hàng</div>
                                    <div className="text-lg font-black text-red-600">{formatCurrency(order.totalAmount || 0)}</div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <Button type="primary" onClick={() => navigate(`/orders/${order._id}`)}>
                                        Xem chi tiết
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}

                    <div className="flex justify-center pt-2">
                        <Pagination
                            current={page}
                            pageSize={limit}
                            total={total}
                            showSizeChanger={false}
                            onChange={(nextPage) => setPage(nextPage)}
                        />
                    </div>
                </div>
            ) : (
                <Card className="rounded-[28px] border-dashed border-slate-300 shadow-sm" bodyStyle={{ padding: 32 }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={(
                            <div>
                                <div className="text-lg font-bold text-slate-900">Chưa có đơn hàng nào</div>
                                <div className="mt-2 text-slate-500">Khi bạn đặt hàng, toàn bộ đơn sẽ hiển thị ở đây.</div>
                            </div>
                        )}
                    >
                        <Button type="primary" size="large" onClick={() => navigate('/search')}>
                            Tiếp tục mua sắm
                        </Button>
                    </Empty>
                </Card>
            )}
        </div>
    );
};

export default OrdersPage;