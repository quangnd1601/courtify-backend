const paymentService = require('../services/paymentService');
const payOSService = require('../services/payOSService');

const createPayment = async (req, res) => {
  try {
    const payment = await paymentService.processPayment(req.body);
    res.status(201).json({
      success: true,
      message: "Thanh toán thành công! Sân của bạn đã được chốt.",
      data: payment
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Tạo link thanh toán payOS
const createPaymentLink = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { booking_id } = req.body;
    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'Thiếu booking_id' });
    }

    const result = await paymentService.createOnlinePaymentLink(booking_id, userId);
    res.status(200).json({
      success: true,
      message: 'Tạo link thanh toán thành công',
      data: result
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Nhận webhook từ payOS (KHÔNG cần token — xác minh bằng chữ ký qua verifyWebhookData)
const handleWebhook = async (req, res) => {
  try {
    const webhookData = await payOSService.verifyWebhookData(req.body);

    if (webhookData && webhookData.code === '00') {
      await paymentService.confirmPaymentFromWebhook(webhookData.orderCode, webhookData);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[payOS webhook] Xác minh thất bại:', error.message);
    res.status(403).json({ success: false, message: 'Webhook không hợp lệ' });
  }
};

// Kiểm tra trạng thái thanh toán theo orderCode
const getPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { orderCode } = req.params;

    const result = await paymentService.getPaymentStatus(orderCode, userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Hủy link thanh toán payOS
const cancelPaymentLink = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { orderCode } = req.params;

    const payment = await paymentService.cancelPaymentLink(orderCode, userId);
    res.status(200).json({ success: true, message: 'Đã hủy link thanh toán', data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// (Admin) Xác nhận đã hoàn tiền thủ công cho giao dịch payOS
const markRefunded = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối' });
    }

    const { orderCode } = req.params;
    const payment = await paymentService.markRefunded(orderCode);
    res.status(200).json({ success: true, message: 'Đã xác nhận hoàn tiền', data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPayment,
  createPaymentLink,
  handleWebhook,
  getPaymentStatus,
  cancelPaymentLink,
  markRefunded
};

