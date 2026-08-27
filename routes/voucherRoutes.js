const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');

router.get('/', voucherController.getAllVouchers);
router.get('/:id', voucherController.getVoucherById);
router.post('/', voucherController.createVoucher);
router.put('/:id', voucherController.updateVoucher);
router.delete('/:id', voucherController.deleteVoucher);
router.get('/check/:code', voucherController.checkVoucher);

module.exports = router;
