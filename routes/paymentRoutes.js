const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authen = require('../middleware/authen');

// Thanh toán tiền mặt / offline (giữ nguyên)
router.post('/', authen, paymentController.createPayment);

// Tạo link thanh toán payOS
router.post('/create-link', authen, paymentController.createPaymentLink);

// Webhook payOS gửi tới (KHÔNG authen — xác minh bằng chữ ký)
router.post('/webhook', paymentController.handleWebhook);

// Kiểm tra trạng thái thanh toán theo orderCode
router.get('/status/:orderCode', authen, paymentController.getPaymentStatus);

// Hủy link thanh toán
router.post('/cancel/:orderCode', authen, paymentController.cancelPaymentLink);

// (Admin) Xác nhận đã hoàn tiền thủ công
router.post('/mark-refunded/:orderCode', authen, paymentController.markRefunded);

module.exports = router;

