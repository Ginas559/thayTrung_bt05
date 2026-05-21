import { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Card, Select, Space, Spin, Table, Tag, notification, Popconfirm } from 'antd';
import { LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import { AuthContext } from '../components/context/auth.context';
import { approveCancelOrderApi, getAdminOrdersApi, updateOrderStatusApi } from '../util/api';
import { formatCurrency } from '../util/format';

const ORDER_STATUS_FLOW = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['SHIPPING'],
    SHIPPING: ['DELIVERED'],
    DELIVERED: [],
    CANCEL_REQUESTED: ['CANCELLED'],
    CANCELLED: [],
};

const ORDER_STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

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

const getNextStatusOptions = (currentStatus, role) => {
    const normalizedStatus = String(currentStatus || 'PENDING').trim().toUpperCase();
    const allowedNextStatuses = ORDER_STATUS_FLOW[normalizedStatus] || [];
    const safeStatuses = allowedNextStatuses.filter((status) => status !== 'CANCEL_REQUESTED');

    if (role === 'Moderator') {
        return safeStatuses.filter((status) => status !== 'CANCELLED');
    }

    return safeStatuses;
};

const AdminOrdersPage = () => {
    const navigate = useNavigate();
    const { auth, appLoading } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [total, setTotal] = useState(0);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [updatingId, setUpdatingId] = useState('');
    const [reloadCount, setReloadCount] = useState(0);
    const isManager = ['Admin', 'Moderator'].includes(auth?.user?.role);
    const isAdmin = auth?.user?.role === 'Admin';

    useEffect(() => {
        const loadOrders = async () => {
            setLoading(true);

            try {
                const response = await getAdminOrdersApi({ page, limit, status: filterStatus });

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
                    message: 'Quản lý đơn hàng',
                    description: error?.message || 'Không thể tải danh sách đơn hàng',
                });
            } finally {
                setLoading(false);
            }
        };

        if (!appLoading && isManager) {
            loadOrders();
        }
    }, [appLoading, isManager, page, limit, filterStatus, reloadCount]);

    const summaryText = useMemo(() => `${total} đơn hàng`, [total]);

    const updateStatus = async (orderId, nextStatus) => {
        setUpdatingId(orderId);

        try {
            const response = await updateOrderStatusApi(orderId, { orderStatus: nextStatus });

            if (response?.EC !== 0) {
                throw new Error(response?.EM || 'Không thể cập nhật trạng thái');
            }

            notification.success({
                message: 'Quản lý đơn hàng',
                description: response?.EM || 'Đã cập nhật trạng thái đơn hàng',
            });

            const payload = response?.DT || null;
            if (payload) {
                setOrders((currentOrders) => currentOrders.map((order) => (String(order._id) === String(orderId) ? payload : order)));
            } else {
                const reloadResponse = await getAdminOrdersApi({ page, limit, status: filterStatus });
                setOrders(normalizeResponseList(reloadResponse));
                setTotal(Number(reloadResponse?.DT?.total || 0));
            }
        } catch (error) {
            notification.error({
                message: 'Quản lý đơn hàng',
                description: error?.message || 'Không thể cập nhật trạng thái',
            });
        } finally {
            setUpdatingId('');
        }
    };

    const approveCancel = async (orderId) => {
        setUpdatingId(orderId);

        try {
            const response = await approveCancelOrderApi(orderId, { note: 'Admin duyệt yêu cầu hủy đơn' });

            if (response?.EC !== 0) {
                throw new Error(response?.EM || 'Không thể duyệt hủy đơn');
            }

            notification.success({
                message: 'Quản lý đơn hàng',
                description: response?.EM || 'Đã duyệt hủy đơn hàng',
            });

            const payload = response?.DT || null;
            if (payload) {
                setOrders((currentOrders) => currentOrders.map((order) => (String(order._id) === String(orderId) ? payload : order)));
            } else {
                const reloadResponse = await getAdminOrdersApi({ page, limit, status: filterStatus });
                setOrders(normalizeResponseList(reloadResponse));
                setTotal(Number(reloadResponse?.DT?.total || 0));
            }
        } catch (error) {
            notification.error({
                message: 'Quản lý đơn hàng',
                description: error?.message || 'Không thể duyệt hủy đơn',
            });
        } finally {
            setUpdatingId('');
        }
    };

    if (appLoading) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-10 lg:px-6">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 28 }} spin />} />
            </div>
        );
    }

    if (!isManager) {
        return <Navigate to="/" replace />;
    }

    const columns = [
        {
            title: 'Đơn hàng',
            dataIndex: '_id',
            key: '_id',
            render: (value, record) => (
                <div>
                    <div className="font-semibold text-slate-900">#{value}</div>
                    <div className="text-xs text-slate-500">{record.createdAt ? new Date(record.createdAt).toLocaleString('vi-VN') : ''}</div>
                </div>
            ),
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            render: (_, record) => (
                <div>
                    <div className="font-medium text-slate-900">{record.userEmail || record.user?.email || '---'}</div>
                    <div className="text-xs text-slate-500">{record.shippingInfo?.fullName || ''}</div>
                </div>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (value) => <span className="font-semibold text-red-600">{formatCurrency(value || 0)}</span>,
        },
        {
            title: 'Thanh toán',
            key: 'paymentStatus',
            render: (_, record) => <Tag color={record.paymentStatus === 'PAID' ? 'green' : 'gold'}>{record.paymentStatus || 'UNPAID'}</Tag>,
        },
        {
            title: 'Trạng thái',
            key: 'orderStatus',
            render: (_, record) => <Tag color={statusColorMap[record.orderStatus] || 'blue'}>{record.orderStatus || 'PENDING'}</Tag>,
        },
        {
            title: 'Cập nhật',
            key: 'actions',
            render: (_, record) => {
                const nextOptions = getNextStatusOptions(record.orderStatus, auth?.user?.role);
                const isCancelRequested = record.orderStatus === 'CANCEL_REQUESTED';

                return (
                    <Space direction="vertical" size={8} className="w-full">
                        <Select
                            value={record.orderStatus || 'PENDING'}
                            style={{ minWidth: 180 }}
                            options={nextOptions.map((status) => ({ value: status, label: status }))}
                            placeholder="Chọn trạng thái"
                            onChange={(value) => updateStatus(record._id, value)}
                            disabled={updatingId === record._id || !nextOptions.length}
                        />

                        {isAdmin && isCancelRequested ? (
                            <Popconfirm
                                title="Duyệt hủy đơn hàng?"
                                description="Thao tác này sẽ chuyển đơn hàng sang CANCELLED và hoàn trả tồn kho."
                                okText="Duyệt"
                                cancelText="Hủy"
                                onConfirm={() => approveCancel(record._id)}
                            >
                                <Button danger size="small" loading={updatingId === record._id}>
                                    Duyệt hủy
                                </Button>
                            </Popconfirm>
                        ) : null}

                        <Button size="small" onClick={() => navigate(`/orders/${record._id}`)}>
                            Xem chi tiết
                        </Button>
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.22em] text-red-600">Admin Orders</div>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Quản lý đơn hàng</h1>
                    <p className="mt-2 max-w-2xl text-slate-500">Danh sách tập trung, lọc theo trạng thái và xử lý workflow xác nhận, chuẩn bị, giao hàng, hủy đơn.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button icon={<ReloadOutlined />} onClick={() => setReloadCount((current) => current + 1)}>
                        Tải lại
                    </Button>
                    <Button onClick={() => navigate('/admin')}>Quay lại admin</Button>
                </div>
            </div>

            <Card className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 20 }}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <Select
                            value={filterStatus}
                            onChange={(value) => {
                                setFilterStatus(value);
                                setPage(1);
                            }}
                            style={{ minWidth: 220 }}
                            options={[
                                { value: 'ALL', label: 'Tất cả trạng thái' },
                                ...ORDER_STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
                            ]}
                        />
                        <Tag color="gold">{summaryText}</Tag>
                    </div>
                </div>

                <Table
                    rowKey="_id"
                    columns={columns}
                    dataSource={orders}
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize: limit,
                        total,
                        showSizeChanger: false,
                        onChange: (nextPage) => setPage(nextPage),
                    }}
                />
            </Card>
        </div>
    );
};

export default AdminOrdersPage;