import { useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Divider, Form, Input, Radio, Spin, Tag, notification } from 'antd';
import { LoadingOutlined, ShoppingOutlined } from '@ant-design/icons';
import { AuthContext } from '../components/context/auth.context';
import { checkoutOrderApi, getCheckoutPreviewApi } from '../util/api';
import { formatCurrency } from '../util/format';

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { auth, appLoading } = useContext(AuthContext);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [preview, setPreview] = useState(null);
    const [previewError, setPreviewError] = useState('');

    const isAuthenticated = Boolean(auth?.isAuthenticated);

    const loadPreview = async () => {
        setLoading(true);
        setPreviewError('');

        try {
            const response = await getCheckoutPreviewApi();

            if (response?.EC !== 0) {
                throw new Error(response?.EM || 'Không thể tải thông tin thanh toán');
            }

            setPreview(response?.DT || null);
        } catch (error) {
            setPreview(null);
            setPreviewError(error?.message || 'Không thể tải thông tin thanh toán');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (appLoading || !isAuthenticated) {
            return;
        }

        loadPreview();
    }, [appLoading, isAuthenticated]);

    useEffect(() => {
        if (auth?.user?.name) {
            form.setFieldsValue({ fullName: auth.user.name });
        }
    }, [auth?.user?.name, form]);

    const items = useMemo(() => preview?.items || [], [preview]);

    const onSubmit = async (values) => {
        setSubmitting(true);
        try {
            const response = await checkoutOrderApi({
                shippingInfo: values,
                paymentMethod: 'COD',
            });

            if (response?.EC !== 0) {
                throw new Error(response?.EM || 'Không thể đặt hàng');
            }

            const order = response?.DT || response;

            notification.success({
                message: 'Đặt hàng thành công',
                description: `Đơn hàng ${order?._id || ''} đã được tạo`,
            });

            navigate(`/orders/${order?._id}`, { state: { order } });
        } catch (error) {
            notification.error({
                message: 'Thanh toán',
                description: error?.message || 'Không thể hoàn tất đơn hàng',
            });
        } finally {
            setSubmitting(false);
        }
    };

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
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.22em] text-red-600">Checkout</div>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Xác nhận đơn hàng COD</h1>
                    <p className="mt-2 max-w-2xl text-slate-500">Thông tin giao hàng được nhập một lần tại đây, còn tổng tiền và phí ship được tính tập trung ở backend.</p>
                </div>

                <Tag color="red" icon={<ShoppingOutlined />}>{items.length} sản phẩm</Tag>
            </div>

            {previewError ? (
                <Alert
                    className="mb-6"
                    type="error"
                    showIcon
                    message="Không thể tải dữ liệu checkout"
                    description={previewError}
                    action={<Button size="small" onClick={loadPreview}>Thử lại</Button>}
                />
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <Card className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 24 }}>
                    <Form layout="vertical" form={form} onFinish={onSubmit} disabled={submitting} initialValues={{ paymentMethod: 'COD' }}>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Form.Item label="Họ và tên" name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}>
                                <Input size="large" placeholder="Nguyễn Văn A" />
                            </Form.Item>

                            <Form.Item
                                label="Số điện thoại"
                                name="phone"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                                    { min: 8, message: 'Số điện thoại không hợp lệ' },
                                ]}
                            >
                                <Input size="large" placeholder="0912345678" inputMode="tel" />
                            </Form.Item>
                        </div>

                        <Form.Item label="Địa chỉ giao hàng" name="address" rules={[{ required: true, message: 'Vui lòng nhập địa chỉ giao hàng' }]}>
                            <Input.TextArea rows={4} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" />
                        </Form.Item>

                        <Form.Item label="Ghi chú" name="note">
                            <Input.TextArea rows={3} placeholder="Ví dụ: gọi trước khi giao hàng" />
                        </Form.Item>

                        <Form.Item label="Phương thức thanh toán" name="paymentMethod" initialValue="COD">
                            <Radio.Group value="COD" disabled>
                                <Radio value="COD">COD - Thanh toán khi nhận hàng</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Divider />

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Button size="large" onClick={() => navigate('/cart')}>
                                Quay lại giỏ hàng
                            </Button>
                            <Button type="primary" htmlType="submit" size="large" loading={submitting} disabled={!items.length}>
                                Đặt hàng
                            </Button>
                        </div>
                    </Form>
                </Card>

                <aside className="h-fit space-y-4 lg:sticky lg:top-24">
                    <Card className="rounded-[28px] border-slate-200 shadow-sm" bodyStyle={{ padding: 20 }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm uppercase tracking-[0.22em] text-slate-400">Order Summary</div>
                                <h2 className="mt-1 text-xl font-bold text-slate-900">Tổng tiền đơn hàng</h2>
                            </div>
                            <Tag color="red">COD</Tag>
                        </div>

                        <Divider className="my-4" />

                        <div className="space-y-3 text-sm text-slate-600">
                            <div className="flex items-center justify-between">
                                <span>Số sản phẩm</span>
                                <span className="font-semibold text-slate-900">{items.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Tạm tính</span>
                                <span className="font-semibold text-slate-900">{formatCurrency(preview?.subtotal || 0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Phí ship</span>
                                <span className="font-semibold text-slate-900">{formatCurrency(preview?.shippingFee || 0)}</span>
                            </div>
                            <div className="flex items-center justify-between text-base">
                                <span className="font-medium text-slate-700">Tổng thanh toán</span>
                                <span className="text-lg font-black text-red-600">{formatCurrency(preview?.totalAmount || 0)}</span>
                            </div>
                        </div>

                        <Divider className="my-4" />

                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.product} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                                    <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                                        <img
                                            src={item.snapshot?.image || 'https://placehold.co/128x128?text=Keyboard'}
                                            alt={item.snapshot?.name || 'Sản phẩm'}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-slate-900">{item.snapshot?.name || 'Sản phẩm'}</div>
                                        <div className="mt-1 text-xs text-slate-500">{item.snapshot?.brand || 'Keyboard Store'}</div>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                                            <span className="rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200">SL: {item.quantity}</span>
                                            <span className="rounded-full bg-white px-2 py-1 shadow-sm ring-1 ring-slate-200">{formatCurrency(item.lineSubtotal || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </aside>
            </div>
        </div>
    );
};

export default CheckoutPage;