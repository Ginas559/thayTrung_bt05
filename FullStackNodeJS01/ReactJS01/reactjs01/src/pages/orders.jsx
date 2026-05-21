import { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Collapse, Divider, Empty, Spin, Tag, notification } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, LoadingOutlined, ShoppingOutlined } from '@ant-design/icons';
import { AuthContext } from '../components/context/auth.context';
import { getMyOrdersApi } from '../util/api';
import { formatCurrency } from '../util/format';

const OrdersPage = () => {
    const navigate = useNavigate();
    const { auth, appLoading } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);

    const isAuthenticated = Boolean(auth?.isAuthenticated);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await getMyOrdersApi();
            setOrders(Array.isArray(res) ? res : []);
        } catch (error) {
            setOrders([]);
            notification.error({
                message: 'Đơn hàng của tôi',
                description: error?.message || 'Không thể tải danh sách đơn hàng',
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

        loadOrders();
    }, [appLoading, isAuthenticated]);

    const orderCount = useMemo(() => orders.length, [orders]);

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
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/')} className="px-0 text-slate-600">
                        Quay lại trang chủ
                    </Button>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Đơn hàng của tôi</h1>
                    <p className="mt-2 text-slate-500">Xem lại các đơn đã đặt, từng item trong đơn, snapshot sản phẩm, số lượng và tổng tiền.</p>
                </div>

                <Tag color="red" icon={<ShoppingOutlined />}>{orderCount} đơn hàng</Tag>
            </div>

            {orders.length ? (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const items = Array.isArray(order.items) ? order.items : [];

                        return (
                            <Card key={order._id} className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 20 }}>
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-red-600">Đơn hàng</div>
                                        <h2 className="mt-2 text-xl font-bold text-slate-900">#{order._id}</h2>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                                            <span>{order.userEmail}</span>
                                            <span>•</span>
                                            <span>{order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <Tag color="blue">{order.status || 'Pending'}</Tag>
                                        <Tag color="gold">{order.paymentMethod || 'COD'}</Tag>
                                        <Tag color="red" icon={<ClockCircleOutlined />}>{formatCurrency(order.totalAmount || 0)}</Tag>
                                    </div>
                                </div>

                                <Divider className="my-4" />

                                <Collapse
                                    bordered={false}
                                    defaultActiveKey={['items']}
                                    items={[
                                        {
                                            key: 'items',
                                            label: `Chi tiết sản phẩm (${items.length})`,
                                            children: items.length ? (
                                                <div className="space-y-3">
                                                    {items.map((item, index) => {
                                                        const snapshot = item.snapshot || {};
                                                        const itemName = snapshot.name || item.title || 'Sản phẩm';
                                                        const itemBrand = snapshot.brand || '';
                                                        const itemPrice = Number(snapshot.price || item.price || 0);
                                                        const quantity = Number(item.qty || 0);

                                                        return (
                                                            <div key={`${order._id}-${item.bookId || index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[72px_1fr_auto] md:items-center">
                                                                <div className="h-18 w-18 overflow-hidden rounded-2xl bg-white">
                                                                    <img
                                                                        src={snapshot.image || 'https://placehold.co/144x144?text=Order'}
                                                                        alt={itemName}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <div className="text-sm font-bold text-slate-900">{itemName}</div>
                                                                    <div className="mt-1 text-xs text-slate-500">{itemBrand || 'N/A'}</div>
                                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                                                        <span className="rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200">Số lượng: {quantity}</span>
                                                                        <span className="rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200">Đơn giá: {formatCurrency(itemPrice)}</span>
                                                                        <span className="rounded-full bg-red-50 px-2 py-1 font-semibold text-red-600">Tạm tính: {formatCurrency(quantity * itemPrice)}</span>
                                                                    </div>
                                                                </div>

                                                                <div className="text-right text-sm font-semibold text-slate-900">
                                                                    <div className="text-xs font-normal text-slate-500">Snapshot</div>
                                                                    <div>{snapshot.name || item.title || '---'}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <Empty description="Đơn hàng này chưa có item nào." />
                                            ),
                                        },
                                    ]}
                                />

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                                    <div className="text-sm text-slate-500">Tổng tiền đơn hàng</div>
                                    <div className="text-lg font-black text-red-600">{formatCurrency(order.totalAmount || 0)}</div>
                                </div>
                            </Card>
                        );
                    })}
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