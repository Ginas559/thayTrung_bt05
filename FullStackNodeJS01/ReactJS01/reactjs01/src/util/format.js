const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(value)) + 'đ';
};

const getDiscountLabel = (discount) => {
    if (!discount) return '';
    return `-${discount}%`;
};

export {
    formatCurrency,
    getDiscountLabel,
};