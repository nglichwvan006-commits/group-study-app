import NodeCache from 'node-cache';

// Cache giữ dữ liệu trong 60 giây, kiểm tra hết hạn mỗi 120 giây
export const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
