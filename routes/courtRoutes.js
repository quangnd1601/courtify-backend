const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');
const authen = require('../middleware/authen');

// GET công khai; ghi dữ liệu yêu cầu đăng nhập
router.get('/', courtController.getAllCourts);
router.get('/sport-centers/:centerId', courtController.getCourtsByCenter);
router.get('/:id', courtController.getCourtById);
router.post('/', authen, courtController.createCourt);
router.put('/:id', authen, courtController.updateCourt);
router.delete('/:id', authen, courtController.deleteCourt);
router.put('/sport-centers/:centerId/bulk-price', authen, courtController.bulkUpdatePrice);

module.exports = router;
