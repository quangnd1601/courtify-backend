const express = require('express');
const router = express.Router();
const sportCenterController = require('../controllers/sportCenterController');
const authen = require('../middleware/authen');

// GET công khai cho khách xem; ghi dữ liệu yêu cầu đăng nhập
router.get('/', sportCenterController.getAllCenters);
router.get('/:id', sportCenterController.getCenterById);
router.post('/', authen, sportCenterController.createCenter);
router.put('/:id', authen, sportCenterController.updateCenter);
router.delete('/:id', authen, sportCenterController.deleteCenter);

module.exports = router;
