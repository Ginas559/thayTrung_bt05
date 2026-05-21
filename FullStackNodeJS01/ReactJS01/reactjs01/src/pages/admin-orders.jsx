import { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Card, Input, Select, Space, Spin, Table, Tag, notification } from 'antd';
import { LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import { AuthContext } from '../components/context/auth.context';
import { getAdminOrdersApi, updateOrderStatusApi } from '../util/api';
import { formatCurrency } from '../util/format';

const ORDER_STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'];

const statusColorMap = {
    PENDING: 'gold',
    PROCESSING: 'blue',
    SHIPPING: 'cyan',
    DELIVERED: 'green',
    CANCELLED: 'red',
};

const AdminOrdersPage = () => {
    const navigate = useNavigate();
    const { auth, appLoading } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [query, setQuery] = useState('');
    const [updatingId, setUpdatingId] = useState('');
    const isManager = ['Admin', 'Moderator'].includes(auth?.user?.role);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await getAdminOrdersApi();
            setOrders(Array.isArray(response) ? response : []);
        } catch (error) {
            setOrders([]);
            notification.error({
                message: 'Quản lý đơn hàng',
                description: error?.message || 'Không thể tải danh sách đơn hàng',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (appLoading || !isManager) {
            return;
        }

        loadOrders();
    }, [appLoading, isManager]);

    const filteredOrders = useMemo(() => orders.filter((order) => {
        const haystack = `${order._id} ${order.userEmail || ''} ${order.orderStatus || ''} ${order.paymentStatus || ''}`.toLowerCase();
        const matchesQuery = haystack.includes(query.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || order.orderStatus === filterStatus;
        return matchesQuery && matchesStatus;
    }), [orders, filterStatus, query]);

    const allowedStatusOptions = auth?.user?.role === 'Moderator'
        ? ['PENDING', 'PROCESSING', 'SHIPPING']
        : ORDER_STATUS_OPTIONS;

    const updateStatus = async (orderId, nextStatus) => {
        setUpdatingId(orderId);
        try {
            const response = await updateOrderStatusApi(orderId, nextStatus);

            if (response?.EC !== 0) {
                throw new Error(response?.EM || 'Không thể cập nhật trạng thái');
            }

            notification.success({
                message: 'Quản lý đơn hàng',
                description: response?.EM || 'Đã cập nhật trạng thái đơn hàng',
            });

            await loadOrders();
        } catch (error) {
            notification.error({
                message: 'Quản lý đơn hàng',
                description: error?.message || 'Không thể cập nhật trạng thái',
            });
        } finally {
            setUpdatingId('');
        }
    };

    if (appLoading || loading) {
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
            dataIndex: 'userEmail',
            key: 'userEmail',
            render: (value, record) => (
                <div>
                    <div className="font-medium text-slate-900">{value || record.user?.email || '---'}</div>
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
            render: (_, record) => (
                <Space direction="vertical" size={8} className="w-full">
                    <Select
                        value={record.orderStatus || 'PENDING'}
                        style={{ minWidth: 180 }}
                        options={allowedStatusOptions.map((status) => ({ value: status, label: status }))}
                        onChange={(value) => updateStatus(record._id, value)}
                        disabled={updatingId === record._id}
                    />
                    <Button size="small" onClick={() => navigate(`/orders/success/${record._id}`)}>
                        Xem chi tiết
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.22em] text-red-600">Admin Orders</div>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Quản lý đơn hàng</h1>
                    <p className="mt-2 max-w-2xl text-slate-500">Danh sách đơn hàng tập trung, lọc theo trạng thái và cập nhật tiến trình xử lý trực tiếp từ backend.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button icon={<ReloadOutlined />} onClick={loadOrders}>
                        Tải lại
                    </Button>
                    <Button onClick={() => navigate('/admin')}>Quay lại admin</Button>
                </div>
            </div>

            <Card className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 20 }}>
                <div className="mb-4 flex flex-wrap gap-3">
                    <Input.Search
                        allowClear
                        placeholder="Tìm theo mã đơn, email, trạng thái..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="max-w-xl"
                    />
                    <Select
                        value={filterStatus}
                        onChange={setFilterStatus}
                        style={{ minWidth: 180 }}
                        options={[
                            { value: 'ALL', label: 'Tất cả trạng thái' },
                            ...ORDER_STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
                        ]}
                    />
                </div>

                <Table
                    rowKey="_id"
                    columns={columns}
                    dataSource={filteredOrders}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                />
            </Card>
        </div>
    );
};

export default AdminOrdersPage;