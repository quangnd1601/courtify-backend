const payOS = require('../config/payos');

// Tạo link thanh toán
const createPaymentLink = async ({
  orderCode,
  amount,
  description,
  buyerName,
  buyerEmail,
  buyerPhone,
  returnUrl,
  cancelUrl,
}) => {
  const body = {
    orderCode,
    amount,
    description,
    returnUrl,
    cancelUrl,
    expiredAt: Math.floor(Date.now() / 1000) + 30 * 60, // Link hết hạn sau 30 phút
  };

  if (buyerName) body.buyerName = buyerName;
  if (buyerEmail) body.buyerEmail = buyerEmail;
  if (buyerPhone) body.buyerPhone = buyerPhone;

  return await payOS.paymentRequests.create(body);
};

// Lấy thông tin payment link theo orderCode (để kiểm tra trạng thái thật từ payOS)
const getPaymentLinkInfo = async (orderCode) => {
  return await payOS.paymentRequests.get(orderCode);
};

// Hủy payment link theo orderCode
const cancelPaymentLink = async (orderCode, cancellationReason) => {
  return await payOS.paymentRequests.cancel(orderCode, cancellationReason);
};

// Xác minh dữ liệu webhook payOS gửi tới (bao gồm kiểm tra chữ ký)
const verifyWebhookData = async (webhookBody) => {
  return await payOS.webhooks.verify(webhookBody);
};

module.exports = {
  createPaymentLink,
  getPaymentLinkInfo,
  cancelPaymentLink,
  verifyWebhookData,
};
