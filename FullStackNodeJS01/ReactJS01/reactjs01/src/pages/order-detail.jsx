import { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Divider, Empty, Modal, Skeleton, Steps, Tag, Timeline, notification } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined, LoadingOutlined, StopOutlined } from '@ant-design/icons';
import { AuthContext } from '../components/context/auth.context';
import { cancelOrderApi, getOrderDetailApi } from '../util/api';
import { formatCurrency } from '../util/format';

const TRACKING_STEPS = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED'];

const statusMetaMap = {
    PENDING: { color: 'gold', label: 'Chờ xác nhận' },
    CONFIRMED: { color: 'blue', label: 'Đã xác nhận' },
    PREPARING: { color: 'processing', label: 'Đang chuẩn bị' },
    SHIPPING: { color: 'cyan', label: 'Đang giao hàng' },
    DELIVERED: { color: 'green', label: 'Đã giao thành công' },
    CANCEL_REQUESTED: { color: 'orange', label: 'Đang chờ duyệt hủy' },
    CANCELLED: { color: 'red', label: 'Đã hủy' },
};

const normalizeStatus = (value) => String(value || 'PENDING').trim().toUpperCase();

const getLastTrackableStatus = (order) => {
    const history = Array.isArray(order?.statusHistory) ? order.statusHistory : [];
    const candidates = history
        .map((entry) => normalizeStatus(entry.status))
        .filter((status) => TRACKING_STEPS.includes(status));

    if (candidates.length) {
        return candidates[candidates.length - 1];
    }

    const currentStatus = normalizeStatus(order?.orderStatus);
    if (TRACKING_STEPS.includes(currentStatus)) {
        return currentStatus;
    }

    return 'PENDING';
};

const buildTrackingSteps = (order) => {
    const normalizedStatus = normalizeStatus(order?.orderStatus);
    const displayStatus = getLastTrackableStatus(order);
    const activeIndex = TRACKING_STEPS.indexOf(displayStatus);

    return TRACKING_STEPS.map((status, index) => {
        const meta = statusMetaMap[status] || { color: 'blue', label: status };
        const isFinished = index < activeIndex;
        const isActive = index === activeIndex && TRACKING_STEPS.includes(normalizedStatus);

        return {
            title: meta.label,
            description: status,
            status: isFinished ? 'finish' : isActive ? 'process' : 'wait',
        };
    });
};

