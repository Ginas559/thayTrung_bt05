const ORDER_STATUS_ALIASES = {
    PROCESSING: 'PREPARING',
};

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CANCEL_REQUESTED', 'CANCELLED'];

const STATUS_TRANSITIONS = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['SHIPPING', 'CANCEL_REQUESTED'],
    SHIPPING: ['DELIVERED'],
    DELIVERED: [],
    CANCEL_REQUESTED: ['CANCELLED'],
    CANCELLED: [],
};

const normalizeOrderStatus = (value) => {
    const normalized = String(value || '').trim().toUpperCase();
    return ORDER_STATUS_ALIASES[normalized] || normalized;
};

const isValidOrderStatus = (value) => ORDER_STATUSES.includes(normalizeOrderStatus(value));

const validateStatusTransition = (currentStatus, nextStatus) => {
    const normalizedCurrent = normalizeOrderStatus(currentStatus);
    const normalizedNext = normalizeOrderStatus(nextStatus);

    if (!isValidOrderStatus(normalizedCurrent)) {
        return { valid: false, message: 'Trạng thái hiện tại không hợp lệ' };
    }

    if (!isValidOrderStatus(normalizedNext)) {
        return { valid: false, message: 'Trạng thái đơn hàng không hợp lệ' };
    }

    if (normalizedCurrent === normalizedNext) {
        return { valid: false, message: 'Trạng thái mới phải khác trạng thái hiện tại' };
    }

    const allowedNextStatuses = STATUS_TRANSITIONS[normalizedCurrent] || [];

    if (!allowedNextStatuses.includes(normalizedNext)) {
        return {
            valid: false,
            message: `Không thể chuyển trạng thái từ ${normalizedCurrent} sang ${normalizedNext}`,
        };
    }

    return { valid: true };
};

const buildStatusHistoryEntry = (status, updatedBy, note = '', updatedAt = new Date()) => ({
    status: normalizeOrderStatus(status),
    updatedBy: updatedBy || null,
    updatedAt,
    note: String(note || '').trim(),
});

const normalizeStatusHistory = (history = [], fallbackStatus = 'PENDING', fallbackAt = null) => {
    const normalizedHistory = Array.isArray(history) && history.length
        ? history
        : [buildStatusHistoryEntry(fallbackStatus, null, 'Đơn hàng được tạo', fallbackAt || new Date())];

    return normalizedHistory
        .map((item) => ({
            status: normalizeOrderStatus(item?.status),
            updatedBy: item?.updatedBy || null,
            updatedAt: item?.updatedAt || fallbackAt || new Date(),
            note: String(item?.note || '').trim(),
        }))
        .sort((left, right) => new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime());
};

module.exports = {
    ORDER_STATUSES,
    ORDER_STATUS_ALIASES,
    STATUS_TRANSITIONS,
    normalizeOrderStatus,
    isValidOrderStatus,
    validateStatusTransition,
    buildStatusHistoryEntry,
    normalizeStatusHistory,
};