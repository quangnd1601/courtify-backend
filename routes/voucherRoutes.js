const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const authen = require('../middleware/authen');

// GET công khai; ghi dữ liệu yêu cầu đăng nhập
router.get('/', voucherController.getAllVouchers);
router.get('/:id', voucherController.getVoucherById);
router.post('/', authen, voucherController.createVoucher);
router.put('/:id', authen, voucherController.updateVoucher);
router.delete('/:id', authen, voucherController.deleteVoucher);
router.get('/check/:code', voucherController.checkVoucher);

module.exports = router;