const OrderDetailPage = () => {
    const navigate = useNavigate();
    const params = useParams();
    const { auth, appLoading } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(false);

    const isAuthenticated = Boolean(auth?.isAuthenticated);
    const normalizedStatus = normalizeStatus(order?.orderStatus);
    const isOwner = Boolean(order && auth?.user?.email && order?.userEmail && auth.user.email === order.userEmail);
    const canCancelDirectly = isOwner && ['PENDING', 'CONFIRMED'].includes(normalizedStatus);
    const canRequestCancel = isOwner && normalizedStatus === 'PREPARING';
    const isCancelable = canCancelDirectly || canRequestCancel;
    const trackingSteps = useMemo(() => buildTrackingSteps(order), [order]);

    useEffect(() => {
        const loadOrder = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await getOrderDetailApi(params.id);

                if (response?.EC !== undefined && response?.EC !== 0) {
                    throw new Error(response?.EM || 'Không thể tải chi tiết đơn hàng');
                }

                const orderData = response?.DT || response;
                setOrder(orderData || null);
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
    }, [appLoading, isAuthenticated, params.id]);

    const handleCancelOrder = () => {
        Modal.confirm({
            title: canRequestCancel ? 'Gửi yêu cầu hủy đơn?' : 'Hủy đơn hàng?',
            content: canRequestCancel
                ? 'Đơn đang ở trạng thái PREPARING. Yêu cầu sẽ được gửi để admin duyệt và hệ thống sẽ không hoàn trả stock ngay cho đến khi được duyệt.'
                : 'Đơn ở trạng thái chờ xác nhận/đã xác nhận sẽ được hủy trực tiếp và hoàn trả tồn kho ngay lập tức.',
            okText: 'Xác nhận',
            cancelText: 'Đóng',
            okButtonProps: { danger: true },
            async onOk() {
                setCancelling(true);

                try {
                    const response = await cancelOrderApi(order._id, {
                        cancelReason: canRequestCancel ? 'User requested cancel while preparing' : 'User cancelled order before shipping',
                    });

                    if (response?.EC !== 0) {
                        throw new Error(response?.EM || 'Không thể hủy đơn hàng');
                    }

                    notification.success({
                        message: 'Đơn hàng',
                        description: response?.EM || 'Đã xử lý yêu cầu hủy đơn',
                    });

                    const nextOrder = response?.DT || order;
                    setOrder(nextOrder);
                } catch (cancelError) {
                    notification.error({
                        message: 'Đơn hàng',
                        description: cancelError?.message || 'Không thể hủy đơn hàng',
                    });
                    throw cancelError;
                } finally {
                    setCancelling(false);
                }
            },
        });
    };

    if (appLoading || loading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
                <Card className="rounded-[32px] border-slate-200 shadow-sm" bodyStyle={{ padding: 28 }}>
                    <Skeleton active paragraph={{ rows: 12 }} />
                </Card>
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
                                <div className="mt-2 text-slate-500">{error || 'Đơn hàng không thể hiển thị.'}</div>
                            </div>
                        )}
                    >
                        <Button type="primary" size="large" onClick={() => navigate('/orders')}>
                            Quay lại lịch sử đơn hàng
                        </Button>
                    </Empty>
                </Card>
            </div>
        );
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const statusInfo = statusMetaMap[normalizedStatus] || { color: 'blue', label: normalizedStatus };

    return (
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')} className="px-0 text-slate-600">
                        Quay lại lịch sử đơn hàng
                    </Button>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">#{order._id}</h1>
                    <p className="mt-2 max-w-2xl text-slate-500">Theo dõi trạng thái, timeline xử lý và thông tin snapshot của đơn hàng.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Tag color="red">{order.paymentMethod || 'COD'}</Tag>
                    <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                    <Tag color={order.paymentStatus === 'PAID' ? 'green' : 'gold'} icon={<ClockCircleOutlined />}>{order.paymentStatus || 'UNPAID'}</Tag>
                </div>
            </div>

            {!isOwner && ['Admin', 'Moderator'].includes(auth?.user?.role) ? (
                <Alert className="mb-6" type="info" showIcon message="Chế độ quản trị" description="Bạn đang xem đơn hàng với quyền quản trị, nên hành động hủy sẽ không được hiển thị ở màn này." />
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
                <div className="space-y-6">
                    <Card className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 24 }}>
                        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Tracking Timeline</div>
                        <div className="mt-5">
                            <Steps
                                current={Math.max(0, trackingSteps.reduce((lastActive, step, index) => (step.status === 'finish' || step.status === 'process' ? index : lastActive), 0))}
                                items={trackingSteps}
                                responsive
                            />
                        </div>

                        {normalizedStatus === 'CANCEL_REQUESTED' ? (
                            <Alert className="mt-5" type="warning" showIcon message="Yêu cầu hủy đang chờ duyệt" description="Đơn hàng đã được gửi yêu cầu hủy và đang chờ admin duyệt." />
                        ) : null}

                        {normalizedStatus === 'CANCELLED' ? (
                            <Alert className="mt-5" type="error" showIcon message="Đơn hàng đã hủy" description="Đơn hàng này đã được hủy và tồn kho đã được hoàn trả theo rule." />
                        ) : null}
                    </Card>

                    <Card className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 24 }}>
                        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Lịch sử trạng thái</div>
                        <div className="mt-5">
                            <Timeline
                                items={statusHistory.map((entry) => ({
                                    color: entry.status === 'CANCELLED' ? 'red' : entry.status === 'CANCEL_REQUESTED' ? 'orange' : statusMetaMap[entry.status]?.color || 'blue',
                                    children: (
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-semibold text-slate-900">{statusMetaMap[entry.status]?.label || entry.status}</span>
                                                <span className="text-xs text-slate-500">{entry.updatedAt ? new Date(entry.updatedAt).toLocaleString('vi-VN') : ''}</span>
                                            </div>
                                            <div className="mt-1 text-sm text-slate-600">{entry.note || 'Không có ghi chú'}</div>
                                            <div className="mt-1 text-xs text-slate-400">
                                                {entry.updatedBy?.name || entry.updatedBy?.email || 'Hệ thống'}
                                            </div>
                                        </div>
                                    ),
                                }))}
                            />
                        </div>
                    </Card>

                    <Card className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 24 }}>
                        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Danh sách sản phẩm</div>
                        <div className="mt-5 space-y-3">
                            {items.length ? items.map((item, index) => {
                                const snapshot = item.snapshot || {};
                                const quantity = Number(item.quantity || 0);
                                const price = Number(snapshot.price || 0);

                                return (
                                    <div key={`${order._id}-${item.product || index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[72px_1fr_auto] md:items-center">
                                        <div className="h-18 w-18 overflow-hidden rounded-2xl bg-white">
                                            <img
                                                src={snapshot.image || 'https://placehold.co/144x144?text=Order'}
                                                alt={snapshot.name || 'Sản phẩm'}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-slate-900">{snapshot.name || 'Sản phẩm'}</div>
                                            <div className="mt-1 text-xs text-slate-500">{snapshot.brand || 'Keyboard Store'}</div>
                                            <div className="mt-1 text-xs text-slate-500">{snapshot.category || 'N/A'}</div>
                                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                                <span className="rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200">Số lượng: {quantity}</span>
                                                <span className="rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200">Đơn giá: {formatCurrency(price)}</span>
                                                <span className="rounded-full bg-red-50 px-2 py-1 font-semibold text-red-600">Tạm tính: {formatCurrency(quantity * price)}</span>
                                            </div>
                                        </div>

                                        <div className="text-right text-sm font-semibold text-slate-900">
                                            <div className="text-xs font-normal text-slate-500">Snapshot</div>
                                            <div>{snapshot.name || '---'}</div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <Empty description="Đơn hàng này chưa có item nào." />
                            )}
                        </div>
                    </Card>
                </div>

                <aside className="h-fit space-y-4 lg:sticky lg:top-24">
                    <Card className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 20 }}>
                        <div className="text-sm uppercase tracking-[0.22em] text-slate-400">Thông tin giao hàng</div>
                        <div className="mt-4 space-y-3 text-sm text-slate-600">
                            <div>
                                <div className="text-slate-500">Họ tên</div>
                                <div className="mt-1 font-semibold text-slate-900">{order.shippingInfo?.fullName || '---'}</div>
                            </div>
                            <div>
                                <div className="text-slate-500">Số điện thoại</div>
                                <div className="mt-1 font-semibold text-slate-900">{order.shippingInfo?.phone || '---'}</div>
                            </div>
                            <div>
                                <div className="text-slate-500">Địa chỉ</div>
                                <div className="mt-1 font-semibold text-slate-900">{order.shippingInfo?.address || '---'}</div>
                            </div>
                            {order.shippingInfo?.note ? (
                                <div>
                                    <div className="text-slate-500">Ghi chú</div>
                                    <div className="mt-1 font-semibold text-slate-900">{order.shippingInfo.note}</div>
                                </div>
                            ) : null}
                        </div>

                        <Divider className="my-4" />

                        <div className="space-y-3 text-sm text-slate-600">
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
                        <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={() => navigate('/orders')}>
                            Quay lại đơn hàng của tôi
                        </Button>
                        {isCancelable ? (
                            <Button danger size="large" icon={<StopOutlined />} loading={cancelling} onClick={handleCancelOrder}>
                                {canRequestCancel ? 'Gửi yêu cầu hủy' : 'Hủy đơn hàng'}
                            </Button>
                        ) : (
                            <Button size="large" icon={<ClockCircleOutlined />} disabled>
                                {normalizedStatus === 'CANCEL_REQUESTED' ? 'Đang chờ duyệt hủy' : 'Không thể hủy ở trạng thái này'}
                            </Button>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default OrderDetailPage;