const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authen = require('../middleware/authen');

// GET công khai; ghi dữ liệu yêu cầu đăng nhập
router.get('/sport-centers/:centerId', serviceController.getServicesByCenter);
router.get('/:id', serviceController.getServiceById);
router.post('/', authen, serviceController.createService);
router.put('/:id', authen, serviceController.updateService);
router.delete('/:id', authen, serviceController.deleteService);

module.exports = router;
